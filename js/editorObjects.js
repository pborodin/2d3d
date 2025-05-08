// js/editorObjects.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import { pointsAreEqual } from './utils.js'; // Убедимся, что импортировано

// --- Вспомогательная функция расчета 6 вершин (НУЖНА ДЛЯ 2D) ---
// Эту функцию будет использовать editorInteraction2D.js
export function calculateWallPolygonVertices(start, end, thicknessL, thicknessR) {
    const dx = end.x - start.x; const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length < 0.01) return null;
    const dirX = dx / length; const dirZ = dz / length;
    const perpX = -dirZ; const perpZ = dirX;
    const vertices = [
        { x: start.x, z: start.z },
        { x: start.x + perpX * thicknessL, z: start.z + perpZ * thicknessL }, // 1
        { x: end.x + perpX * thicknessL, z: end.z + perpZ * thicknessL },     // 2
        { x: end.x, z: end.z },
        { x: end.x - perpX * thicknessR, z: end.z - perpZ * thicknessR },     // 4
        { x: start.x - perpX * thicknessR, z: start.z - perpZ * thicknessR }  // 5
    ];
    return vertices;
}


// --- Wall Management ---
export function initializeDefaultWalls() {
    editorState.walls = []; editorState.wallCounter = 0;
    const w = 10; const d = 10;
    // Вызываем addWall, который сам вызовет createOrUpdateAll3DWalls
    addWall({x: -w, z: -d}, {x: w, z: -d}); // Задняя
    addWall({x: w, z: -d}, {x: w, z: d});   // Правая
    addWall({x: w, z: d}, {x: -w, z: d});  // Передняя
    addWall({x: -w, z: d}, {x: -w, z: -d}); // Левая
}

// --- Обновленная addWall ---
export function addWall(start_p, end_p, options = {}) {
    editorState.wallCounter++;
    const id = 'wall-' + editorState.wallCounter;
    const height = options.height ?? Config.DEFAULT_WALL_HEIGHT;
    const thicknessL = options.thicknessLeft ?? Config.DEFAULT_WALL_THICKNESS_LEFT;
    const thicknessR = options.thicknessRight ?? Config.DEFAULT_WALL_THICKNESS_RIGHT;

    const vertices = calculateWallPolygonVertices(start_p, end_p, thicknessL, thicknessR);
    if (!vertices) { console.error("Could not calculate vertices for wall:", start_p, end_p); return null; }

    const wallData = {
        id: id,
        vertices: vertices,
        height: height,
        thicknessL: thicknessL, // Сохраняем толщины
        thicknessR: thicknessR,
        threeMesh: null
    };
    editorState.walls.push(wallData);
    createOrUpdateAll3DWalls(); // Обновляем 3D и пол
    return wallData;
}

// --- Функции для пола (findContour, buildAdjacencyMap, getKey) ---
// ОСТАЮТСЯ ПРЕЖНИМИ (используют осевые точки wall.vertices[0] и [3])
const adjacencyMap = new Map();
const vertexMap = new Map();
function getKey(p) { return `${p.x.toFixed(4)},${p.z.toFixed(4)}`; }

function buildAdjacencyMap() {
    adjacencyMap.clear(); vertexMap.clear();
    editorState.walls.forEach(wall => {
        if (!wall.vertices || wall.vertices.length !== 6) return; // Пропускаем некорректные
        const startCenterline = wall.vertices[0]; // Используем осевые точки [0] и [3]
        const endCenterline = wall.vertices[3];
        const startKey = getKey(startCenterline); const endKey = getKey(endCenterline);
        if (!vertexMap.has(startKey)) { vertexMap.set(startKey, { x: startCenterline.x, z: startCenterline.z }); adjacencyMap.set(startKey, new Set()); }
        if (!vertexMap.has(endKey)) { vertexMap.set(endKey, { x: endCenterline.x, z: endCenterline.z }); adjacencyMap.set(endKey, new Set()); }
    });
    editorState.walls.forEach(wall => {
        if (!wall.vertices || wall.vertices.length !== 6) return;
        const startCenterline = wall.vertices[0]; const endCenterline = wall.vertices[3];
        const startKey = getKey(startCenterline); const endKey = getKey(endCenterline);
        const startNode = vertexMap.get(startKey); const endNode = vertexMap.get(endKey);
        if (startNode && endNode && startKey !== endKey) {
            adjacencyMap.get(startKey).add(endNode); adjacencyMap.get(endKey).add(startNode);
        }
    });
}

function findContour() {
    buildAdjacencyMap();
    if (vertexMap.size < 3) return null;
    let startNode = null; let minZ = Infinity; let minXforMinZ = Infinity;
    for (const node of vertexMap.values()) {
        if (node.z < minZ) { minZ = node.z; minXforMinZ = node.x; startNode = node; }
        else if (node.z === minZ && node.x < minXforMinZ) { minXforMinZ = node.x; startNode = node; }
    }
    if (!startNode) return null;
    const contourPoints = []; const visitedEdges = new Set();
    let currentNode = startNode; let previousNode = { x: currentNode.x - 1, z: currentNode.z };
    let safetyCounter = 0; const maxIterations = vertexMap.size * 2;
    while (safetyCounter < maxIterations) {
        contourPoints.push(currentNode); const currentKey = getKey(currentNode);
        const neighbors = Array.from(adjacencyMap.get(currentKey) || []);
        if (neighbors.length === 0) { console.error("Contour finding error: Node has no neighbors", currentNode); return null; }
        const prevAngle = Math.atan2(currentNode.z - previousNode.z, currentNode.x - previousNode.x);
        let bestNextNode = null; let minAngleDiff = Infinity;
        neighbors.forEach(neighbor => {
            const nextAngle = Math.atan2(neighbor.z - currentNode.z, neighbor.x - currentNode.x);
            let angleDiff = prevAngle - nextAngle;
            while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI; while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff <= 1e-9) angleDiff += 2 * Math.PI;
            const edgeKey1 = `${getKey(currentNode)}_${getKey(neighbor)}`; const edgeKey2 = `${getKey(neighbor)}_${getKey(currentNode)}`;
            // Allow revisiting edge only if it's the only option or leads back to start
            if (!visitedEdges.has(edgeKey1) || neighbors.length === 1 || neighbor === startNode) {
                if (angleDiff < minAngleDiff) { minAngleDiff = angleDiff; bestNextNode = neighbor; }
            }
        });
        if (!bestNextNode) { console.error("Contour finding error: Could not find next node from", currentNode); if (contourPoints.length >= 3) return contourPoints; return null; }
        const edgeKeyForward = `${getKey(currentNode)}_${getKey(bestNextNode)}`; const edgeKeyBackward = `${getKey(bestNextNode)}_${getKey(currentNode)}`;
        visitedEdges.add(edgeKeyForward); visitedEdges.add(edgeKeyBackward);
        previousNode = currentNode; currentNode = bestNextNode;
        if (pointsAreEqual(currentNode, startNode)) break; // Используем pointsAreEqual для сравнения с startNode
        safetyCounter++;
    }
    if (safetyCounter >= maxIterations) { console.error("Contour finding error: Max iterations reached."); return null; }
    if (contourPoints.length < 3) return null;
    return contourPoints.reverse();
}


// --- Обновленная функция обновления 3D стен И СОЗДАНИЯ ПОЛА ---
export function createOrUpdateAll3DWalls() {
    if (!editorState.scene) return;

    // --- Обновление 3D Стен с использованием BoxGeometry ---
    editorState.walls.forEach(wall => {
        if (wall.threeMesh) { // Удаляем старый меш
            editorState.scene.remove(wall.threeMesh);
            wall.threeMesh.geometry?.dispose();
            if (Array.isArray(wall.threeMesh.material)) wall.threeMesh.material.forEach(m => m?.dispose());
            else wall.threeMesh.material?.dispose();
            wall.threeMesh = null;
        }
        if (!wall.vertices || wall.vertices.length !== 6 || wall.thicknessL === undefined || wall.thicknessR === undefined) {
            console.warn(`Wall ${wall.id} has invalid data.`); return;
        }

        const start = wall.vertices[0]; // Осевая Start
        const end = wall.vertices[3];   // Осевая End
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx); // Угол осевой линии

        if (length < 0.01) return; // Пропускаем стены нулевой длины

        const totalThickness = wall.thicknessL + wall.thicknessR; // Общая толщина
        const wallGeometry = new THREE.BoxGeometry(length, wall.height, totalThickness);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: Config.COLORS.WALL_DEFAULT, side: THREE.DoubleSide });
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        // Центр BoxGeometry находится в центре осевой линии
        const centerX = start.x + dx / 2;
        const centerZ = start.z + dz / 2;
        const centerY = wall.height / 2;

        // Смещаем меш, если толщины слева/справа не равны
        const thicknessOffset = (wall.thicknessL - wall.thicknessR) / 2;
        if (Math.abs(thicknessOffset) > 1e-6) { // Применяем смещение только если толщины не равны
            const perpX = -dz / length; // Перпендикуляр к оси
            const perpZ = dx / length;
            const offsetX = perpX * thicknessOffset;
            const offsetZ = perpZ * thicknessOffset;
            wallMesh.position.set(centerX + offsetX, centerY, centerZ + offsetZ);
        } else {
            wallMesh.position.set(centerX, centerY, centerZ);
        }

        wallMesh.rotation.y = -angle; // Поворачиваем вокруг Y

        wallMesh.castShadow = true; wallMesh.receiveShadow = true;
        wallMesh.userData.wallId = wall.id;
        editorState.scene.add(wallMesh);
        wall.threeMesh = wallMesh;
    });
    // --- Конец обновления стен ---


    // --- СОЗДАНИЕ ПОЛА ПО КОНТУРУ (Осевые линии) - Без изменений ---
    if (editorState.floorMesh) {
        editorState.scene.remove(editorState.floorMesh);
        editorState.floorMesh.geometry?.dispose();
        if (editorState.floorMesh.material) {
            if (Array.isArray(editorState.floorMesh.material)) editorState.floorMesh.material.forEach(m => m?.dispose());
            else editorState.floorMesh.material?.dispose();
        }
        editorState.floorMesh = null;
    }
    const contourPoints = findContour();
    if (!contourPoints || contourPoints.length < 3) { return; }
    const floorShape = new THREE.Shape();

    // Используем x и -z для создания формы в плоскости XY Three.js
    floorShape.moveTo(contourPoints[0].x, -contourPoints[0].z);
    for (let i = 1; i < contourPoints.length; i++) {
        floorShape.lineTo(contourPoints[i].x, -contourPoints[i].z);
    }

    try {
        const floorGeometry = new THREE.ShapeGeometry(floorShape);
        // --- ИЗМЕНЕНИЕ: Проверим нормали после создания ---
        floorGeometry.computeVertexNormals(); // Пересчитаем нормали

        const floorMaterial = new THREE.MeshStandardMaterial({ color: Config.COLORS.FLOOR_DEFAULT, side: THREE.DoubleSide });
        editorState.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        editorState.floorMesh.rotation.x = -Math.PI / 2;
        editorState.floorMesh.position.y = -0.01; // Чуть ниже для предотвращения z-fighting
        editorState.floorMesh.receiveShadow = true;
        editorState.floorMesh.name = "floor_shape";
        editorState.scene.add(editorState.floorMesh);
    } catch (error) { console.error("Error creating ShapeGeometry for floor:", error, contourPoints); }
    // --- Конец создания пола ---
}


// --- Furniture Creation Functions ---
function createTable() {
    const group = new THREE.Group();
    const topGeo = new THREE.BoxGeometry(2, 0.2, 1);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.2 });
    const top = new THREE.Mesh(topGeo, mat); top.position.y = 1; top.castShadow = true; top.receiveShadow = true; group.add(top);
    [{x: -0.8, z: -0.35}, {x: 0.8, z: -0.35}, {x: -0.8, z: 0.35}, {x: 0.8, z: 0.35}].forEach(p => {
        const leg = new THREE.Mesh(legGeo, mat); leg.position.set(p.x, 0.5, p.z); leg.castShadow = true; leg.receiveShadow = true; group.add(leg); });
    group.userData.planDimensions = { width: 2, depth: 1, shape: 'rect' };
    group.userData.itemData = { id: 'table-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Стол обеденный Sky', sku: '105306822', price: 12000, image: 'https://images.pexels.com/photos/2098913/pexels-photo-2098913.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'table' };
    return group;
}
function createSofa() {
    const group = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0x607D8B, roughness: 0.8, metalness: 0.1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.2), mat); base.position.y = 0.4; base.castShadow = true; base.receiveShadow = true; group.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), mat); back.position.set(0, 0.8 + 0.5, -1.2/2 + 0.3/2); back.castShadow = true; back.receiveShadow = true; group.add(back);
    const armGeo = new THREE.BoxGeometry(0.3, 0.6, 1.2);
    const lArm = new THREE.Mesh(armGeo, mat); lArm.position.set(-3/2 + 0.3/2, 0.4 + 0.2, 0); lArm.castShadow = true; lArm.receiveShadow = true; group.add(lArm);
    const rArm = new THREE.Mesh(armGeo, mat); rArm.position.set(3/2 - 0.3/2, 0.4 + 0.2, 0); rArm.castShadow = true; rArm.receiveShadow = true; group.add(rArm);
    group.userData.planDimensions = { width: 3, depth: 1.2, shape: 'rect' };
    group.userData.itemData = { id: 'sofa-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Угловой диван-кровать', sku: '40530683', price: 52000, image: 'https://images.pexels.com/photos/4846106/pexels-photo-4846106.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'sofa' };
    return group;
}
function createLamp() {
    const group = new THREE.Group(); const standMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, roughness: 0.4, metalness: 0.6 });
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFFFDD0, side: THREE.DoubleSide, roughness: 0.9 });
    const standBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 12); const standBase = new THREE.Mesh(standBaseGeo, standMat); standBase.position.y = 0.05; standBase.castShadow = true; standBase.receiveShadow = true; group.add(standBase);
    const standPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8); const standPole = new THREE.Mesh(standPoleGeo, standMat); standPole.position.y = 0.1 + 0.7; standPole.castShadow = true; standPole.receiveShadow = true; group.add(standPole);
    const shadeGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 12, 1, false); const shade = new THREE.Mesh(shadeGeo, shadeMat); shade.position.y = 1.5 + 0.2; shade.castShadow = true; group.add(shade);
    group.userData.planDimensions = { radius: 0.5, shape: 'circle' };
    group.userData.itemData = { id: 'lamp-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Напольная лампа Modern', sku: '200100500', price: 3500, image: 'https://images.pexels.com/photos/7005386/pexels-photo-7005386.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'lamp' };
    return group;
}
export const furnitureCreationFunctions = { table: createTable, sofa: createSofa, lamp: createLamp };

// --- Furniture Management ---
export async function addFurnitureObject(type) {
    const editorCoreModule = await import('./editorCore.js');
    const editorSelectionModule = await import('./editorSelection.js');
    editorCoreModule.ensureInitialized();
    if (!editorState.scene) { console.error("addFurniture: Scene not found!"); return; }
    const creationFunction = furnitureCreationFunctions[type];
    if (!creationFunction) { console.error(`Unknown furniture type: ${type}`); return; }
    const furnitureItem = creationFunction();
    const limit = Config.FURNITURE_PLACEMENT_LIMIT;
    furnitureItem.position.set( Math.random() * limit * 1.6 - limit * 0.8, 0, Math.random() * limit * 1.6 - limit * 0.8 );
    editorState.scene.add(furnitureItem); editorState.furniture.push(furnitureItem);
    editorSelectionModule.selectObject(furnitureItem);
    if (editorState.activeViewMode === 'plan') {
        const editorInteraction2DModule = await import('./editorInteraction2D.js');
        editorInteraction2DModule.render2DPlan(); // 2D план нужно будет адаптировать!
    } else if (!editorState.animationFrameId && editorState.renderer) {
        editorCoreModule.startAnimationLoop();
    }
}
export function removeFurnitureById(itemId) {
    const indexToRemove = editorState.furniture.findIndex(f => f.userData.itemData && f.userData.itemData.id === itemId);
    if (indexToRemove > -1) {
        const removedThreeJSObject = editorState.furniture.splice(indexToRemove, 1)[0];
        if (editorState.scene && removedThreeJSObject) {
            editorState.scene.remove(removedThreeJSObject);
            removedThreeJSObject.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m?.dispose());
                    else child.material?.dispose();
                }
            });
            if (editorState.selectedObject === removedThreeJSObject) {
                import('./editorSelection.js').then(mod => mod.deselectEverything());
            }
        }
        if (editorState.activeViewMode === 'plan') {
            import('./editorInteraction2D.js').then(mod => mod.render2DPlan());
        }
        return true;
    }
    return false;
}
export function clearAllFurniture() {
    if (!editorState.scene) return;
    while (editorState.furniture.length > 0) {
        const item = editorState.furniture.pop();
        editorState.scene.remove(item);
        item.traverse(child => {
            if (child.isMesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) child.material.forEach(m => m?.dispose());
                else child.material?.dispose();
            }
        });
    }
    if (editorState.activeViewMode === 'plan') {
        import('./editorInteraction2D.js').then(mod => mod.render2DPlan());
    }
}
export function clearAllWalls() {
    if (!editorState.scene) return;
    editorState.walls.forEach(wall => {
        if (wall.threeMesh) {
            editorState.scene.remove(wall.threeMesh);
            wall.threeMesh.geometry?.dispose();
            if(Array.isArray(wall.threeMesh.material)) wall.threeMesh.material.forEach(m=>m?.dispose());
            else wall.threeMesh.material?.dispose();
            wall.threeMesh = null;
        }
    });
    editorState.walls = []; editorState.wallCounter = 0;
    if (editorState.activeViewMode === 'plan') {
        import('./editorInteraction2D.js').then(mod => mod.render2DPlan());
    }
    createOrUpdateAll3DWalls(); // Обновляем пол (он должен удалиться)
}