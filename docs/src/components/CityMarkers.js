/**
 * China 3D Map — City Markers
 * 
 * Creates 3D markers for cities on the map surface.
 * Each city is rendered as a glowing dot with an optional pulsing ring.
 */

import * as THREE from 'three';

export class CityMarkers {
  constructor(engine, theme) {
    this.engine = engine;
    this.theme = theme;
  }

  /**
   * Create a city marker at the given position
   * @param {string} name - City name (e.g., "Beijing")
   * @param {number} x - X coordinate in map space
   * @param {number} y - Y coordinate in map space
   * @param {number} z - Z (height) coordinate
   * @param {boolean} isCapital - Whether this is a provincial capital (larger marker)
   * @returns {{ marker: THREE.Mesh, ring: THREE.Mesh|null }}
   */
  createMarker(name, x, y, z = 0, isCapital = false) {
    const config = this.theme.city;
    const size = isCapital ? config.size * 1.6 : config.size;

    // Glowing dot
    const dotGeo = new THREE.SphereGeometry(size, 16, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.2,
    });
    const marker = new THREE.Mesh(dotGeo, dotMat);
    marker.position.set(x, y, z + size * 0.6);
    marker.name = name;

    // Pulsing ring (only for capitals or major cities)
    let ring = null;
    if (isCapital) {
      const ringGeo = new THREE.TorusGeometry(size * 2.5, size * 0.3, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: config.ringColor,
        emissive: config.ringColor,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.6,
      });
      ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(marker.position);
      ring.rotation.x = -Math.PI / 2; // Lie flat
      ring.name = name + '_ring';
    }

    return { marker, ring };
  }

  /**
   * Animate all city rings (call in render loop)
   */
  update(time) {
    this.engine.cities.forEach(({ ring }) => {
      if (ring) {
        ring.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        ring.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
      }
    });
  }
}
