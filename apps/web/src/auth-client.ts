/**
 * better-auth 端点的薄封装（本项目不使用 better-auth JS 客户端，统一走原始 fetch）。
 * Passkey 的 WebAuthn 浏览器端流程使用 @simplewebauthn/browser，
 * 与服务端 @better-auth/passkey 所用的 @simplewebauthn/server 版本族一致。
 */
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export type AuthError = {
  message: string;
  code?: string;
  status: number;
};

type AuthResult<T> = { data: T; error: null } | { data: null; error: AuthError };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  image?: string | null;
  twoFactorEnabled?: boolean;
};

export type AuthSessionInfo = {
  id: string;
  expiresAt: string;
  createdAt?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type PasskeyInfo = {
  id: string;
  name?: string | null;
  credentialID: string;
  deviceType: string;
  backedUp: boolean;
  transports?: string | null;
  createdAt?: string | null;
  aaguid?: string | null;
};

async function authFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<AuthResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? (init?.body ? "POST" : "GET"),
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    return { data: null, error: { message: "网络请求失败，请稍后重试", status: 0 } };
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; code?: string }
      | null;
    return {
      data: null,
      error: {
        message: payload?.message ?? `请求失败（${response.status}）`,
        code: payload?.code,
        status: response.status,
      },
    };
  }
  const payload = (await response.json().catch(() => null)) as T | null;
  return { data: (payload ?? ({} as T)), error: null };
}

export async function getSession(): Promise<AuthResult<{ user: AuthUser }>> {
  return authFetch("/api/auth/get-session");
}

export async function updateUser(input: { name?: string; image?: string }) {
  return authFetch<{ status: boolean }>("/api/auth/update-user", { body: input });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return authFetch<{ token?: string }>("/api/auth/change-password", {
    body: { ...input, revokeOtherSessions: true },
  });
}

export const twoFactor = {
  async enable(password: string) {
    return authFetch<{ method: string; totpURI: string; backupCodes: string[] }>(
      "/api/auth/two-factor/enable",
      { body: { password } },
    );
  },
  async disable(password: string) {
    return authFetch<{ status: boolean }>("/api/auth/two-factor/disable", {
      body: { password },
    });
  },
  async verifyTotp(code: string) {
    return authFetch<{ status: boolean; token?: string }>("/api/auth/two-factor/verify-totp", {
      body: { code },
    });
  },
};

export const sessions = {
  async list() {
    return authFetch<AuthSessionInfo[]>("/api/auth/list-sessions");
  },
  async revoke(id: string) {
    return authFetch<{ status: boolean }>("/api/auth/revoke-session", { body: { id } });
  },
  async revokeOthers() {
    return authFetch<{ status: boolean }>("/api/auth/revoke-sessions");
  },
};

export const passkey = {
  async list() {
    return authFetch<PasskeyInfo[]>("/api/auth/passkey/list-user-passkeys");
  },
  /** 请求注册选项 → 浏览器 WebAuthn 弹窗 → 服务端校验登记 */
  async add(name?: string) {
    const query = name ? `?name=${encodeURIComponent(name)}` : "";
    const options = await authFetch<Record<string, unknown>>(
      `/api/auth/passkey/generate-register-options${query}`,
    );
    if (options.error) return options;
    let response: Record<string, unknown>;
    try {
      const { clientExtensionResults, ...responseBody } = await startRegistration({
        optionsJSON: options.data as unknown as Parameters<
          typeof startRegistration
        >[0]["optionsJSON"],
      });
      void clientExtensionResults;
      response = responseBody as Record<string, unknown>;
    } catch (cause) {
      return {
        data: null,
        error: {
          message: describeWebAuthnError(cause),
          status: 400,
        },
      };
    }
    return verifyRegistration(response, name);
  },
  async remove(id: string) {
    return authFetch<{ status: boolean }>("/api/auth/passkey/delete-passkey", { body: { id } });
  },
  /** 浏览器 WebAuthn 弹窗 → 服务端校验并建立会话 */
  async signIn() {
    const options = await authFetch<Record<string, unknown>>(
      "/api/auth/passkey/generate-authenticate-options",
    );
    if (options.error) return options;
    let response: Record<string, unknown>;
    try {
      const { clientExtensionResults, ...responseBody } = await startAuthentication({
        optionsJSON: options.data as unknown as Parameters<
          typeof startAuthentication
        >[0]["optionsJSON"],
      });
      void clientExtensionResults;
      response = responseBody as Record<string, unknown>;
    } catch (cause) {
      return {
        data: null,
        error: {
          message: describeWebAuthnError(cause),
          status: 400,
        },
      };
    }
    return verifyAuthentication(response);
  },
};

function verifyRegistration(response: unknown, name?: string) {
  return authFetch<{ passkey?: PasskeyInfo }>("/api/auth/passkey/verify-registration", {
    body: { response, ...(name ? { name } : {}) },
  });
}

function verifyAuthentication(response: unknown) {
  return authFetch<{ session?: unknown }>("/api/auth/passkey/verify-authentication", {
    body: { response },
  });
}

/** 把 WebAuthn DOM 异常转成可读提示 */
function describeWebAuthnError(cause: unknown): string {
  const name = (cause as { name?: string } | null)?.name;
  switch (name) {
    case "NotAllowedError":
      return "已取消 Passkey 验证或请求超时";
    case "InvalidStateError":
      return "该 Passkey 已注册过";
    case "NotSupportedError":
    case "SecurityError":
      return "当前环境不支持 Passkey，请使用 HTTPS 访问并确认浏览器支持";
    default:
      return "Passkey 验证失败，请重试";
  }
}
