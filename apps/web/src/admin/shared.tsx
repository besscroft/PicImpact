import { Switch, SwitchThumb } from "@ui-sdk/solid/switch";
import { For, Show, createSignal } from "solid-js";

export const PHOTO_PAGE_SIZE = 8;

/* ===== Nova（shadcn preset bcivVKXQ）共享样式常量 ===== */

export const focusRing =
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const btnBase = `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const btnPrimary = `${btnBase} border border-transparent bg-primary text-primary-foreground hover:bg-primary/80`;
export const btnOutline = `${btnBase} border border-border bg-background hover:bg-muted hover:text-foreground`;
export const btnGhost = `${btnBase} border border-transparent text-foreground hover:bg-muted`;
export const btnDanger = `${btnBase} bg-destructive/10 text-destructive hover:bg-destructive/20`;

export const cardCls = "rounded-xl bg-card ring-1 ring-foreground/10";
const inputBase = `h-8 cursor-text rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors placeholder:text-muted-foreground disabled:bg-input/50 disabled:opacity-60 ${focusRing}`;
export const inputCls = `w-full ${inputBase}`;
export const selectCls = `w-full ${inputBase} cursor-pointer`;
export const selectAutoCls = `${inputBase} w-auto cursor-pointer`;
export const labelCls = "text-sm font-medium text-foreground";
export const fieldCls = "grid min-w-0 gap-1.5 text-left";
export const metaCls = "text-xs text-muted-foreground";
export const badgeCls = "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium";
export const badgeSecondary = `${badgeCls} max-w-full bg-secondary text-secondary-foreground`;
export const badgeDestructive = `${badgeCls} bg-destructive/10 text-destructive`;

export const rowAction = `inline-flex cursor-pointer items-center rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const errorBanner =
  "rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive";
export const noticeBanner =
  "rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground";

export const dialogBackdropCls =
  "fixed inset-0 z-50 bg-black/10 supports-[backdrop-filter]:backdrop-blur-[4px]";
export const dialogContentCls = `fixed left-1/2 top-1/2 z-50 flex max-h-[min(88dvh,820px)] w-[min(860px,100%)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden ${cardCls} p-0`;
export const dialogFooterCls =
  "flex flex-none justify-end gap-2.5 border-t border-border bg-muted/50 px-5 py-3.5";
export const dialogBodyCls =
  "grid flex-1 grid-cols-2 content-start gap-3.5 overflow-y-auto px-5 py-5 @max-[760px]:grid-cols-1";
export const dialogHeadingCls =
  "flex flex-none items-center justify-between border-b border-border px-5 py-3";
export const dialogTitleCls = "text-sm font-medium text-foreground";

export const switchCls =
  "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input p-0.5 transition-colors data-checked:bg-primary disabled:cursor-default disabled:opacity-50";
export const switchThumbCls =
  "ml-0 size-4 rounded-full bg-card shadow-sm transition-[translate] duration-150 data-checked:translate-x-4";

export const exifTableCls = "w-full border-collapse text-sm";
export const exifCellCls = "border border-border px-2.5 py-1.5 text-left";

/* ===== 逻辑工具 ===== */

export const EXIF_ROWS: Array<{ key: string; label: string }> = [
  { key: "make", label: "相机品牌" },
  { key: "model", label: "相机型号" },
  { key: "bits", label: "bit 位数" },
  { key: "dateTime", label: "拍摄时间" },
  { key: "exposure_time", label: "快门时间" },
  { key: "f_number", label: "光圈" },
  { key: "exposure_program", label: "曝光程序" },
  { key: "iso_speed_rating", label: "ISO" },
  { key: "focal_length", label: "焦距" },
  { key: "lens_specification", label: "镜头规格" },
  { key: "lens_model", label: "镜头型号" },
  { key: "exposure_mode", label: "曝光模式" },
  { key: "cfa_pattern", label: "CFA 模式" },
  { key: "color_space", label: "色彩空间" },
  { key: "white_balance", label: "白平衡" },
];

export function exifValue(exif: Record<string, unknown> | null | undefined, key: string) {
  if (!exif || typeof exif !== "object") return "";
  const value = exif[key];
  return typeof value === "string" ? value : "";
}

export function formatExifDateTime(value: string) {
  const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}${value.slice(10)}`;
}

export function exifField(photo: { exif?: Record<string, unknown> | null }, ...keys: string[]) {
  const exif = photo.exif;
  if (!exif || typeof exif !== "object") return null;
  for (const key of keys) {
    const value = exif[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

export function exifSummary(photo: { exif?: Record<string, unknown> | null }) {
  return [
    exifField(photo, "make", "model"),
    exifField(photo, "f_number"),
    exifField(photo, "focal_length"),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function labelsOf(photo: { labels?: string[] | null }) {
  return Array.isArray(photo.labels)
    ? photo.labels.filter((label): label is string => typeof label === "string")
    : [];
}

export function albumHref(albumValue: string) {
  return albumValue === "/" ? "/" : `/${albumValue.replace(/^\/+/, "")}`;
}

export const navIconCls = "size-[18px] flex-none";

export function NavIcon(props: { view: string }) {
  return (
    <svg
      class={navIconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <Show when={props.view === "dashboard"}>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </Show>
      <Show when={props.view === "upload"}>
        <path d="M12 13V3" />
        <path d="m7 8 5-5 5 5" />
        <path d="M4.5 15a4.5 4.5 0 0 0 4 4.5h7a4.5 4.5 0 0 0 4-4.5" />
      </Show>
      <Show when={props.view === "photos"}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </Show>
      <Show when={props.view === "albums"}>
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </Show>
      <Show when={props.view === "storage"}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14a8 3 0 0 0 16 0V5M4 12a8 3 0 0 0 16 0" />
      </Show>
      <Show when={props.view === "config"}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </Show>
      <Show when={props.view === "home"}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </Show>
    </svg>
  );
}

export function ToolbarIcon() {
  return (
    <svg
      class={navIconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

export function LoadingState() {
  return (
    <div class="grid gap-3 p-12" aria-live="polite">
      <div class="h-3 w-[42%] animate-pulse rounded-full bg-black/10" />
      <div class="h-3 w-[24%] animate-pulse rounded-full bg-black/10" />
      <div class="h-[220px] animate-pulse rounded-lg bg-black/10" />
    </div>
  );
}

export function EmptyState(props: { title: string; detail: string }) {
  return (
    <div class="rounded-xl border border-dashed border-input px-5 py-12 text-center">
      <h3 class="mb-1.5 text-sm font-medium text-foreground">{props.title}</h3>
      <p class="text-sm leading-relaxed text-muted-foreground">{props.detail}</p>
    </div>
  );
}

export function FilterSelect(props: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      class={selectAutoCls}
      value={props.value}
      onChange={(event) => props.onChange(event.currentTarget.value)}
    >
      <option value="">{props.placeholder}</option>
      <For each={props.options}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  );
}

export function TagInput(props: {
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = createSignal("");
  function commit() {
    const value = draft().trim();
    if (!value) return;
    if (!props.tags.includes(value)) props.onChange([...props.tags, value]);
    setDraft("");
  }
  return (
    <div
      class={`flex min-h-8 w-full flex-wrap content-center items-center gap-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-within:border-ring focus-within:outline-none focus-within:ring-3 focus-within:ring-ring/50`}
    >
      <For each={props.tags}>
        {(tag) => (
          <span class={`${badgeSecondary} gap-1 pr-1`}>
            {tag}
            <button
              type="button"
              class="cursor-pointer bg-transparent text-muted-foreground hover:text-destructive"
              aria-label={`移除标签 ${tag}`}
              onClick={() => props.onChange(props.tags.filter((item) => item !== tag))}
            >
              ×
            </button>
          </span>
        )}
      </For>
      <input
        class="min-w-[110px] flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        value={draft()}
        placeholder={props.placeholder}
        onInput={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}

export function SwitchRow(props: {
  label: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div class="flex items-center justify-between gap-3 rounded-lg border border-input bg-transparent px-3 py-2">
      <span class="grid gap-0.5">
        <span class="text-sm font-medium text-foreground">{props.label}</span>
        {props.detail ? <span class="text-xs text-muted-foreground">{props.detail}</span> : null}
      </span>
      <Switch
        class={switchCls}
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={(checked) => props.onChange?.(checked)}
      >
        <SwitchThumb class={switchThumbCls} />
      </Switch>
    </div>
  );
}
