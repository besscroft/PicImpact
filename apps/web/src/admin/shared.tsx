import { For, Show, createSignal } from "solid-js";

export const PHOTO_PAGE_SIZE = 8;

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

export function NavIcon(props: { view: string }) {
  return (
    <svg
      class="module-icon"
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
      class="module-icon"
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
    <div class="loading-state" aria-live="polite">
      <div class="loading-bar" />
      <div class="loading-bar short" />
      <div class="loading-card" />
    </div>
  );
}

export function EmptyState(props: { title: string; detail: string }) {
  return (
    <div class="empty-state">
      <span class="empty-line" aria-hidden="true" />
      <h3>{props.title}</h3>
      <p>{props.detail}</p>
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
      class="filter-select"
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
    <div class="tag-input">
      <For each={props.tags}>
        {(tag) => (
          <span class="tag-chip">
            {tag}
            <button
              type="button"
              aria-label={`移除标签 ${tag}`}
              onClick={() => props.onChange(props.tags.filter((item) => item !== tag))}
            >
              ×
            </button>
          </span>
        )}
      </For>
      <input
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
    <label class="switch-row">
      <span class="switch-copy">
        <strong>{props.label}</strong>
        {props.detail ? <small>{props.detail}</small> : null}
      </span>
      <span class="switch">
        <input
          type="checkbox"
          checked={props.checked}
          disabled={props.disabled}
          onChange={(event) => props.onChange?.(event.currentTarget.checked)}
        />
        <i aria-hidden="true" />
      </span>
    </label>
  );
}
