import { Button } from "@ui-sdk/solid/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@ui-sdk/solid/alert-dialog";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { For, Show, createSignal } from "solid-js";

import {
  btnOutline,
  btnPrimary,
  cardCls,
  dialogBackdropCls,
  dialogContentCls,
  dialogFooterCls,
  dialogHeadingCls,
  dialogTitleCls,
  errorBanner,
  fieldCls,
  inputCls,
  labelCls,
  metaCls,
  rowAction,
} from "../../admin/shared";
import { type PasskeyInfo, passkey } from "../../auth-client";

/** Passkey 管理卡片：列表、注册新 Passkey、删除。 */
export function PasskeyCard() {
  const [items, setItems] = createSignal<PasskeyInfo[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [registerOpen, setRegisterOpen] = createSignal(false);
  const [pendingDelete, setPendingDelete] = createSignal<PasskeyInfo | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  async function refresh() {
    const result = await passkey.list();
    if (!result.error) setItems(result.data ?? []);
    setLoaded(true);
  }

  async function removeTarget() {
    const target = pendingDelete();
    if (!target) return;
    const result = await passkey.remove(target.id);
    setPendingDelete(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await refresh();
  }

  return (
    <>
      <section class={`${cardCls} max-w-[900px] p-5`}>
        <div class="mb-3 grid gap-1">
          <div class="flex items-center justify-between gap-3">
            <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">Passkey</h2>
            <Button class={btnPrimary} type="button" onClick={() => setRegisterOpen(true)}>
              注册新 Passkey
            </Button>
          </div>
          <p class={`m-0 ${metaCls}`}>
            使用指纹、面部识别或设备锁屏密码登录，无需输入密码。
          </p>
        </div>
        <Show when={error()}>
          <div class={`${errorBanner} mb-3`} role="alert">
            {error()}
          </div>
        </Show>
        <Show when={loaded() && items().length === 0}>
          <div class="rounded-xl border border-dashed border-input px-5 py-8 text-center">
            <h3 class="mb-1.5 text-sm font-medium text-foreground">还没有注册 Passkey</h3>
            <p class="m-0 text-sm text-muted-foreground">注册后即可在登录页使用 Passkey 快速登录。</p>
          </div>
        </Show>
        <Show when={items().length > 0}>
          <div class="grid">
            <For each={items()}>
              {(item) => (
                <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-border px-1 py-3 last:border-b-0">
                  <span class="grid size-8 place-items-center rounded-lg bg-muted text-foreground" aria-hidden="true">
                    <svg
                      class="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <Show
                        when={item.deviceType === "platform"}
                        fallback={
                          <>
                            <path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V18a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2" />
                            <path d="M9 22h6" />
                          </>
                        }
                      >
                        <rect width="8" height="14" x="8" y="4" rx="2" />
                        <path d="M12 18h.01" />
                      </Show>
                    </svg>
                  </span>
                  <div class="grid min-w-0 gap-0.5">
                    <span class="truncate text-sm font-medium text-foreground">
                      {item.name || "未命名 Passkey"}
                    </span>
                    <span class={`truncate ${metaCls}`}>
                      {item.deviceType === "platform" ? "本机认证器" : "外接认证器"}
                      <Show when={item.createdAt}>
                        {" · "}注册于 {formatDate(item.createdAt!)}
                      </Show>
                      {item.backedUp ? " · 已同步备份" : " · 未同步备份"}
                    </span>
                  </div>
                  <button
                    class={rowAction}
                    type="button"
                    onClick={() => setPendingDelete(item)}
                  >
                    删除
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
      </section>
      <Show when={registerOpen()}>
        <RegisterPasskeyDialog
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => {
            setRegisterOpen(false);
            void refresh();
          }}
        />
      </Show>
      <Show when={pendingDelete()}>
        {(target) => (
          <AlertDialog defaultOpen onOpenChange={(open) => !open && setPendingDelete(null)}>
            <AlertDialogBackdrop class={dialogBackdropCls} />
            <AlertDialogContent
              class={`${cardCls} fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[min(420px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 flex-col p-0`}
              aria-labelledby="passkey-delete-title"
              aria-describedby="passkey-delete-description"
            >
              <header class="border-b border-border px-4 py-3.5">
                <AlertDialogTitle id="passkey-delete-title" class="m-0 text-lg font-semibold tracking-tight text-foreground">
                  删除 Passkey
                </AlertDialogTitle>
              </header>
              <div class="grid gap-2 px-4 py-4 text-[0.88rem] leading-relaxed text-foreground">
                <AlertDialogDescription id="passkey-delete-description" class="m-0">
                  「{target().name || "未命名 Passkey"}」删除后将无法再用它登录。
                </AlertDialogDescription>
              </div>
              <footer class="flex flex-none justify-end gap-2.5 border-t border-border bg-muted/50 px-4 py-3">
                <AlertDialogClose class={btnOutline}>取消</AlertDialogClose>
                <AlertDialogClose
                  class="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => void removeTarget()}
                >
                  删除
                </AlertDialogClose>
              </footer>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </Show>
    </>
  );
}

function RegisterPasskeyDialog(props: { onClose: () => void; onRegistered: () => void }) {
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await passkey.add(name().trim() || undefined);
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    props.onRegistered();
  }

  return (
    <Dialog defaultOpen onOpenChange={(next) => !next && props.onClose()}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent class={dialogContentCls} aria-labelledby="passkey-register-title">
        <form class="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <header class={dialogHeadingCls}>
            <DialogTitle id="passkey-register-title" class={dialogTitleCls}>
              注册新 Passkey
            </DialogTitle>
            <DialogClose class={rowAction} aria-label="关闭">
              关闭
            </DialogClose>
          </header>
          <div class="grid gap-4 px-5 py-5">
            <label class={`${fieldCls} ${labelCls}`}>
              名称（可选）
              <input
                class={inputCls}
                type="text"
                value={name()}
                onInput={(event) => setName(event.currentTarget.value)}
                placeholder="例如：MacBook 指纹、YubiKey"
              />
            </label>
            <p class={`m-0 ${metaCls}`}>
              点击「开始注册」后，浏览器会弹出 Passkey 创建窗口。
            </p>
            <Show when={error()}>
              <div class={errorBanner} role="alert">
                {error()}
              </div>
            </Show>
          </div>
          <footer class={dialogFooterCls}>
            <DialogClose class={btnOutline} disabled={pending()}>
              取消
            </DialogClose>
            <Button class={btnPrimary} type="submit" disabled={pending()}>
              {pending() ? "等待浏览器…" : "开始注册"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
