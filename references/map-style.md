# 地图样式规范

## 整体风格

map-z 使用**暗色科技感**风格，核心设计原则：
- 背景极深（#080a0f）
- 省份顶面压暗，侧面发光
- 边界流光脉冲动画
- 配色高饱和、高对比

## 配色主题

### cyan（科技蓝，默认）
```
主色:   #00c9ff   RGB(0, 201, 255)
中间色: #0080ff
暗色:   #001a2e
适用:   科技、数字经济、互联网
```

### orange（火焰橙）
```
主色:   #ff8c00   RGB(255, 140, 0)
中间色: #cc5500
暗色:   #1a0800
适用:   商业、销售、能源
```

### green（荧光绿）
```
主色:   #39ff14   RGB(57, 255, 20)
中间色: #00aa33
暗色:   #001a08
适用:   环境、农业、生态
```

### purple（紫霓虹）
```
主色:   #bf5fff   RGB(191, 95, 255)
中间色: #7b2fff
暗色:   #120020
适用:   医疗、创新、文化
```

## 图层结构（从下到上）

| 层级 | 图层 ID | 类型 | 说明 |
|------|---------|------|------|
| 1 | p-extrusion | fill-extrusion | 3D 挤出主体 |
| 2 | p-top | fill | 顶面压暗蒙版 |
| 3 | p-border | line | 省份边界细线 |
| 4 | p-glow1 | line | 流光宽光晕 |
| 5 | p-glow2 | line | 流光亮边（动画） |
| 6 | arcs-bg | line | 飞线光晕 |
| 7 | arcs | line | 飞线主体（动画） |

## 3D 参数

```javascript
// 默认视角
center:  [106, 36]   // 中国地理中心
zoom:    3.6
pitch:   52          // 俯仰角
bearing: -6          // 偏转角

// 挤出高度系数
全国层级: value * 0.08
省级层级: value * 0.15
市级层级: value * 0.25
```

## 流光动画参数

```javascript
// 脉冲范围
亮线 opacity: 0.25 ~ 0.90
光晕 opacity: 0.05 ~ 0.30
动画间隔: 50ms
步长: 0.03
```

## 飞线样式

```javascript
线宽: 根据 value 插值，最小 0.5px，最大 2px
光晕: 线宽 * 2，opacity 0.15，blur 4
动画: dasharray 流动，间隔 60ms
颜色: 与主题色一致
```

## Tooltip 样式

```css
background: rgba(8,10,15,0.95)
border: 1px solid rgba(主色, 0.35)
border-radius: 8px
box-shadow: 0 0 20px rgba(主色, 0.15)
```
