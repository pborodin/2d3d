// js/furniture/Table.js
// import * as THREE from 'three';

// --- Пример SVG для стола (простой прямоугольник) ---
// Атрибуты viewBox, width, height важны для правильного масштабирования
// --- SVG для стола (вид сверху, прямоугольный со стульями) ---
// Размеры viewBox соответствуют реальным размерам (2000x1000 мм) + место для стульев
const tableSvgString = `
<svg viewBox="-200 -250 2400 1500" xmlns="http://www.w3.org/2000/svg" stroke="#333" fill="none" stroke-width="15">
  <!-- Столешница -->
  <rect x="0" y="0" width="2000" height="1000" rx="30" ry="30" fill="#f0e0d0" stroke-width="10"/>
  <!-- Стулья сверху (простые прямоугольники со скруглением) -->
  <rect x="300" y="-200" width="400" height="180" rx="20" ry="20" fill="#e0d0c0"/>
  <rect x="1300" y="-200" width="400" height="180" rx="20" ry="20" fill="#e0d0c0"/>
  <!-- Стулья снизу -->
  <rect x="300" y="1020" width="400" height="180" rx="20" ry="20" fill="#e0d0c0"/>
  <rect x="1300" y="1020" width="400" height="180" rx="20" ry="20" fill="#e0d0c0"/>
</svg>
`;

export function createTableMesh() {
    const group = new THREE.Group();
    const topGeo = new THREE.BoxGeometry(2, 0.2, 1);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.2 });
    const top = new THREE.Mesh(topGeo, mat); top.position.y = 1; top.castShadow = true; top.receiveShadow = true; group.add(top);
    [{x: -0.8, z: -0.35}, {x: 0.8, z: -0.35}, {x: -0.8, z: 0.35}, {x: 0.8, z: 0.35}].forEach(p => {
        const leg = new THREE.Mesh(legGeo, mat); leg.position.set(p.x, 0.5, p.z); leg.castShadow = true; leg.receiveShadow = true; group.add(leg); });

    group.userData.planDimensions = { width: 2, depth: 1, shape: 'rect' }; // Оставляем для 3D/псевдо-3D?
    group.userData.itemData = {
        id: 'table-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: 'Стол обеденный Sky',
        sku: '105306822',
        price: 12000,
        image: 'https://images.pexels.com/photos/2098913/pexels-photo-2098913.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        type: 'table',
        // --- НОВЫЕ ДАННЫЕ ---
        svgIconString: tableSvgString,
        realDimensionsMM: { width: 2000, depth: 1000, height: 1200 }, // Размеры в ММ (примерные)
        elevationMM: 0 // Высота от пола (для стола = 0)
        // --- КОНЕЦ НОВЫХ ДАННЫХ ---
    };
    return group;
}