# 🇨🇳 China 3D Map

**A beautiful, interactive 3D map of China built with Three.js.**
Visualize provincial data with extruded 3D regions, city markers, and a designer-friendly theme system.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?logo=three.js)](https://threejs.org/)

<p align="center">
  <em>Drag to rotate · Scroll to zoom · Click provinces to explore · Press R to reset</em>
</p>

---

## ✨ Features

- **3D Province Extrusion** — Each province rendered as an extruded 3D block with beveled edges
- **Data-Driven Colors** — Color provinces by data values with smooth color ramp mapping
- **Height Mapping** — Province height scales with data magnitude for dual-channel encoding
- **City Markers** — 3D glowing markers for major cities with pulsing rings
- **Interactive Exploration** — Hover tooltips, click-to-focus camera animation, dragging & zooming
- **Dual Themes** — Light and dark theme presets, fully customizable
- **Zero Dependencies** — Just Three.js from CDN, no build tools required
- **Designer-Friendly** — Theme config object for colors, materials, lighting, and labels
- **Responsive** — Adapts to any container size

## 🚀 Quick Start

### Option 1: CDN (No Build)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <div id="map" style="width:100vw;height:100vh;"></div>
  <script type="module">
    import { China3DMap } from './src/index.js';
    
    const map = new China3DMap('#map', { theme: 'light' });
    await map.load();
    
    // Bind your data
    map.setData({
      '广东省': 135673,
      '江苏省': 128222,
      '山东省': 92069,
      // ... all provinces
    });
  </script>
</body>
</html>
```

### Option 2: Clone & Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/china-3d-map.git
cd china-3d-map

# Serve with any static server
python3 -m http.server 8080
# or
npx serve .

# Open http://localhost:8080/demo/
```

## 📖 API Reference

### `new China3DMap(container, options)`

| Param | Type | Description |
|-------|------|-------------|
| `container` | `string \| HTMLElement` | Container element or CSS selector |
| `options.theme` | `'light' \| 'dark'` | Theme preset (default: `'light'`) |
| `options.customTheme` | `Object` | Override specific theme values |

### Methods

| Method | Description |
|--------|-------------|
| `await map.load()` | Load China GeoJSON data (must call first) |
| `map.setData(data, options)` | Bind province data `{ "name": value }` |
| `map.setCities(cities)` | Add city markers |
| `map.focusOn(provinceName)` | Animate camera to a province |
| `map.resetView()` | Reset camera to default view |
| `map.setTheme('dark')` | Switch theme |
| `map.getLegend()` | Get legend data for custom rendering |
| `map.destroy()` | Clean up all resources |

### Data Format

```javascript
// Province data
{
  '广东省': 135673,   // GDP in billion CNY
  '江苏省': 128222,
  // ... all 31 provinces
}

// City markers
[
  { name: '北京', lng: 116.407, lat: 39.904, isCapital: true },
  { name: '深圳', lng: 114.058, lat: 22.543, isCapital: false },
]
```

## 🎨 Theme Customization

Themes are designer-friendly config objects. Copy a preset and tweak:

```javascript
const myTheme = {
  background: 0xf5f5f7,
  province: {
    color: 0xE8EAF6,        // Base fill color
    roughness: 0.7,          // Surface roughness (0=glossy, 1=matte)
    metalness: 0.1,          // Metallic appearance
    lineColor: 0xffffff,     // Border line color
    sideColor: 0xC5CAE9,     // Extrusion side face color
  },
  colorRamp: [               // 10-color gradient for data mapping
    '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5',
    '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
  ],
  lights: {
    ambient:  { color: 0xffffff, intensity: 0.6 },
    directional1: { color: 0xffffff, intensity: 0.8, position: [1, 1, 1] },
    directional2: { color: 0xE3F2FD, intensity: 0.4, position: [-0.5, 0.3, -0.5] },
  },
};

const map = new China3DMap('#map', { customTheme: myTheme });
```

## 🗺️ Project Structure

```
china-3d-map/
├── src/
│   ├── core/
│   │   ├── Engine.js          # Three.js scene, camera, renderer, lights, controls
│   │   └── MapRenderer.js     # GeoJSON → 3D extrusion mesh converter
│   ├── data/
│   │   └── DataBinder.js      # Data-to-visual mapping (color + height)
│   ├── components/
│   │   ├── CityMarkers.js     # 3D city marker objects
│   │   ├── Label.js           # Province name label sprites
│   │   └── Tooltip.js         # HTML tooltip manager
│   ├── styles/
│   │   └── Theme.js           # Theme presets & color ramps
│   └── index.js               # Public API (China3DMap class)
├── demo/
│   ├── index.html             # Interactive demo page
│   ├── demo.css               # Demo styling
│   └── demo.js                # Demo logic (GDP data example)
├── dist/                      # Production build output
└── docs/                      # Extended documentation
```

## 🔧 Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Three.js](https://threejs.org/) | 3D rendering engine |
| GeoJSON (via [DataV API](https://datav.aliyun.com/)) | China provincial boundaries |
| Vanilla JavaScript | Zero framework overhead |
| ES Modules | Modern import/export |

## 📝 Data Source

Province boundary GeoJSON data is loaded from [DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector) — an open geographic data service by Alibaba Cloud. The data includes all 31 provincial-level administrative regions of China.

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- [ ] Add county/city-level drill-down
- [ ] Animate data transitions (e.g., time series)
- [ ] Export as image/GLB
- [ ] More theme presets
- [ ] Legend improvements
- [ ] Mobile touch optimization
- [ ] i18n support

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT © [Zhang Tiantian](https://github.com/YOUR_USERNAME)

---

<p align="center">
  <sub>Built with ❤️ for data visualization & open source</sub>
</p>
