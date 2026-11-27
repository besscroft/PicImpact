import { Button } from "@ui-sdk/solid/button";
import { createSignal } from "solid-js";

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
    <section class="auth-card" aria-labelledby="auth-title">
      <div class="auth-kicker">PICIMPACT / PRIVATE WORKSPACE</div>
      <h1 id="auth-title">{mode() === "sign-in" ? "回到你的影像库" : "建立管理员账号"}</h1>
      <p class="auth-intro">
        {mode() === "sign-in"
          ? "登录后管理照片、相册、配置与备份。"
          : "创建账号后即可进入这个实例的管理工作区。"}
      </p>
      <form class="auth-form" onSubmit={submit}>
        <label>
          用户名
          <input
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
        <label>
          密码
          <input
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
          <div class="auth-error" role="alert">
            {error()}
          </div>
        )}
        <Button class="primary-button auth-submit" type="submit" disabled={pending()}>
          {pending() ? "处理中…" : mode() === "sign-in" ? "登录工作区" : "创建账号"}
        </Button>
      </form>
    </section>
  );
}
