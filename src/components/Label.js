/**
 * China 3D Map — Label Generator
 * 
 * Renders province name labels onto the 3D map surface using Canvas textures.
 * Labels are placed at the centroid of each province's GeoJSON polygon.
 */

import * as THREE from 'three';

// Coordinate normalization (must match MapRenderer)
const CHINA_EXTENT = {
  lngMin: 73, lngMax: 135, lngCenter: 104,
  latMin: 18, latMax: 54,  latCenter: 36,
};
const SCENE_EXTENT = {
  xMin: -1.8, xMax: 1.8,
  yMin: -1.2, yMax: 1.2,
};

export class LabelGenerator {
  constructor(theme) {
    this.theme = theme;
    this.labelConfig = theme.label;
  }

  /**
   * Create a label sprite for a province
   * @param {string} text - Province name (e.g., "广东" or "Guangdong")
   * @param {number} x - Centroid X
   * @param {number} y - Centroid Y
   * @param {number} z - Surface height
   * @returns {THREE.Sprite}
   */
  createLabel(text, x, y, z = 0.03) {
    const config = this.labelConfig;
    const canvas = document.createElement('canvas');
    const size = config.fontSize || 48;
    canvas.width = size * 3;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.font = `500 ${size * 0.7}px ${config.fontFamily || '-apple-system, sans-serif'}`;
    ctx.fillStyle = config.color || '#1d1d1f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z + 0.01);
    sprite.scale.set(size * 0.012, size * 0.004, 1);

    return sprite;
  }
}

/**
 * Calculate the centroid of a GeoJSON polygon, projected to scene coordinates.
 */
export function calculateCentroid(feature) {
  const geo = feature.geometry;
  let coords = [];

  if (geo.type === 'Polygon') {
    coords = geo.coordinates[0];
  } else if (geo.type === 'MultiPolygon') {
    let maxLen = 0;
    for (const poly of geo.coordinates) {
      if (poly[0].length > maxLen) {
        maxLen = poly[0].length;
        coords = poly[0];
      }
    }
  }

  if (coords.length === 0) return { x: 0, y: 0 };

  // Project using same transform as MapRenderer
  const scaleX = (SCENE_EXTENT.xMax - SCENE_EXTENT.xMin) /
    (CHINA_EXTENT.lngMax - CHINA_EXTENT.lngMin);
  const scaleY = (SCENE_EXTENT.yMax - SCENE_EXTENT.yMin) /
    (CHINA_EXTENT.latMax - CHINA_EXTENT.latMin);
  const offsetX = SCENE_EXTENT.xMin - CHINA_EXTENT.lngMin * scaleX;
  const offsetY = SCENE_EXTENT.yMin - CHINA_EXTENT.latMin * scaleY;

  let sumX = 0, sumY = 0;
  for (const [lng, lat] of coords) {
    sumX += lng * scaleX + offsetX;
    sumY += lat * scaleY + offsetY;
  }

  return {
    x: sumX / coords.length,
    y: sumY / coords.length,
  };
}
