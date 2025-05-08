// js/editorInteraction2D.js
import { getDomElements } from './ui.js';
import { state as editorState, setLastTouchDistance, getLastTouchDistance } from './editorState.js';
import * as Config from './config.js';
import { getPointerXY, pointsAreEqual } from './utils.js';
import { selectObject, deselectEverything, selectWall, selectVertex } from './editorSelection.js';
// Динамически импортируем editorObjects при необходимости

// --- Кэш для SVG Image объектов ---
const svgImageCache = new Map(); // Используем Map для кэша: Map<string, {image: HTMLImageElement, loaded: boolean}>

// --- Функция для загрузки и кэширования SVG ---
function getOrCreateSvgImage(type, svgString) {
    if (!type || !svgString) return null;

    if (svgImageCache.has(type)) {
        return svgImageCache.get(type); // Возвращаем объект из кэша {image, loaded}
    }

    // Создаем объект Image
    const image = new Image();
    const cacheEntry = { image: image, loaded: false };
    svgImageCache.set(type, cacheEntry); // Добавляем в кэш СРАЗУ

    image.onload = () => {
        cacheEntry.loaded = true;
        // Важно: нужно перерисовать canvas ПОСЛЕ загрузки изображения,
        // если оно рисовалось в первый раз. Проще всего вызывать render2DPlan().
        // Но делать это здесь может быть не очень эффективно.
        // Пока оставим так, изображение появится на следующем кадре render2DPlan.
        // console.log(`SVG image loaded for type: ${type}`);
        render2DPlan(); // Принудительно перерисовываем после загрузки
    };
    image.onerror = (err) => {
        console.error(`Error loading SVG image for type: ${type}`, err);
        svgImageCache.delete(type); // Удаляем из кэша при ошибке
    };

    // Устанавливаем Data URL
    // Используем btoa для кодирования в Base64, чтобы избежать проблем со спецсимволами SVG в URL
    const base64Svg = btoa(unescape(encodeURIComponent(svgString))); // Правильное кодирование для base64
    image.src = `data:image/svg+xml;base64,${base64Svg}`;

    return cacheEntry; // Возвращаем объект {image, loaded}
}

// --- ИСПРАВЛЕННАЯ async функция обновления соединенных осевых вершин ---
async function updateConnectedVertices(originalPos, newPos) {
    if (!originalPos || !newPos) return false;
    let overallUpdated = false;
    const affectedWallIds = new Set();

    // Синхронно обновляем осевые точки и собираем ID затронутых стен
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
        if (wallAffected) affectedWallIds.add(wall.id);
    });

    // Если осевые точки были обновлены, асинхронно импортируем модуль
    // и пересчитываем геометрию ВСЕХ затронутых стен
    if (overallUpdated && affectedWallIds.size > 0) {
        try {
            // Динамически импортируем ОДИН РАЗ
            const editorObjectsModule = await import('./editorObjects.js');
            // Пересчитываем каждую затронутую стену
            affectedWallIds.forEach(wallId => {
                const wall = editorState.walls.find(w => w.id === wallId);
                if (wall) {
                    // Вызываем функцию пересчета из импортированного модуля
                    // Эта функция синхронная, поэтому Promise.all не нужен здесь
                    editorObjectsModule.recalculateWallVertices(wall);
                }
            });
        } catch (err) {
            console.error("Failed to load editorObjects.js for recalculating vertices:", err);
            return false; // Возвращаем false в случае ошибки импорта
        }
    }

    return overallUpdated; // Возвращаем true, если осевые точки изменились
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

    // Рисуем Мебель
    editorState.furniture.forEach(item => {
        const itemData = item.userData?.itemData;
        const dims = itemData?.realDimensionsMM; // Теперь берем из itemData
        const svgString = itemData?.svgIconString;
        const type = itemData?.type;

        // --- ДОБАВИМ ЛОГГИРОВАНИЕ ---
        // console.log(`Rendering furniture: ${type || 'unknown'}`, { hasItemData: !!itemData, hasDims: !!dims, hasSvg: !!svgString });

        if (!itemData || !dims || !svgString || !type) {
            // --- ОТРИСОВКА СТАРЫХ planDimensions ---
            const planDims = item.userData?.planDimensions;
            if (planDims) {
                // console.log(`Falling back to planDimensions for ${type || 'unknown'}`);
                const x = item.position.x * scale; const z = item.position.z * scale; const rotation = item.rotation.y;
                ctx.save(); ctx.translate(x, z); ctx.rotate(rotation);
                ctx.fillStyle = "#AAAAAA"; ctx.strokeStyle = "#555555"; ctx.lineWidth = 1;
                if (planDims.shape === 'rect') { const w = planDims.width * scale; const d = planDims.depth * scale; ctx.fillRect(-w / 2, -d / 2, w, d); ctx.strokeRect(-w / 2, -d / 2, w, d); }
                else if (planDims.shape === 'circle') { const r = planDims.radius * scale; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
                ctx.restore();
            } else {
                // console.log(`Skipping ${type || 'unknown'} - no planDimensions either.`);
            }
            return;
        }
        // --- КОНЕЦ ОТРИСОВКИ СТАРЫХ ---


        const cacheEntry = getOrCreateSvgImage(type, svgString);
        const x = item.position.x * scale; const z = item.position.z * scale; const rotation = item.rotation.y;
        const drawWidthPx = (dims.width / 1000) * scale;
        const drawDepthPx = (dims.depth / 1000) * scale;

        ctx.save();
        ctx.translate(x, z);
        ctx.rotate(rotation);

        let drewSomething = false;
        if (cacheEntry && cacheEntry.loaded && !cacheEntry.error) {
            try {
                // console.log(`Drawing SVG image for ${type}`);
                ctx.drawImage(cacheEntry.image, -drawWidthPx / 2, -drawDepthPx / 2, drawWidthPx, drawDepthPx);
                drewSomething = true;
            } catch (e) {
                console.error("Error in ctx.drawImage:", type, e);
                // Рисуем красный квадрат при ошибке отрисовки
                ctx.fillStyle = "red";
                ctx.fillRect(-drawWidthPx / 2, -drawDepthPx / 2, drawWidthPx, drawDepthPx);
                drewSomething = true;
            }
        }

        // Рисуем плейсхолдер, если еще грузится ИЛИ если была ошибка загрузки/кодирования
        if (!drewSomething || (cacheEntry && !cacheEntry.loaded) || (cacheEntry && cacheEntry.error)) {
            if (!drewSomething && cacheEntry?.error) {
                // console.log(`Drawing RED placeholder due to load/encode error for ${type}`);
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Красный для ошибки
            } else {
                // console.log(`Drawing loading/default placeholder for ${type}`);
                ctx.fillStyle = "rgba(100, 100, 100, 0.5)"; // Серый для загрузки
            }
            ctx.strokeStyle = "#888888"; ctx.lineWidth = 1;
            ctx.fillRect(-drawWidthPx / 2, -drawDepthPx / 2, drawWidthPx, drawDepthPx);
            ctx.strokeRect(-drawWidthPx / 2, -drawDepthPx / 2, drawWidthPx, drawDepthPx);
        }

        // Рамка выделения
        if (item === editorState.selectedObject) {
            ctx.strokeStyle = Config.COLORS.PLAN_FURNITURE_SELECTED_STROKE; ctx.lineWidth = 2;
            ctx.strokeRect(-drawWidthPx / 2, -drawDepthPx / 2, drawWidthPx, drawDepthPx);
        }
        ctx.restore();
    });
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

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
    if (!posData.valid) return;
    const pos = posData;
    let hitDetected = false;
    editorState.isDragging2D = false; editorState.isDraggingVertex = false;
    editorState.isDraggingWall = false; editorState.isPanning2D = false;

    if (editorState.isAddingWallMode && (event.button === 0 || event.touches)) {
        let startX = pos.x; let startZ = pos.z; let snapped = false;
        for (const wall of editorState.walls) {
            if (!wall.vertices || wall.vertices.length !== 6) continue; const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
            if (Math.hypot(startX - v0.x, startZ - v0.z) < Config.SNAP_DISTANCE) { startX = v0.x; startZ = v0.z; snapped = true; break; }
            if (Math.hypot(startX - v3.x, startZ - v3.z) < Config.SNAP_DISTANCE) { startX = v3.x; startZ = v3.z; snapped = true; break; }
        }
        editorState.newWallStartPoint = { x: startX, z: startZ }; editorState.currentMouseWorldPos2D = { x: startX, z: startZ };
        hitDetected = true; render2DPlan(); return;
    }

    // Мебель
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (let i = editorState.furniture.length - 1; i >= 0; i--) {
            const item = editorState.furniture[i]; const itemPlanDim = item.userData.planDimensions; if (!itemPlanDim) continue;
            const dxWorld = pos.x - item.position.x; const dzWorld = pos.z - item.position.z; const rotation = -item.rotation.y;
            const localX = dxWorld * Math.cos(rotation) - dzWorld * Math.sin(rotation); const localZ = dxWorld * Math.sin(rotation) + dzWorld * Math.cos(rotation);
            if (itemPlanDim.shape === 'rect' && Math.abs(localX) <= itemPlanDim.width / 2 && Math.abs(localZ) <= itemPlanDim.depth / 2 ||
                itemPlanDim.shape === 'circle' && localX * localX + localZ * localZ <= itemPlanDim.radius * itemPlanDim.radius) {
                if (editorState.selectedObject !== item) { deselectEverything(); selectObject(item); }
                editorState.isDragging2D = true; editorState.dragOffset2D = { x: item.position.x - pos.x, z: item.position.z - pos.z };
                hitDetected = true; break;
            }
        }
    }
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
    if (!hitDetected) {
        if (event.button === 0 && !event.touches) { deselectEverything(); }
        else if (event.button === 2 || event.touches) {
            event.preventDefault(); deselectEverything(); editorState.isPanning2D = true;
            const pointer = getPointerXY(event);
            editorState.panStart2D.x = pointer.x; editorState.panStart2D.y = pointer.y;
            editorState.planOriginStart.x = editorState.planOrigin.x; editorState.planOriginStart.y = editorState.planOrigin.y;
        }
    }
    render2DPlan();
}

export function on2DPlanPointerMove(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const posData = get2DPlanPointerWorldPosition(event);
    if (!posData.valid) return;
    const pos = posData;

    if (editorState.isAddingWallMode && editorState.newWallStartPoint) {
        editorState.currentMouseWorldPos2D = { x: pos.x, z: pos.z }; render2DPlan(); return;
    }

    let needsRedraw = false;
    let needs3DUpdate = false;

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
    else if (editorState.isDragging2D && editorState.selectedObject) {
        const limit = Config.FURNITURE_PLACEMENT_LIMIT;
        const targetX = pos.x + editorState.dragOffset2D.x; const targetZ = pos.z + editorState.dragOffset2D.z;
        const newX = Math.max(-limit, Math.min(limit, targetX)); const newZ = Math.max(-limit, Math.min(limit, targetZ));
        if (editorState.selectedObject.position.x !== newX || editorState.selectedObject.position.z !== newZ) {
            editorState.selectedObject.position.x = newX; editorState.selectedObject.position.z = newZ;
            needsRedraw = true;
        }
    }
    // Панорамирование
    else if (editorState.isPanning2D) {
        const pointer = getPointerXY(event);
        const deltaX = pointer.x - editorState.panStart2D.x; const deltaY = pointer.y - editorState.panStart2D.y;
        const newOriginX = editorState.planOriginStart.x + deltaX; const newOriginY = editorState.planOriginStart.y + deltaY;
        if (editorState.planOrigin.x !== newOriginX || editorState.planOrigin.y !== newOriginY) {
            editorState.planOrigin.x = newOriginX; editorState.planOrigin.y = newOriginY;
            needsRedraw = true;
        }
    }

    if (needsRedraw) render2DPlan();
    if (needs3DUpdate) import('./editorObjects.js').then(mod => mod.createOrUpdateAll3DWalls());
}

// --- ИСПРАВЛЕННЫЙ on2DPlanPointerUp ---
export function on2DPlanPointerUp(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const posData = get2DPlanPointerWorldPosition(event.changedTouches ? event.changedTouches[0] : event);

    // Логика добавления стены
    if (editorState.isAddingWallMode && editorState.newWallStartPoint && (event.button === 0 || (event.changedTouches && event.changedTouches.length > 0))) {
        const pos = posData.valid ? posData : editorState.currentMouseWorldPos2D;
        if (pos) {
            let finalEndX = pos.x; let finalEndZ = pos.z; let snapped = false;
            // Логика снаппинга finalEndX, finalEndZ...
            for (const wall of editorState.walls) {
                if (!wall.vertices || wall.vertices.length !== 6) continue; const v0 = wall.vertices[0]; const v3 = wall.vertices[3];
                if (Math.hypot(finalEndX - v0.x, finalEndZ - v0.z) < Config.SNAP_DISTANCE) { finalEndX = v0.x; finalEndZ = v0.z; snapped = true; break; }
                if (Math.hypot(finalEndX - v3.x, finalEndZ - v3.z) < Config.SNAP_DISTANCE) { finalEndX = v3.x; finalEndZ = v3.z; snapped = true; break; }
            }
            if (!snapped) {
                if (Math.abs(finalEndX - editorState.newWallStartPoint.x) < Config.SNAP_DISTANCE) finalEndX = editorState.newWallStartPoint.x;
                if (Math.abs(finalEndZ - editorState.newWallStartPoint.z) < Config.SNAP_DISTANCE) finalEndZ = editorState.newWallStartPoint.z;
            }

            // Проверяем длину
            if (Math.hypot(finalEndX - editorState.newWallStartPoint.x, finalEndZ - editorState.newWallStartPoint.z) > 0.1) {
                // --- ИСПРАВЛЕНИЕ: Захватываем объекты ---
                const startPointObject = { ...editorState.newWallStartPoint }; // Копия начальной точки
                const endPointObject = { x: finalEndX, z: finalEndZ };       // Новая конечная точка

                import('./editorObjects.js').then(editorObjectsModule => {
                    // Передаем объекты в addWall
                    editorObjectsModule.addWall(startPointObject, endPointObject);
                    render2DPlan();
                }).catch(err => console.error("Failed to load editorObjects.js for addWall:", err));
            }
        }
        // Сбрасываем ПОСЛЕ инициирования импорта
        editorState.newWallStartPoint = null;
        editorState.currentMouseWorldPos2D = null;
        render2DPlan(); // Убираем временную линию
    }

    // Сброс флагов перетаскивания
    if (event.button === 0 || (event.changedTouches && event.changedTouches.length > 0)) {
        editorState.isDraggingVertex = false;
        editorState.isDraggingWall = false;
        editorState.isDragging2D = false;
    } else if (event.button === 2) {
        editorState.isPanning2D = false;
    }
}

export function on2DPlanWheel(event) {
    event.preventDefault();
    if (editorState.activeViewMode !== 'plan' || !editorState.planCanvas) return;
    const zoomSensitivity = 0.001;
    const oldScale = editorState.planScale;
    let newScale = oldScale - event.deltaY * zoomSensitivity * oldScale;
    newScale = Math.max(editorState.minPlanScale, Math.min(editorState.maxPlanScale, newScale));
    if (Math.abs(newScale - oldScale) < 0.0001) return;
    const rect = editorState.planCanvas.getBoundingClientRect();
    const mouseXCanvas = event.clientX - rect.left; const mouseYCanvas = event.clientY - rect.top;
    const worldXBefore = (mouseXCanvas - editorState.planOrigin.x) / oldScale;
    const worldZBefore = (mouseYCanvas - editorState.planOrigin.y) / oldScale;
    editorState.planScale = newScale;
    editorState.planOrigin.x = mouseXCanvas - worldXBefore * editorState.planScale;
    editorState.planOrigin.y = mouseYCanvas - worldZBefore * editorState.planScale;
    render2DPlan();
}

export function on2DPlanTouchStart(event) {
    if (editorState.activeViewMode !== 'plan' || !editorState.planCanvas) return;
    if (editorState.isAddingWallMode) { on2DPlanPointerDown(event); return; }
    if (event.touches.length === 1) {
        on2DPlanPointerDown(event); setLastTouchDistance(null);
    } else if (event.touches.length === 2) {
        event.preventDefault(); deselectEverything();
        editorState.isPanning2D = false; editorState.isDragging2D = false;
        editorState.isDraggingVertex = false; editorState.isDraggingWall = false;
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        setLastTouchDistance(Math.sqrt(dx * dx + dy * dy));
    }
}

export function on2DPlanTouchMove(event) {
    if (editorState.activeViewMode !== 'plan' || !editorState.planCanvas) return;
    if (editorState.isAddingWallMode && editorState.newWallStartPoint) { on2DPlanPointerMove(event); return; }
    if (event.touches.length === 1) {
        on2DPlanPointerMove(event);
    } else if (event.touches.length === 2 && getLastTouchDistance() !== null) {
        event.preventDefault();
        const touch1 = event.touches[0]; const touch2 = event.touches[1];
        const dx = touch1.clientX - touch2.clientX; const dy = touch1.clientY - touch2.clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const zoomFactor = currentDist / getLastTouchDistance();
        const oldScale = editorState.planScale;
        let newScale = oldScale * zoomFactor;
        newScale = Math.max(editorState.minPlanScale, Math.min(editorState.maxPlanScale, newScale));
        if (Math.abs(newScale - oldScale) < 0.0001) { setLastTouchDistance(currentDist); return; }
        const rect = editorState.planCanvas.getBoundingClientRect();
        const pinchCenterXCanvas = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const pinchCenterYCanvas = (touch1.clientY + touch2.clientY) / 2 - rect.top;
        const worldXBefore = (pinchCenterXCanvas - editorState.planOrigin.x) / oldScale;
        const worldZBefore = (pinchCenterYCanvas - editorState.planOrigin.y) / oldScale;
        editorState.planScale = newScale; setLastTouchDistance(currentDist);
        editorState.planOrigin.x = pinchCenterXCanvas - worldXBefore * editorState.planScale;
        editorState.planOrigin.y = pinchCenterYCanvas - worldZBefore * editorState.planScale;
        render2DPlan();
    }
}

export function on2DPlanTouchEnd(event) {
    if (editorState.activeViewMode !== 'plan') return;
    if (editorState.isAddingWallMode && editorState.newWallStartPoint) {
        if (event.touches.length === 0 && event.changedTouches.length === 1) { on2DPlanPointerUp(event); }
    } else { on2DPlanPointerUp(event); } // Сброс флагов произойдет в on2DPlanPointerUp
    if (event.touches.length < 2) setLastTouchDistance(null);
    if (event.touches.length === 0) editorState.isPanning2D = false; // Явный сброс панорамирования при отпускании последнего пальца
}