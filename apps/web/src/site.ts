import { createSignal } from "solid-js";

export type SiteConfig = {
  title: string;
  faviconUrl: string;
  author: string;
  umamiHost: string;
  umamiAnalytics: string;
};

const FALLBACK_SITE_CONFIG: SiteConfig = {
  title: "PicImpact",
  faviconUrl: "",
  author: "",
  umamiHost: "",
  umamiAnalytics: "",
};

/** 当前生效的站点配置，未加载完成时回落到默认值 */
export const [siteConfig, setSiteConfig] = createSignal<SiteConfig>(FALLBACK_SITE_CONFIG);

export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch("/api/public/site");
    if (!response.ok) return siteConfig();
    const body = (await response.json()) as { data?: SiteConfig };
    const config = body.data ?? siteConfig();
    setSiteConfig(config);
    return config;
  } catch {
    return siteConfig();
  }
}

/** 把站点配置应用到浏览器环境：标题、favicon、Umami 统计脚本。 */
export function applySiteConfig(config: SiteConfig) {
  if (typeof document === "undefined") return;
  setSiteConfig(config);
  if (config.title) document.title = config.title;

  const faviconHref = config.faviconUrl || "/favicon.svg";
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  if (link.href !== faviconHref) link.href = faviconHref;

  injectUmami(config);
}

let umamiInjected = false;

/** Umami：脚本地址与 Website ID 都配置后才注入，整个页面生命周期只注入一次。 */
function injectUmami(config: SiteConfig) {
  if (umamiInjected) return;
  if (!config.umamiHost || !config.umamiAnalytics) return;
  if (!/^https?:\/\//i.test(config.umamiHost)) return;
  umamiInjected = true;
  const script = document.createElement("script");
  script.id = "umami-analytics";
  script.async = true;
  script.src = config.umamiHost;
  script.dataset.websiteId = config.umamiAnalytics;
  document.head.appendChild(script);
}
