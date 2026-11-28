import { render } from "@solidjs/web";

import App from "./App";
import { applySiteConfig, fetchSiteConfig } from "./site";
import "./styles.css";

render(() => <App />, document.getElementById("app")!);

// 启动时读取站点配置并应用标题 / favicon / Umami（失败时保留默认值）
void fetchSiteConfig().then(applySiteConfig);
