// js/editorInteraction3D.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import { selectObject, deselectEverything } from './editorSelection.js';
import { getDomElements } from './ui.js';
import { getPointerXY } from './utils.js';


function get3DPointerPosition(event) {
    const dom = getDomElements();
    const rect = dom.threeJSContainer.getBoundingClientRect();
    const pointer = getPointerXY(event);
    const x = (pointer.x - rect.left) / rect.width * 2 - 1;
    const y = -((pointer.y - rect.top) / rect.height) * 2 + 1;
    return { x, y };
}

export function on3DPointerDown(event) {
    if (editorState.activeViewMode === 'plan' || (event.button !== 0 && !event.touches) ) return; // Only left click or touch

    const pos = get3DPointerPosition(event);
    editorState.pointer.set(pos.x, pos.y);
    editorState.raycaster.setFromCamera(editorState.pointer, editorState.camera);

    const intersectsFurniture = editorState.raycaster.intersectObjects(editorState.furniture, true);

    if (intersectsFurniture.length > 0) {
        let clickedObject = intersectsFurniture[0].object;
        while (clickedObject.parent && clickedObject.parent !== editorState.scene && !clickedObject.userData.itemData) {
            clickedObject = clickedObject.parent;
        }
        if (clickedObject.userData.itemData) {
            if (editorState.selectedObject !== clickedObject) {
                deselectEverything();
                selectObject(clickedObject);
            }
            editorState.isDragging3D = true;
            if (editorState.controls) editorState.controls.enabled = false;
            const intersectionPointWorld = intersectsFurniture[0].point;
            editorState.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), intersectionPointWorld);
        } else {
            deselectEverything();
        }
    } else {
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Проверяем пересечение с НОВЫМ полом (floorMesh), если он существует
        let intersectsFloor = [];
        if (editorState.floorMesh) { // Проверяем, что меш пола создан
            try {
                intersectsFloor = editorState.raycaster.intersectObject(editorState.floorMesh);
            } catch (e) {
                // Иногда raycaster может выдавать ошибку с кастомной геометрией, если она некорректна
                console.error("Raycaster error intersecting floorMesh:", e);
            }
        }
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        if (intersectsFloor.length > 0) {
            // Кликнули на пол (или не попали в мебель), снимаем выделение
            deselectEverything();
        }
        // Если не попали ни в мебель, ни в пол, ничего не делаем (оставляем текущее выделение)
    }
}

export function on3DPointerMove(event) {
    if (editorState.activeViewMode === 'plan' || !editorState.isDragging3D || !editorState.selectedObject) return;
    if (!editorState.camera || !editorState.raycaster || !editorState.dragPlane) return; // Добавим проверку

    const pos = get3DPointerPosition(event);
    editorState.pointer.set(pos.x, pos.y);
    editorState.raycaster.setFromCamera(editorState.pointer, editorState.camera);

    const intersectionPoint = new THREE.Vector3();
    if (editorState.raycaster.ray.intersectPlane(editorState.dragPlane, intersectionPoint)) {
        const limit = Config.FURNITURE_PLACEMENT_LIMIT; // Используем лимит из Config
        editorState.selectedObject.position.x = Math.max(-limit, Math.min(limit, intersectionPoint.x));
        editorState.selectedObject.position.z = Math.max(-limit, Math.min(limit, intersectionPoint.z));
        // editorState.selectedObject.position.y = 0; // Убедимся, что мебель на полу
    }
}


export function on3DPointerUp(event) {
    if (editorState.activeViewMode === 'plan') return;
    editorState.isDragging3D = false;
    if (editorState.controls) editorState.controls.enabled = true;
}