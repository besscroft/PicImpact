import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { twoFactor, username } from "better-auth/plugins";
import { sql } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "./db";
import { schema, user } from "./db/schema";

type AuthDatabase = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

const registrationInput = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_.]+$/),
  password: z.string().min(8),
});

function safeHostname(url: string) {
  try {
    const hostname = new URL(url).hostname;
    // localhost 之外取纯域名即可作为 RP ID（WebAuthn 禁止带端口）
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

export function createAuth(
  db: Database,
  options: {
    secret?: string;
    baseURL?: string;
    /** WebAuthn RP ID：默认从 BETTER_AUTH_URL 域名推导，可显式覆盖 */
    passkeyRpId?: string;
    passkeyRpName?: string;
  } = {},
) {
  // WebAuthn 的 rpID 必须等于访问域名：优先显式配置，其次 BETTER_AUTH_URL 的域名
  const rpId =
    options.passkeyRpId ||
    (options.baseURL ? safeHostname(options.baseURL) : undefined) ||
    "localhost";
  const rpName = options.passkeyRpName || "PicImpact";
  const authOptions = {
    baseURL: options.baseURL,
    secret: options.secret,
    advanced: {
      cookiePrefix: "pic-impact",
    },
    plugins: [
      username({
        displayUsername: false,
        immutableUsername: true,
      }),
      twoFactor({
        issuer: "PicImpact",
      }),
      passkey({
        rpID: rpId,
        rpName,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // list-sessions、passkey 注册等敏感端点默认要求 1 天内的“新鲜会话”，
      // 单管理员实例下只会带来莫名的 403；敏感操作已通过输入当前密码二次确认
      freshAge: 0,
    },
  };
  const buildAuth = (database: AuthDatabase, allowSignup = false) =>
    betterAuth({
      ...authOptions,
      emailAndPassword: { enabled: true, disableSignUp: !allowSignup },
      disabledPaths: allowSignup ? [] : ["/sign-in/email", "/sign-up/email"],
      database: drizzleAdapter(database, { provider: "pg", schema, transaction: true }),
    });
  const auth = buildAuth(db);
  const isRegistrationOpen = async (database: AuthDatabase = db) => {
    const users = await database.select({ id: user.id }).from(user).limit(1);
    return users.length === 0;
  };

  return {
    api: { getSession: auth.api.getSession },
    isRegistrationOpen: () => isRegistrationOpen(),
    handler: async (request: Request) => {
      const path = new URL(request.url).pathname.replace(/\/+$/, "");
      if (request.method !== "POST" || !path.endsWith("/sign-up/username")) {
        return auth.handler(request);
      }

      const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim();
      const input = registrationInput.safeParse(
        contentType === "application/json" ? await request.json().catch(() => null) : null,
      );
      if (!input.success) {
        return Response.json(
          { code: "INVALID_CREDENTIALS", message: "请输入有效的用户名和至少 8 个字符的密码。" },
          { status: 400 },
        );
      }

      return db.transaction(async (transaction) => {
        await transaction.execute(sql`LOCK TABLE ${user} IN SHARE ROW EXCLUSIVE MODE`);
        if (!(await isRegistrationOpen(transaction))) {
          return Response.json(
            {
              code: "REGISTRATION_CLOSED",
              message: "管理员账号已创建，注册已关闭，请登录。",
            },
            { status: 403 },
          );
        }
        const signupUrl = new URL(request.url);
        signupUrl.pathname = path.replace(/\/sign-up\/username$/, "/sign-up/email");
        const headers = new Headers(request.headers);
        headers.delete("Content-Length");
        const signupRequest = new Request(signupUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...input.data,
            name: input.data.username,
            email: "admin@picimpact.invalid",
          }),
        });
        return buildAuth(transaction, true).handler(signupRequest);
      });
    },
  };
}
