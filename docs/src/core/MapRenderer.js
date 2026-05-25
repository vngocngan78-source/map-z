/**
 * China 3D Map — Map Renderer
 * 
 * Converts GeoJSON polygon data into extruded 3D meshes using Three.js.
 * Each province becomes a beautiful 3D block with proper extrusion, bevels, and outlines.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// China geographic extent for coordinate normalization
const CHINA_EXTENT = {
  lngMin: 73, lngMax: 135,   // Longitude range
  latMin: 18, latMax: 54,    // Latitude range
  lngCenter: 104,            // Geographic center (approx)
  latCenter: 36,
};

// Map target extent in Three.js scene space
const SCENE_EXTENT = {
  xMin: -1.8, xMax: 1.8,
  yMin: -1.2, yMax: 1.2,
};

export class MapRenderer {
  constructor(engine, theme) {
    this.engine = engine;
    this.theme = theme;
    this.extrusionConfig = theme.extrusion || {};

    // Pre-compute normalization transform
    this._scaleX = (SCENE_EXTENT.xMax - SCENE_EXTENT.xMin) /
      (CHINA_EXTENT.lngMax - CHINA_EXTENT.lngMin);
    this._scaleY = (SCENE_EXTENT.yMax - SCENE_EXTENT.yMin) /
      (CHINA_EXTENT.latMax - CHINA_EXTENT.latMin);
    this._offsetX = SCENE_EXTENT.xMin - CHINA_EXTENT.lngMin * this._scaleX;
    this._offsetY = SCENE_EXTENT.yMin - CHINA_EXTENT.latMin * this._scaleY;
  }

  /**
   * Transform geographic [lng, lat] → scene [x, y].
   * Y is flipped because Three.js Y-up matches north in our scene layout.
   */
  _project(lng, lat) {
    return [
      lng * this._scaleX + this._offsetX,
      lat * this._scaleY + this._offsetY,
    ];
  }

  /**
   * Convert a GeoJSON feature (province) into an extruded 3D mesh.
   * 
   * @param {Object} feature - GeoJSON Feature with Polygon geometry
   * @param {number} height - Extrusion height (normalized 0–1)
   * @param {number} colorIndex - Index into color ramp (0–9)
   * @returns {{ mesh: THREE.Mesh, line: THREE.Line }}
   */
  createProvinceMesh(feature, height = 0, colorIndex = 0) {
    const geo = feature.geometry;
    const config = this.extrusionConfig;
    const baseH = config.baseHeight || 0.02;
    const maxH = config.maxHeight || 0.6;
    const actualHeight = baseH + height * maxH;

    // Collect all polygon shapes from the GeoJSON
    const shapes = this._extractShapes(geo);

    if (shapes.length === 0) return null;

    // Extrude settings
    const extrudeSettings = {
      steps: 1,
      depth: actualHeight,
      bevelEnabled: config.bevelEnabled ?? true,
      bevelThickness: config.bevelThickness ?? 0.005,
      bevelSize: config.bevelSize ?? 0.005,
      bevelSegments: config.bevelSegments ?? 2,
    };

    // Create extruded geometry from all shapes
    const geometries = shapes.map(shape => {
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      return geo;
    });

    const mergedGeometry = geometries.length === 1 
      ? geometries[0] 
      : mergeGeometries(geometries);

    // Get color from ramp
    const color = this._getColor(colorIndex);
    const sideColor = new THREE.Color(this.theme.province.sideColor);

    // Multi-material: top face + side faces
    const materials = [
      // Side material (index 0)
      new THREE.MeshStandardMaterial({
        color: sideColor,
        roughness: this.theme.province.sideRoughness ?? 0.6,
        metalness: this.theme.province.metalness ?? 0.1,
        emissive: new THREE.Color(this.theme.province.sideEmissive ?? 0x000000),
        flatShading: false,
      }),
      // Top/Bottom material (index 1)
      new THREE.MeshStandardMaterial({
        color: color,
        roughness: this.theme.province.roughness ?? 0.7,
        metalness: this.theme.province.metalness ?? 0.1,
        emissive: new THREE.Color(this.theme.province.emissive ?? 0x000000),
        flatShading: false,
      }),
    ];

    const mesh = new THREE.Mesh(mergedGeometry, materials);
    mesh.name = feature.properties.name;

    // Create outline
    const line = this._createOutline(shapes, actualHeight);

    return { mesh, line };
  }

  /**
   * Update province color based on new data value
   */
  updateProvinceColor(provinceName, colorIndex) {
    const province = this.engine.provinces.get(provinceName);
    if (!province) return;

    const color = this._getColor(colorIndex);
    province.mesh.material.forEach(mat => {
      if (mat.color && mat.name !== 'side') {
        mat.color.set(color);
      }
    });
  }

  /**
   * Update province height based on new data value
   */
  updateProvinceHeight(provinceName, height) {
    const province = this.engine.provinces.get(provinceName);
    if (!province) return;

    const config = this.extrusionConfig;
    const baseH = config.baseHeight || 0.02;
    const maxH = config.maxHeight || 0.6;
    const actualHeight = baseH + height * maxH;

    // Modify geometry scale on Z axis
    const scaleZ = actualHeight / (province.mesh.geometry.parameters?.depth || actualHeight);
    province.mesh.scale.z = scaleZ || 1;
    province.mesh.position.z = 0; // Keep base anchored
  }

  // -------- Private Methods --------

  _extractShapes(geometry) {
    const shapes = [];
    const coords = this._getAllPolygons(geometry);

    for (const polygon of coords) {
      // Outer ring
      const outerRing = polygon[0];
      if (!outerRing || outerRing.length < 3) continue;

      const shape = new THREE.Shape();
      const [startX, startY] = this._project(outerRing[0][0], outerRing[0][1]);
      shape.moveTo(startX, startY);
      for (let i = 1; i < outerRing.length; i++) {
        const [px, py] = this._project(outerRing[i][0], outerRing[i][1]);
        shape.lineTo(px, py);
      }
      shape.closePath();

      // Holes (inner rings) — e.g., enclaves or lakes
      for (let i = 1; i < polygon.length; i++) {
        const hole = polygon[i];
        if (!hole || hole.length < 3) continue;
        const holePath = new THREE.Path();
        const [hx, hy] = this._project(hole[0][0], hole[0][1]);
        holePath.moveTo(hx, hy);
        for (let j = 1; j < hole.length; j++) {
          const [hpx, hpy] = this._project(hole[j][0], hole[j][1]);
          holePath.lineTo(hpx, hpy);
        }
        holePath.closePath();
        shape.holes.push(holePath);
      }

      shapes.push(shape);
    }

    return shapes;
  }

  /**
   * Normalize all polygon types (Polygon / MultiPolygon) into a flat array of rings.
   */
  _getAllPolygons(geometry) {
    if (!geometry) return [];

    if (geometry.type === 'Polygon') {
      return [geometry.coordinates];
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates;
    }
    return [];
  }

  _getColor(index) {
    const ramp = this.theme.colorRamp;
    const i = Math.max(0, Math.min(ramp.length - 1, Math.round(index)));
    return new THREE.Color(ramp[i]);
  }

  _createOutline(shapes, height) {
    const outlinePoints = [];

    for (const shape of shapes) {
      const curves = shape.extractPoints(64);
      const points = curves.shape;

      for (let i = 0; i < points.length; i++) {
        outlinePoints.push(new THREE.Vector3(points[i].x, points[i].y, height + 0.001));
      }
      // Close the loop
      if (points.length > 0) {
        outlinePoints.push(new THREE.Vector3(points[0].x, points[0].y, height + 0.001));
      }
    }

    if (outlinePoints.length < 2) return null;

    const lineGeo = new THREE.BufferGeometry().setFromPoints(outlinePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: this.theme.province.lineColor,
      transparent: true,
      opacity: 0.6,
    });

    return new THREE.Line(lineGeo, lineMat);
  }
}
