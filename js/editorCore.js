// js/editorCore.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js'; // Config может быть нужен для других вещей
import { on3DPointerDown, on3DPointerMove, on3DPointerUp } from './editorInteraction3D.js';
import { on2DPlanPointerDown, on2DPlanPointerMove, on2DPlanPointerUp, on2DPlanWheel, on2DPlanTouchStart, on2DPlanTouchMove, on2DPlanTouchEnd, render2DPlan } from './editorInteraction2D.js';
import { getDomElements } from './ui.js';

// dom кэшируется внутри ui.js, здесь getDomElements не нужен на верхнем уровне

export function ensureInitialized() {
    if (!editorState.isInitialized) {
        initThreeJSCore();
        init2DPlanCanvas();
        editorState.isInitialized = true;
    }
}

function initThreeJSCore() {
    const dom = getDomElements(); // Получаем здесь, если нужно для контейнера
    const canvas = document.getElementById('threejs-canvas');
    if (!dom.threeJSContainer || !canvas) {
        console.error("Three.js container or canvas not found!");
        return;
    }

    editorState.scene = new THREE.Scene();
    editorState.scene.background = new THREE.Color(0x24243e);

    editorState.camera = new THREE.PerspectiveCamera(60, dom.threeJSContainer.clientWidth / dom.threeJSContainer.clientHeight, 0.1, 1000);
    editorState.camera.position.copy(editorState.defaultCameraPos);
    editorState.camera.lookAt(editorState.defaultCameraLookAt);

    editorState.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    editorState.renderer.setSize(dom.threeJSContainer.clientWidth, dom.threeJSContainer.clientHeight);
    editorState.renderer.setPixelRatio(window.devicePixelRatio);
    editorState.renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    editorState.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(8, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024; directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5; directionalLight.shadow.camera.far = 50;
    editorState.scene.add(directionalLight);

    // Controls
    editorState.controls = new THREE.OrbitControls(editorState.camera, editorState.renderer.domElement);
    Object.assign(editorState.controls, editorState.defaultOrbitControls);
    editorState.controls.target.copy(editorState.defaultControlsTarget);
    editorState.controls.enableDamping = true;
    editorState.controls.dampingFactor = 0.1;

    // !!! ПРЯМОУГОЛЬНЫЙ ПОЛ УДАЛЕН ОТСЮДА !!!
    // Пол теперь создается в editorObjects.js -> createOrUpdateAll3DWalls

    // Raycaster and Pointer
    editorState.raycaster = new THREE.Raycaster();
    editorState.pointer = new THREE.Vector2();
    editorState.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Event Listeners for 3D view
    dom.threeJSContainer.addEventListener('pointerdown', on3DPointerDown);
    dom.threeJSContainer.addEventListener('pointermove', on3DPointerMove);
    dom.threeJSContainer.addEventListener('pointerup', on3DPointerUp);
    dom.threeJSContainer.addEventListener('pointerleave', on3DPointerUp);

    window.addEventListener('resize', handleResize);
}

function init2DPlanCanvas() {
    const dom = getDomElements(); // Получаем здесь, если нужно для контейнера
    editorState.planCanvas = document.getElementById('plan-canvas');
    if (!dom.planCanvasContainer || !editorState.planCanvas) {
        console.error("2D Plan container or canvas not found!");
        return;
    }
    editorState.planContext = editorState.planCanvas.getContext('2d');
    resize2DPlanCanvas();

    // Event Listeners for 2D Plan view
    editorState.planCanvas.addEventListener('pointerdown', on2DPlanPointerDown);
    editorState.planCanvas.addEventListener('pointermove', on2DPlanPointerMove);
    editorState.planCanvas.addEventListener('pointerup', on2DPlanPointerUp);
    editorState.planCanvas.addEventListener('pointerleave', on2DPlanPointerUp);
    editorState.planCanvas.addEventListener('wheel', on2DPlanWheel, { passive: false });
    editorState.planCanvas.addEventListener('touchstart', on2DPlanTouchStart, { passive: false });
    editorState.planCanvas.addEventListener('touchmove', on2DPlanTouchMove, { passive: false });
    editorState.planCanvas.addEventListener('touchend', on2DPlanTouchEnd);
    editorState.planCanvas.addEventListener('touchcancel', on2DPlanTouchEnd);
    editorState.planCanvas.addEventListener('contextmenu', (event) => {
        if (editorState.activeViewMode === 'plan') event.preventDefault();
    });
}

export function resize2DPlanCanvas() {
    if (!editorState.planCanvas || !editorState.planCanvas.parentElement || editorState.planCanvas.parentElement.clientWidth === 0) {
        requestAnimationFrame(resize2DPlanCanvas); return; // Defer resize if container not ready
    }
    editorState.planCanvas.width = editorState.planCanvas.parentElement.clientWidth;
    editorState.planCanvas.height = editorState.planCanvas.parentElement.clientHeight;
    if (!editorState.planOrigin.x || !editorState.planOrigin.y || !isFinite(editorState.planOrigin.x) || !isFinite(editorState.planOrigin.y)) {
        editorState.planOrigin = { x: editorState.planCanvas.width / 2, y: editorState.planCanvas.height / 2 };
    }
    if (editorState.activeViewMode === 'plan') render2DPlan();
}

export function handleResize() {
    const dom = getDomElements();
    if (dom.threeJSContainer.offsetParent !== null && editorState.renderer && editorState.camera && dom.threeJSContainer.clientWidth > 0 && dom.threeJSContainer.clientHeight > 0) {
        editorState.camera.aspect = dom.threeJSContainer.clientWidth / dom.threeJSContainer.clientHeight;
        editorState.camera.updateProjectionMatrix();
        editorState.renderer.setSize(dom.threeJSContainer.clientWidth, dom.threeJSContainer.clientHeight);
    }
    if (dom.planCanvasContainer.offsetParent !== null) {
        resize2DPlanCanvas();
    }
}

export function startAnimationLoop() {
    if (editorState.activeViewMode === 'plan' || editorState.animationFrameId) return;
    function animate() {
        editorState.animationFrameId = requestAnimationFrame(animate);
        if (editorState.controls) editorState.controls.update();
        if (editorState.renderer && editorState.scene && editorState.camera) {
            editorState.renderer.render(editorState.scene, editorState.camera);
        }
    }
    animate();
}

export function stopAnimationLoop() {
    if (editorState.animationFrameId) {
        cancelAnimationFrame(editorState.animationFrameId);
        editorState.animationFrameId = null;
    }
}