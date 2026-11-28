import { Button } from "@ui-sdk/solid/button";
import { For, Show, createEffect, createSignal } from "solid-js";

import {
  badgeSecondary,
  btnOutline,
  btnPrimary,
  cardCls,
  errorBanner,
  fieldCls,
  inputCls,
  labelCls,
  metaCls,
  rowAction,
} from "../admin/shared";
import {
  type AuthSessionInfo,
  type AuthUser,
  changePassword,
  getSession,
  passkey,
  sessions,
  updateUser,
} from "../auth-client";
import { PasskeyCard } from "./account/PasskeyCard";
import { TwoFactorCard } from "./account/TwoFactorCard";

/** 账户设置：基本信息、修改密码、双因素验证、Passkey、登录会话。 */
export function AccountView(props: {
  user: AuthUser | null;
  onUserNameChange: (name: string) => void;
}) {
  const [profile, setProfile] = createSignal<AuthUser | null>(props.user);
  const [name, setName] = createSignal(props.user?.name ?? "");
  const [twoFactorEnabled, setTwoFactorEnabled] = createSignal(
    Boolean(props.user?.twoFactorEnabled),
  );

  async function reloadProfile() {
    const result = await getSession();
    if (result.error) return;
    setProfile(result.data.user);
    setName(result.data.user.name);
    setTwoFactorEnabled(Boolean(result.data.user.twoFactorEnabled));
  }

  return (
    <section class="grid gap-5">
      <ProfileCard
        profile={profile()}
        name={name()}
        onNameChange={setName}
        onSaved={(savedName) => {
          props.onUserNameChange(savedName);
          void reloadProfile();
        }}
      />
      <PasswordCard />
      <TwoFactorCard enabled={twoFactorEnabled()} onEnabledChange={setTwoFactorEnabled} />
      <PasskeyCard />
      <SessionsCard />
    </section>
  );
}

function ProfileCard(props: {
  profile: AuthUser | null;
  name: string;
  onNameChange: (name: string) => void;
  onSaved: (name: string) => void;
}) {
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const nextName = props.name.trim();
    if (!nextName) {
      setError("显示名称不能为空");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await updateUser({ name: nextName });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMessage("已保存");
    props.onSaved(nextName);
  }

  return (
    <section class={`${cardCls} max-w-[900px] p-5`}>
      <div class="mb-3 grid gap-1">
        <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">基本信息</h2>
        <p class={`m-0 ${metaCls}`}>用户名是登录凭据，创建后不可修改。</p>
      </div>
      <form class="grid max-w-[560px] gap-3.5" onSubmit={submit}>
        <label class={`${fieldCls} ${labelCls}`}>
          用户名
          <input class={inputCls} type="text" value={props.profile?.username ?? ""} disabled />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          显示名称
          <input
            class={inputCls}
            type="text"
            value={props.name}
            onInput={(event) => props.onNameChange(event.currentTarget.value)}
            placeholder="用于侧栏与界面展示"
          />
        </label>
        <Show when={message()}>
          <span class="text-sm text-foreground" role="status">
            {message()}
          </span>
        </Show>
        <Show when={error()}>
          <div class={errorBanner} role="alert">
            {error()}
          </div>
        </Show>
        <div>
          <Button class={btnPrimary} type="submit" disabled={saving()}>
            {saving() ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [message, setMessage] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (newPassword().length < 8) {
      setError("新密码不能少于 8 位");
      return;
    }
    if (newPassword() !== confirmPassword()) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await changePassword({
      currentPassword: currentPassword(),
      newPassword: newPassword(),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error.message || "修改失败");
      return;
    }
    // revokeOtherSessions: true 后当前会话已换成新 token
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("密码已修改，其他设备的登录会话已撤销");
  }

  return (
    <section class={`${cardCls} max-w-[900px] p-5`}>
      <div class="mb-3 grid gap-1">
        <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">修改密码</h2>
        <p class={`m-0 ${metaCls}`}>修改后会自动撤销其他设备的登录会话。</p>
      </div>
      <form class="grid max-w-[560px] gap-3.5" onSubmit={submit}>
        <label class={`${fieldCls} ${labelCls}`}>
          当前密码
          <input
            class={inputCls}
            type="password"
            autocomplete="current-password"
            required
            value={currentPassword()}
            onInput={(event) => setCurrentPassword(event.currentTarget.value)}
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          新密码
          <input
            class={inputCls}
            type="password"
            autocomplete="new-password"
            required
            minlength={8}
            value={newPassword()}
            onInput={(event) => setNewPassword(event.currentTarget.value)}
            placeholder="至少 8 个字符"
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          确认新密码
          <input
            class={inputCls}
            type="password"
            autocomplete="new-password"
            required
            value={confirmPassword()}
            onInput={(event) => setConfirmPassword(event.currentTarget.value)}
          />
        </label>
        <Show when={message()}>
          <span class="text-sm text-foreground" role="status">
            {message()}
          </span>
        </Show>
        <Show when={error()}>
          <div class={errorBanner} role="alert">
            {error()}
          </div>
        </Show>
        <div>
          <Button class={btnPrimary} type="submit" disabled={saving()}>
            {saving() ? "提交中…" : "修改密码"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SessionsCard() {
  const [items, setItems] = createSignal<AuthSessionInfo[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function refresh() {
    const result = await sessions.list();
    setLoaded(true);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setItems(result.data ?? []);
  }

  async function revoke(id: string) {
    const result = await sessions.revoke(id);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await refresh();
  }

  async function revokeOthers() {
    const result = await sessions.revokeOthers();
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await refresh();
  }

  createEffect(
    () => true,
    () => void refresh(),
  );

  return (
    <section class={`${cardCls} max-w-[900px] p-5`}>
      <div class="mb-3 grid gap-1">
        <div class="flex items-center justify-between gap-3">
          <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">登录会话</h2>
          <Button class={btnOutline} type="button" onClick={() => void revokeOthers()}>
            撤销其他会话
          </Button>
        </div>
        <p class={`m-0 ${metaCls}`}>当前浏览器会话用「本会话」标记。</p>
      </div>
      <Show when={error()}>
        <div class={`${errorBanner} mb-3`} role="alert">
          {error()}
        </div>
      </Show>
      <Show
        when={loaded() && items().length === 0}
        fallback={
          <Show when={items().length > 0}>
            <div class="grid">
              <For each={items()}>
                {(item) => (
                  <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-border px-1 py-3 last:border-b-0">
                    <div class="grid min-w-0 gap-0.5">
                      <span class="truncate text-sm font-medium text-foreground">
                        {describeDevice(item.userAgent)}
                        {isCurrentSession(item, items()) ? (
                          <span class={`${badgeSecondary} ml-2 align-middle`}>本会话</span>
                        ) : null}
                      </span>
                      <span class={`truncate ${metaCls}`}>
                        {item.ipAddress || "IP 未知"}
                        {item.createdAt ? ` · 登录于 ${formatDate(item.createdAt)}` : ""}
                        {` · 过期于 ${formatDate(item.expiresAt)}`}
                      </span>
                    </div>
                    <Show when={!isCurrentSession(item, items())}>
                      <button class={rowAction} type="button" onClick={() => void revoke(item.id)}>
                        撤销
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        }
      >
        <div class="rounded-xl border border-dashed border-input px-5 py-8 text-center">
          <p class="m-0 text-sm text-muted-foreground">没有可显示的会话。</p>
        </div>
      </Show>
    </section>
  );
}

function isCurrentSession(item: AuthSessionInfo, items: AuthSessionInfo[]) {
  // better-auth list-sessions 把当前会话放在第一位，且未提供 isCurrent 标记；
  // 这里用浏览器下无法精确判断的现实约定：第一项即当前会话。
  return items[0]?.id === item.id;
}

function describeDevice(userAgent?: string | null) {
  if (!userAgent) return "未知设备";
  if (/iPhone|iPad|iOS/i.test(userAgent)) return "iOS 设备";
  if (/Android/i.test(userAgent)) return "Android 设备";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "macOS 设备";
  if (/Windows/i.test(userAgent)) return "Windows 设备";
  if (/Linux/i.test(userAgent)) return "Linux 设备";
  return "其他设备";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
