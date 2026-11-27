import { Button } from "@ui-sdk/solid/button";
import { createSignal } from "solid-js";

export function LoginScreen(props: {
  registrationOpen: boolean;
  onRegistrationClosed: () => void;
  onAuthenticated: () => void;
}) {
  const mode = () => (props.registrationOpen ? "sign-up" : "sign-in");
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const endpoint = mode() === "sign-in" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
    const body =
      mode() === "sign-in"
        ? { email: email().trim(), password: password() }
        : {
            name: name().trim(),
            email: email().trim(),
            password: password(),
          };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          payload?.message ?? payload?.error?.message ?? "登录失败，请检查邮箱和密码",
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
        {mode() === "sign-up" && (
          <label>
            名称
            <input
              required
              autocomplete="name"
              value={name()}
              onInput={(event) => setName(event.currentTarget.value)}
              placeholder="你的名字"
            />
          </label>
        )}
        <label>
          邮箱
          <input
            required
            type="email"
            autocomplete="email"
            value={email()}
            onInput={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
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
