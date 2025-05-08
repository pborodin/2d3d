// js/editorState.js
// Note: THREE will be available globally from the script tag in index.html

export const state = {
    scene: null, camera: null, renderer: null, controls: null,
    floorMesh: null, // Меш для пола, созданный из ShapeGeometry (по осевым линиям)
    furniture: [],
    walls: [], // Элементы теперь: { id, vertices: [{x,z} * 6], height, threeMesh }
    animationFrameId: null, isInitialized: false,
    raycaster: null, pointer: null, selectedObject: null, dragPlane: null,
    isDragging3D: false, originalSelectionColor: {},

    activeViewMode: '3d', // '3d', 'pseudo3d', 'plan'
    planCanvas: null, planContext: null,
    planScale: 25,
    minPlanScale: 5,
    maxPlanScale: 100,
    planOrigin: {x: 0, y: 0},
    isDragging2D: false, dragOffset2D: {x:0, y:0}, // For furniture
    isPanning2D: false,
    panStart2D: { x: 0, y: 0 },
    planOriginStart: { x: 0, y: 0 },

    selectedWallId: null,
    selectedVertexInfo: null, // Формат нужно будет изменить для поддержки 6 вершин { wallId, vertexIndex, initialPosAtDragStart }
    isDraggingVertex: false,
    wallCounter: 0,

    isAddingWallMode: false,
    newWallStartPoint: null, // {x,z} осевой линии
    currentMouseWorldPos2D: null, // {x,z} осевой линии

    isDraggingWall: false,
    dragOffsetWall: { x: 0, z: 0 }, // Смещение для центра осевой линии
    originalWallDragPoints: { start: null, end: null }, // Храним осевые точки на начало перетаскивания стены

    // Default camera and controls settings
    defaultCameraPos: new THREE.Vector3(0, 7, 12),
    defaultCameraLookAt: new THREE.Vector3(0, 0, 0),
    defaultControlsTarget: new THREE.Vector3(0,0,0),
    defaultOrbitControls: { minDistance: 3, maxDistance: 40, maxPolarAngle: Math.PI / 2 - 0.05, minPolarAngle: 0, enableRotate: true, enablePan: true, enableZoom: true },
    pseudo3DCameraPos: new THREE.Vector3(0, 20, 0.01),
    pseudo3DControls: { enableRotate: false, minPolarAngle: 0, maxPolarAngle: Math.PI * 0.01, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, enablePan: true, enableZoom: true }
};

// --- Переменная и функции для отслеживания расстояния при pinch-zoom ---
let lastTouchDistance_internal = null;

export function setLastTouchDistance(val) {
    lastTouchDistance_internal = val;
}
export function getLastTouchDistance() {
    return lastTouchDistance_internal;
}