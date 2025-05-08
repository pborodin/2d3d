// js/furniture/Lamp.js
// import * as THREE from 'three';

// --- Пример SVG для лампы (круг) ---
// --- SVG для лампы (вид сверху, круг с обозначением стойки) ---
// viewBox 1000x1000 мм (по диаметру абажура)
const lampSvgString = `
<svg viewBox="-50 -50 1100 1100" xmlns="http://www.w3.org/2000/svg" stroke="#333" fill="none" stroke-width="15">
  <!-- Абажур (внешний круг) -->
  <circle cx="500" cy="500" r="500" fill="#f0f0f0" stroke-width="10"/>
  <!-- Стойка (маленький круг в центре) -->
  <circle cx="500" cy="500" r="50" fill="#aaaaaa" stroke="#555" stroke-width="5"/>
</svg>
`;

export function createLampMesh() {
    const group = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, roughness: 0.4, metalness: 0.6 });
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFFFDD0, side: THREE.DoubleSide, roughness: 0.9 });
    const standBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 12); const standBase = new THREE.Mesh(standBaseGeo, standMat); standBase.position.y = 0.05; standBase.castShadow = true; standBase.receiveShadow = true; group.add(standBase);
    const standPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8); const standPole = new THREE.Mesh(standPoleGeo, standMat); standPole.position.y = 0.1 + 0.7; standPole.castShadow = true; standPole.receiveShadow = true; group.add(standPole);
    const shadeGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 12, 1, false); const shade = new THREE.Mesh(shadeGeo, shadeMat); shade.position.y = 0.1 + 1.4 + 0.2; shade.castShadow = true; group.add(shade);

    group.userData.planDimensions = { radius: 0.5, shape: 'circle' };
    group.userData.itemData = {
        id: 'lamp-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: 'Напольная лампа Modern',
        sku: '200100500',
        price: 3500,
        image: 'https://images.pexels.com/photos/7005386/pexels-photo-7005386.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        type: 'lamp',
        // --- НОВЫЕ ДАННЫЕ ---
        svgIconString: lampSvgString,
        // У круглой лампы ширина = глубина = диаметр абажура
        realDimensionsMM: { width: 1000, depth: 1000, height: 1800 }, // Размеры в ММ (по абажуру)
        elevationMM: 0
        // --- КОНЕЦ НОВЫХ ДАННЫХ ---
    };
    return group;
}