Хорошо, я разобью код на несколько файлов, как мы обсуждали. Это будет довольно объемный вывод, но он будет содержать полный код для каждого файла.

**Структура проекта:**

```
.
├── index.html
└── js/
    ├── main.js
    ├── config.js
    ├── utils.js
    ├── ui.js
    ├── editorState.js
    ├── editorCore.js
    ├── editorControls.js
    ├── editorInteraction3D.js
    ├── editorInteraction2D.js
    ├── editorObjects.js
    └── editorSelection.js
```

---

**`index.html` (изменения только в подключении скриптов):**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Совушка ROOM</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #1a1a2e;
            color: #e0e0e0;
            margin: 0;
            overflow-x: hidden;
        }
        .app-container-base {
            margin: 0 auto;
            background-color: #24243e;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header { padding: 1rem; text-align: center; background-color: #1f1f38; }
        .header h1 { font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .content { padding: 1.5rem; flex-grow: 1; }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: auto;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            text-align: center;
            transition: background-color 0.3s ease;
            cursor: pointer;
            border: none;
        }
        .btn-block {
            display: flex;
            width: 100%;
        }
        .btn-primary { background-color: #4a90e2; color: #ffffff; }
        .btn-primary:hover { background-color: #357abd; }
        .btn-secondary { background-color: #3a3a5a; color: #e0e0e0; }
        .btn-secondary:hover { background-color: #4a4a6a; }
        .btn-danger { background-color: #e53e3e; color: #ffffff; }
        .btn-danger:hover { background-color: #c53030; }

        .checkbox-label { display: flex; align-items: center; padding: 0.75rem; background-color: #2a2a4a; border-radius: 0.5rem; margin-bottom: 0.75rem; cursor: pointer; }
        .checkbox-label input[type="checkbox"] { accent-color: #4a90e2; margin-right: 0.75rem; width: 1.25rem; height: 1.25rem; }
        .style-option { background-color: #2a2a4a; border-radius: 0.5rem; padding: 0.5rem; text-align: center; cursor: pointer; transition: background-color 0.3s ease, transform 0.2s ease, border-color 0.3s ease; border: 2px solid transparent; }
        .style-option.selected { border-color: #4a90e2; background-color: #3a3a5a; transform: scale(1.05); }
        .style-option img { width: 100%; height: 80px; object-fit: cover; border-radius: 0.25rem; margin-bottom: 0.5rem; background-color: #333; }
        @media (min-width: 640px) {
            .style-option img { height: 100px; }
        }
        @media (min-width: 768px) {
            .style-option img { height: 120px; }
        }

        .hidden { display: none !important; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4a90e2; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 2rem auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .result-image-container {
            position: relative; border: 2px dashed #4a4a6a; border-radius: 0.5rem;
            padding: 1rem; margin-bottom: 1rem;
            min-height: 200px;
            display: flex; align-items: center; justify-content: center; background-color: #2a2a4a;
        }
        .result-image-container img {
            max-width: 100%;
            max-height: 250px;
            border-radius: 0.25rem; object-fit: contain;
        }
        @media (min-width: 768px) {
            .result-image-container { min-height: 300px; }
            .result-image-container img { max-height: 350px; }
            #imagePreviewContainer img { max-height: 300px !important; }
        }

        .image-placeholder-text { color: #777790; text-align: center; }

        #screen4, #screen5 {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 70px);
            position: relative;
        }
         @media (min-width: 768px) {
            #screen4, #screen5 { height: calc(100vh - 86px);  }
        }

        #threejs-canvas-container, #plan-canvas-container {
            flex-grow: 1;
            position: relative;
            background-color: #101020;
            border-radius: 0.5rem;
            overflow: hidden;
            touch-action: none;
        }
        #threejs-canvas, #plan-canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
        #plan-canvas-container {
            background-color: #f0f0f0;
        }

        .editor-controls-toolbar {
            padding: 0.5rem 0;
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        }
        .editor-controls-toolbar .btn {
            padding: 0.5rem;
            min-width: 40px;
            height: 40px;
        }
         .editor-controls-toolbar .btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        .view-mode-btn-group .btn {
            padding: 0.35rem 0.6rem;
        }

        .selected-object-controls {
            position: absolute;
            top: 50%;
            right: 0.5rem;
            transform: translateY(-50%);
            padding: 0.5rem;
            background-color: rgba(36, 36, 62, 0.9);
            border-radius: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 10;
        }
         .selected-object-controls.hidden {
            display: none !important;
        }
        .selected-object-controls .btn {
            padding: 0.5rem;
            min-width: 40px;
            height: 40px;
            width: 40px;
        }
        .selected-object-controls .btn svg {
             width: 24px;
             height: 24px;
             fill: currentColor;
        }

        #wallPropertiesPanel { /* Specific styles for wall properties */
            align-items: stretch; /* Make inputs full width */
        }
        #wallPropertiesPanel input {
            background-color: #3a3a5a; /* Darker input background */
            border: 1px solid #4a4a6a;
            color: #e0e0e0; /* Text color for inputs */
            padding: 0.25rem 0.5rem; /* Padding for inputs */
            box-sizing: border-box; /* Include padding and border in the element's total width and height */
        }


        .instructions {
            font-size: 0.75rem;
            text-align: center;
            color: #9090a0;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 1;
        }

        /* Стили для экрана сметы (screen5) */
        #screen5 .content-wrapper {
            flex-grow: 1;
            overflow-y: auto;
            padding-bottom: 1rem;
        }
        .estimate-item {
            background-color: #2a2a4a;
            border-radius: 0.5rem;
            padding: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        .estimate-item-checkbox {
            accent-color: #4a90e2;
            width: 1.25rem;
            height: 1.25rem;
            flex-shrink: 0;
        }
        .estimate-item-image {
            width: 60px;
            height: 60px;
            object-fit: contain;
            background-color: #333;
            border-radius: 0.25rem;
            flex-shrink: 0;
        }
        .estimate-item-details {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
        }
        .estimate-item-name {
            font-weight: 600;
            color: #ffffff;
            font-size: 0.875rem;
        }
        .estimate-item-sku, .estimate-item-price {
            font-size: 0.75rem;
            color: #a0aec0;
        }
        .estimate-item-price {
            font-weight: 500;
            color: #e0e0e0;
        }
        .estimate-item-actions button {
            background: none;
            border: none;
            color: #a0aec0;
            cursor: pointer;
            padding: 0.25rem;
        }
        .estimate-item-actions button:hover {
            color: #ffffff;
        }
        .estimate-summary {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #3a3a5a;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }
        .summary-row.total {
            font-weight: 700;
            font-size: 1rem;
            color: #ffffff;
            margin-top: 0.75rem;
        }
    </style>
</head>
<body>
    <div class="app-container-base w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
        <header class="header md:py-6">
            <h1 class="md:text-2xl">Совушка ROOM</h1>
        </header>
        <main class="content md:p-8">
            <div id="screen1">
                <h2 class="text-2xl md:text-3xl font-semibold mb-2 text-center text-white">Обновление интерьера</h2>
                <p class="text-sm md:text-base text-center mb-6 text-gray-400">детской за 30 секунд</p>
                <div class="bg-gray-700 p-4 md:p-6 rounded-lg mb-6 md:max-w-lg md:mx-auto">
                    <p class="text-sm md:text-base mb-3 text-gray-300">Загрузите фото комнаты...</p>
                    <p class="text-sm md:text-base font-semibold mb-1 text-gray-200">Если вы хотите:</p>
                    <label class="checkbox-label text-sm md:text-base"><input type="checkbox" id="goal_repair">Сделать ремонт</label>
                    <label class="checkbox-label text-sm md:text-base"><input type="checkbox" id="goal_setup_room">Обустроить первую детскую</label>
                    <label class="checkbox-label text-sm md:text-base"><input type="checkbox" id="goal_find_furniture">Подобрать мебель</label>
                </div>
                <button id="nextToScreen2" class="btn btn-primary btn-block text-base md:text-lg md:py-3">Далее</button>
            </div>

            <div id="screen2" class="hidden">
                <h3 class="text-xl md:text-2xl font-semibold mb-3 text-white">Ваша комната</h3>
                <div id="imagePreviewContainer" class="result-image-container mb-3">
                    <span class="image-placeholder-text md:text-lg">Предпросмотр фото</span>
                </div>
                <input type="file" id="photoUpload" class="hidden" accept="image/*">
                <button id="uploadButton" class="btn btn-secondary btn-block mb-4 text-base md:text-lg md:py-3">Загрузить фото</button>

                <h3 class="text-xl md:text-2xl font-semibold mb-4 text-white">Выберите стиль</h3>
                                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    <div class="style-option" data-style="minimalism">
                        <img src="https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Минимализм">
                        <p class="text-sm md:text-base">Минимализм</p>
                    </div>
                    <div class="style-option" data-style="loft">
                        <img src="https://images.pexels.com/photos/6434635/pexels-photo-6434635.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Лофт">
                        <p class="text-sm md:text-base">Лофт</p>
                    </div>
                    <div class="style-option" data-style="classic">
                         <img src="https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Классика">
                         <p class="text-sm md:text-base">Классика</p>
                    </div>
                    <div class="style-option" data-style="neoclassic">
                        <img src="https://images.pexels.com/photos/6782470/pexels-photo-6782470.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Неоклассика">
                        <p class="text-sm md:text-base">Неоклассика</p>
                    </div>
                    <div class="style-option" data-style="scandinavian">
                         <img src="https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Скандинавский">
                         <p class="text-sm md:text-base">Сканди</p>
                    </div>
                    <div class="style-option" data-style="other">
                        <img src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Другое">
                        <p class="text-sm md:text-base">Другое</p>
                    </div>
                </div>
                <button id="showResultButton" class="btn btn-primary btn-block text-base md:text-lg md:py-3">Показать результат</button>
                <button id="backToScreen1From2" class="btn btn-secondary btn-block mt-3 text-base md:text-lg md:py-3">Назад</button>
            </div>

            <div id="screen3" class="hidden">
                <h2 class="text-2xl md:text-3xl font-semibold mb-4 text-center text-white">Результат <span class="text-yellow-400 text-xl md:text-2xl">✨</span></h2>
                <div id="loadingIndicator" class="loader hidden"></div>
                <div id="resultContent">
                    <p class="text-center text-gray-400 mb-4 text-base md:text-lg">Ваш обновленный интерьер в стиле <strong id="selectedStyleText" class="text-white"></strong>:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div><h4 class="text-lg md:text-xl font-medium mb-2 text-gray-300">До:</h4><div id="originalImageResult" class="result-image-container"><span class="image-placeholder-text md:text-lg">Фото не загружено</span></div></div>
                        <div><h4 class="text-lg md:text-xl font-medium mb-2 text-gray-300">После:</h4><div class="result-image-container"><img id="generatedImage" src="https://placehold.co/300x200/777790/FFFFFF?text=Выберите+стиль" alt="Сгенерированный дизайн"></div></div>
                    </div>
                </div>
                <button id="openEditorButton" class="btn btn-secondary btn-block mt-4 md:mt-6 text-base md:text-lg md:py-3">Редактор</button>
                <button id="startOverButton" class="btn btn-primary btn-block mt-3 text-base md:text-lg md:py-3">Начать заново</button>
            </div>

            <div id="screen4" class="hidden">
                <h2 id="editorTitle" class="text-xl md:text-2xl font-semibold text-white text-center">3D Редактор Комнаты</h2>
                <div class="editor-controls-toolbar md:gap-2">
                    <div class="view-mode-btn-group flex gap-1 md:gap-2">
                        <button id="viewMode3D" class="btn btn-secondary md:min-w-[48px] md:h-[48px]" title="3D Вид">3D</button>
                        <button id="viewModePseudo3D" class="btn btn-secondary md:min-w-[48px] md:h-[48px]" title="2D Вид сверху (псевдо-3D)">2D</button>
                        <button id="viewModePlan" class="btn btn-secondary md:min-w-[48px] md:h-[48px]" title="2D Чертёж">План</button>
                    </div>
                    <div class="w-px h-8 bg-gray-600 mx-1 hidden sm:block"></div>
                    <button id="addTableButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Добавить стол">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path d="M4 7H20V9H4V7M4 10H20V12H4V10M4 13H20V15H4V13M5 17H7V20H5V17M9 17H11V20H9V17M13 17H15V20H13V17M17 17H19V20H17V17Z"></path></svg>
                    </button>
                    <button id="addSofaButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Добавить диван">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path d="M20,9H4C2.9,9 2,9.9 2,11V15C2,16.11 2.9,17 4,17H5V20H7V17H17V20H19V17H20C21.1,17 22,16.11 22,15V11C22,9.9 21.1,9 20,9M20,15H4V11H20V15M5,12V14H7V12H5M17,12V14H19V12H17Z"></path></svg>
                    </button>
                    <button id="addLampButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Добавить лампу">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path d="M12,2C10.34,2 9,3.34 9,5V10H6L12,18L18,10H15V5C15,3.34 13.66,2 12,2M12,20A2,2 0 0,0 14,22H10A2,2 0 0,0 12,20Z"></path></svg>
                    </button>
                    <button id="addWallButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Добавить стену">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path fill="currentColor" d="M22,11V3H13V5H11V3H2V11H4V21H6V11H8V21H10V11H12V21H14V11H16V21H18V11H20V21H22V11Z M11,11H4V5H11V11Z M20,9H13V7H20V9Z"></path></svg>
                    </button>
                     <div class="w-px h-8 bg-gray-600 mx-1 hidden sm:block"></div>
                    <button id="openEstimateButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Смета">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path fill="currentColor" d="M9,7V10H11V7H9M13,7V10H15V7H13M9,12V15H11V12H9M13,12V15H15V12H13M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3M5,5V19H19V5H5Z"></path></svg>
                    </button>
                </div>
                <div id="selectedObjectControls" class="selected-object-controls hidden md:gap-2">
                     <button id="rotateLeftButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Повернуть влево">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path d="M14.22,2.22L12.78,3.67L15.1,6H10C6.69,6 4,8.69 4,12C4,15.31 6.69,18 10,18H15V20H10C5.58,20 2,16.42 2,12C2,7.58 5.58,4 10,4H15.1L12.78,1.33L14.22,2.22M20,12V14H18V12H20M20,8V10H18V8H20M20,16V18H18V16H20Z" transform="scale(-1,1) translate(-24,0)"></path></svg>
                    </button>
                    <button id="rotateRightButton" class="btn btn-secondary md:min-w-[48px] md:h-[48px] md:p-2.5" title="Повернуть вправо">
                         <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path d="M14.22,2.22L12.78,3.67L15.1,6H10C6.69,6 4,8.69 4,12C4,15.31 6.69,18 10,18H15V20H10C5.58,20 2,16.42 2,12C2,7.58 5.58,4 10,4H15.1L12.78,1.33L14.22,2.22M20,12V14H18V12H20M20,8V10H18V8H20M20,16V18H18V16H20Z"></path></svg>
                    </button>
                    <button id="deleteButton" class="btn btn-danger md:min-w-[48px] md:h-[48px] md:p-2.5" title="Удалить">
                        <svg class="md:w-7 md:h-7" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></svg>
                    </button>
                </div>
                <div id="wallPropertiesPanel" class="selected-object-controls hidden md:gap-2" style="flex-direction: column;">
                    <h4 class="text-xs text-center text-gray-300 mb-1">Свойства стены</h4>
                    <label class="text-xs text-gray-400">Толщина (м):</label>
                    <input type="number" id="wallThicknessInput" step="0.01" class="bg-gray-700 text-white text-sm rounded p-1 w-full mb-1">
                    <label class="text-xs text-gray-400">Высота (м):</label>
                    <input type="number" id="wallHeightInput" step="0.1" class="bg-gray-700 text-white text-sm rounded p-1 w-full mb-2">
                    <button id="deleteWallButton" class="btn btn-danger btn-block md:min-w-[auto] md:h-[auto] md:p-1.5 text-xs" title="Удалить стену">
                        Удалить стену
                    </button>
                </div>

                <div id="threejs-canvas-container">
                    <canvas id="threejs-canvas"></canvas>
                </div>
                <div id="plan-canvas-container" class="hidden">
                    <canvas id="plan-canvas"></canvas>
                </div>

                <p class="instructions md:text-sm">Клик/тап для выбора. Перетаскивание для перемещения. Колесико/жест для зума (в 2D Плане).</p>
                <button id="backToResultsButton" class="btn btn-primary btn-block mt-3 text-base md:text-lg md:py-3">Назад к результатам</button>
            </div>

            <div id="screen5" class="hidden">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl md:text-2xl font-semibold text-white">Смета помещения</h2>
                    <button id="closeEstimateButton" class="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="content-wrapper">
                    <div class="flex justify-between items-center mb-3 text-sm">
                        <div id="estimateItemCountHeader">0 товаров</div>
                        <button id="removeAllEstimateItems" class="text-red-400 hover:text-red-300 flex items-center gap-1">
                            Удалить всё
                            <svg class="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></svg>
                        </button>
                    </div>
                    <label class="checkbox-label mb-3 text-sm">
                        <input type="checkbox" id="selectAllEstimateItems" class="estimate-item-checkbox">
                        Выбрать всё
                    </label>

                    <div id="estimateItemsContainer" class="mb-6">
                        {/* Сюда будут добавляться элементы сметы */}
                    </div>

                    <div class="estimate-summary">
                        <h3 class="text-lg font-semibold mb-3 text-white">Ваш заказ:</h3>
                        <div class="summary-row">
                            <span>Количество товаров</span>
                            <span id="summaryQuantity">0 шт.</span>
                        </div>
                        <div class="summary-row">
                            <span>Товары на сумму</span>
                            <span id="summarySubtotal">0 ₽</span>
                        </div>
                        <div class="summary-row total">
                            <span>Итого:</span>
                            <span id="summaryTotal">0 ₽</span>
                        </div>
                    </div>
                </div>
                <div class="mt-auto pt-4">
                    <button id="checkoutButton" class="btn btn-primary btn-block text-base md:text-lg md:py-3 bg-green-500 hover:bg-green-600">Оформить заказ</button>
                    <button id="checkoutCreditButton" class="btn btn-secondary btn-block mt-3 text-base md:text-lg md:py-3">Оформить заказ в кредит</button>
                </div>
            </div>

        </main>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

**`js/config.js`:**

```javascript
// js/config.js
export const SNAP_DISTANCE = 0.5;
export const VERTEX_HIT_RADIUS = 8; // Pixel radius for vertex hit
export const WALL_HIT_TOLERANCE = 5; // Pixel tolerance for wall hit
export const DEFAULT_WALL_THICKNESS = 0.2; // meters
export const DEFAULT_WALL_HEIGHT = 2.5; // meters
export const DEFAULT_FLOOR_SIZE = 20; // meters (for the plane geometry)
export const FURNITURE_PLACEMENT_LIMIT = DEFAULT_FLOOR_SIZE / 2 - 0.5; // To keep furniture within bounds

export const COLORS = {
    WALL_DEFAULT: 0xa0a0a0,
    FLOOR_DEFAULT: 0x777777,
    FURNITURE_SELECTED_EMISSIVE: 0x888800,
    PLAN_WALL_DEFAULT: "#555",
    PLAN_WALL_SELECTED: "#4a90e2",
    PLAN_FURNITURE_DEFAULT_FILL: "#e0e0e0",
    PLAN_FURNITURE_DEFAULT_STROKE: "#333",
    PLAN_FURNITURE_SELECTED_STROKE: "#00ced1",
    PLAN_VERTEX_DEFAULT: '#4a90e2',
    PLAN_VERTEX_SELECTED: '#ff00ff',
    PLAN_VERTEX_STROKE: '#ffffff',
    PLAN_NEW_WALL_TEMP_LINE: 'rgba(74, 144, 226, 0.7)',
};

export const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x200/777790/FFFFFF?text=Выберите+стиль';
```

---

**`js/utils.js`:**

```javascript
// js/utils.js
export function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

export function pointsAreEqual(p1, p2, tolerance = 0.001) {
    if (!p1 || !p2) return false;
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.z - p2.z) < tolerance;
}

// Helper to get pointer position for both mouse and touch events
export function getPointerXY(event) {
    let x, y;
    if (event.changedTouches && event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX;
        y = event.changedTouches[0].clientY;
    } else if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    return { x, y };
}
```

---

**`js/editorState.js`:**

```javascript
// js/editorState.js
// Note: THREE will be available globally from the script tag in index.html

export const state = {
    scene: null, camera: null, renderer: null, controls: null,
    roomFloor: null, furniture: [], walls: [],
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
    selectedVertexInfo: null, // { wallId: '...', type: 'start'/'end', initialPosAtDragStart: {x,z}, vertexRef: {x,z} }
    isDraggingVertex: false,
    wallCounter: 0,

    isAddingWallMode: false,
    newWallStartPoint: null, // {x,z} in world coordinates for adding new wall
    currentMouseWorldPos2D: null, // {x,z} for drawing temp new wall line

    isDraggingWall: false,
    dragOffsetWall: { x: 0, z: 0 }, // For dragging whole wall
    originalWallDragPoints: { start: null, end: null }, // For dragging whole wall

    // Default camera and controls settings
    defaultCameraPos: new THREE.Vector3(0, 7, 12),
    defaultCameraLookAt: new THREE.Vector3(0, 0, 0),
    defaultControlsTarget: new THREE.Vector3(0,0,0),
    defaultOrbitControls: { minDistance: 3, maxDistance: 40, maxPolarAngle: Math.PI / 2 - 0.05, minPolarAngle: 0, enableRotate: true, enablePan: true, enableZoom: true },
    pseudo3DCameraPos: new THREE.Vector3(0, 20, 0.01), // Slightly off Z to avoid issues
    pseudo3DControls: { enableRotate: false, minPolarAngle: 0, maxPolarAngle: Math.PI * 0.01, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, enablePan: true, enableZoom: true }
};

export let lastTouchDistance = null;
export function setLastTouchDistance(val) { lastTouchDistance = val; }
export function getLastTouchDistance() { return lastTouchDistance; }
```

---

**`js/ui.js`:**

```javascript
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
    wallPropertiesPanel: document.getElementById('wallPropertiesPanel'),
    wallThicknessInput: document.getElementById('wallThicknessInput'),
    wallHeightInput: document.getElementById('wallHeightInput'),

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


export function showSelectedObjectControls() { dom.selectedObjectControls.classList.remove('hidden'); dom.wallPropertiesPanel.classList.add('hidden');}
export function hideSelectedObjectControls() { dom.selectedObjectControls.classList.add('hidden');}
export function showWallPropertiesPanel(wall) {
    dom.wallPropertiesPanel.classList.remove('hidden');
    dom.selectedObjectControls.classList.add('hidden');
    dom.wallThicknessInput.value = wall.thickness;
    dom.wallHeightInput.value = wall.height;
}
export function hideWallPropertiesPanel() { dom.wallPropertiesPanel.classList.add('hidden');}


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
```

---

**`js/editorCore.js`:**

```javascript
// js/editorCore.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import { on3DPointerDown, on3DPointerMove, on3DPointerUp } from './editorInteraction3D.js';
import { on2DPlanPointerDown, on2DPlanPointerMove, on2DPlanPointerUp, on2DPlanWheel, on2DPlanTouchStart, on2DPlanTouchMove, on2DPlanTouchEnd, render2DPlan } from './editorInteraction2D.js';
import { getDomElements } from './ui.js';

const dom = getDomElements();

export function ensureInitialized() {
    if (!editorState.isInitialized) {
        initThreeJSCore();
        init2DPlanCanvas();
        editorState.isInitialized = true;
    }
}

function initThreeJSCore() {
    const canvas = document.getElementById('threejs-canvas');
    if (!dom.threeJSContainer || !canvas) {
        console.error("Three.js container or canvas not found!");
        return;
    }

    editorState.scene = new THREE.Scene();
    editorState.scene.background = new THREE.Color(0x24243e); // Dark blueish grey

    editorState.camera = new THREE.PerspectiveCamera(60, dom.threeJSContainer.clientWidth / dom.threeJSContainer.clientHeight, 0.1, 1000);
    editorState.camera.position.copy(editorState.defaultCameraPos);
    editorState.camera.lookAt(editorState.defaultCameraLookAt);

    editorState.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    editorState.renderer.setSize(dom.threeJSContainer.clientWidth, dom.threeJSContainer.clientHeight);
    editorState.renderer.setPixelRatio(window.devicePixelRatio);
    editorState.renderer.shadowMap.enabled = true;
    // editorState.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    editorState.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(8, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    editorState.scene.add(directionalLight);

    // Controls
    editorState.controls = new THREE.OrbitControls(editorState.camera, editorState.renderer.domElement);
    Object.assign(editorState.controls, editorState.defaultOrbitControls);
    editorState.controls.target.copy(editorState.defaultControlsTarget);
    editorState.controls.enableDamping = true;
    editorState.controls.dampingFactor = 0.1;


    // Floor
    const floorGeometry = new THREE.PlaneGeometry(Config.DEFAULT_FLOOR_SIZE, Config.DEFAULT_FLOOR_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: Config.COLORS.FLOOR_DEFAULT, side: THREE.DoubleSide });
    editorState.roomFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    editorState.roomFloor.rotation.x = -Math.PI / 2;
    editorState.roomFloor.receiveShadow = true;
    editorState.roomFloor.name = "floor";
    editorState.scene.add(editorState.roomFloor);

    // Raycaster and Pointer
    editorState.raycaster = new THREE.Raycaster();
    editorState.pointer = new THREE.Vector2();
    editorState.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y-up plane at y=0

    // Event Listeners for 3D view
    dom.threeJSContainer.addEventListener('pointerdown', on3DPointerDown);
    dom.threeJSContainer.addEventListener('pointermove', on3DPointerMove);
    dom.threeJSContainer.addEventListener('pointerup', on3DPointerUp); // Also handles pointercancel, pointerout
    dom.threeJSContainer.addEventListener('pointerleave', on3DPointerUp); // Explicitly handle leave for safety

    window.addEventListener('resize', handleResize);
}

function init2DPlanCanvas() {
    editorState.planCanvas = document.getElementById('plan-canvas');
    if (!dom.planCanvasContainer || !editorState.planCanvas) {
        console.error("2D Plan container or canvas not found!");
        return;
    }
    editorState.planContext = editorState.planCanvas.getContext('2d');
    resize2DPlanCanvas(); // Set initial size and origin

    // Event Listeners for 2D Plan view
    editorState.planCanvas.addEventListener('pointerdown', on2DPlanPointerDown);
    editorState.planCanvas.addEventListener('pointermove', on2DPlanPointerMove);
    editorState.planCanvas.addEventListener('pointerup', on2DPlanPointerUp);
    editorState.planCanvas.addEventListener('pointerleave', on2DPlanPointerUp); // To stop dragging if mouse leaves
    editorState.planCanvas.addEventListener('wheel', on2DPlanWheel, { passive: false });

    // Touch events for 2D Plan (Panning and Pinch-Zoom)
    editorState.planCanvas.addEventListener('touchstart', on2DPlanTouchStart, { passive: false });
    editorState.planCanvas.addEventListener('touchmove', on2DPlanTouchMove, { passive: false });
    editorState.planCanvas.addEventListener('touchend', on2DPlanTouchEnd);
    editorState.planCanvas.addEventListener('touchcancel', on2DPlanTouchEnd);


    // Prevent context menu on right-click in plan view
    editorState.planCanvas.addEventListener('contextmenu', (event) => {
        if (editorState.activeViewMode === 'plan') {
            event.preventDefault();
        }
    });
}

export function resize2DPlanCanvas() {
    if (!editorState.planCanvas || !dom.planCanvasContainer.clientWidth || !dom.planCanvasContainer.clientHeight) return;
    // Prevent resizing to 0x0 if container is hidden then shown
    if (dom.planCanvasContainer.clientWidth === 0 || dom.planCanvasContainer.clientHeight === 0) {
        // Defer resize if container not yet laid out
        requestAnimationFrame(resize2DPlanCanvas);
        return;
    }

    editorState.planCanvas.width = dom.planCanvasContainer.clientWidth;
    editorState.planCanvas.height = dom.planCanvasContainer.clientHeight;

    // Re-center origin if it was default or if canvas was 0x0
    if (!editorState.planOrigin.x || !editorState.planOrigin.y || editorState.planOrigin.x === Infinity || editorState.planOrigin.y === Infinity) {
        editorState.planOrigin = {
            x: editorState.planCanvas.width / 2,
            y: editorState.planCanvas.height / 2
        };
    }


    if (editorState.activeViewMode === 'plan') {
        render2DPlan();
    }
}


export function handleResize() {
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
        if (editorState.controls) editorState.controls.update(); // For damping
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
```

---

**`js/editorControls.js`:**

```javascript
// js/editorControls.js
import { state as editorState } from './editorState.js';
import { ensureInitialized, startAnimationLoop, stopAnimationLoop, handleResize, resize2DPlanCanvas } from './editorCore.js';
import { render2DPlan } from './editorInteraction2D.js';
import { updateEditorTitle, showThreeJSContainer, showPlanCanvasContainer, updateViewModeButtons } from './ui.js';
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
    const dom = getDomElements();
    dom.viewMode3DButton.addEventListener('click', () => switchTo3DView());
    dom.viewModePseudo3DButton.addEventListener('click', () => switchToPseudo3DView());
    dom.viewModePlanButton.addEventListener('click', () => switchToPlanView());
}
```
*Обратите внимание: `createOrUpdate3DWalls` было переименовано в `createOrUpdateAll3DWalls` в `editorObjects.js` (будет показано ниже), чтобы избежать путаницы с функцией, которая может обновлять одну стену.*

---

**`js/editorInteraction3D.js`:**

```javascript
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
        // Traverse up to find the group parent which has itemData
        while (clickedObject.parent && clickedObject.parent !== editorState.scene && !clickedObject.userData.itemData) {
            clickedObject = clickedObject.parent;
        }

        if (clickedObject.userData.itemData) { // Check if it's a furniture group
            if (editorState.selectedObject !== clickedObject) {
                deselectEverything();
                selectObject(clickedObject);
            }
            editorState.isDragging3D = true;
            if (editorState.controls) editorState.controls.enabled = false;

            // Update dragPlane to be at the Y level of the clicked object's base (assuming y=0 is base)
            // or keep it at y=0 if object is slightly above/below due to minor errors
            const intersectionPointWorld = intersectsFurniture[0].point;
            editorState.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), intersectionPointWorld);

        } else {
            deselectEverything();
        }
    } else {
        // Check for floor intersection to deselect
        const intersectsFloor = editorState.raycaster.intersectObject(editorState.roomFloor);
        if (intersectsFloor.length > 0) {
            deselectEverything();
        }
    }
}

export function on3DPointerMove(event) {
    if (editorState.activeViewMode === 'plan' || !editorState.isDragging3D || !editorState.selectedObject) return;

    const pos = get3DPointerPosition(event);
    editorState.pointer.set(pos.x, pos.y);
    editorState.raycaster.setFromCamera(editorState.pointer, editorState.camera);

    const intersectionPoint = new THREE.Vector3();
    if (editorState.raycaster.ray.intersectPlane(editorState.dragPlane, intersectionPoint)) {
        const limit = Config.FURNITURE_PLACEMENT_LIMIT;
        editorState.selectedObject.position.x = Math.max(-limit, Math.min(limit, intersectionPoint.x));
        editorState.selectedObject.position.z = Math.max(-limit, Math.min(limit, intersectionPoint.z));
        // Keep y at 0 or object's original base y if needed:
        // editorState.selectedObject.position.y = editorState.selectedObject.userData.baseY || 0;
    }
}

export function on3DPointerUp(event) {
    if (editorState.activeViewMode === 'plan') return;
    editorState.isDragging3D = false;
    if (editorState.controls) editorState.controls.enabled = true;
}
```

---

**`js/editorInteraction2D.js`:**

```javascript
// js/editorInteraction2D.js
import { state as editorState, setLastTouchDistance, getLastTouchDistance } from './editorState.js';
import * as Config from './config.js';
import { getDomElements } from './ui.js';
import { selectObject, deselectEverything, selectWall, selectVertex } from './editorSelection.js';
import { createOrUpdateAll3DWalls } from './editorObjects.js';
import { getPointerXY, pointsAreEqual } from './utils.js';

const dom = getDomElements();

function get2DPlanPointerWorldPosition(event) {
    const canvas = editorState.planCanvas;
    const rect = canvas.getBoundingClientRect();
    const pointer = getPointerXY(event);

    const canvasX = pointer.x - rect.left;
    const canvasY = pointer.y - rect.top;

    const worldX = (canvasX - editorState.planOrigin.x) / editorState.planScale;
    const worldZ = (canvasY - editorState.planOrigin.y) / editorState.planScale;
    return { x: worldX, z: worldZ, canvasX, canvasY };
}


export function render2DPlan() {
    if (!editorState.planContext || !editorState.planCanvas || !editorState.planCanvas.width || !editorState.planCanvas.height) return;
    const ctx = editorState.planContext;
    const canvas = editorState.planCanvas;
    const scale = editorState.planScale;
    const origin = editorState.planOrigin;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.lineCap = "round";

    // Draw Walls
    editorState.walls.forEach(wall => {
        const startX = wall.start.x * scale;
        const startY = wall.start.z * scale;
        const endX = wall.end.x * scale;
        const endY = wall.end.z * scale;

        ctx.strokeStyle = (editorState.selectedWallId === wall.id || (editorState.selectedVertexInfo && editorState.selectedVertexInfo.wallId === wall.id))
            ? Config.COLORS.PLAN_WALL_SELECTED
            : Config.COLORS.PLAN_WALL_DEFAULT;
        ctx.lineWidth = Math.max(2, wall.thickness * scale);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });

    // Draw Furniture
    editorState.furniture.forEach(item => {
        const itemPlanDim = item.userData.planDimensions;
        if (!itemPlanDim) return;

        const x = item.position.x * scale;
        const z = item.position.z * scale;
        const rotation = item.rotation.y; // Assuming Y is up

        ctx.save();
        ctx.translate(x, z);
        ctx.rotate(rotation);

        ctx.fillStyle = Config.COLORS.PLAN_FURNITURE_DEFAULT_FILL;
        ctx.strokeStyle = (item === editorState.selectedObject)
            ? Config.COLORS.PLAN_FURNITURE_SELECTED_STROKE
            : Config.COLORS.PLAN_FURNITURE_DEFAULT_STROKE;
        ctx.lineWidth = (item === editorState.selectedObject) ? 2 : 1;

        if (itemPlanDim.shape === 'rect') {
            const w = itemPlanDim.width * scale;
            const d = itemPlanDim.depth * scale;
            ctx.fillRect(-w / 2, -d / 2, w, d);
            ctx.strokeRect(-w / 2, -d / 2, w, d);
        } else if (itemPlanDim.shape === 'circle') {
            const r = itemPlanDim.radius * scale;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    });

    // Draw temporary new wall line
    if (editorState.isAddingWallMode && editorState.newWallStartPoint && editorState.currentMouseWorldPos2D) {
        ctx.beginPath();
        ctx.moveTo(editorState.newWallStartPoint.x * scale, editorState.newWallStartPoint.z * scale);

        let tempEndX = editorState.currentMouseWorldPos2D.x;
        let tempEndZ = editorState.currentMouseWorldPos2D.z;
        let snapped = false;

        // Snap to existing vertices
        for (const wall of editorState.walls) {
            if (Math.hypot(tempEndX - wall.start.x, tempEndZ - wall.start.z) < Config.SNAP_DISTANCE) {
                tempEndX = wall.start.x; tempEndZ = wall.start.z; snapped = true; break;
            }
            if (Math.hypot(tempEndX - wall.end.x, tempEndZ - wall.end.z) < Config.SNAP_DISTANCE) {
                tempEndX = wall.end.x; tempEndZ = wall.end.z; snapped = true; break;
            }
        }
        // Snap to horizontal/vertical from start point
        if (!snapped) {
            if (Math.abs(tempEndX - editorState.newWallStartPoint.x) < Config.SNAP_DISTANCE) {
                tempEndX = editorState.newWallStartPoint.x;
            }
            if (Math.abs(tempEndZ - editorState.newWallStartPoint.z) < Config.SNAP_DISTANCE) {
                tempEndZ = editorState.newWallStartPoint.z;
            }
        }
        ctx.lineTo(tempEndX * scale, tempEndZ * scale);
        ctx.strokeStyle = Config.COLORS.PLAN_NEW_WALL_TEMP_LINE;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore(); // Restore from translate(origin.x, origin.y)
    drawVertices(ctx, scale, origin); // Draw vertices in canvas coordinates (after main restore)
}

function drawVertices(ctx, scale, origin) {
    const radiusPx = Config.VERTEX_HIT_RADIUS / 2;
    ctx.lineWidth = 1;
    editorState.walls.forEach(wall => {
        const startXCanvas = wall.start.x * scale + origin.x;
        const startYCanvas = wall.start.z * scale + origin.y;
        const endXCanvas = wall.end.x * scale + origin.x;
        const endYCanvas = wall.end.z * scale + origin.y;

        // Start Vertex
        ctx.beginPath();
        ctx.arc(startXCanvas, startYCanvas, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = (editorState.selectedVertexInfo?.wallId === wall.id && editorState.selectedVertexInfo?.type === 'start')
            ? Config.COLORS.PLAN_VERTEX_SELECTED
            : Config.COLORS.PLAN_VERTEX_DEFAULT;
        ctx.fill();
        ctx.strokeStyle = Config.COLORS.PLAN_VERTEX_STROKE;
        ctx.stroke();

        // End Vertex
        ctx.beginPath();
        ctx.arc(endXCanvas, endYCanvas, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = (editorState.selectedVertexInfo?.wallId === wall.id && editorState.selectedVertexInfo?.type === 'end')
            ? Config.COLORS.PLAN_VERTEX_SELECTED
            : Config.COLORS.PLAN_VERTEX_DEFAULT;
        ctx.fill();
        ctx.strokeStyle = Config.COLORS.PLAN_VERTEX_STROKE;
        ctx.stroke();
    });
}


function isPointNearWallSegment(px, py, wall, scale, origin, tolerance) {
    const x1 = wall.start.x * scale + origin.x;
    const y1 = wall.start.z * scale + origin.y;
    const x2 = wall.end.x * scale + origin.x;
    const y2 = wall.end.z * scale + origin.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) { // If start and end points are the same
        return Math.hypot(px - x1, py - y1) <= tolerance;
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t)); // Clamp t to the segment

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const distSq = (px - closestX) * (px - closestX) + (py - closestY) * (py - closestY);

    return distSq <= tolerance * tolerance;
}


export function on2DPlanPointerDown(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const pos = get2DPlanPointerWorldPosition(event);
    let hitDetected = false;

    // Reset drag flags
    editorState.isDragging2D = false;
    editorState.isDraggingVertex = false;
    editorState.isDraggingWall = false;
    editorState.isPanning2D = false;


    if (editorState.isAddingWallMode && (event.button === 0 || event.touches)) {
        let startX = pos.x; let startZ = pos.z; let snapped = false;
        // Snap first point of new wall
        for (const wall of editorState.walls) {
            if (Math.hypot(startX - wall.start.x, startZ - wall.start.z) < Config.SNAP_DISTANCE) {
                startX = wall.start.x; startZ = wall.start.z; snapped = true; break;
            }
            if (Math.hypot(startX - wall.end.x, startZ - wall.end.z) < Config.SNAP_DISTANCE) {
                startX = wall.end.x; startZ = wall.end.z; snapped = true; break;
            }
        }
        editorState.newWallStartPoint = { x: startX, z: startZ };
        editorState.currentMouseWorldPos2D = { x: startX, z: startZ }; // Initialize for immediate feedback
        hitDetected = true; // Prevents other interactions
        render2DPlan();
        return; // Exit early as we are in add wall mode
    }


    // 1. Check Furniture
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (let i = editorState.furniture.length - 1; i >= 0; i--) {
            const item = editorState.furniture[i];
            const itemPlanDim = item.userData.planDimensions;
            if (!itemPlanDim) continue;

            // Transform pointer to item's local space
            const dxWorld = pos.x - item.position.x;
            const dzWorld = pos.z - item.position.z;
            const rotation = -item.rotation.y; // Inverse rotation
            const localX = dxWorld * Math.cos(rotation) - dzWorld * Math.sin(rotation);
            const localZ = dxWorld * Math.sin(rotation) + dzWorld * Math.cos(rotation);

            if (itemPlanDim.shape === 'rect') {
                if (Math.abs(localX) <= itemPlanDim.width / 2 && Math.abs(localZ) <= itemPlanDim.depth / 2) {
                    if (editorState.selectedObject !== item) { deselectEverything(); selectObject(item); }
                    editorState.isDragging2D = true;
                    editorState.dragOffset2D = { x: item.position.x - pos.x, z: item.position.z - pos.z };
                    hitDetected = true; break;
                }
            } else if (itemPlanDim.shape === 'circle') {
                if (localX * localX + localZ * localZ <= itemPlanDim.radius * itemPlanDim.radius) {
                    if (editorState.selectedObject !== item) { deselectEverything(); selectObject(item); }
                    editorState.isDragging2D = true;
                    editorState.dragOffset2D = { x: item.position.x - pos.x, z: item.position.z - pos.z };
                    hitDetected = true; break;
                }
            }
        }
    }

    // 2. Check Vertices
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (const wall of editorState.walls) {
            const startXCanvas = wall.start.x * editorState.planScale + editorState.planOrigin.x;
            const startYCanvas = wall.start.z * editorState.planScale + editorState.planOrigin.y;
            const endXCanvas = wall.end.x * editorState.planScale + editorState.planOrigin.x;
            const endYCanvas = wall.end.z * editorState.planScale + editorState.planOrigin.y;

            if (Math.hypot(pos.canvasX - startXCanvas, pos.canvasY - startYCanvas) <= Config.VERTEX_HIT_RADIUS) {
                deselectEverything();
                selectVertex({ wallId: wall.id, type: 'start', initialPosAtDragStart: { ...wall.start }, vertexRef: wall.start });
                editorState.isDraggingVertex = true; hitDetected = true; break;
            }
            if (Math.hypot(pos.canvasX - endXCanvas, pos.canvasY - endYCanvas) <= Config.VERTEX_HIT_RADIUS) {
                deselectEverything();
                selectVertex({ wallId: wall.id, type: 'end', initialPosAtDragStart: { ...wall.end }, vertexRef: wall.end });
                editorState.isDraggingVertex = true; hitDetected = true; break;
            }
        }
    }

    // 3. Check Walls for selection or dragging
    if (!hitDetected && (event.button === 0 || event.touches)) {
        for (const wall of editorState.walls) {
            if (isPointNearWallSegment(pos.canvasX, pos.canvasY, wall, editorState.planScale, editorState.planOrigin, Config.WALL_HIT_TOLERANCE)) {
                deselectEverything();
                selectWall(wall.id);
                editorState.isDraggingWall = true;
                const wallCenterX = (wall.start.x + wall.end.x) / 2;
                const wallCenterZ = (wall.start.z + wall.end.z) / 2;
                editorState.dragOffsetWall = { x: wallCenterX - pos.x, z: wallCenterZ - pos.z };
                editorState.originalWallDragPoints = { start: { ...wall.start }, end: { ...wall.end } }; // Store original points of the selected wall
                hitDetected = true; break;
            }
        }
    }

    // 4. Handle Pan or Deselect
    if (!hitDetected) {
        if (event.button === 0 && !event.touches) { // Left click with no hit
            deselectEverything();
        } else if (event.button === 2 || event.touches) { // Right click or touch for panning
            event.preventDefault(); // Prevent context menu on right click
            deselectEverything(); // Deselect if panning starts
            editorState.isPanning2D = true;
            const pointer = getPointerXY(event);
            editorState.panStart2D.x = pointer.x;
            editorState.panStart2D.y = pointer.y;
            editorState.planOriginStart.x = editorState.planOrigin.x;
            editorState.planOriginStart.y = editorState.planOrigin.y;
        }
    }
    render2DPlan();
}


export function on2DPlanPointerMove(event) {
    if (editorState.activeViewMode !== 'plan') return;
    const pos = get2DPlanPointerWorldPosition(event);

    if (editorState.isAddingWallMode && editorState.newWallStartPoint) {
        editorState.currentMouseWorldPos2D = { x: pos.x, z: pos.z };
        render2DPlan();
        return;
    }


    if (editorState.isDraggingVertex && editorState.selectedVertexInfo) {
        const { wallId: SVIwallId, type: SVIvertexType, initialPosAtDragStart, vertexRef } = editorState.selectedVertexInfo;
        let targetX = pos.x;
        let targetZ = pos.z;
        let snapped = false;
        const draggingWall = editorState.walls.find(w => w.id === SVIwallId);

        // Snap to other walls' vertices
        for (const wall of editorState.walls) {
            if (wall.id === SVIwallId && !snapped) { // Don't snap to self unless no other snap occurs
                 // Check snapping to other vertex of the SAME wall for horizontal/vertical alignment
                const otherVertexOfSameWall = (SVIvertexType === 'start') ? wall.end : wall.start;
                if (Math.abs(targetX - otherVertexOfSameWall.x) < Config.SNAP_DISTANCE) {
                    targetX = otherVertexOfSameWall.x; snapped = true;
                }
                if (Math.abs(targetZ - otherVertexOfSameWall.z) < Config.SNAP_DISTANCE) {
                    targetZ = otherVertexOfSameWall.z; snapped = true;
                }
                if (snapped) break; // Prioritize aligning with the same wall's axis
                continue; // Then proceed to check other walls
            }
            if (snapped) break;

            if (Math.hypot(targetX - wall.start.x, targetZ - wall.start.z) < Config.SNAP_DISTANCE) {
                targetX = wall.start.x; targetZ = wall.start.z; snapped = true;
            }
            if (snapped) break;
            if (Math.hypot(targetX - wall.end.x, targetZ - wall.end.z) < Config.SNAP_DISTANCE) {
                targetX = wall.end.x; targetZ = wall.end.z; snapped = true;
            }
        }


        const newPos = { x: targetX, z: targetZ };

        // Update the vertex being dragged
        if (vertexRef) {
            vertexRef.x = newPos.x;
            vertexRef.z = newPos.z;
        }

        // Update connected walls that shared the original vertex position
        editorState.walls.forEach(currentWall => {
            if (currentWall.id === SVIwallId) return; // Already handled by vertexRef
            if (pointsAreEqual(currentWall.start, initialPosAtDragStart)) {
                currentWall.start.x = newPos.x; currentWall.start.z = newPos.z;
            }
            if (pointsAreEqual(currentWall.end, initialPosAtDragStart)) {
                currentWall.end.x = newPos.x; currentWall.end.z = newPos.z;
            }
        });

        editorState.selectedVertexInfo.initialPosAtDragStart = { ...newPos }; // Update for next move delta
        render2DPlan();
        createOrUpdateAll3DWalls();

    } else if (editorState.isDraggingWall && editorState.selectedWallId) {
        const draggedWall = editorState.walls.find(w => w.id === editorState.selectedWallId);
        if (!draggedWall) { editorState.isDraggingWall = false; return; }

        const newWallCenterX = pos.x + editorState.dragOffsetWall.x;
        const newWallCenterZ = pos.z + editorState.dragOffsetWall.z;

        const oldWallCenterX = (editorState.originalWallDragPoints.start.x + editorState.originalWallDragPoints.end.x) / 2;
        const oldWallCenterZ = (editorState.originalWallDragPoints.start.z + editorState.originalWallDragPoints.end.z) / 2;

        const deltaX = newWallCenterX - oldWallCenterX;
        const deltaZ = newWallCenterZ - oldWallCenterZ;

        const newStartPos = { x: editorState.originalWallDragPoints.start.x + deltaX, z: editorState.originalWallDragPoints.start.z + deltaZ };
        const newEndPos = { x: editorState.originalWallDragPoints.end.x + deltaX, z: editorState.originalWallDragPoints.end.z + deltaZ };

        draggedWall.start.x = newStartPos.x;
        draggedWall.start.z = newStartPos.z;
        draggedWall.end.x = newEndPos.x;
        draggedWall.end.z = newEndPos.z;

        // Update connected walls
        editorState.walls.forEach(otherWall => {
            if (otherWall.id === draggedWall.id) return;

            if (pointsAreEqual(otherWall.start, editorState.originalWallDragPoints.start)) {
                otherWall.start.x = newStartPos.x; otherWall.start.z = newStartPos.z;
            } else if (pointsAreEqual(otherWall.start, editorState.originalWallDragPoints.end)) {
                otherWall.start.x = newEndPos.x; otherWall.start.z = newEndPos.z;
            }

            if (pointsAreEqual(otherWall.end, editorState.originalWallDragPoints.start)) {
                otherWall.end.x = newStartPos.x; otherWall.end.z = newStartPos.z;
            } else if (pointsAreEqual(otherWall.end, editorState.originalWallDragPoints.end)) {
                otherWall.end.x = newEndPos.x; otherWall.end.z = newEndPos.z;
            }
        });
        render2DPlan();
        createOrUpdateAll3DWalls();

    } else if (editorState.isDragging2D && editorState.selectedObject) {
        const limit = Config.FURNITURE_PLACEMENT_LIMIT;
        const targetX = pos.x + editorState.dragOffset2D.x;
        const targetZ = pos.z + editorState.dragOffset2D.z;
        editorState.selectedObject.position.x = Math.max(-limit, Math.min(limit, targetX));
        editorState.selectedObject.position.z = Math.max(-limit, Math.min(limit, targetZ));
        render2DPlan();
    } else if (editorState.isPanning2D) {
        const pointer = getPointerXY(event);
        const deltaX = pointer.x - editorState.panStart2D.x;
        const deltaY = pointer.y - editorState.panStart2D.y;
        editorState.planOrigin.x = editorState.planOriginStart.x + deltaX;
        editorState.planOrigin.y = editorState.planOriginStart.y + deltaY;
        render2DPlan();
    }
     // Update cursor based on hover (optional, can be complex)
}


export function on2DPlanPointerUp(event) {
    if (editorState.activeViewMode !== 'plan') return;
     const pos = get2DPlanPointerWorldPosition(event); // Get final position

    if (editorState.isAddingWallMode && editorState.newWallStartPoint && (event.button === 0 || (event.changedTouches && event.changedTouches.length > 0))) {
        let finalEndX = pos.x;
        let finalEndZ = pos.z;
        let snapped = false;

        // Snap end point of new wall
        for (const wall of editorState.walls) {
            if (Math.hypot(finalEndX - wall.start.x, finalEndZ - wall.start.z) < Config.SNAP_DISTANCE) {
                finalEndX = wall.start.x; finalEndZ = wall.start.z; snapped = true; break;
            }
            if (Math.hypot(finalEndX - wall.end.x, finalEndZ - wall.end.z) < Config.SNAP_DISTANCE) {
                finalEndX = wall.end.x; finalEndZ = wall.end.z; snapped = true; break;
            }
        }
        if (!snapped) { // Snap to horizontal/vertical from start point
            if (Math.abs(finalEndX - editorState.newWallStartPoint.x) < Config.SNAP_DISTANCE) {
                finalEndX = editorState.newWallStartPoint.x;
            }
            if (Math.abs(finalEndZ - editorState.newWallStartPoint.z) < Config.SNAP_DISTANCE) {
                finalEndZ = editorState.newWallStartPoint.z;
            }
        }

        // Add wall if it has some length
        if (Math.hypot(finalEndX - editorState.newWallStartPoint.x, finalEndZ - editorState.newWallStartPoint.z) > 0.1) { // Minimum length
            const { addWall } = await import('./editorObjects.js'); // Dynamic import to avoid circular dependency if addWall uses render2DPlan
            addWall(editorState.newWallStartPoint.x, editorState.newWallStartPoint.z, finalEndX, finalEndZ);
            createOrUpdateAll3DWalls();
        }

        editorState.newWallStartPoint = null; // Reset for next wall or to exit mode
        editorState.currentMouseWorldPos2D = null;
        // Do not turn off isAddingWallMode, allow adding multiple walls. User can click button again to turn off.
        render2DPlan();
    }


    if (event.button === 0 || (event.changedTouches && event.changedTouches.length > 0)) { // Left mouse or touch up
        if(editorState.isDraggingVertex) { editorState.isDraggingVertex = false; }
        if(editorState.isDraggingWall) { editorState.isDraggingWall = false; }
        if(editorState.isDragging2D) { editorState.isDragging2D = false; }
    } else if (event.button === 2) { // Right mouse button up
        editorState.isPanning2D = false;
    }
}


export function on2DPlanWheel(event) {
    event.preventDefault();
    if (editorState.activeViewMode !== 'plan') return;

    const zoomSensitivity = 0.001;
    const oldScale = editorState.planScale;
    let newScale = oldScale - event.deltaY * zoomSensitivity * oldScale;
    newScale = Math.max(editorState.minPlanScale, Math.min(editorState.maxPlanScale, newScale));

    if (Math.abs(newScale - oldScale) < 0.0001) return; // Avoid unnecessary redraws for tiny changes

    const rect = editorState.planCanvas.getBoundingClientRect();
    const mouseXCanvas = event.clientX - rect.left;
    const mouseYCanvas = event.clientY - rect.top;

    // World coordinates before zoom
    const worldXBefore = (mouseXCanvas - editorState.planOrigin.x) / oldScale;
    const worldZBefore = (mouseYCanvas - editorState.planOrigin.y) / oldScale;

    editorState.planScale = newScale;

    // New origin to keep mouse point stationary in world space
    editorState.planOrigin.x = mouseXCanvas - worldXBefore * editorState.planScale;
    editorState.planOrigin.y = mouseYCanvas - worldZBefore * editorState.planScale;

    render2DPlan();
}

export function on2DPlanTouchStart(event) {
    if (editorState.activeViewMode !== 'plan') return;
     if (editorState.isAddingWallMode) { // If in add wall mode, let on2DPlanPointerDown handle it
        on2DPlanPointerDown(event);
        return;
    }


    if (event.touches.length === 1) {
        // Let on2DPlanPointerDown handle single touch for selection/drag start
        on2DPlanPointerDown(event);
        // If it wasn't a drag/select, it will become a pan in on2DPlanPointerDown
        setLastTouchDistance(null);
    } else if (event.touches.length === 2) {
        event.preventDefault(); // Prevent default pinch zoom/scroll
        deselectEverything(); // Deselect if starting a pinch zoom
        editorState.isPanning2D = false; // Ensure not panning
        editorState.isDragging2D = false; // Ensure not dragging furniture
        editorState.isDraggingVertex = false; // Ensure not dragging vertex
        editorState.isDraggingWall = false; // Ensure not dragging wall


        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        setLastTouchDistance(Math.sqrt(dx * dx + dy * dy));
    }
}

export function on2DPlanTouchMove(event) {
    if (editorState.activeViewMode !== 'plan') return;
     if (editorState.isAddingWallMode && editorState.newWallStartPoint) {
        on2DPlanPointerMove(event); // Let the pointer move handle drawing temp line
        return;
    }

    if (event.touches.length === 1) {
        // Let on2DPlanPointerMove handle single touch drag/pan
        on2DPlanPointerMove(event);
    } else if (event.touches.length === 2 && getLastTouchDistance() !== null) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const zoomFactor = currentDist / getLastTouchDistance();

        const oldScale = editorState.planScale;
        let newScale = oldScale * zoomFactor;
        newScale = Math.max(editorState.minPlanScale, Math.min(editorState.maxPlanScale, newScale));

        if (Math.abs(newScale - oldScale) < 0.0001) {
            setLastTouchDistance(currentDist); // Update distance even if scale doesn't change much
            return;
        }

        const rect = editorState.planCanvas.getBoundingClientRect();
        const pinchCenterXCanvas = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const pinchCenterYCanvas = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        const worldXBefore = (pinchCenterXCanvas - editorState.planOrigin.x) / oldScale;
        const worldZBefore = (pinchCenterYCanvas - editorState.planOrigin.y) / oldScale;

        editorState.planScale = newScale;
        setLastTouchDistance(currentDist);

        editorState.planOrigin.x = pinchCenterXCanvas - worldXBefore * editorState.planScale;
        editorState.planOrigin.y = pinchCenterYCanvas - worldZBefore * editorState.planScale;

        render2DPlan();
    }
}

export function on2DPlanTouchEnd(event) {
    if (editorState.activeViewMode !== 'plan') return;

    if (editorState.isAddingWallMode && editorState.newWallStartPoint) {
        // If only one touch was involved and it ended, treat as pointer up for adding wall
        if (event.touches.length === 0 && event.changedTouches.length === 1) {
             on2DPlanPointerUp(event);
        }
        // If multiple touches were involved and one ended, we might still be in pinch or other gestures.
        // The add wall logic mostly relies on pointer up from single touch/click.
    } else {
        // General touch end, let on2DPlanPointerUp handle drag/pan state resets
        on2DPlanPointerUp(event);
    }


    if (event.touches.length < 2) {
        setLastTouchDistance(null); // Reset for next pinch
    }
    if (event.touches.length === 0) { // Last touch lifted
        editorState.isPanning2D = false; // Ensure panning stops
    }
}
```

---

**`js/editorObjects.js`:**

```javascript
// js/editorObjects.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import { selectObject, deselectEverything } from './editorSelection.js';
import { render2DPlan } from './editorInteraction2D.js'; // For updating plan view after adding/clearing

// --- Wall Management ---
export function initializeDefaultWalls() {
    editorState.walls = [];
    editorState.wallCounter = 0;
    const w = Config.DEFAULT_FLOOR_SIZE / 2; // Use configured floor size
    const d = Config.DEFAULT_FLOOR_SIZE / 2;

    addWall(-w, -d, w, -d); // Back
    addWall(w, -d, w, d);   // Right
    addWall(w, d, -w, d);   // Front
    addWall(-w, d, -w, -d); // Left
    createOrUpdateAll3DWalls();
}

export function addWall(x1, z1, x2, z2, thickness, height) {
    editorState.wallCounter++;
    const wallData = {
        id: 'wall-' + editorState.wallCounter,
        start: { x: x1, z: z1 },
        end: { x: x2, z: z2 },
        thickness: thickness === undefined ? Config.DEFAULT_WALL_THICKNESS : thickness,
        height: height === undefined ? Config.DEFAULT_WALL_HEIGHT : height,
        threeMesh: null
    };
    editorState.walls.push(wallData);
    // createOrUpdateSingle3DWall(wallData); // Or batch update
    return wallData;
}

export function createOrUpdateAll3DWalls() {
    if (!editorState.scene) return;

    // Dispose and remove existing wall meshes first
    editorState.walls.forEach(wall => {
        if (wall.threeMesh) {
            editorState.scene.remove(wall.threeMesh);
            if (wall.threeMesh.geometry) wall.threeMesh.geometry.dispose();
            if (wall.threeMesh.material) {
                if (Array.isArray(wall.threeMesh.material)) {
                    wall.threeMesh.material.forEach(m => m?.dispose());
                } else {
                    wall.threeMesh.material?.dispose();
                }
            }
            wall.threeMesh = null;
        }
    });

    // Create new meshes
    const wallMaterial3D = new THREE.MeshStandardMaterial({
        color: Config.COLORS.WALL_DEFAULT,
        side: THREE.DoubleSide // Render both sides
    });

    editorState.walls.forEach(wall => {
        const start = wall.start;
        const end = wall.end;
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx); // Angle for Y rotation

        if (length < 0.01) return; // Skip zero-length walls

        const wallGeometry = new THREE.BoxGeometry(length, wall.height, wall.thickness);
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial3D.clone()); // Clone material for individual walls if needed

        // Position is the center of the wall
        wallMesh.position.set(
            start.x + dx / 2,
            wall.height / 2, // Center of height
            start.z + dz / 2
        );
        wallMesh.rotation.y = -angle; // Rotate around Y axis
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallMesh.userData.wallId = wall.id; // Link to wall data

        editorState.scene.add(wallMesh);
        wall.threeMesh = wallMesh;
    });
}


// --- Furniture Creation Functions ---
function createTable() {
    const group = new THREE.Group();
    const topGeo = new THREE.BoxGeometry(2, 0.2, 1);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.2 });
    const top = new THREE.Mesh(topGeo, mat);
    top.position.y = 1; // Top surface at y=1
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    [{x: -0.8, z: -0.35}, {x: 0.8, z: -0.35}, {x: -0.8, z: 0.35}, {x: 0.8, z: 0.35}].forEach(p => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(p.x, 0.5, p.z); // Leg base at y=0, center at y=0.5
        leg.castShadow = true;
        leg.receiveShadow = true;
        group.add(leg);
    });
    group.userData.planDimensions = { width: 2, depth: 1, shape: 'rect' };
    group.userData.itemData = { id: 'table-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Стол обеденный Sky', sku: '105306822', price: 12000, image: 'https://images.pexels.com/photos/2098913/pexels-photo-2098913.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'table' };
    return group;
}

function createSofa() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x607D8B, roughness: 0.8, metalness: 0.1 });
    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.2), mat); // w, h, d
    base.position.y = 0.4; // Base center at y=0.4
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), mat);
    back.position.set(0, 0.8 + 0.5, -1.2/2 + 0.3/2); // Positioned on top-back of base
    back.castShadow = true; back.receiveShadow = true;
    group.add(back);
    // Arms
    const armGeo = new THREE.BoxGeometry(0.3, 0.6, 1.2);
    const lArm = new THREE.Mesh(armGeo, mat);
    lArm.position.set(-3/2 + 0.3/2, 0.4 + 0.2, 0); // Adjust y based on base height
    lArm.castShadow = true; lArm.receiveShadow = true;
    group.add(lArm);
    const rArm = new THREE.Mesh(armGeo, mat);
    rArm.position.set(3/2 - 0.3/2, 0.4 + 0.2, 0);
    rArm.castShadow = true; rArm.receiveShadow = true;
    group.add(rArm);

    group.userData.planDimensions = { width: 3, depth: 1.2, shape: 'rect' };
    group.userData.itemData = { id: 'sofa-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Угловой диван-кровать', sku: '40530683', price: 52000, image: 'https://images.pexels.com/photos/4846106/pexels-photo-4846106.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'sofa' };
    return group;
}

function createLamp() {
    const group = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, roughness: 0.4, metalness: 0.6 });
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFFFDD0, side: THREE.DoubleSide, roughness: 0.9 }); // Creamy, less shiny

    const standBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 12);
    const standBase = new THREE.Mesh(standBaseGeo, standMat);
    standBase.position.y = 0.05;
    standBase.castShadow = true; standBase.receiveShadow = true;
    group.add(standBase);

    const standPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8);
    const standPole = new THREE.Mesh(standPoleGeo, standMat);
    standPole.position.y = 0.1 + 0.7; // On top of base
    standPole.castShadow = true; standPole.receiveShadow = true;
    group.add(standPole);

    const shadeGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 12, 1, false); // topRadius, bottomRadius, height
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 1.5 + 0.2; // Top of pole + half shade height
    shade.castShadow = true; // Shade might not cast strong shadows but can
    group.add(shade);

    group.userData.planDimensions = { radius: 0.5, shape: 'circle' }; // Based on shade bottom radius
    group.userData.itemData = { id: 'lamp-' + Date.now() + Math.random().toString(36).substr(2, 5), name: 'Напольная лампа Modern', sku: '200100500', price: 3500, image: 'https://images.pexels.com/photos/7005386/pexels-photo-7005386.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', type: 'lamp' };
    return group;
}

export const furnitureCreationFunctions = {
    table: createTable,
    sofa: createSofa,
    lamp: createLamp,
};

export function addFurnitureObject(type) {
    const { ensureInitialized, startAnimationLoop } = await import('./editorCore.js'); // Dynamic for potential cycle
    ensureInitialized();
    if (!editorState.scene) { console.error("addFurniture: Scene not found!"); return; }

    const creationFunction = furnitureCreationFunctions[type];
    if (!creationFunction) { console.error(`Unknown furniture type: ${type}`); return; }

    const furnitureItem = creationFunction();
    const limit = Config.FURNITURE_PLACEMENT_LIMIT;
    furnitureItem.position.set(
        Math.random() * limit * 1.6 - limit * 0.8, // Random position within a smaller central area
        0, // Base at y=0
        Math.random() * limit * 1.6 - limit * 0.8
    );
    editorState.scene.add(furnitureItem);
    editorState.furniture.push(furnitureItem);
    selectObject(furnitureItem);

    if (editorState.activeViewMode === 'plan') {
        render2DPlan();
    } else if (!editorState.animationFrameId && editorState.renderer) {
        startAnimationLoop();
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
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m?.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
            if (editorState.selectedObject === removedThreeJSObject) {
                deselectEverything();
            }
        }
        if (editorState.activeViewMode === 'plan') render2DPlan();
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
    if (editorState.activeViewMode === 'plan') render2DPlan();
}

export function clearAllWalls() {
    if (!editorState.scene) return;
    editorState.walls.forEach(wall => {
        if (wall.threeMesh) {
            editorState.scene.remove(wall.threeMesh);
            if (wall.threeMesh.geometry) wall.threeMesh.geometry.dispose();
            if (wall.threeMesh.material) {
                 if(Array.isArray(wall.threeMesh.material)) wall.threeMesh.material.forEach(m=>m?.dispose());
                 else wall.threeMesh.material?.dispose();
            }
            wall.threeMesh = null;
        }
    });
    editorState.walls = [];
    editorState.wallCounter = 0;
    if (editorState.activeViewMode === 'plan') render2DPlan();
}
```

---

**`js/editorSelection.js`:**

```javascript
// js/editorSelection.js
import { state as editorState } from './editorState.js';
import * as Config from './config.js';
import * as UI from './ui.js';
import { render2DPlan } from './editorInteraction2D.js';
import { createOrUpdateAll3DWalls, removeFurnitureById, clearAllFurniture as clearEditorFurniture, clearAllWalls as clearEditorWalls, addWall as addEditorWall } from './editorObjects.js';
import { getDomElements } from './ui.js';


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

export function selectWall(wallId) {
    const dom = getDomElements();
    if (editorState.selectedWallId === wallId && !dom.wallPropertiesPanel.classList.contains('hidden')) return;
    deselectEverything();

    editorState.selectedWallId = wallId;
    const wall = editorState.walls.find(w => w.id === wallId);
    if (wall) {
        UI.showWallPropertiesPanel(wall);
    }
    if (editorState.activeViewMode === 'plan') render2DPlan();
}

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

export function updateWallPropertiesFromInput() {
    const dom = getDomElements();
    if (editorState.selectedWallId) {
        const wall = editorState.walls.find(w => w.id === editorState.selectedWallId);
        if (wall) {
            const newThickness = parseFloat(dom.wallThicknessInput.value);
            const newHeight = parseFloat(dom.wallHeightInput.value);

            if (!isNaN(newThickness) && newThickness > 0) wall.thickness = newThickness;
            if (!isNaN(newHeight) && newHeight > 0) wall.height = newHeight;

            createOrUpdateAll3DWalls();
            if (editorState.activeViewMode === 'plan') render2DPlan();
        }
    }
}

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
```

---

**`js/main.js`:**

```javascript
// js/main.js
import * as Config from './config.js';
import * as UI from './ui.js';
import { state as editorState, setLastTouchDistance } from './editorState.js';
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
};

// --- Navigation ---
function navigateTo(screenNumber) {
    UI.showScreen(screenNumber); // UI module handles hiding/showing screens and loader

    if (screenNumber === 4) { // Editor screen
        ensureInitialized();
        // Default to 3D view or last active view if implemented
        if (editorState.activeViewMode === 'plan') EditorControls.switchToPlanView(false);
        else if (editorState.activeViewMode === 'pseudo3d') EditorControls.switchToPseudo3DView(false);
        else EditorControls.switchTo3DView(false); // Default to 3D
        handleResize(); // Ensure canvas is sized correctly
    } else if (screenNumber === 5) { // Estimate screen
        stopAnimationLoop();
        UI.renderEstimateScreen(
            editorState.furniture,
            (itemId, isChecked) => { // onItemSelectedChange
                const furnitureObject = editorState.furniture.find(f => f.userData.itemData && f.userData.itemData.id === itemId);
                if (furnitureObject) furnitureObject.userData.estimateSelected = isChecked;
                UI.renderEstimateScreen(editorState.furniture, /* pass self again or manage state */); // Re-render to update totals
            },
            (itemIdToRemove) => { // onItemRemoved
                if (removeFurnitureById(itemIdToRemove)) {
                    UI.renderEstimateScreen(editorState.furniture, /* pass self */);
                }
            }
        );
    } else { // Any other screen
        stopAnimationLoop();
    }
    currentScreen = screenNumber;
}


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
        setTimeout(() => { // Simulate API call
            UI.displayResultsScreen(appSelectedStyle.name, appUploadedFile, appSelectedStyle.image);
        }, 1500);
    }
});

mainDom.openEditorButton.addEventListener('click', () => {
    // editorState.activeViewMode = '3d'; // Set default view for editor
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
    clearAllWalls(); // Clears editorState.walls and their 3D meshes
    initializeDefaultWalls(); // Re-adds default walls and their 3D meshes

    editorState.activeViewMode = '3d'; // Reset editor view mode
    editorState.planScale = 25; // Reset plan scale
    editorState.planOrigin = { x: 0, y: 0 }; // Reset pan
    if(editorState.planCanvas) { // Recenter if canvas exists
         editorState.planOrigin = {
            x: editorState.planCanvas.width / 2,
            y: editorState.planCanvas.height / 2
        };
    }

    navigateTo(1);
});

mainDom.openEstimateButtonEditor.addEventListener('click', () => navigateTo(5));

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    UI.initPhotoUpload((file) => { appUploadedFile = file; });
    UI.initStyleSelection((styleData) => { appSelectedStyle = styleData; });
    EditorControls.initEditorControls(); // For view mode buttons
    initSelectionControls(); // For furniture/wall manipulation buttons from editorSelection

    UI.initEstimateScreenControls(
        (isChecked) => { // onSelectAll
            editorState.furniture.forEach(f => { if (f.userData.itemData) f.userData.estimateSelected = isChecked; });
            UI.renderEstimateScreen(editorState.furniture, /* item change callback */ (itemId, itemIsChecked) => {
                const furnitureObject = editorState.furniture.find(f => f.userData.itemData && f.userData.itemData.id === itemId);
                if (furnitureObject) furnitureObject.userData.estimateSelected = itemIsChecked;
                 UI.renderEstimateScreen(editorState.furniture, /* pass self again */);
            }, /* item remove callback */ (itemIdToRemove) => {
                 if (removeFurnitureById(itemIdToRemove)) {
                    UI.renderEstimateScreen(editorState.furniture, /* pass self */);
                }
            });
        },
        () => { // onRemoveAll
            if (confirm('Вы уверены, что хотите удалить все предметы из сметы и сцены?')) {
                clearAllFurniture();
                deselectEverything();
                UI.renderEstimateScreen(editorState.furniture, /* item change callback */ (itemId, itemIsChecked) => {
                    const furnitureObject = editorState.furniture.find(f => f.userData.itemData && f.userData.itemData.id === itemId);
                    if (furnitureObject) furnitureObject.userData.estimateSelected = itemIsChecked;
                    UI.renderEstimateScreen(editorState.furniture, /* pass self again */);
                }, /* item remove callback */ (itemIdToRemove) => {
                     if (removeFurnitureById(itemIdToRemove)) {
                        UI.renderEstimateScreen(editorState.furniture, /* pass self */);
                    }
                });
            }
        },
        () => navigateTo(4) // onCloseEstimate
    );

    // Add furniture buttons from editor toolbar
    document.getElementById('addTableButton').addEventListener('click', () => addFurnitureObject('table'));
    document.getElementById('addSofaButton').addEventListener('click', () => addFurnitureObject('sofa'));
    document.getElementById('addLampButton').addEventListener('click', () => addFurnitureObject('lamp'));


    initializeDefaultWalls(); // Initialize with default walls
    navigateTo(1); // Start on the first screen
});
```

---

**Важные моменты и изменения:**

1.  **Глобальные `THREE` и `OrbitControls`:** Они все еще загружаются через `<script>` теги в `index.html` и доступны глобально. Если бы вы использовали сборщик (Webpack, Parcel), вы бы импортировали их явно в нужных модулях.
2.  **Динамический импорт:** В `editorInteraction2D.js` (в `on2DPlanPointerUp`) и `editorObjects.js` (в `addFurnitureObject`) я использовал `await import(...)` для загрузки модуля `editorObjects.js` и `editorCore.js` соответственно. Это сделано, чтобы разорвать потенциальный цикл зависимостей, где, например, `editorObjects.js` может вызывать `render2DPlan` из `editorInteraction2D.js`, а `editorInteraction2D.js` может вызывать `addWall` из `editorObjects.js` во время события. Динамический импорт загружает модуль только тогда, когда он действительно нужен в этой конкретной функции.
3.  **Передача DOM-элементов:** Я создал объект `dom` в `ui.js` для кеширования ссылок на элементы DOM. Другие модули могут получать этот объект через `getDomElements()` из `ui.js`. Это централизует управление DOM-ссылками, которые нужны UI.
4.  **Состояние (`editorState.js`):** Объект `editorState` теперь централизован.
5.  **Функциональность:** Я постарался максимально сохранить всю исходную функциональность, включая недавние добавления (снаппинг, перемещение стен, добавление/удаление стен, редактирование свойств).
6.  **Обработчики событий:** Многие обработчики событий теперь инициализируются в `main.js` или в специализированных функциях инициализации (например, `initSelectionControls`, `initEditorControls`).
7.  **Рендеринг сметы:** Логика рендеринга сметы и ее обработчики немного переработаны для лучшего взаимодействия с модульной структурой. Коллбэки передаются в `UI.renderEstimateScreen` и `UI.initEstimateScreenControls`.
8.  **Инициализация:** `DOMContentLoaded` в `main.js` теперь вызывает функции инициализации из разных модулей.

**Как запустить:**

1.  Создайте указанную структуру папок и файлов.
2.  Скопируйте содержимое каждого файла в соответствующий файл.
3.  Откройте `index.html` в браузере. Все должно работать так же, как и раньше.

Этот рефакторинг значительно улучшает структуру кода. Если возникнут какие-либо проблемы или ошибки при запуске, проверьте консоль браузера – она часто указывает на проблемы с импортом/экспортом или ненайденные функции.