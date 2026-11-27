const albums = [
  { name: '山野行记', route: '/travel', order: '01', visible: true, theme: '默认样式', detail: '山间徒步、雾气和沿途停留的地方。', art: 'mountain' },
  { name: '城市散步', route: '/street', order: '02', visible: true, theme: '简约样式', detail: '街角、天桥和下班路上的光。', art: 'city' },
  { name: '湖边一日', route: '/lake', order: '03', visible: true, theme: '拍立得样式', detail: '留给水面、倒影和日落。', art: 'lake' },
  { name: '光落下的时候', route: '/light', order: '04', visible: false, theme: '简约样式', detail: '收集室内不同时间的光。', art: 'light' },
  { name: '黑白练习', route: '/monochrome', order: '05', visible: false, theme: '简约样式', detail: '对比、轮廓与重复的形状。', art: 'mono' },
  { name: '远方来信', route: '/postcards', order: '06', visible: false, theme: '默认样式', detail: '尚未放进前台导航的旅行照片。', art: 'none' },
];

function icon(name, size = 16) {
  return `<ryugi-icon name="${name}" size="${size}" aria-hidden="true"></ryugi-icon>`;
}

function sidebar() {
  const items = [['layout-dashboard', '仪表盘'], ['images', '图片'], ['folder-open', '相册'], ['upload', '上传'], ['settings', '配置']];
  return `<aside class="sidebar"><div class="brand"><span class="brand-mark">P</span><span>PicImpact</span></div><div class="nav-label">管理</div><nav class="nav" aria-label="后台导航">${items.map(([symbol, label]) => `<div class="nav-item${label === '相册' ? ' active' : ''}">${icon(symbol, 17)}<span>${label}</span></div>`).join('')}</nav><div class="side-end">${icon('arrow-up-right', 15)}<span>查看前台</span></div></aside>`;
}

function shell(content, subtitle) {
  document.body.innerHTML = `<div class="workspace">${sidebar()}<main class="main"><div class="crumb">管理后台 ${icon('chevron-right', 13)} <strong>相册</strong></div><div class="page"><header class="heading"><div><h1>相册管理</h1><p class="subtitle">${subtitle}</p></div><button class="action">${icon('plus')}新建相册</button></header>${content}</div></main></div>`;
}

function status(album) {
  return `<span class="badge" data-visible="${album.visible}">${album.visible ? '公开' : '隐藏'}</span>`;
}

function cover(album) {
  if (album.art === 'none') return `<div class="cover blank">${icon('image', 25)}<span>暂无封面</span></div>`;
  return `<div class="cover"><svg viewBox="0 0 350 145" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="covers.svg#${album.art}"></use></svg></div>`;
}
