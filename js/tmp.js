// js/editorInteraction2D.js
import { getDomElements } from './ui.js';
import { state as editorState, setLastTouchDistance, getLastTouchDistance } from './editorState.js';
import * as Config from './config.js';
import { getPointerXY, pointsAreEqual } from './utils.js';
import { selectObject, deselectEverything, selectWall, selectVertex } from './editorSelection.js';
// Динамически импортируем editorObjects при необходимости

// --- Вспомогательная функция для пересчета 6 вершин стены ---
// Ипортируем или определяем здесь. Т.к. она нужна только здесь и в editorObjects,
// можно вынести в utils.js или оставить пока здесь для локальности.
// Важно: использует сохраненные wall.thicknessL и wall.thicknessR
function recalculateWallVertices(wall) {
    if (!wall || !wall.vertices || wall.vertices.length !== 6 || wall.thicknessL === undefined || wall.thicknessR === undefined) return false;
    const start = wall.vertices[0]; const end = wall.vertices[3];
    const thicknessL = wall.thicknessL; const thicknessR = wall.thicknessR;
    const dx = end.x - start.x; const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length < 0.01) return false;
    const dirX = dx / length; const dirZ = dz / length;
    const perpX = -dirZ; const perpZ = dirX;
    // Обновляем весь массив вершин
    wall.vertices = [
        { x: start.x, z: start.z },
        { x: start.x + perpX * thicknessL, z: start.z + perpZ * thicknessL }, // 1
        { x: end.x + perpX * thicknessL, z: end.z + perpZ * thicknessL },     // 2
        { x: end.x, z: end.z },
        { x: end.x - perpX * thicknessR, z: end.z - perpZ * thicknessR },     // 4
        { x: start.x - perpX * thicknessR, z: start.z - perpZ * thicknessR }  // 5
    ];
    return true;
}

// --- Обновленная функция обновления соединенных осевых вершин и пересчета геометрии ---
function updateConnectedVertices(originalPos, newPos) {
    if (!originalPos || !newPos) return false;
    let overallUpdated = false;
    const affectedWallIds = new Set();
    editorState.walls.forEach(wall => {
        if (!wall.vertices || wall.vertices.length !== 6) return;
        let wallAffected = false;
        if (pointsAreEqual(wall.vertices[0], originalPos)) {
            if (wall.vertices[0].x !== newPos.x || wall.vertices[0].z !== newPos.z) {
                wall.vertices[0].x = newPos.x; wall.vertices[0].z = newPos.z;
                overallUpdated = true; wallAffected = true;
            }
        }
        if (pointsAreEqual(wall.vertices[3], originalPos)) {
            if (wall.vertices[3].x !== newPos.x || wall.vertices[3].z !== newPos.z) {
                wall.vertices[3].x = newPos.x; wall.vertices[3].z = newPos.z;
                overallUpdated = true; wallAffected = true;
            }
        }
        if (wallAffected) {
            affectedWallIds.add(wall.id);
        }
    });
    affectedWallIds.forEach(wallId => {
        const wall = editorState.walls.find(w => w.id === wallId);
        if (wall) recalculateWallVertices(wall);
    });
    return overallUpdated;
}

// --- Helper function to get world and canvas coordinates from event ---
function get2DPlanPointerWorldPosition(event) {
    const canvas = editorState.planCanvas;
    if (!canvas || !canvas.parentElement || canvas.parentElement.clientWidth === 0) { return { x: 0, z: 0, canvasX: 0, canvasY: 0, valid: false }; }
    const rect = canvas.getBoundingClientRect(); const pointer = getPointerXY(event);
    const canvasX = pointer.x - rect.left; const canvasY = pointer.y - rect.top;
    const worldX = (canvasX - editorState.planOrigin.x) / editorState.planScale; const worldZ = (canvasY - editorState.planOrigin.y) / editorState.planScale;
    return { x: worldX, z: worldZ, canvasX, canvasY, valid: true };
}

// --- Rendering Function ---
export function render2DPlan() {
    if (!editorState.planContext || !editorState.planCanvas || !editorState.planCanvas.width || !editorState.planCanvas.height) { return; }
    const ctx = editorState.planContext; const canvas = editorState.planCanvas; const scale = editorState.planScale; const origin = editorState.planOrigin;
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(origin.x, origin.y);
    ctx.lineCap = "round"; ctx.lineJoin = "round";

    // Рисуем полигоны стен
    editorState.walls.forEach(wall => {
        if (!wall.vertices || wall.vertices.length !== 6) return;
        const v1 = wall.vertices[1]; const v2 = wall.vertices[2]; const v4 = wall.vertices[4]; const v5 = wall.vertices[5];
        ctx.beginPath(); ctx.moveTo(v1.x * scale, v1.z * scale); ctx.lineTo(v2.x * scale, v2.z * scale);
        ctx.lineTo(v4.x * scale, v4.z * scale); ctx.lineTo(v5.x * scale, v5.z * scale); ctx.closePath();
        // Проверяем, является ли стена или ее вершина выбранной
        const isSelected = editorState.selectedWallId === wall.id || (editorState.selectedVertexInfo && editorState.selectedVertexInfo.wallId === wall.id);
        ctx.fillStyle = isSelected ? Config.COLORS.PLAN_WALL_SELECTED : Config.COLORS.WALL_DEFAULT; // Используем цвет выделения для заливки выбранной
        ctx.strokeStyle = isSelected ? '#FFFFFF' : Config.COLORS.PLAN_WALL_DEFAULT; // Белая обводка для выделенной
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.fill(); ctx.stroke();
    });

    // Draw Furniture
    editorState.furniture.forEach(item => {
        const itemPlanDim = item.userData.planDimensions; if (!itemPlanDim) return;
        const x = item.position.x * scale; const z = item.position.z * scale; const rotation = item.rotation.y;
        ctx.save(); ctx.translate(x, z); ctx.rotate(rotation);
        ctx.fillStyle = Config.COLORS.PLAN_FURNITURE_DEFAULT_FILL;
        ctx.strokeStyle = (item === editorState.selectedObject) ? Config.COLORS.PLAN_FURNITURE_SELECTED_STROKE : Config.COLORS.PLAN_FURNITURE_DEFAULT_STROKE;
        ctx.lineWidth = (item === editorState.selectedObject) ? 2 : 1;
        if (itemPlanDim.shape === 'rect') { const w = itemPlanDim.width * scale; const d = itemPlanDim.depth * scale; ctx.fillRect(-w / 2, -d / 2, w, d); ctx.strokeRect(-w / 2, -d / 2, w, d); }
        else if (itemPlanDim.shape === 'circle') { const r = itemPlanDim.radius * scale; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        ctx.restore();
    });

    // Draw temporary new wall line (осевая)
    if (editorState.isAddingWallMode && editorState.newWallStartPoint && editorState.currentMouseWorldPos2D) {
        ctx.beginPath(); ctx.moveTo(editorState.newWallStartPoint.x * scale, editorState.newWallStartPoint.z * scale);
        let tempEndX = editorState.currentMouseWorldPos2D.x; let tempEndZ = editorState.currentMouseWorldPos2D.z; let snapped = false;
        for (const wall of editorState.walls) {
            if (!wall.vertices || wall.vertices.length !== 6) continue; const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
            if (Math.hypot(tempEndX - v0.x, tempEndZ - v0.z) < Config.SNAP_DISTANCE) { tempEndX = v0.x; tempEndZ = v0.z; snapped = true; break; }
            if (Math.hypot(tempEndX - v3.x, tempEndZ - v3.z) < Config.SNAP_DISTANCE) { tempEndX = v3.x; tempEndZ = v3.z; snapped = true; break; }
        }
        if (!snapped) {
            if (Math.abs(tempEndX - editorState.newWallStartPoint.x) < Config.SNAP_DISTANCE) tempEndX = editorState.newWallStartPoint.x;
            if (Math.abs(tempEndZ - editorState.newWallStartPoint.z) < Config.SNAP_DISTANCE) tempEndZ = editorState.newWallStartPoint.z;
        }
        ctx.lineTo(tempEndX * scale, tempEndZ * scale); ctx.strokeStyle = Config.COLORS.PLAN_NEW_WALL_TEMP_LINE; ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.restore();
    drawVertices(ctx, scale, origin); // Рисуем осевые вершины
}

// Рисует ТОЛЬКО осевые вершины (индексы 0 и 3)
function drawVertices(ctx, scale, origin) {
    const radiusPx = Config.VERTEX_HIT_RADIUS / 2; ctx.lineWidth = 1;
    editorState.walls.forEach(wall => {
        if (!wall.vertices || wall.vertices.length !== 6) return;
        const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
        const startXCanvas = v0.x * scale + origin.x; const startYCanvas = v0.z * scale + origin.y;
        const endXCanvas = v3.x * scale + origin.x; const endYCanvas = v3.z * scale + origin.y;
        const isStartSelected = editorState.selectedVertexInfo?.wallId === wall.id && editorState.selectedVertexInfo?.vertexIndex === 0;
        const isEndSelected = editorState.selectedVertexInfo?.wallId === wall.id && editorState.selectedVertexInfo?.vertexIndex === 3;
        ctx.beginPath(); ctx.arc(startXCanvas, startYCanvas, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = isStartSelected ? Config.COLORS.PLAN_VERTEX_SELECTED : Config.COLORS.PLAN_VERTEX_DEFAULT;
        ctx.fill(); ctx.strokeStyle = Config.COLORS.PLAN_VERTEX_STROKE; ctx.stroke();
        ctx.beginPath(); ctx.arc(endXCanvas, endYCanvas, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = isEndSelected ? Config.COLORS.PLAN_VERTEX_SELECTED : Config.COLORS.PLAN_VERTEX_DEFAULT;
        ctx.fill(); ctx.strokeStyle = Config.COLORS.PLAN_VERTEX_STROKE; ctx.stroke();
    });
}

// Проверяет близость к ОСЕВОЙ линии стены
function isPointNearWallSegment(px, py, wall, scale, origin, tolerance) {
    if (!wall.vertices || wall.vertices.length !== 6) return false;
    const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
    const x1 = v0.x * scale + origin.x; const y1 = v0.z * scale + origin.y;
    const x2 = v3.x * scale + origin.x; const y2 = v3.z * scale + origin.y;
    const dx = x2 - x1; const dy = y2 - y1; const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1) <= tolerance;
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq; t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx; const closestY = y1 + t * dy;
    return Math.hypot(px - closestX, py - closestY) <= tolerance;
}

// --- Event Handlers ---
export function on2DPlanPointerDown(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const posData = get2DPlanPointerWorldPosition(event);
    if (!posData.valid) return; const pos = posData; let hitDetected = false;
    editorState.isDragging2D = false; editorState.isDraggingVertex = false; editorState.isDraggingWall = false; editorState.isPanning2D = false;

    if (editorState.isAddingWallMode && (event.button === 0 || event.touches)) { /* ... как было ... */ }
    if (!hitDetected && (event.button === 0 || event.touches)) { /* ... проверка мебели ... */ }
    // Осевые вершины
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (const wall of editorState.walls) {
            if (!wall.vertices || wall.vertices.length !== 6) continue;
            const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
            const startXCanvas = v0.x * editorState.planScale + editorState.planOrigin.x; const startYCanvas = v0.z * editorState.planScale + editorState.planOrigin.y;
            const endXCanvas = v3.x * editorState.planScale + editorState.planOrigin.x; const endYCanvas = v3.z * editorState.planScale + editorState.planOrigin.y;
            if (Math.hypot(pos.canvasX - startXCanvas, pos.canvasY - startYCanvas) <= Config.VERTEX_HIT_RADIUS) {
                deselectEverything(); selectVertex({ wallId: wall.id, vertexIndex: 0, initialPosAtDragStart: { ...v0 }, vertexRef: v0 }); // vertexRef нужен? updateConnectedVertices работает по значению
                editorState.isDraggingVertex = true; hitDetected = true; break;
            } if (Math.hypot(pos.canvasX - endXCanvas, pos.canvasY - endYCanvas) <= Config.VERTEX_HIT_RADIUS) {
                deselectEverything(); selectVertex({ wallId: wall.id, vertexIndex: 3, initialPosAtDragStart: { ...v3 }, vertexRef: v3 });
                editorState.isDraggingVertex = true; hitDetected = true; break;
            }
        }
    }
    // Стены (по осевой линии)
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (const wall of editorState.walls) {
            if (!wall.vertices || wall.vertices.length !== 6) continue;
            if (isPointNearWallSegment(pos.canvasX, pos.canvasY, wall, editorState.planScale, editorState.planOrigin, Config.WALL_HIT_TOLERANCE)) {
                deselectEverything(); selectWall(wall.id); editorState.isDraggingWall = true;
                const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
                const wallCenterX = (v0.x + v3.x) / 2; const wallCenterZ = (v0.z + v3.z) / 2;
                editorState.dragOffsetWall = { x: wallCenterX - pos.x, z: wallCenterZ - pos.z };
                editorState.originalWallDragPoints = { start: { ...v0 }, end: { ...v3 } };
                hitDetected = true; break;
            }
        }
    }
    // Панорамирование / Отмена выделения
    if (!hitDetected) { /* ... как было ... */ }
    render2DPlan();
}

export function on2DPlanPointerMove(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const posData = get2DPlanPointerWorldPosition(event);
    if (!posData.valid) return; const pos = posData;
    if (editorState.isAddingWallMode && editorState.newWallStartPoint) { /* ... как было ... */ }
    let needsRedraw = false; let needs3DUpdate = false;

    // Перетаскивание ОСЕВОЙ вершины
    if (editorState.isDraggingVertex && editorState.selectedVertexInfo && (editorState.selectedVertexInfo.vertexIndex === 0 || editorState.selectedVertexInfo.vertexIndex === 3)) {
        const { initialPosAtDragStart } = editorState.selectedVertexInfo;
        let targetX = pos.x; let targetZ = pos.z; let snapped = false;
        for (const wall of editorState.walls) { /* ... Snap logic по осевым точкам ... */ }
        const newPos = { x: targetX, z: targetZ };
        if (!pointsAreEqual(initialPosAtDragStart, newPos)) {
            const updated = updateConnectedVertices(initialPosAtDragStart, newPos); // Обновит осевые и пересчитает внешние
            if (updated) {
                editorState.selectedVertexInfo.initialPosAtDragStart = { ...newPos };
                needsRedraw = true; needs3DUpdate = true;
            }
        }
    }
    // Перетаскивание стены
    else if (editorState.isDraggingWall && editorState.selectedWallId) {
        const draggedWall = editorState.walls.find(w => w.id === editorState.selectedWallId);
        if (draggedWall) {
            const newWallCenterX = pos.x + editorState.dragOffsetWall.x; const newWallCenterZ = pos.z + editorState.dragOffsetWall.z;
            const oldOriginalWallCenterX = (editorState.originalWallDragPoints.start.x + editorState.originalWallDragPoints.end.x) / 2;
            const oldOriginalWallCenterZ = (editorState.originalWallDragPoints.start.z + editorState.originalWallDragPoints.end.z) / 2;
            const deltaX = newWallCenterX - oldOriginalWallCenterX; const deltaZ = newWallCenterZ - oldOriginalWallCenterZ;
            const newStartPos = { x: editorState.originalWallDragPoints.start.x + deltaX, z: editorState.originalWallDragPoints.start.z + deltaZ };
            const newEndPos = { x: editorState.originalWallDragPoints.end.x + deltaX, z: editorState.originalWallDragPoints.end.z + deltaZ };
            const startChanged = !pointsAreEqual(draggedWall.vertices[0], newStartPos); const endChanged = !pointsAreEqual(draggedWall.vertices[3], newEndPos);
            if (startChanged || endChanged) {
                // Обновляем осевые точки всех соединенных стен И ПЕРЕСЧИТЫВАЕМ их 6 вершин
                const updatedStart = updateConnectedVertices(editorState.originalWallDragPoints.start, newStartPos);
                const updatedEnd = updateConnectedVertices(editorState.originalWallDragPoints.end, newEndPos);
                if (updatedStart || updatedEnd) {
                    editorState.originalWallDragPoints.start = { ...newStartPos }; editorState.originalWallDragPoints.end = { ...newEndPos };
                    needsRedraw = true; needs3DUpdate = true;
                }
            }
        }
    }
    // Перетаскивание мебели
    else if (editorState.isDragging2D && editorState.selectedObject) { /* ... как было ... */ }
    // Панорамирование
    else if (editorState.isPanning2D) { /* ... как было ... */ }

    if (needsRedraw) render2DPlan();
    if (needs3DUpdate) import('./editorObjects.js').then(mod => mod.createOrUpdateAll3DWalls());
}

export function on2DPlanPointerUp(event) { /* ... как было ... */ }
export function on2DPlanWheel(event) { /* ... как было ... */ }
export function on2DPlanTouchStart(event) { /* ... как было ... */ }
export function on2DPlanTouchMove(event) { /* ... как было ... */ }
export function on2DPlanTouchEnd(event) { /* ... как было ... */ }