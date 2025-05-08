// js/editorControls.js
import { state as editorState } from './editorState.js';
import { ensureInitialized, startAnimationLoop, stopAnimationLoop, handleResize, resize2DPlanCanvas } from './editorCore.js';
import { render2DPlan } from './editorInteraction2D.js';
import { updateEditorTitle, showThreeJSContainer, showPlanCanvasContainer, updateViewModeButtons, getDomElements } from './ui.js'; // <--- ДОБАВЛЕН ИМПОРТ
import { createOrUpdateAll3DWalls } from './editorObjects.js'; // Renamed for clarity

export function switchTo3DView(updateStateFlag = true) {
    if (updateStateFlag) editorState.activeViewMode = '3d';
    ensureInitialized();
    createOrUpdateAll3DWalls();
    updateEditorTitle("3D Редактор Комнаты");
    showThreeJSContainer();

    if (editorState.controls && editorState.camera) {
        Object.assign(editorState.controls, editorState.defaultOrbitControls);
        editorState.camera.position.copy(editorState.defaultCameraPos);
        editorState.camera.lookAt(editorState.defaultCameraLookAt);
        editorState.controls.target.copy(editorState.defaultControlsTarget);
        editorState.controls.enabled = true;
        editorState.controls.update();
    }

    if (editorState.renderer) { // Check if renderer is initialized
        startAnimationLoop();
    }
    updateViewModeButtons(editorState.activeViewMode);
    handleResize(); // Ensure correct aspect ratio and size
}

export function switchToPseudo3DView(updateStateFlag = true) {
    if (updateStateFlag) editorState.activeViewMode = 'pseudo3d';
    ensureInitialized();
    createOrUpdateAll3DWalls();
    updateEditorTitle("2D Вид Сверху (Псевдо-3D)");
    showThreeJSContainer();

    if (editorState.controls && editorState.camera) {
        // Reset to default orbit controls first to ensure all properties are set
        Object.assign(editorState.controls, editorState.defaultOrbitControls);
        // Then apply pseudo 3D specific overrides
        Object.assign(editorState.controls, editorState.pseudo3DControls);

        editorState.camera.position.copy(editorState.pseudo3DCameraPos);
        editorState.camera.lookAt(editorState.defaultCameraLookAt); // Look at the center of the floor
        editorState.controls.target.copy(editorState.defaultCameraLookAt);
        editorState.controls.enabled = true;
        editorState.controls.update();
    }
    if (editorState.renderer) {
        startAnimationLoop();
    }
    updateViewModeButtons(editorState.activeViewMode);
    handleResize();
}

export function switchToPlanView(updateStateFlag = true) {
    if (updateStateFlag) editorState.activeViewMode = 'plan';
    ensureInitialized();
    updateEditorTitle("2D План-Чертёж");
    showPlanCanvasContainer();
    stopAnimationLoop();

    if (editorState.controls) editorState.controls.enabled = false; // Disable OrbitControls

    resize2DPlanCanvas(); // This will also call render2DPlan
    updateViewModeButtons(editorState.activeViewMode);
    // No need for handleResize() here as resize2DPlanCanvas handles plan view specifically
}

export function initEditorControls() {
    const dom = getDomElements(); // <--- Получаем DOM элементы здесь, внутри функции
    // Теперь dom.viewMode3DButton и т.д. должны быть доступны, если getDomElements() из ui.js их возвращает
    // В файле ui.js, кнопки viewMode уже есть в объекте dom.

    if (dom.viewMode3DButton) { // Добавим проверки на всякий случай
        dom.viewMode3DButton.addEventListener('click', () => switchTo3DView());
    } else {
        console.error("viewMode3DButton not found in DOM cache from ui.js");
    }

    if (dom.viewModePseudo3DButton) {
        dom.viewModePseudo3DButton.addEventListener('click', () => switchToPseudo3DView());
    } else {
        console.error("viewModePseudo3DButton not found in DOM cache from ui.js");
    }

    if (dom.viewModePlanButton) {
        dom.viewModePlanButton.addEventListener('click', () => switchToPlanView());
    } else {
        console.error("viewModePlanButton not found in DOM cache from ui.js");
    }
}