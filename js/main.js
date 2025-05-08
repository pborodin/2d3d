// js/main.js
import * as Config from './config.js';
import * as UI from './ui.js';
import { state as editorState } from './editorState.js';
import { ensureInitialized, startAnimationLoop, stopAnimationLoop, handleResize } from './editorCore.js';
import * as EditorControls from './editorControls.js';
import { initializeDefaultWalls, addFurnitureObject, clearAllFurniture, clearAllWalls, removeFurnitureById } from './editorObjects.js';
import { deselectEverything, initSelectionControls } from './editorSelection.js';

// --- Global App State (Minimal) ---
let currentScreen = 1;
let appUploadedFile = null;
let appSelectedStyle = { style: null, name: '', image: Config.PLACEHOLDER_IMAGE_URL };

// --- DOM Elements (Main Navigation & Global) ---
const mainDom = {
    nextToScreen2Button: document.getElementById('nextToScreen2'),
    backToScreen1From2Button: document.getElementById('backToScreen1From2'),
    showResultButton: document.getElementById('showResultButton'),
    startOverButton: document.getElementById('startOverButton'),
    openEditorButton: document.getElementById('openEditorButton'),
    backToResultsButton: document.getElementById('backToResultsButton'),
    openEstimateButtonEditor: document.getElementById('openEstimateButton'), // From editor toolbar
    // Estimate screen buttons
    checkoutButton: document.getElementById('checkoutButton'),
    checkoutCreditButton: document.getElementById('checkoutCreditButton'),
    // Add furniture buttons
    addTableButton: document.getElementById('addTableButton'),
    addSofaButton: document.getElementById('addSofaButton'),
    addLampButton: document.getElementById('addLampButton'),
};

// --- Navigation ---
function navigateTo(screenNumber) {
    UI.showScreen(screenNumber);

    if (screenNumber === 4) { // Editor screen
        ensureInitialized();
        if (editorState.activeViewMode === 'plan') EditorControls.switchToPlanView(false);
        else if (editorState.activeViewMode === 'pseudo3d') EditorControls.switchToPseudo3DView(false);
        else EditorControls.switchTo3DView(false);
        handleResize();
    } else if (screenNumber === 5) { // Estimate screen
        stopAnimationLoop();
        // Initial render of estimate screen. Callbacks will handle subsequent re-renders.
        renderEstimateWithCallbacks();
    } else { // Any other screen
        stopAnimationLoop();
    }
    currentScreen = screenNumber;
}

// --- Estimate Screen Callbacks & Rendering ---
// Define these functions once so they can reference each other without arguments.callee
let onEstimateItemSelectedChange;
let onEstimateItemRemoved;

function renderEstimateWithCallbacks() {
    UI.renderEstimateScreen(
        editorState.furniture,
        onEstimateItemSelectedChange,
        onEstimateItemRemoved
    );
}

onEstimateItemSelectedChange = (itemId, isChecked) => {
    const furnitureObject = editorState.furniture.find(f => f.userData.itemData && f.userData.itemData.id === itemId);
    if (furnitureObject) {
        furnitureObject.userData.estimateSelected = isChecked;
    }
    renderEstimateWithCallbacks(); // Re-render with updated state
};

onEstimateItemRemoved = (itemIdToRemove) => {
    if (removeFurnitureById(itemIdToRemove)) {
        renderEstimateWithCallbacks(); // Re-render after item is removed
    }
};


// --- Event Handlers ---
mainDom.nextToScreen2Button.addEventListener('click', () => navigateTo(2));
mainDom.backToScreen1From2Button.addEventListener('click', () => navigateTo(1));

mainDom.showResultButton.addEventListener('click', () => {
    let valid = true;
    if (!appUploadedFile) { valid = false; alert("Пожалуйста, загрузите фото комнаты."); }
    if (!appSelectedStyle.style) { valid = false; alert("Пожалуйста, выберите стиль."); }
    if (valid) {
        navigateTo(3);
        UI.showLoadingIndicator();
        setTimeout(() => {
            UI.displayResultsScreen(appSelectedStyle.name, appUploadedFile, appSelectedStyle.image);
        }, 1500);
    }
});

mainDom.openEditorButton.addEventListener('click', () => {
    navigateTo(4);
});

mainDom.backToResultsButton.addEventListener('click', () => navigateTo(3));

mainDom.startOverButton.addEventListener('click', () => {
    appUploadedFile = null;
    appSelectedStyle = { style: null, name: '', image: Config.PLACEHOLDER_IMAGE_URL };
    UI.resetPhotoUpload();
    UI.resetStyleSelection();
    document.querySelectorAll('#screen1 input[type="checkbox"]').forEach(cb => cb.checked = false);

    deselectEverything();
    clearAllFurniture();
    clearAllWalls();
    initializeDefaultWalls();

    editorState.activeViewMode = '3d';
    editorState.planScale = 25;
    editorState.planOrigin = { x: 0, y: 0 };
    if (editorState.planCanvas && editorState.planCanvas.width > 0) {
        editorState.planOrigin = {
            x: editorState.planCanvas.width / 2,
            y: editorState.planCanvas.height / 2
        };
    }
    navigateTo(1);
});

mainDom.openEstimateButtonEditor.addEventListener('click', () => navigateTo(5));

mainDom.addTableButton.addEventListener('click', async () => {
    await addFurnitureObject('table');
});
mainDom.addSofaButton.addEventListener('click', async () => {
    await addFurnitureObject('sofa');
});
mainDom.addLampButton.addEventListener('click', async () => {
    await addFurnitureObject('lamp');
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    UI.initPhotoUpload((file) => { appUploadedFile = file; });
    UI.initStyleSelection((styleData) => { appSelectedStyle = styleData; });
    EditorControls.initEditorControls();
    initSelectionControls();

    UI.initEstimateScreenControls(
        (isChecked) => { // onSelectAll
            editorState.furniture.forEach(f => { if (f.userData.itemData) f.userData.estimateSelected = isChecked; });
            renderEstimateWithCallbacks(); // Re-render
        },
        () => { // onRemoveAll
            if (confirm('Вы уверены, что хотите удалить все предметы из сметы и сцены?')) {
                clearAllFurniture();
                deselectEverything();
                renderEstimateWithCallbacks(); // Re-render
            }
        },
        () => navigateTo(4) // onCloseEstimate
    );

    initializeDefaultWalls();
    navigateTo(1);
});