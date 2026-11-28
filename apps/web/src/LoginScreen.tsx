import { Button } from "@ui-sdk/solid/button";
import { Show, createSignal } from "solid-js";

import { btnOutline, btnPrimary, cardCls, errorBanner, fieldCls, inputCls, labelCls } from "./admin/shared";
import { passkey } from "./auth-client";

export function LoginScreen(props: {
  registrationOpen: boolean;
  onRegistrationClosed: () => void;
  onAuthenticated: () => void;
}) {
  const mode = () => (props.registrationOpen ? "sign-up" : "sign-in");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);
  // 登录成功但返回 twoFactorRedirect 时切换到 OTP 输入态
  const [otpMode, setOtpMode] = createSignal(false);
  const [otp, setOtp] = createSignal("");
  const [otpPending, setOtpPending] = createSignal(false);
  const [passkeyPending, setPasskeyPending] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const endpoint =
      mode() === "sign-in" ? "/api/auth/sign-in/username" : "/api/auth/sign-up/username";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username().trim(), password: password() }),
      });
      const payload = (await response.json().catch(() => null)) as {
        code?: string;
        message?: string;
        error?: { message?: string };
        twoFactorRedirect?: boolean;
      } | null;
      if (!response.ok) {
        if (payload?.code === "REGISTRATION_CLOSED") {
          props.onRegistrationClosed();
        }
        throw new Error(
          payload?.message ?? payload?.error?.message ?? "登录失败，请检查用户名和密码",
        );
      }
      if (payload?.twoFactorRedirect) {
        setOtpMode(true);
        setError(null);
        return;
      }
      props.onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败");
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: SubmitEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp())) {
      setError("请输入 6 位数字验证码");
      return;
    }
    setOtpPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp() }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "验证码不正确，请重试");
      }
      props.onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "验证失败");
    } finally {
      setOtpPending(false);
    }
  }

  async function signInWithPasskey() {
    setPasskeyPending(true);
    setError(null);
    const result = await passkey.signIn();
    setPasskeyPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    props.onAuthenticated();
  }

  return (
    <section class={`${cardCls} w-[min(440px,100%)] p-8`} aria-labelledby="auth-title">
      <div class="mb-3.5 text-xs font-medium text-muted-foreground">PICIMPACT / PRIVATE WORKSPACE</div>
      <h1 id="auth-title" class="mb-2.5 text-2xl font-semibold tracking-tight text-foreground">
        {otpMode() ? "两步验证" : mode() === "sign-in" ? "回到你的影像库" : "建立管理员账号"}
      </h1>
      <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
        {otpMode()
          ? "输入验证器 App 中的 6 位验证码以完成登录。"
          : mode() === "sign-in"
            ? "登录后管理照片、相册、配置与备份。"
            : "创建账号后即可进入这个实例的管理工作区。"}
      </p>
      <Show
        when={otpMode()}
        fallback={
          <>
            <form class="grid gap-3.5" onSubmit={submit}>
              <label class={`${fieldCls} ${labelCls}`}>
                用户名
                <input
                  class={inputCls}
                  required
                  minlength={3}
                  maxlength={30}
                  pattern="[A-Za-z0-9_.]+"
                  type="text"
                  autocomplete="username"
                  value={username()}
                  onInput={(event) => setUsername(event.currentTarget.value)}
                  placeholder={props.registrationOpen ? "3–30 个字母、数字、点或下划线" : "你的用户名"}
                />
              </label>
              <label class={`${fieldCls} ${labelCls}`}>
                密码
                <input
                  class={inputCls}
                  required
                  minlength={8}
                  type="password"
                  autocomplete={mode() === "sign-in" ? "current-password" : "new-password"}
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                  placeholder="至少 8 个字符"
                />
              </label>
              {error() && (
                <div class={errorBanner} role="alert">
                  {error()}
                </div>
              )}
              <Button class={`${btnPrimary} mt-1 w-full`} type="submit" disabled={pending()}>
                {pending() ? "处理中…" : mode() === "sign-in" ? "登录工作区" : "创建账号"}
              </Button>
            </form>
            <Show when={mode() === "sign-in"}>
              <div class="my-5 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
                <span class="h-px flex-1 bg-border" />
                或
                <span class="h-px flex-1 bg-border" />
              </div>
              <Button
                class={`${btnOutline} w-full`}
                type="button"
                disabled={passkeyPending()}
                onClick={() => void signInWithPasskey()}
              >
                {passkeyPending() ? "等待浏览器…" : "使用 Passkey 登录"}
              </Button>
            </Show>
          </>
        }
      >
        <form class="grid gap-3.5" onSubmit={verifyOtp}>
          <label class={`${fieldCls} ${labelCls}`}>
            验证码
            <input
              class={`${inputCls} tracking-[0.5em]`}
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength={6}
              required
              placeholder="000000"
              value={otp()}
              onInput={(event) => setOtp(event.currentTarget.value.replace(/\D/g, ""))}
            />
          </label>
          {error() && (
            <div class={errorBanner} role="alert">
              {error()}
            </div>
          )}
          <Button
            class={`${btnPrimary} mt-1 w-full`}
            type="submit"
            disabled={otpPending() || !/^\d{6}$/.test(otp())}
          >
            {otpPending() ? "验证中…" : "验证并登录"}
          </Button>
        </form>
      </Show>
    </section>
  );
}
