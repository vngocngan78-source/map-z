/**
 * China 3D Map — Main Entry Point
 * 
 * Public API for creating and controlling a 3D China map.
 * 
 * Quick Start:
 *   import { China3DMap } from 'china-3d-map';
 *   
 *   const map = new China3DMap('#container', { theme: 'light' });
 *   await map.load();
 *   map.setData({ '广东': 126000, '江苏': 122000, ... });
 */

export { Engine } from './core/Engine.js';
export { MapRenderer } from './core/MapRenderer.js';
export { DataBinder } from './data/DataBinder.js';
export { CityMarkers } from './components/CityMarkers.js';
export { LabelGenerator, calculateCentroid } from './components/Label.js';
export { TooltipManager } from './components/Tooltip.js';
export { themes, defaults } from './styles/Theme.js';

import { Engine } from './core/Engine.js';
import { MapRenderer } from './core/MapRenderer.js';
import { DataBinder } from './data/DataBinder.js';
import { CityMarkers } from './components/CityMarkers.js';
import { LabelGenerator, calculateCentroid } from './components/Label.js';
import { TooltipManager } from './components/Tooltip.js';
import { themes } from './styles/Theme.js';

// Coordinate normalization (must match MapRenderer & Label.js)
const CHINA_EXTENT = { lngMin: 73, lngMax: 135, latMin: 18, latMax: 54 };
const SCENE_EXTENT = { xMin: -1.8, xMax: 1.8, yMin: -1.2, yMax: 1.2 };

// Pre-compute projection
const _scaleX = (SCENE_EXTENT.xMax - SCENE_EXTENT.xMin) / (CHINA_EXTENT.lngMax - CHINA_EXTENT.lngMin);
const _scaleY = (SCENE_EXTENT.yMax - SCENE_EXTENT.yMin) / (CHINA_EXTENT.latMax - CHINA_EXTENT.latMin);
const _offsetX = SCENE_EXTENT.xMin - CHINA_EXTENT.lngMin * _scaleX;
const _offsetY = SCENE_EXTENT.yMin - CHINA_EXTENT.latMin * _scaleY;

export class China3DMap {
  /**
   * Create a new 3D China map.
   * 
   * @param {string|HTMLElement} container - Container element or CSS selector
   * @param {Object} [options]
   * @param {string} [options.theme='light'] - 'light' or 'dark'
   * @param {Object} [options.customTheme] - Override theme settings
   * @param {string} [options.geoUrl] - URL to China GeoJSON (defaults to DataV CDN)
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    const themeName = options.theme || 'light';
    this.theme = { ...themes[themeName], ...options.customTheme };
    
    this.engine = new Engine(this.container, this.theme);
    this.mapRenderer = new MapRenderer(this.engine, this.theme);
    this.dataBinder = new DataBinder(this.engine, this.mapRenderer, this.theme);
    this.cityMarkers = new CityMarkers(this.engine, this.theme);
    this.labelGenerator = new LabelGenerator(this.theme);
    this.tooltip = new TooltipManager('tooltip');
    
    this.geoData = null;
    this.citiesData = null;
    this.isLoaded = false;
    
    // Hover state tracking
    this.hoveredProvince = null;
    
    // Bind interactions
    this._bindInteractions();
  }

  /**
   * Load map data. Must be called before any data binding.
   * @param {Object} [options]
   * @param {string} [options.geoUrl] - China provinces GeoJSON URL
   * @param {string} [options.citiesUrl] - Cities data URL
   */
  async load(options = {}) {
    const geoUrl = options.geoUrl || 
      './china.geojson';

    try {
      const response = await fetch(geoUrl);
      this.geoData = await response.json();
    } catch (err) {
      console.error('China 3D Map: Failed to load GeoJSON data.', err);
      throw err;
    }

    this._renderProvinces();
    this.isLoaded = true;
    
    return this;
  }

  /**
   * Set data values for provinces. Triggers visual updates.
   * @param {Object} data - { "ProvinceName": number, ... }
   * @param {Object} [options] - Range overrides
   */
  setData(data, options) {
    if (!this.isLoaded) {
      console.warn('China 3D Map: Map not loaded yet. Call load() first.');
      return;
    }
    this.dataBinder.bindData(data, options);
    this._updateLegend();
  }

  /**
   * Set city markers on the map.
   * @param {Array} cities - [{ name: 'Beijing', lng: 116.4, lat: 39.9, isCapital: true }]
   */
  setCities(cities) {
    if (!this.isLoaded) return;
    this.citiesData = cities;

    for (const city of cities) {
      // Convert lng/lat to map XY coordinates
      const { x, y } = this._lngLatToXY(city.lng, city.lat);
      const { marker, ring } = this.cityMarkers.createMarker(
        city.name, x, y, 0.05, city.isCapital
      );
      this.engine.addCity(city.name, marker, ring);
    }

    // Add ring animation to render loop
    const originalAnimate = this.engine._animate.bind(this.engine);
    this.engine._animate = () => {
      originalAnimate();
      this.cityMarkers.update(this.engine.clock.getElapsedTime());
    };
  }

  /**
   * Focus camera on a specific province.
   */
  focusOn(name) {
    if (!this.isLoaded) return;

    const feature = this.geoData.features.find(
      f => f.properties.name === name
    );
    if (!feature) return;

    const centroid = calculateCentroid(feature);
    this.engine.focusOn({ x: centroid.x, y: centroid.y, z: 0.3 });
  }

  /**
   * Reset camera to default view.
   */
  resetView() {
    const cp = this.theme.camera?.position || [0, -2.5, 2.5];
    this.engine.camera.position.set(...cp);
    this.engine.controls.target.set(0, 0, 0);
    this.engine.controls.update();
  }

  /**
   * Switch theme.
   * @param {string} themeName - 'light' or 'dark'
   */
  setTheme(themeName) {
    this.theme = { ...themes[themeName] };
    this.engine.setBackground(this.theme.background);
    // Note: Full theme switching requires re-rendering.
    // For now, we update background and lights.
  }

  /**
   * Get legend data for custom rendering.
   */
  getLegend() {
    return this.dataBinder.getLegend();
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.engine.destroy();
  }

  // -------- Private --------

  _renderProvinces() {
    if (!this.geoData) return;

    for (const feature of this.geoData.features) {
      const name = feature.properties.name;
      if (!name) continue;

      const result = this.mapRenderer.createProvinceMesh(feature, 0, 0);
      if (!result) continue;

      this.engine.addProvince(name, result.mesh, result.line);

      // Add label
      const centroid = calculateCentroid(feature);
      const label = this.labelGenerator.createLabel(name, centroid.x, centroid.y);
      this.engine.scene.add(label);
    }
  }

  _bindInteractions() {
    this.engine.onHover = (name, event) => {
      // Highlight province
      if (this.hoveredProvince && this.hoveredProvince !== name) {
        this._setProvinceHighlight(this.hoveredProvince, false);
      }
      if (this.hoveredProvince !== name) {
        this._setProvinceHighlight(name, true);
        this.hoveredProvince = name;
      }

      // Show tooltip
      const value = this.dataBinder.data[name];
      const content = value !== undefined
        ? `<div class="tooltip-name">${name}</div><div class="tooltip-value">${value.toLocaleString()}</div>`
        : `<div class="tooltip-name">${name}</div>`;
      this.tooltip.show(event.clientX, event.clientY, content);
    };

    this.engine.onClick = (name) => {
      // Focus camera on clicked province
      this.focusOn(name);

      // Update info panel
      const infoEl = document.getElementById('province-info');
      if (infoEl) {
        const value = this.dataBinder.data[name];
        infoEl.innerHTML = value !== undefined
          ? `<p style="font-weight: 600; font-size: 15px;">${name}</p>
             <p style="color: var(--text-secondary);">Value: <strong>${value.toLocaleString()}</strong></p>`
          : `<p style="font-weight: 600; font-size: 15px;">${name}</p>
             <p style="color: var(--text-secondary);">No data</p>`;
      }
    };

    // Hide tooltip on mouse leave
    this.engine.renderer.domElement.addEventListener('mouseleave', () => {
      if (this.hoveredProvince) {
        this._setProvinceHighlight(this.hoveredProvince, false);
        this.hoveredProvince = null;
      }
      this.tooltip.hide();
    });
  }

  _setProvinceHighlight(name, highlight) {
    const province = this.engine.provinces.get(name);
    if (!province) return;

    if (highlight) {
      province.mesh.material.forEach(mat => {
        if (mat.emissive) {
          mat.emissive.set(this.theme.hover.emissive);
          mat.emissiveIntensity = this.theme.hover.emissiveIntensity;
        }
      });
      if (province.line) {
        province.line.material.color.set(this.theme.hover.lineColor);
        province.line.material.opacity = 1;
      }
    } else {
      province.mesh.material.forEach(mat => {
        if (mat.emissive) {
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
      if (province.line) {
        province.line.material.color.set(this.theme.province.lineColor);
        province.line.material.opacity = 0.6;
      }
    }
  }

  _updateLegend() {
    const legendEl = document.getElementById('legend');
    if (!legendEl) return;

    const legend = this.dataBinder.getLegend();
    legendEl.innerHTML = legend.map(item => `
      <div class="legend-item">
        <span class="legend-color" style="background: ${item.color};"></span>
        <span>${item.label}</span>
      </div>
    `).join('');
  }

  /**
   * Project geographic lng/lat → scene XY (same transform as MapRenderer).
   */
  _lngLatToXY(lng, lat) {
    return {
      x: lng * _scaleX + _offsetX,
      y: lat * _scaleY + _offsetY,
    };
  }
}
