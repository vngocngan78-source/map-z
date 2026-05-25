/**
 * China 3D Map — Data Binder
 * 
 * Connects arbitrary data to the 3D map. Feed it a simple key-value object
 * and it handles color mapping, height mapping, and label generation.
 * 
 * Usage:
 *   binder.bindData({ 广东: 126, 江苏: 122, ... });
 *   binder.setColorRange([0, 200]);  // optional, auto-detected by default
 */

export class DataBinder {
  constructor(engine, mapRenderer, theme) {
    this.engine = engine;
    this.mapRenderer = mapRenderer;
    this.theme = theme;
    
    this.data = {};           // province → value
    this.colorRange = null;   // [min, max] for color mapping
    this.heightRange = null;  // [min, max] for height mapping
    this.animateHeight = true;
  }

  /**
   * Bind data to the map. This triggers color & height updates for all provinces.
   * 
   * @param {Object} data - { "ProvinceName": value, ... }
   * @param {Object} [options]
   * @param {[number,number]} [options.colorRange] - Override automatic color range
   * @param {[number,number]} [options.heightRange] - Override automatic height range
   * @param {boolean} [options.animate] - Animate height transitions (default false for bind, true for update)
   */
  bindData(data, options = {}) {
    this.data = { ...data };
    
    const values = Object.values(this.data).filter(v => typeof v === 'number');
    if (values.length === 0) return;
    
    // Auto-detect ranges
    const actualMin = Math.min(...values);
    const actualMax = Math.max(...values);
    this.colorRange = options.colorRange || [actualMin, actualMax];
    this.heightRange = options.heightRange || [actualMin, actualMax];
    
    const [cMin, cMax] = this.colorRange;
    const [hMin, hMax] = this.heightRange;
    
    for (const [provinceName, value] of Object.entries(this.data)) {
      if (typeof value !== 'number') continue;
      
      // Normalize 0–1
      const colorNormal = cMax === cMin ? 0.5 : (value - cMin) / (cMax - cMin);
      const heightNormal = hMax === hMin ? 0.5 : (value - hMin) / (hMax - hMin);
      
      // Map to color index (0–9)
      const colorIndex = colorNormal * 9;
      
      // Apply
      this.mapRenderer.updateProvinceColor(provinceName, colorIndex);
      
      // Use setTimeout to animate height transitions
      if (this.animateHeight || options.animate) {
        setTimeout(() => {
          this.mapRenderer.updateProvinceHeight(provinceName, heightNormal);
        }, 50);
      } else {
        this.mapRenderer.updateProvinceHeight(provinceName, heightNormal);
      }
    }
  }

  /**
   * Update a single province's data value
   */
  updateProvince(name, value) {
    this.data[name] = value;
    this.bindData(this.data, { animate: true });
  }
  
  /**
   * Get legend data for display
   * @returns {Array<{color: string, label: string}>}
   */
  getLegend() {
    if (!this.colorRange) return [];
    
    const [min, max] = this.colorRange;
    const ramp = this.theme.colorRamp;
    const steps = 5;
    const legend = [];
    
    for (let i = 0; i < steps; i++) {
      const value = min + (max - min) * (i / (steps - 1));
      const colorIndex = Math.round((i / (steps - 1)) * (ramp.length - 1));
      legend.push({
        color: ramp[Math.min(colorIndex, ramp.length - 1)],
        label: this._formatValue(value),
      });
    }
    
    return legend;
  }

  _formatValue(value) {
    if (value >= 10000) return (value / 10000).toFixed(1) + '万';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return Math.round(value).toLocaleString();
  }
}
