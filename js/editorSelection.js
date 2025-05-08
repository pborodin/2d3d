// js/editorSelection.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import * as UI from './ui.js';
import { render2DPlan } from './editorInteraction2D.js';
import { createOrUpdateAll3DWalls, removeFurnitureById, clearAllFurniture as clearEditorFurniture, clearAllWalls as clearEditorWalls, addWall as addEditorWall } from './editorObjects.js';
import { getDomElements } from './ui.js';
// --- ИМПОРТИРУЕМ функцию пересчета ---
import { recalculateWallVertices } from './editorObjects.js';


export function selectObject(object) {
    if (editorState.selectedObject === object) return;
    deselectEverything(); // Deselect previous first

    editorState.selectedObject = object;
    if (object && object.traverse) {
        object.traverse(child => {
            if (child.isMesh && child.material && child.material.emissive) {
                editorState.originalSelectionColor[child.uuid] = child.material.emissive.getHex();
                child.material.emissive.setHex(Config.COLORS.FURNITURE_SELECTED_EMISSIVE);
            }
        });
    }
    UI.showSelectedObjectControls();
    if (editorState.activeViewMode === 'plan') render2DPlan();
}

// --- ИЗМЕНЕНИЕ: selectWall читает толщины и считает общую ---
export function selectWall(wallId) {
    // if (editorState.selectedWallId === wallId && !UI.getDomElements().wallPropertiesPanel.classList.contains('hidden')) return; // Оптимизация, если панель уже видима
    deselectEverything();

    editorState.selectedWallId = wallId;
    const wall = editorState.walls.find(w => w.id === wallId);
    if (wall) {
        // Получаем DOM-элементы здесь
        const domUi = UI.getDomElements();

        // Показываем панель свойств стены и устанавливаем значения
        domUi.wallPropertiesPanel.classList.remove('hidden');
        domUi.selectedObjectControls.classList.add('hidden');

        // Рассчитываем и устанавливаем ОБЩУЮ толщину в инпут
        const totalThickness = (wall.thicknessL ?? 0) + (wall.thicknessR ?? 0);
        domUi.wallThicknessInput.value = totalThickness.toFixed(2); // Форматируем до 2 знаков

        domUi.wallHeightInput.value = wall.height ?? Config.DEFAULT_WALL_HEIGHT; // Используем сохраненную высоту

    } else {
        UI.hideWallPropertiesPanel(); // Скрываем, если стена не найдена
    }

    if (editorState.activeViewMode === 'plan') {
        import('./editorInteraction2D.js').then(mod => mod.render2DPlan()); // Обновляем 2D план
    }
}
// --- КОНЕЦ ИЗМЕНЕНИЯ ---

export function selectVertex(vertexInfo) { // vertexInfo = { wallId, type, initialPosAtDragStart, vertexRef }
    const dom = getDomElements();
    if (editorState.selectedVertexInfo?.wallId === vertexInfo.wallId && editorState.selectedVertexInfo?.type === vertexInfo.type) return;
    deselectEverything();

    editorState.selectedVertexInfo = vertexInfo;
    editorState.selectedWallId = vertexInfo.wallId; // Also select the wall the vertex belongs to
    const wall = editorState.walls.find(w => w.id === vertexInfo.wallId);
    if (wall) {
        UI.showWallPropertiesPanel(wall); // Show properties of the wall this vertex belongs to
    }
    if (editorState.activeViewMode === 'plan') render2DPlan();
}

export function deselectEverything() {
    const prevSelectedFurniture = editorState.selectedObject;
    const prevSelectedWallId = editorState.selectedWallId;
    const prevSelectedVertexInfo = editorState.selectedVertexInfo;

    if (editorState.selectedObject && editorState.selectedObject.traverse) {
        editorState.selectedObject.traverse(child => {
            if (child.isMesh && editorState.originalSelectionColor[child.uuid] !== undefined && child.material && child.material.emissive) {
                child.material.emissive.setHex(editorState.originalSelectionColor[child.uuid]);
                delete editorState.originalSelectionColor[child.uuid];
            }
        });
    }
    editorState.selectedObject = null;
    editorState.selectedWallId = null;
    editorState.selectedVertexInfo = null;

    UI.hideSelectedObjectControls();
    UI.hideWallPropertiesPanel();

    // Reset interaction flags
    editorState.isDragging3D = false;
    editorState.isDragging2D = false;
    editorState.isDraggingVertex = false;
    editorState.isDraggingWall = false;

    // If in add wall mode and something was deselected, turn off add wall mode
    if (editorState.isAddingWallMode && (prevSelectedFurniture || prevSelectedWallId || prevSelectedVertexInfo)) {
        editorState.isAddingWallMode = false;
        UI.toggleAddWallButtonActive(false);
        editorState.newWallStartPoint = null;
        editorState.currentMouseWorldPos2D = null;
    }


    if (editorState.activeViewMode === 'plan' && (prevSelectedFurniture || prevSelectedWallId || prevSelectedVertexInfo)) {
        render2DPlan();
    }
}


export function rotateSelectedObject(angleIncrement) {
    if (editorState.selectedObject) {
        editorState.selectedObject.rotation.y += angleIncrement;
        if (editorState.activeViewMode === 'plan') render2DPlan();
    }
}

export function deleteSelectedObject() {
    if (editorState.selectedObject && editorState.selectedObject.userData.itemData) { // Ensure it's furniture
        const itemIdToRemove = editorState.selectedObject.userData.itemData.id;
        deselectEverything(); // Important to deselect before removing from array/scene
        removeFurnitureById(itemIdToRemove); // This will handle scene removal and array update
        // render2DPlan is called within removeFurnitureById if needed
    }
}

export function deleteSelectedWall() {
    if (editorState.selectedWallId) {
        const wallIdToDelete = editorState.selectedWallId;
        const wallIndex = editorState.walls.findIndex(w => w.id === wallIdToDelete);
        if (wallIndex > -1) {
            const wallToRemove = editorState.walls[wallIndex];
            if (wallToRemove.threeMesh) {
                editorState.scene.remove(wallToRemove.threeMesh);
                if (wallToRemove.threeMesh.geometry) wallToRemove.threeMesh.geometry.dispose();
                if (wallToRemove.threeMesh.material) {
                    if(Array.isArray(wallToRemove.threeMesh.material)) wallToRemove.threeMesh.material.forEach(m=>m?.dispose());
                    else wallToRemove.threeMesh.material?.dispose();
                }
            }
            editorState.walls.splice(wallIndex, 1);
            deselectEverything(); // This will hide panels and redraw
            createOrUpdateAll3DWalls(); // Update 3D view
            if(editorState.activeViewMode === 'plan') render2DPlan();
        }
    }
}

export function toggleAddWallMode() {
    editorState.isAddingWallMode = !editorState.isAddingWallMode;
    editorState.newWallStartPoint = null;
    editorState.currentMouseWorldPos2D = null;
    if (editorState.isAddingWallMode) {
        deselectEverything(); // Ensure nothing is selected when entering add wall mode
    }
    UI.toggleAddWallButtonActive(editorState.isAddingWallMode);
    if (editorState.activeViewMode === 'plan') render2DPlan(); // Redraw to show/hide temp line or cursor change
}

// --- ИЗМЕНЕНИЕ: updateWallPropertiesFromInput читает общую толщину, делит и сохраняет L/R ---
export function updateWallPropertiesFromInput() {
    const domUi = UI.getDomElements();
    if (editorState.selectedWallId) {
        const wall = editorState.walls.find(w => w.id === editorState.selectedWallId);
        if (wall) {
            let changed = false;

            // Читаем ОБЩУЮ толщину из инпута
            const newTotalThickness = parseFloat(domUi.wallThicknessInput.value);
            if (!isNaN(newTotalThickness) && newTotalThickness > 0.01) {
                // Делим поровну от осевой линии (можно добавить другую логику)
                const newThicknessL = newTotalThickness / 2;
                const newThicknessR = newTotalThickness / 2;
                // Проверяем, изменились ли значения L или R
                if (Math.abs((wall.thicknessL ?? 0) - newThicknessL) > 1e-6 || Math.abs((wall.thicknessR ?? 0) - newThicknessR) > 1e-6) {
                    wall.thicknessL = newThicknessL;
                    wall.thicknessR = newThicknessR;
                    changed = true;
                }
            }

            // Обновляем высоту
            const newHeight = parseFloat(domUi.wallHeightInput.value);
            if (!isNaN(newHeight) && newHeight > 0 && Math.abs((wall.height ?? 0) - newHeight) > 1e-6) {
                wall.height = newHeight;
                changed = true;
            }

            if (changed) {
                // Пересчитываем вершины, т.к. толщина или высота могли измениться
                const recalculated = recalculateWallVertices(wall); // Используем импортированную функцию

                if (recalculated) {
                    // Обновляем 2D и 3D
                    import('./editorInteraction2D.js').then(mod => mod.render2DPlan());
                    import('./editorObjects.js').then(mod => mod.createOrUpdateAll3DWalls());
                }
            }
        }
    }
}
// --- КОНЕЦ ИЗМЕНЕНИЯ ---

export function initSelectionControls() {
    const domUi = getDomElements(); // Get main UI elements cache

    // Furniture controls
    document.getElementById('rotateLeftButton').addEventListener('click', () => rotateSelectedObject(Math.PI / 4));
    document.getElementById('rotateRightButton').addEventListener('click', () => rotateSelectedObject(-Math.PI / 4));
    document.getElementById('deleteButton').addEventListener('click', deleteSelectedObject); // Furniture delete

    // Wall controls
    domUi.wallThicknessInput.addEventListener('input', updateWallPropertiesFromInput);
    domUi.wallHeightInput.addEventListener('input', updateWallPropertiesFromInput);
    domUi.deleteWallButton.addEventListener('click', deleteSelectedWall);
    domUi.addWallButton.addEventListener('click', toggleAddWallMode);
}