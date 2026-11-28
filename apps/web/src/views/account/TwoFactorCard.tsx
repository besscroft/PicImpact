import { Button } from "@ui-sdk/solid/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { renderSVG } from "uqr";
import { For, Show, createSignal } from "solid-js";

import {
  badgeCls,
  badgeSecondary,
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
  focusRing,
  inputCls,
  labelCls,
  metaCls,
  rowAction,
} from "../../admin/shared";
import { twoFactor } from "../../auth-client";

const btnDangerOutline = `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 ${focusRing}`;

/**
 * 双因素验证（TOTP）卡片：
 * 未开启 → 输入密码生成二维码，验证码校验后开启并展示一次性备份码；
 * 已开启 → 输入密码关闭。
 */
export function TwoFactorCard(props: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [flow, setFlow] = createSignal<"idle" | "enable" | "disable">("idle");
  const [backupCodes, setBackupCodes] = createSignal<string[]>([]);

  function handleEnabled(codes: string[]) {
    setBackupCodes(codes);
    props.onEnabledChange(true);
    setFlow("idle");
  }

  function handleDisabled() {
    props.onEnabledChange(false);
    setFlow("idle");
  }

  return (
    <>
      <section class={`${cardCls} max-w-[900px] p-5`}>
        <div class="mb-3 grid gap-1">
          <div class="flex items-center gap-2.5">
            <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">双因素验证</h2>
            <span
              class={props.enabled ? `${badgeCls} bg-primary/10 text-primary` : badgeSecondary}
            >
              {props.enabled ? "已开启" : "未开启"}
            </span>
          </div>
          <p class={`m-0 ${metaCls}`}>
            使用验证器 App（如 Google Authenticator、1Password）生成一次性验证码，登录时需要额外输入。
          </p>
        </div>
        <Button
          class={props.enabled ? btnDangerOutline : btnPrimary}
          type="button"
          onClick={() => setFlow(props.enabled ? "disable" : "enable")}
        >
          {props.enabled ? "关闭双因素验证" : "开启双因素验证"}
        </Button>
      </section>
      <Show when={flow() === "enable"}>
        <EnableFlow onClose={() => setFlow("idle")} onEnabled={handleEnabled} />
      </Show>
      <Show when={flow() === "disable"}>
        <DisableFlow onClose={() => setFlow("idle")} onDisabled={handleDisabled} />
      </Show>
      <Show when={flow() === "idle" && backupCodes().length > 0}>
        <BackupCodesDialog
          codes={backupCodes()}
          onClose={() => setBackupCodes([])}
        />
      </Show>
    </>
  );
}

/** 第一步：密码 → totpURI 二维码；第二步：输入 6 位验证码完成绑定 */
function EnableFlow(props: { onClose: () => void; onEnabled: (backupCodes: string[]) => void }) {
  const [step, setStep] = createSignal<"password" | "scan">("password");
  const [password, setPassword] = createSignal("");
  const [totpURI, setTotpURI] = createSignal("");
  const [backupCodes, setBackupCodes] = createSignal<string[]>([]);
  const [code, setCode] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function start() {
    setPending(true);
    setError(null);
    const result = await twoFactor.enable(password());
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes ?? []);
    setStep("scan");
  }

  async function verify() {
    setPending(true);
    setError(null);
    const result = await twoFactor.verifyTotp(code());
    setPending(false);
    if (result.error) {
      setError("验证码不正确，请重试");
      return;
    }
    props.onEnabled(backupCodes());
  }

  return (
    <Dialog defaultOpen onOpenChange={(next) => !next && props.onClose()}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent class={dialogContentCls} aria-labelledby="twofactor-enable-title">
        <header class={dialogHeadingCls}>
          <DialogTitle id="twofactor-enable-title" class={dialogTitleCls}>
            开启双因素验证
          </DialogTitle>
          <DialogClose class={rowAction} aria-label="关闭">
            关闭
          </DialogClose>
        </header>
        <Show
          when={step() === "scan"}
          fallback={
            <form
              class="grid gap-4 px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                void start();
              }}
            >
              <label class={`${fieldCls} ${labelCls}`}>
                当前密码
                <input
                  class={inputCls}
                  type="password"
                  autocomplete="current-password"
                  required
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                  placeholder="确认身份后生成绑定二维码"
                />
              </label>
              <Show when={error()}>
                <div class={errorBanner} role="alert">
                  {error()}
                </div>
              </Show>
            </form>
          }
        >
          <div class="grid gap-4 px-5 py-5">
            <p class="m-0 text-sm leading-relaxed text-muted-foreground">
              用验证器 App 扫描下方二维码，然后输入 6 位验证码确认绑定。
            </p>
            <div
              class="mx-auto w-[200px] rounded-xl bg-white p-3.5 [&>svg]:h-full [&>svg]:w-full"
              // totpURI 由 better-auth 生成，uqr 输出的 SVG 仅包含二维码形状
              innerHTML={renderSVG(totpURI())}
              aria-label="TOTP 绑定二维码"
            />
            <label class={`${fieldCls} ${labelCls}`}>
              验证码
              <input
                class={`${inputCls} tracking-[0.5em]`}
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength={6}
                placeholder="000000"
                value={code()}
                onInput={(event) => setCode(event.currentTarget.value.replace(/\D/g, ""))}
              />
            </label>
            <Show when={error()}>
              <div class={errorBanner} role="alert">
                {error()}
              </div>
            </Show>
          </div>
        </Show>
        <footer class={dialogFooterCls}>
          <DialogClose class={btnOutline} disabled={pending()}>
            取消
          </DialogClose>
          <Show
            when={step() === "scan"}
            fallback={
              <Button
                class={btnPrimary}
                type="button"
                disabled={pending() || !password()}
                onClick={() => void start()}
              >
                {pending() ? "生成中…" : "下一步"}
              </Button>
            }
          >
            <Button
              class={btnPrimary}
              type="button"
              disabled={pending() || !/^\d{6}$/.test(code())}
              onClick={() => void verify()}
            >
              {pending() ? "验证中…" : "验证并开启"}
            </Button>
          </Show>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function DisableFlow(props: { onClose: () => void; onDisabled: () => void }) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await twoFactor.disable(password());
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    props.onDisabled();
  }

  return (
    <Dialog defaultOpen onOpenChange={(next) => !next && props.onClose()}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent class={dialogContentCls} aria-labelledby="twofactor-disable-title">
        <form class="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <header class={dialogHeadingCls}>
            <DialogTitle id="twofactor-disable-title" class={dialogTitleCls}>
              关闭双因素验证
            </DialogTitle>
            <DialogClose class={rowAction} aria-label="关闭">
              关闭
            </DialogClose>
          </header>
          <div class="grid gap-4 px-5 py-5">
            <label class={`${fieldCls} ${labelCls}`}>
              当前密码
              <input
                class={inputCls}
                type="password"
                autocomplete="current-password"
                required
                value={password()}
                onInput={(event) => setPassword(event.currentTarget.value)}
              />
            </label>
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
            <Button class={btnPrimary} type="submit" disabled={pending() || !password()}>
              {pending() ? "处理中…" : "确认关闭"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BackupCodesDialog(props: { codes: string[]; onClose: () => void }) {
  return (
    <Dialog defaultOpen onOpenChange={(next) => !next && props.onClose()}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent class={dialogContentCls} aria-labelledby="twofactor-backup-title">
        <header class={dialogHeadingCls}>
          <DialogTitle id="twofactor-backup-title" class={dialogTitleCls}>
            双因素验证已开启
          </DialogTitle>
          <DialogClose class={rowAction} aria-label="关闭">
            关闭
          </DialogClose>
        </header>
        <div class="grid gap-3.5 px-5 py-5">
          <p class="m-0 text-sm leading-relaxed text-muted-foreground">
            请把备份码保存在安全的地方。验证器不可用时，可用备份码作为第二因素登录，每个备份码只能使用一次。
          </p>
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted px-4 py-3.5 font-mono text-sm text-foreground max-[560px]:grid-cols-1">
            <For each={props.codes}>{(code) => <span>{code}</span>}</For>
          </div>
        </div>
        <footer class={dialogFooterCls}>
          <DialogClose class={btnPrimary}>我已保存备份码</DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
