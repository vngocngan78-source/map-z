/**
 * China 3D Map — Theme System
 * Designer-friendly configuration layer for customizing the map appearance.
 * 
 * To create your own theme, copy one of the presets below and tweak the values.
 */

// -------- Color Ramps --------
const BlueRamp = ['#E3F2FD','#BBDEFB','#90CAF9','#64B5F6','#42A5F5','#2196F3','#1E88E5','#1976D2','#1565C0','#0D47A1'];
const GreenRamp = ['#E8F5E9','#C8E6C9','#A5D6A7','#81C784','#66BB6A','#4CAF50','#43A047','#388E3C','#2E7D32','#1B5E20'];
const OrangeRamp = ['#FFF3E0','#FFE0B2','#FFCC80','#FFB74D','#FFA726','#FF9800','#FB8C00','#F57C00','#EF6C00','#E65100'];
const PurpleRamp = ['#F3E5F5','#E1BEE7','#CE93D8','#BA68C8','#AB47BC','#9C27B0','#8E24AA','#7B1FA2','#6A1B9A','#4A148C'];

// -------- Preset Themes --------

export const themes = {
  light: {
    name: 'Light',
    background: 0xf5f5f7,
    // Province base
    province: {
      color: 0xE8EAF6,
      emissive: 0x000000,
      roughness: 0.7,
      metalness: 0.1,
      // Border line
      lineColor: 0xffffff,
      lineWidth: 0.5,
      // Extrusion side material
      sideColor: 0xC5CAE9,
      sideEmissive: 0x000000,
      sideRoughness: 0.6,
    },
    // Hover state
    hover: {
      emissive: 0x333333,
      emissiveIntensity: 0.3,
      lineColor: 0x1990FF,
    },
    // Data color ramp
    colorRamp: BlueRamp,
    // City markers
    city: {
      color: 0x1990FF,
      size: 0.015,
      ringColor: 0x1990FF,
    },
    // Labels
    label: {
      color: '#1d1d1f',
      fontSize: 48,
      fontFamily: '-apple-system, sans-serif',
    },
    // Lights
    lights: {
      ambient: { color: 0xffffff, intensity: 0.6 },
      directional1: { color: 0xffffff, intensity: 0.8, position: [1, 1, 1] },
      directional2: { color: 0xE3F2FD, intensity: 0.4, position: [-0.5, 0.3, -0.5] },
    },
    // Grid
    grid: { color: 0xcccccc, opacity: 0.15 },
  },

  dark: {
    name: 'Dark',
    background: 0x1a1a2e,
    province: {
      color: 0x16213e,
      emissive: 0x000000,
      roughness: 0.5,
      metalness: 0.3,
      lineColor: 0x2a2a4a,
      lineWidth: 0.8,
      sideColor: 0x0f3460,
      sideEmissive: 0x000000,
      sideRoughness: 0.5,
    },
    hover: {
      emissive: 0x1990FF,
      emissiveIntensity: 0.5,
      lineColor: 0x1990FF,
    },
    colorRamp: BlueRamp,
    city: {
      color: 0x64B5F6,
      size: 0.015,
      ringColor: 0x1990FF,
    },
    label: {
      color: '#e0e0e0',
      fontSize: 48,
      fontFamily: '-apple-system, sans-serif',
    },
    lights: {
      ambient: { color: 0x404060, intensity: 0.5 },
      directional1: { color: 0xffffff, intensity: 0.6, position: [1, 0.8, 1] },
      directional2: { color: 0x1990FF, intensity: 0.3, position: [-0.5, 0.2, -0.5] },
    },
    grid: { color: 0x444466, opacity: 0.1 },
  },
};

// Default values for partial overrides
export const defaults = {
  camera: {
    position: [0, -2.5, 2.5],   // 45-degree top-down view
    fov: 45,
    near: 0.1,
    far: 20,
  },
  orbit: {
    enableDamping: true,
    dampingFactor: 0.08,
    minDistance: 1.5,
    maxDistance: 8,
    maxPolarAngle: Math.PI / 2.2, // Prevent going under the map
  },
  extrusion: {
    baseHeight: 0.02,   // Minimum province height
    maxHeight: 0.6,     // Maximum province height
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  },
};
