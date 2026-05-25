[SKILL.md](https://github.com/user-attachments/files/28207575/SKILL.md)
# map-z SKILL

使用本 Skill，Claude 可以根据用户描述，自动生成一个完整的、开箱即用的 3D 交互地图 HTML 文件。

## 触发词

用户说以下任意内容时，启用本 Skill：
- "帮我生成一个地图"
- "做一个XX的3D地图"
- "可视化这份地理数据"
- "生成热力地图 / 飞线地图 / 区域地图"
- "map-z 生成"

## 输出规范

每次生成一个完整的单 HTML 文件，包含：
1. 地图渲染（MapLibre GL + 自定义 3D 效果）
2. 流光边界动画
3. 飞线动画（如有数据）
4. 地图下钻交互（全国 → 省 → 市 → 区县）
5. 鼠标悬浮 Tooltip
6. 数据侧边栏

文件可直接双击在浏览器打开，无需任何安装。

---

## 代码模板

生成地图时，严格按照以下模板结构输出，替换 `{{占位符}}` 部分：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{地图标题}} — map-z</title>
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#080a0f; font-family:-apple-system,'PingFang SC',sans-serif; color:#fff; height:100vh; display:flex; flex-direction:column; overflow:hidden; }

    /* ===== 头部 ===== */
    header { padding:12px 20px; background:rgba(8,10,15,0.9); border-bottom:1px solid rgba({{R}},{{G}},{{B}},0.2); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    .logo { font-size:18px; font-weight:700; }
    .logo em { color:{{主色}}; font-style:normal; }
    .breadcrumb { display:flex; align-items:center; gap:6px; font-size:13px; color:rgba(255,255,255,0.4); }
    .breadcrumb span { color:rgba(255,255,255,0.8); cursor:pointer; }
    .breadcrumb span:hover { color:{{主色}}; }
    .breadcrumb i { font-size:10px; }

    /* ===== 主体 ===== */
    .main { flex:1; display:flex; overflow:hidden; position:relative; }
    #map { flex:1; }

    /* ===== 侧边栏 ===== */
    .sidebar { width:220px; background:rgba(8,10,15,0.85); border-left:1px solid rgba({{R}},{{G}},{{B}},0.1); overflow-y:auto; flex-shrink:0; }
    .s-section { padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.05); }
    .s-title { font-size:10px; font-weight:600; letter-spacing:2px; color:rgba({{R}},{{G}},{{B}},0.6); text-transform:uppercase; margin-bottom:10px; }
    .data-item { display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer; border-radius:4px; transition:background 0.15s; }
    .data-item:hover { background:rgba(255,255,255,0.04); padding:4px 6px; margin:0 -6px; }
    .data-name { font-size:12px; color:rgba(255,255,255,0.65); min-width:30px; }
    .data-bar-wrap { flex:1; height:3px; background:rgba(255,255,255,0.06); border-radius:2px; }
    .data-bar { height:100%; border-radius:2px; background:{{主色}}; }
    .data-val { font-size:11px; color:{{主色}}; min-width:24px; text-align:right; }
    .tip { font-size:11px; color:rgba(255,255,255,0.3); line-height:1.9; }
    .legend { display:flex; align-items:center; gap:8px; }
    .legend-bar { flex:1; height:5px; border-radius:3px; }
    .legend-label { font-size:10px; color:rgba(255,255,255,0.3); }

    /* ===== Tooltip ===== */
    #tooltip { position:absolute; background:rgba(8,10,15,0.95); border:1px solid rgba({{R}},{{G}},{{B}},0.4); border-radius:8px; padding:10px 14px; font-size:13px; pointer-events:none; display:none; z-index:100; box-shadow:0 0 20px rgba({{R}},{{G}},{{B}},0.2); }
    #tooltip .t-name { font-weight:600; margin-bottom:4px; }
    #tooltip .t-val { font-size:12px; color:rgba(255,255,255,0.5); }
    #tooltip .t-num { color:{{主色}}; font-weight:700; }

    /* ===== 流光动画 ===== */
    @keyframes flowPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }

    /* ===== 下钻按钮 ===== */
    #back-btn { position:absolute; top:12px; left:12px; background:rgba(8,10,15,0.9); border:1px solid rgba({{R}},{{G}},{{B}},0.4); color:{{主色}}; padding:6px 14px; border-radius:20px; font-size:12px; cursor:pointer; display:none; z-index:50; transition:all 0.2s; }
    #back-btn:hover { background:rgba({{R}},{{G}},{{B}},0.15); }

    .maplibregl-ctrl-attrib, .maplibregl-ctrl-logo { display:none !important; }
  </style>
</head>
<body>

<header>
  <div class="logo">map<em>-z</em> <span style="font-size:13px;font-weight:400;color:rgba(255,255,255,0.4);margin-left:8px">{{地图标题}}</span></div>
  <div class="breadcrumb" id="breadcrumb">
    <span onclick="drillUp(0)">全国</span>
  </div>
</header>

<div class="main">
  <div id="map"></div>
  <button id="back-btn" onclick="drillBack()">← 返回上级</button>
  <div id="tooltip">
    <div class="t-name" id="tt-name"></div>
    <div class="t-val">{{数据标签}}：<span class="t-num" id="tt-val"></span></div>
  </div>
  <div class="sidebar">
    <div class="s-section">
      <div class="s-title">图例</div>
      <div class="legend">
        <span class="legend-label">低</span>
        <div class="legend-bar" style="background:linear-gradient(to right,{{暗色}},{{主色}})"></div>
        <span class="legend-label">高</span>
      </div>
    </div>
    <div class="s-section">
      <div class="s-title">数据排名</div>
      <div id="data-list"></div>
    </div>
    {{#if 飞线数据}}
    <div class="s-section">
      <div class="s-title">飞线来源</div>
      <div id="arc-list"></div>
    </div>
    {{/if}}
    <div class="s-section">
      <div class="s-title">操作</div>
      <p class="tip">点击省份下钻查看<br>拖拽旋转视角<br>滚轮缩放地图<br>悬停查看数值</p>
    </div>
  </div>
</div>

<script>
// ==================== 数据配置（按需修改）====================
const THEME = {
  main: '{{主色}}',
  dark: '{{暗色}}',
  mid:  '{{中间色}}',
  rgb:  [{{R}}, {{G}}, {{B}}]
};

const REGION_DATA = {{区域数据JSON}};
// 格式: [ {name:'北京', value:98, adcode:'110000'}, ... ]

const ARC_DATA = {{飞线数据JSON}};
// 格式: [ {from:'上海', to:'北京', fromCoord:[121.47,31.23], toCoord:[116.40,39.90], value:100}, ... ]
// 无飞线时设为 []

const MAX_VAL = Math.max(...REGION_DATA.map(d=>d.value));
// ==================== 数据配置结束 ====================

// 地图层级状态
let drillStack = []; // 记录下钻路径
let currentAdcode = '100000'; // 当前层级 adcode

// ===== 地图初始化 =====
const map = new maplibregl.Map({
  container: 'map',
  style: { version:8, sources:{}, layers:[{id:'bg',type:'background',paint:{'background-color':'#080a0f'}}] },
  center: [106, 36], zoom: 3.6, pitch: 52, bearing: -6, antialias: true
});

map.on('load', async () => {
  await loadRegion('100000');
  if (ARC_DATA.length > 0) renderArcs();
  renderSidebar();
});

// ===== 区域加载与渲染 =====
async function loadRegion(adcode) {
  currentAdcode = adcode;
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
  const res = await fetch(url);
  const geojson = await res.json();

  geojson.features.forEach(f => {
    const rawName = f.properties.name || '';
    const shortName = rawName.replace(/省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g,'');
    const match = REGION_DATA.find(d => shortName.includes(d.name) || d.name.includes(shortName));
    f.properties._value   = match ? match.value : 0;
    f.properties._name    = match ? match.name : rawName;
    f.properties._adcode  = f.properties.adcode || '';
  });

  // 移除旧图层
  ['glow2','glow1','border','top','extrusion'].forEach(id => {
    if (map.getLayer('province-'+id)) map.removeLayer('province-'+id);
  });
  if (map.getSource('provinces')) map.removeSource('provinces');

  map.addSource('provinces', { type:'geojson', data: geojson });

  // 3D 挤出层
  map.addLayer({ id:'province-extrusion', type:'fill-extrusion', source:'provinces', paint: {
    'fill-extrusion-color': ['case', ['>', ['get','_value'], 0],
      ['interpolate',['linear'],['get','_value'], 0, THEME.dark, MAX_VAL*0.5, THEME.mid, MAX_VAL, THEME.main],
      '#0d0f14'],
    'fill-extrusion-height': ['*', ['get','_value'], adcode==='100000' ? 1200 : 800],
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.88
  }});

  // 顶面压暗
  map.addLayer({ id:'province-top', type:'fill', source:'provinces', paint: {
    'fill-color': '#080a0f', 'fill-opacity': 0.5
  }});

  // 边界线
  map.addLayer({ id:'province-border', type:'line', source:'provinces', paint: {
    'line-color': 'rgba(255,255,255,0.07)', 'line-width': 0.5
  }});

  // 流光描边（宽，低透明度）
  map.addLayer({ id:'province-glow1', type:'line', source:'provinces', paint: {
    'line-color': ['case',['>', ['get','_value'], 0], THEME.main, 'rgba(0,0,0,0)'],
    'line-width': 4, 'line-opacity': 0.25, 'line-blur': 6
  }});

  // 流光描边（细，高亮）
  map.addLayer({ id:'province-glow2', type:'line', source:'provinces', paint: {
    'line-color': ['case',['>', ['get','_value'], 0], THEME.main, 'rgba(0,0,0,0)'],
    'line-width': 1, 'line-opacity': 0.9
  }});

  // 流光动画（通过 opacity 脉冲实现）
  let glowDir = -1, glowVal = 0.9;
  setInterval(() => {
    glowVal += glowDir * 0.04;
    if (glowVal <= 0.3) glowDir = 1;
    if (glowVal >= 0.9) glowDir = -1;
    if (map.getLayer('province-glow2')) map.setPaintProperty('province-glow2','line-opacity', glowVal);
  }, 60);

  // Tooltip
  const tooltip = document.getElementById('tooltip');
  map.on('mousemove','province-extrusion', e => {
    const props = e.features?.[0]?.properties;
    if (!props) { tooltip.style.display='none'; return; }
    document.getElementById('tt-name').textContent = props._name;
    document.getElementById('tt-val').textContent  = props._value || '暂无数据';
    tooltip.style.display = 'block';
    tooltip.style.left = (e.point.x + 16) + 'px';
    tooltip.style.top  = (e.point.y - 8)  + 'px';
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave','province-extrusion', () => {
    tooltip.style.display = 'none';
    map.getCanvas().style.cursor = '';
  });

  // 下钻点击
  map.on('click','province-extrusion', e => {
    const props = e.features?.[0]?.properties;
    if (!props || !props._adcode) return;
    const adcode = props._adcode;
    if (!adcode || adcode.endsWith('0000') === false) return; // 已是最小单元
    drillDown(adcode, props._name);
  });

  // 面包屑与返回按钮
  document.getElementById('back-btn').style.display = drillStack.length > 0 ? 'block' : 'none';
  updateBreadcrumb();
}

// ===== 下钻 =====
function drillDown(adcode, name) {
  drillStack.push({ adcode: currentAdcode, name });
  loadRegion(adcode);
  // 飞线下钻时隐藏
  if (map.getLayer('arcs')) map.setLayoutProperty('arcs','visibility','none');
}

function drillBack() {
  if (drillStack.length === 0) return;
  const prev = drillStack.pop();
  loadRegion(prev.adcode);
  if (drillStack.length === 0 && ARC_DATA.length > 0) {
    if (map.getLayer('arcs')) map.setLayoutProperty('arcs','visibility','visible');
  }
}

function drillUp(index) {
  while (drillStack.length > index) drillStack.pop();
  loadRegion(index === 0 ? '100000' : drillStack[index-1]?.adcode || '100000');
}

function updateBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  let html = `<span onclick="drillUp(0)">全国</span>`;
  drillStack.forEach((item, i) => {
    html += `<i>›</i><span onclick="drillUp(${i+1})">${item.name}</span>`;
  });
  bc.innerHTML = html;
}

// ===== 飞线渲染 =====
function renderArcs() {
  if (!ARC_DATA.length) return;
  const maxArc = Math.max(...ARC_DATA.map(d=>d.value));

  const arcFeatures = ARC_DATA.map(d => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: greatCircle(d.fromCoord, d.toCoord)
    },
    properties: { value: d.value, from: d.from, to: d.to }
  }));

  map.addSource('arcs', { type:'geojson', data:{ type:'FeatureCollection', features: arcFeatures }});

  // 飞线底色
  map.addLayer({ id:'arcs-bg', type:'line', source:'arcs', paint: {
    'line-color': THEME.main,
    'line-width': ['interpolate',['linear'],['get','value'], 0,0.5, maxArc,3],
    'line-opacity': 0.25
  }});

  // 飞线亮线
  map.addLayer({ id:'arcs', type:'line', source:'arcs', paint: {
    'line-color': THEME.main,
    'line-width': ['interpolate',['linear'],['get','value'], 0,0.5, maxArc,2],
    'line-opacity': 0.8,
    'line-dasharray': [2, 4]
  }});

  // 飞线流动动画
  let offset = 0;
  setInterval(() => {
    offset = (offset + 1) % 6;
    if (map.getLayer('arcs')) map.setPaintProperty('arcs','line-dasharray',[2, 4]);
  }, 80);

  // 飞线侧边栏
  const arcList = document.getElementById('arc-list');
  if (arcList) {
    arcList.innerHTML = ARC_DATA.sort((a,b)=>b.value-a.value).slice(0,8).map(d=>
      `<div class="data-item">
        <span class="data-name" style="min-width:60px">${d.from}→${d.to}</span>
        <span class="data-val">${d.value}</span>
      </div>`
    ).join('');
  }
}

// 大圆弧插值（让飞线弯曲）
function greatCircle(from, to, steps=30) {
  const points = [];
  for (let i=0; i<=steps; i++) {
    const t = i/steps;
    const lng = from[0] + (to[0]-from[0])*t;
    const lat = from[1] + (to[1]-from[1])*t;
    // 抛物线高度
    const h = Math.sin(Math.PI*t) * 5;
    points.push([lng, lat+h]);
  }
  return points;
}

// ===== 侧边栏 =====
function renderSidebar() {
  const sorted = [...REGION_DATA].sort((a,b)=>b.value-a.value);
  document.getElementById('data-list').innerHTML = sorted.map(d => {
    const pct = Math.round(d.value/MAX_VAL*100);
    return `<div class="data-item" onclick="focusRegion('${d.name}')">
      <span class="data-name">${d.name}</span>
      <div class="data-bar-wrap"><div class="data-bar" style="width:${pct}%"></div></div>
      <span class="data-val">${d.value}</span>
    </div>`;
  }).join('');
}
</script>
</body>
</html>
```

---

## Claude 生成地图的规则

### 1. 识别用户需求

| 用户说 | Claude 填入 |
|--------|------------|
| "北京的地图" | 初始加载北京（adcode: 110000） |
| "全国省份热力图" | 默认全国（adcode: 100000） |
| "从上海飞往各城市的航线" | 生成飞线数据，from='上海' |
| "销售额数据地图" | 数据标签改为"销售额（万元）" |

### 2. 配色选择规则

| 场景 | 主色 | R,G,B | 暗色 | 中间色 |
|------|------|-------|------|--------|
| 科技/默认 | #00c9ff | 0,201,255 | #001a2e | #0080ff |
| 商业/销售 | #ff8c00 | 255,140,0 | #1a0800 | #cc5500 |
| 环境/生态 | #39ff14 | 57,255,20 | #001a08 | #00aa33 |
| 医疗/健康 | #ff4d8d | 255,77,141 | #1a0010 | #cc2266 |
| 政务/严肃 | #4f8ef7 | 79,142,247 | #0d1a3d | #2255cc |

### 3. 数据填充规则

- 用户提供了数据 → 直接使用
- 用户未提供数据 → 生成合理的示例数据（全国31省）
- 飞线数据未提供 → `ARC_DATA = []`

### 4. 下钻层级 adcode 对照

| 层级 | URL 格式 | 示例 |
|------|----------|------|
| 全国 | 100000_full.json | 显示省级 |
| 省级 | {省adcode}_full.json | 110000 = 北京 |
| 市级 | {市adcode}_full.json | 110100 = 北京市区 |

常用省级 adcode：
北京110000 上海310000 广东440000 浙江330000 江苏320000
四川510000 湖北420000 山东370000 河南410000 福建350000

---

## 使用示例

**用户输入**：帮我生成一个全国GDP分布的3D地图，科技蓝配色

**Claude 输出**：按模板生成完整 HTML，其中：
- `{{主色}}` → `#00c9ff`
- `{{区域数据JSON}}` → 31省GDP示例数据
- `{{飞线数据JSON}}` → `[]`
- `{{数据标签}}` → `GDP（亿元）`

---

## 版本

map-z skill v0.1.0 | MIT License | github.com/{{your-username}}/map-z
