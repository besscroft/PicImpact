import { Button } from "@ui-sdk/solid/button";
import { createSignal } from "solid-js";

import { btnPrimary, cardCls, errorBanner, fieldCls, inputCls, labelCls } from "./admin/shared";

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
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          code?: string;
          message?: string;
          error?: { message?: string };
        } | null;
        if (payload?.code === "REGISTRATION_CLOSED") {
          props.onRegistrationClosed();
        }
        throw new Error(
          payload?.message ?? payload?.error?.message ?? "登录失败，请检查用户名和密码",
        );
      }
      props.onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <section class={`${cardCls} w-[min(440px,100%)] p-8`} aria-labelledby="auth-title">
      <div class="mb-3.5 text-xs font-medium text-muted-foreground">PICIMPACT / PRIVATE WORKSPACE</div>
      <h1 id="auth-title" class="mb-2.5 text-2xl font-semibold tracking-tight text-foreground">
        {mode() === "sign-in" ? "回到你的影像库" : "建立管理员账号"}
      </h1>
      <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
        {mode() === "sign-in"
          ? "登录后管理照片、相册、配置与备份。"
          : "创建账号后即可进入这个实例的管理工作区。"}
      </p>
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
    </section>
  );
}
