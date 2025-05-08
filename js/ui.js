// js/ui.js
import { getNoun } from './utils.js';
import { state as editorState, setLastTouchDistance, getLastTouchDistance } from './editorState.js';
import * as Config from './config.js';
import { deselectEverything, selectObject as selectEditorObject, selectWall as selectEditorWall, selectVertex as selectEditorVertex, rotateSelectedObject, deleteSelectedObject, deleteSelectedWall, toggleAddWallMode, updateWallPropertiesFromInput } from './editorSelection.js';
import { removeFurnitureById } from './editorObjects.js';


// --- DOM Elements Cache ---
const dom = {
    screens: {
        s1: document.getElementById('screen1'),
        s2: document.getElementById('screen2'),
        s3: document.getElementById('screen3'),
        s4: document.getElementById('screen4'),
        s5: document.getElementById('screen5')
    },
    editorTitle: document.getElementById('editorTitle'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    resultContent: document.getElementById('resultContent'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    originalImageResult: document.getElementById('originalImageResult'),
    photoUploadInput: document.getElementById('photoUpload'),
    uploadButton: document.getElementById('uploadButton'),
    styleOptions: document.querySelectorAll('.style-option'),
    selectedStyleText: document.getElementById('selectedStyleText'),
    generatedImage: document.getElementById('generatedImage'),

    // Editor specific UI
    threeJSContainer: document.getElementById('threejs-canvas-container'),
    planCanvasContainer: document.getElementById('plan-canvas-container'),
    viewMode3DButton: document.getElementById('viewMode3D'),
    viewModePseudo3DButton: document.getElementById('viewModePseudo3D'),
    viewModePlanButton: document.getElementById('viewModePlan'),
    addWallButton: document.getElementById('addWallButton'),

    selectedObjectControls: document.getElementById('selectedObjectControls'),
    // Элементы внутри selectedObjectControls (для мебели)
    rotateLeftButton: document.getElementById('rotateLeftButton'),
    rotateRightButton: document.getElementById('rotateRightButton'),
    deleteButton: document.getElementById('deleteButton'),

    // Панель свойств стены и ее элементы (Bottom Sheet)
    wallPropertiesBottomSheet: document.getElementById('wallPropertiesBottomSheet'),
    wallThicknessInput: document.getElementById('wallThicknessInput'),
    wallHeightInput: document.getElementById('wallHeightInput'),
    deleteWallButton: document.getElementById('deleteWallButton'), // Кнопка удаления стены (маленькая с иконкой)
    confirmCloseWallPropertiesButton: document.getElementById('confirmCloseWallPropertiesButton'), // Новая кнопка "Закрыть" рядом с удалением
    closeWallPropertiesSheetCornerButton: document.getElementById('closeWallPropertiesSheetCornerButton'), // Кнопка закрытия в углу


    // Estimate screen UI
    estimateItemsContainer: document.getElementById('estimateItemsContainer'),
    estimateItemCountHeader: document.getElementById('estimateItemCountHeader'),
    selectAllEstimateItemsCheckbox: document.getElementById('selectAllEstimateItems'),
    removeAllEstimateItemsButton: document.getElementById('removeAllEstimateItems'),
    summaryQuantity: document.getElementById('summaryQuantity'),
    summarySubtotal: document.getElementById('summarySubtotal'),
    summaryTotal: document.getElementById('summaryTotal'),
    closeEstimateButton: document.getElementById('closeEstimateButton'),
};

export function getDomElements() {
    return dom;
}

// --- Screen Navigation ---
export function showScreen(screenNumber) {
    Object.values(dom.screens).forEach(s => s.classList.add('hidden'));
    if (dom.screens[`s${screenNumber}`]) {
        dom.screens[`s${screenNumber}`].classList.remove('hidden');
    }
    hideLoadingIndicator();
    window.scrollTo(0, 0);
}

// --- Loading and Results ---
export function showLoadingIndicator() { dom.loadingIndicator.classList.remove('hidden'); dom.resultContent.classList.add('hidden'); }
export function hideLoadingIndicator() { dom.loadingIndicator.classList.add('hidden'); dom.resultContent.classList.remove('hidden'); }

export function displayResultsScreen(selectedStyleName, uploadedFile, generatedImageUrl) {
    dom.selectedStyleText.textContent = selectedStyleName || 'Не выбран';
    if (uploadedFile) {
        const reader = new FileReader();
        reader.onload = (e) => { dom.originalImageResult.innerHTML = `<img src="${e.target.result}" alt="Оригинальное фото" class="max-w-full rounded-md object-contain" style="max-height: inherit;">`; };
        reader.readAsDataURL(uploadedFile);
    } else {
        dom.originalImageResult.innerHTML = `<span class="image-placeholder-text md:text-lg">Фото не загружено</span>`;
    }
    dom.generatedImage.src = generatedImageUrl || Config.PLACEHOLDER_IMAGE_URL;
    hideLoadingIndicator();
}

// --- Photo Upload ---
export function initPhotoUpload(onFileUploadedCallback) {
    dom.uploadButton.addEventListener('click', () => dom.photoUploadInput.click());
    dom.photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgHTML = `<img src="${e.target.result}" alt="Предпросмотр фото" class="max-w-full rounded-md object-contain" style="max-height: inherit;">`;
                dom.imagePreviewContainer.innerHTML = imgHTML;
            };
            reader.readAsDataURL(file);
            if (onFileUploadedCallback) onFileUploadedCallback(file);
        }
    });
}
export function resetPhotoUpload() {
    dom.photoUploadInput.value = null;
    dom.imagePreviewContainer.innerHTML = '<span class="image-placeholder-text md:text-lg">Предпросмотр фото</span>';
    dom.originalImageResult.innerHTML = '<span class="image-placeholder-text md:text-lg">Ваше фото не загружено</span>';
}

// --- Style Selection ---
export function initStyleSelection(onStyleSelectedCallback) {
    dom.styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            dom.styleOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            const style = option.dataset.style;
            const name = option.querySelector('p').textContent;
            const image = option.querySelector('img').src;
            dom.generatedImage.src = image; // Update preview on screen 2 immediately
            if (onStyleSelectedCallback) onStyleSelectedCallback({ style, name, image });
        });
    });
}
export function resetStyleSelection() {
    dom.styleOptions.forEach(opt => opt.classList.remove('selected'));
    dom.generatedImage.src = Config.PLACEHOLDER_IMAGE_URL;
    dom.selectedStyleText.textContent = 'Не выбран';
}

// --- Editor UI ---
export function updateEditorTitle(title) { dom.editorTitle.textContent = title; }
export function showThreeJSContainer() { dom.threeJSContainer.classList.remove('hidden'); dom.planCanvasContainer.classList.add('hidden'); }
export function showPlanCanvasContainer() { dom.planCanvasContainer.classList.remove('hidden'); dom.threeJSContainer.classList.add('hidden'); }

export function updateViewModeButtons(activeMode) {
    [dom.viewMode3DButton, dom.viewModePseudo3DButton, dom.viewModePlanButton].forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    if (activeMode === '3d') dom.viewMode3DButton.classList.replace('btn-secondary', 'btn-primary');
    else if (activeMode === 'pseudo3d') dom.viewModePseudo3DButton.classList.replace('btn-secondary', 'btn-primary');
    else if (activeMode === 'plan') dom.viewModePlanButton.classList.replace('btn-secondary', 'btn-primary');
}

export function toggleAddWallButtonActive(isActive) {
    if (isActive) {
        dom.addWallButton.classList.replace('btn-secondary', 'btn-primary');
        if (editorState.planCanvas) editorState.planCanvas.style.cursor = 'crosshair';
    } else {
        dom.addWallButton.classList.replace('btn-primary', 'btn-secondary');
        if (editorState.planCanvas) editorState.planCanvas.style.cursor = 'default';
    }
}


export function showSelectedObjectControls() {
    dom.selectedObjectControls.classList.remove('hidden');
    if (dom.wallPropertiesBottomSheet) {
        dom.wallPropertiesBottomSheet.classList.remove('visible');
    }
}
export function hideSelectedObjectControls() { dom.selectedObjectControls.classList.add('hidden');}

export function showWallPropertiesControls(wall) {
    if (!wall || !dom.wallPropertiesBottomSheet) return;

    const totalThickness = (wall.thicknessL ?? 0) + (wall.thicknessR ?? 0);
    dom.wallThicknessInput.value = totalThickness.toFixed(2);
    dom.wallHeightInput.value = wall.height ?? Config.DEFAULT_WALL_HEIGHT;

    dom.selectedObjectControls.classList.add('hidden');
    dom.wallPropertiesBottomSheet.classList.add('visible');
}
export function hideWallPropertiesControls() {
    if (!dom.wallPropertiesBottomSheet) return;
    dom.wallPropertiesBottomSheet.classList.remove('visible');
}

export function initExtraUIActions(deselectCallback) {
    const closeAction = () => {
        hideWallPropertiesControls();
        if (deselectCallback) deselectCallback();
    };

    if (dom.closeWallPropertiesSheetCornerButton) {
        dom.closeWallPropertiesSheetCornerButton.addEventListener('click', closeAction);
    }
    if (dom.confirmCloseWallPropertiesButton) {
        dom.confirmCloseWallPropertiesButton.addEventListener('click', closeAction);
    }
}

// --- Estimate Screen ---
export function renderEstimateScreen(furnitureItems, onItemSelectedChange, onItemRemoved, onSelectAll, onRemoveAll) {
    dom.estimateItemsContainer.innerHTML = '';
    let totalQuantity = 0;
    let subtotalPrice = 0;
    let allActuallySelected = furnitureItems.length > 0;

    furnitureItems.forEach(furnitureObject => {
        const item = furnitureObject.userData.itemData;
        if (!item) return;

        const isChecked = furnitureObject.userData.estimateSelected === undefined ? true : furnitureObject.userData.estimateSelected;

        const itemElement = document.createElement('div');
        itemElement.classList.add('estimate-item');
        itemElement.innerHTML = `
            <input type="checkbox" class="estimate-item-checkbox" data-item-id="${item.id}" ${isChecked ? 'checked' : ''}>
            <img src="${item.image}" alt="${item.name}" class="estimate-item-image">
            <div class="estimate-item-details">
                <span class="estimate-item-name">${item.name}</span>
                <span class="estimate-item-sku">Артикул: ${item.sku}</span>
                <span class="estimate-item-price">${item.price.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="estimate-item-actions">
                <button data-remove-item-id="${item.id}" title="Удалить">
                    <svg class="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></svg>
                </button>
            </div>
        `;
        dom.estimateItemsContainer.appendChild(itemElement);

        if (isChecked) {
            totalQuantity++;
            subtotalPrice += item.price;
        }
        if (!isChecked) {
            allActuallySelected = false;
        }
    });

    dom.estimateItemCountHeader.textContent = `${furnitureItems.length} ${getNoun(furnitureItems.length, 'товар', 'товара', 'товаров')}`;
    dom.summaryQuantity.textContent = `${totalQuantity} ${getNoun(totalQuantity, 'шт.', 'шт.', 'шт.')}`;
    dom.summarySubtotal.textContent = `${subtotalPrice.toLocaleString('ru-RU')} ₽`;
    dom.summaryTotal.textContent = `${subtotalPrice.toLocaleString('ru-RU')} ₽`; // Assuming no tax/shipping for now

    dom.selectAllEstimateItemsCheckbox.checked = allActuallySelected && furnitureItems.length > 0;

    // Re-attach event listeners for dynamically created elements
    dom.estimateItemsContainer.querySelectorAll('.estimate-item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            if (onItemSelectedChange) onItemSelectedChange(event.target.dataset.itemId, event.target.checked);
        });
    });
    dom.estimateItemsContainer.querySelectorAll('button[data-remove-item-id]').forEach(button => {
        button.addEventListener('click', (event) => {
            if (onItemRemoved) onItemRemoved(event.currentTarget.dataset.removeItemId);
        });
    });
}

export function initEstimateScreenControls(onSelectAllCallback, onRemoveAllCallback, onCloseCallback) {
    dom.selectAllEstimateItemsCheckbox.addEventListener('change', (event) => {
        if (onSelectAllCallback) onSelectAllCallback(event.target.checked);
    });
    dom.removeAllEstimateItemsButton.addEventListener('click', () => {
        if (onRemoveAllCallback) onRemoveAllCallback();
    });
    dom.closeEstimateButton.addEventListener('click', () => {
        if (onCloseCallback) onCloseCallback();
    });
}