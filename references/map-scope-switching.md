# 地图范围切换规范

## 支持的初始范围

map-z 支持以任意范围作为初始视图，不一定从全国开始。

### 示例

```javascript
// 从全国开始（默认）
MapZ.render('#map', { scope: 'china', data: [...] })

// 直接从某省开始
MapZ.render('#map', { scope: '广东', data: [...] })

// 直接从某市开始
MapZ.render('#map', { scope: '广州', data: [...] })
```

## 范围与初始视角对应表

| 范围 | adcode | center | zoom | pitch |
|------|--------|--------|------|-------|
| 全国 | 100000 | [106,36] | 3.6 | 52 |
| 华东 | - | [119,31] | 5.5 | 50 |
| 华南 | - | [113,23] | 6.0 | 50 |
| 华北 | - | [115,39] | 5.8 | 50 |
| 西部 | - | [100,35] | 4.5 | 48 |
| 省级 | XX0000 | 省中心 | 6~7 | 52 |
| 市级 | XXXX00 | 市中心 | 8~9 | 55 |

## 范围切换动画

切换范围时使用 `map.flyTo()`：

```javascript
map.flyTo({
  center: targetCenter,
  zoom: targetZoom,
  pitch: targetPitch,
  duration: 1200,
  easing: t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t  // easeInOut
})
```

## 多范围对比模式

未来版本将支持分屏对比两个不同区域：

```javascript
// v0.3.0 计划功能
MapZ.compare('#map', {
  left:  { scope: '北京', data: [...] },
  right: { scope: '上海', data: [...] }
})
```
