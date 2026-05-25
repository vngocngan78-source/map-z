/**
 * China 3D Map — Core Engine
 * 
 * Manages Three.js scene, camera, renderer, lights, and resize handling.
 * The engine is the foundation that everything else builds on.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Engine {
  constructor(container, theme) {
    this.container = container;
    this.theme = theme;
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Animation
    this.clock = new THREE.Clock();
    this.animationId = null;
    
    // Raycaster for hover/click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Tracked objects
    this.provinces = new Map();  // name → { mesh, line }
    this.cities = new Map();     // name → { marker, ring }
    
    // Callbacks
    this.onHover = null;
    this.onClick = null;
    this.onHoverOut = null;
    
    this._init();
  }
  
  _init() {
    const { width, height } = this.container.getBoundingClientRect();
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme.background);
    
    // Camera — positioned at 45° angle for a beautiful top-down perspective
    this.camera = new THREE.PerspectiveCamera(
      this.theme.camera?.fov || 45,
      width / height,
      this.theme.camera?.near || 0.1,
      this.theme.camera?.far || 20
    );
    const cp = this.theme.camera?.position || [0, -2.5, 2.5];
    this.camera.position.set(...cp);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Orbit Controls — intuitive mouse interaction
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    const oc = this.theme.orbit || {};
    this.controls.enableDamping = oc.enableDamping ?? true;
    this.controls.dampingFactor = oc.dampingFactor ?? 0.08;
    this.controls.minDistance = oc.minDistance ?? 1.5;
    this.controls.maxDistance = oc.maxDistance ?? 8;
    this.controls.maxPolarAngle = oc.maxPolarAngle ?? Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);
    
    // Lights — three-light setup for depth and dimension
    this._setupLights();
    
    // Grid — subtle reference plane
    this._setupGrid();
    
    // Events
    this._bindEvents();
    
    // Start render loop
    this._animate();
  }
  
  _setupLights() {
    const lights = this.theme.lights;
    
    // Ambient — fills shadows
    const ambient = new THREE.AmbientLight(
      lights.ambient.color, 
      lights.ambient.intensity
    );
    this.scene.add(ambient);
    
    // Directional Key Light — from top-right
    const dir1 = new THREE.DirectionalLight(
      lights.directional1.color, 
      lights.directional1.intensity
    );
    dir1.position.set(...lights.directional1.position);
    dir1.castShadow = true;
    dir1.shadow.mapSize.width = 1024;
    dir1.shadow.mapSize.height = 1024;
    this.scene.add(dir1);
    
    // Directional Fill Light — soft blue fill from opposite side
    const dir2 = new THREE.DirectionalLight(
      lights.directional2.color,
      lights.directional2.intensity
    );
    dir2.position.set(...lights.directional2.position);
    this.scene.add(dir2);
  }
  
  _setupGrid() {
    const grid = this.theme.grid;
    const gridHelper = new THREE.PolarGridHelper(4, 32, 24, 64, grid.color, grid.color);
    gridHelper.material.opacity = grid.opacity;
    gridHelper.material.transparent = true;
    gridHelper.position.z = -0.01;
    this.scene.add(gridHelper);
  }
  
  // Add a province mesh to the scene
  addProvince(name, mesh, line) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    if (line) this.scene.add(line);
    this.provinces.set(name, { mesh, line });
  }
  
  // Add a city marker to the scene
  addCity(name, marker, ring) {
    const group = new THREE.Group();
    group.add(marker);
    if (ring) group.add(ring);
    group.name = name;
    
    this.scene.add(group);
    this.cities.set(name, { group, marker, ring });
  }
  
  // Detect object under mouse (province or city)
  _getIntersections(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all province meshes
    const meshes = [];
    this.provinces.forEach(({ mesh }) => meshes.push(mesh));
    this.cities.forEach(({ group }) => group.children.forEach(c => meshes.push(c)));
    
    return this.raycaster.intersectObjects(meshes, false);
  }
  
  _bindEvents() {
    // Resize
    window.addEventListener('resize', () => {
      const { width, height } = this.container.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    
    // Mouse move → hover detection
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      const intersects = this._getIntersections(e);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const name = obj.name;
        if (name && this.onHover) {
          this.onHover(name, e);
        }
      }
    });
    
    // Click
    this.renderer.domElement.addEventListener('click', (e) => {
      const intersects = this._getIntersections(e);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const name = obj.name;
        if (name && this.onClick) {
          this.onClick(name, e);
        }
      }
    });
    
    // Touch support
    this.renderer.domElement.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const intersects = this._getIntersections(touch);
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          const name = obj.name;
          if (name && this.onClick) {
            this.onClick(name, touch);
          }
        }
      }
    });
  }
  
  // Animate camera to focus on a specific position
  focusOn(target, duration = 1000) {
    const start = {
      x: this.controls.target.x,
      y: this.controls.target.y,
      z: this.controls.target.z,
    };
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      
      this.controls.target.set(
        start.x + (target.x - start.x) * ease,
        start.y + (target.y - start.y) * ease,
        start.z + (target.z - start.z) * ease
      );
      
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }
  
  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  // Set background color
  setBackground(color) {
    this.scene.background = new THREE.Color(color);
  }
  
  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.clear();
    this.container.innerHTML = '';
  }
}
