// js/furniture/Sofa.js
// import * as THREE from 'three';

// --- Пример SVG для дивана (прямоугольник с подушками) ---
// --- SVG для дивана (вид сверху, с подлокотниками и спинкой) ---
// viewBox соответствует размерам 3000x1200 мм
const sofaSvgString = `
<svg viewBox="-10 -10 3020 1220" xmlns="http://www.w3.org/2000/svg" stroke="#333" fill="none" stroke-width="15">
  <!-- Основной контур -->
  <rect x="0" y="0" width="3000" height="1200" rx="50" ry="50" fill="#d3d3d3" stroke-width="10"/>
  <!-- Спинка (чуть темнее) -->
  <rect x="20" y="20" width="2960" height="250" rx="30" ry="30" fill="#c0c0c0" stroke="#555" stroke-width="5"/>
  <!-- Сиденье (основной цвет) -->
  <rect x="20" y="290" width="2960" height="890" rx="30" ry="30" fill="#d3d3d3" stroke="none"/>
   <!-- Разделители подушек (если нужно) -->
  <line x1="1000" y1="290" x2="1000" y2="1180" stroke="#b0b0b0" stroke-width="8"/>
  <line x1="2000" y1="290" x2="2000" y2="1180" stroke="#b0b0b0" stroke-width="8"/>
  <!-- Подлокотники (сверху основного контура) -->
   <rect x="0" y="0" width="150" height="1200" rx="50" ry="50" fill="#c8c8c8" stroke="#444" stroke-width="5"/>
   <rect x="2850" y="0" width="150" height="1200" rx="50" ry="50" fill="#c8c8c8" stroke="#444" stroke-width="5"/>
</svg>
`;

export function createSofaMesh() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x607D8B, roughness: 0.8, metalness: 0.1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.2), mat); base.position.y = 0.4; base.castShadow = true; base.receiveShadow = true; group.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), mat); back.position.set(0, 0.8 + 0.5, -1.2/2 + 0.3/2); back.castShadow = true; back.receiveShadow = true; group.add(back);
    const armGeo = new THREE.BoxGeometry(0.3, 0.6, 1.2);
    const lArm = new THREE.Mesh(armGeo, mat); lArm.position.set(-3/2 + 0.3/2, 0.4 + 0.2, 0); lArm.castShadow = true; lArm.receiveShadow = true; group.add(lArm);
    const rArm = new THREE.Mesh(armGeo, mat); rArm.position.set(3/2 - 0.3/2, 0.4 + 0.2, 0); rArm.castShadow = true; rArm.receiveShadow = true; group.add(rArm);

    group.userData.planDimensions = { width: 3, depth: 1.2, shape: 'rect' };
    group.userData.itemData = {
        id: 'sofa-' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: 'Угловой диван-кровать',
        sku: '40530683',
        price: 52000,
        image: 'https://images.pexels.com/photos/4846106/pexels-photo-4846106.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        type: 'sofa',
        // --- НОВЫЕ ДАННЫЕ ---
        svgIconString: sofaSvgString,
        realDimensionsMM: { width: 3000, depth: 1200, height: 1800 }, // Размеры в ММ (примерные)
        elevationMM: 0
        // --- КОНЕЦ НОВЫХ ДАННЫХ ---
    };
    return group;
}