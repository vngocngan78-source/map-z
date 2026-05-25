/**
 * China 3D Map — Demo
 * 
 * This file demonstrates the full capabilities of the 3D China map.
 * It loads real provincial GDP data and renders an interactive 3D visualization.
 */

import { China3DMap } from './src/index.js';

// -------- Demo: Provincial GDP Data (2023 estimates, unit: billion CNY) --------
const gdpData = {
  '广东省': 135673,
  '江苏省': 128222,
  '山东省': 92069,
  '浙江省': 82553,
  '河南省': 61346,
  '四川省': 60133,
  '湖北省': 55803,
  '福建省': 54355,
  '湖南省': 48670,
  '上海市': 47219,
  '安徽省': 47051,
  '河北省': 42370,
  '北京市': 41611,
  '陕西省': 32773,
  '江西省': 32200,
  '辽宁省': 28975,
  '重庆市': 29129,
  '云南省': 28954,
  '广西壮族自治区': 26301,
  '山西省': 25642,
  '内蒙古自治区': 23159,
  '贵州省': 20165,
  '新疆维吾尔自治区': 17741,
  '天津市': 16311,
  '黑龙江省': 15901,
  '吉林省': 13070,
  '甘肃省': 11202,
  '海南省': 6818,
  '宁夏回族自治区': 5070,
  '青海省': 3610,
  '西藏自治区': 2133,
};

// -------- Major Cities --------
const cities = [
  { name: '北京', lng: 116.407, lat: 39.904, isCapital: true },
  { name: '上海', lng: 121.474, lat: 31.230, isCapital: true },
  { name: '广州', lng: 113.264, lat: 23.129, isCapital: true },
  { name: '深圳', lng: 114.058, lat: 22.543, isCapital: false },
  { name: '成都', lng: 104.066, lat: 30.573, isCapital: true },
  { name: '武汉', lng: 114.305, lat: 30.593, isCapital: true },
  { name: '杭州', lng: 120.155, lat: 30.274, isCapital: true },
  { name: '南京', lng: 118.797, lat: 32.061, isCapital: true },
  { name: '重庆', lng: 106.551, lat: 29.563, isCapital: true },
  { name: '西安', lng: 108.940, lat: 34.260, isCapital: true },
];

// -------- Boot --------
async function init() {
  const container = document.getElementById('map-container');

  // Show loading state
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:14px;">Loading China map data...</div>';

  try {
    const map = new China3DMap(container, { theme: 'light' });
    await map.load();

    // Clear loading message (the engine appends its canvas to container)
    const loadingEl = container.querySelector('div');
    if (loadingEl) loadingEl.style.display = 'none';

    // Bind GDP data
    map.setData(gdpData);

    // Add city markers
    map.setCities(cities);

    // Theme switcher
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        map.setTheme(btn.dataset.theme);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        map.resetView();
      }
    });

    console.log('🇨🇳 China 3D Map ready! Drag to rotate, scroll to zoom, click provinces to explore.');
    console.log('   Press "R" to reset view.');

  } catch (err) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#D85A30;font-size:14px;">Failed to load map: ${err.message}</div>`;
    console.error('China 3D Map init error:', err);
  }
}

init();
