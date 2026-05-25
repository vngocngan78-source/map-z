# 性能优化规范

## 核心原则

map-z 以"零安装、秒加载"为目标，所有优化围绕首屏速度展开。

## GeoJSON 数据优化

### 问题
阿里云 GeoJSON 原始文件较大（全国省级约 800KB），直接加载影响首屏速度。

### 解决方案

1. **按需加载**：只在用户下钻时才加载下一层级数据
2. **缓存复用**：已加载的 adcode 数据缓存在内存中，避免重复请求

```javascript
const geoCache = new Map()

async function loadRegion(adcode) {
  if (geoCache.has(adcode)) {
    return geoCache.get(adcode)
  }
  const res = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`)
  const data = await res.json()
  geoCache.set(adcode, data)
  return data
}
```

## 渲染性能

### 图层数量控制
- 同时存在的图层不超过 8 个
- 下钻时先移除旧图层，再添加新图层

### 动画帧率
- 流光动画使用 `setInterval(50ms)` 而非 `requestAnimationFrame`
- 避免与 WebGL 渲染抢占主线程

### 飞线数量
- 建议最多 20 条飞线
- 超过 50 条时自动按 value 排序取前 20

## 首屏加载顺序

```
1. 解析 HTML/CSS（同步）
2. 初始化 MapLibre GL 地图实例
3. 加载全国省级 GeoJSON（异步，~800KB）
4. 渲染3D图层 + 流光动画
5. 渲染飞线（如有）
6. 渲染侧边栏数据
7. 隐藏 loading 蒙版
```

目标首屏时间：< 3秒（正常网络）

## 移动端适配

```javascript
const isMobile = window.innerWidth < 768

const mapConfig = {
  zoom:    isMobile ? 2.8 : 3.6,
  pitch:   isMobile ? 35  : 52,
  bearing: isMobile ? 0   : -6,
}

// 移动端侧边栏改为底部抽屉
const sidebarStyle = isMobile ? 'bottom-drawer' : 'right-panel'
```
