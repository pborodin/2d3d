//_generate_code_snapshot.js

const fs = require('fs');
const path = require('path');

// --- КОНФИГУРАЦИЯ ---
const PROJECT_ROOT = process.cwd(); // Корень проекта - текущая рабочая директория
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'project_code_snapshot.md'); // Имя выходного MD файла
const ALLOWED_EXTENSIONS = ['.js', '.http', '.css', '.jsx', '.ts', '.tsx', '.html', '.json', '.md', '.yaml', '.yml', '.py', '.java', '.go', '.sh']; // Расширения файлов для включения
const IGNORED_DIRS = ['node_modules', '.git', '.vscode', '.idea', 'code-files', 'dist', 'build', 'coverage', 'public']; // Папки, которые нужно игнорировать
const IGNORED_FILES = [path.basename(__filename), path.basename(OUTPUT_FILE)]; // Файлы, которые нужно игнорировать (сам скрипт и его вывод)
// --- КОНЕЦ КОНФИГУРАЦИИ ---

// Маппинг расширений на языки для Markdown
const EXT_TO_LANG_MAP = {
    '.js': 'javascript',
    '.jsx': 'javascript', // React JSX
    '.ts': 'typescript',
    '.tsx': 'typescript', // React TSX
    '.http': 'http', // или 'text' если http не поддерживается, но для LLM http лучше
    '.css': 'css',
    '.html': 'html',
    '.json': 'json',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.sh': 'shell',
    // Добавьте другие по необходимости
};

function getLanguageType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return EXT_TO_LANG_MAP[ext] || 'text'; // По умолчанию 'text', если расширение неизвестно
}

function collectFiles(dir, projectRoot, allFiles = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativeItemPath = path.relative(projectRoot, itemPath);

        // Игнорируем сам скрипт и файл вывода
        if (IGNORED_FILES.includes(item)) {
            console.log(`[INFO] Игнорируется специальный файл: ${relativeItemPath}`);
            continue;
        }

        // Игнорируем директории из списка IGNORED_DIRS
        if (fs.statSync(itemPath).isDirectory()) {
            if (IGNORED_DIRS.includes(item)) {
                console.log(`[INFO] Игнорируется директория: ${relativeItemPath}`);
                continue;
            }
            collectFiles(itemPath, projectRoot, allFiles);
        } else {
            const ext = path.extname(itemPath).toLowerCase();
            if (ALLOWED_EXTENSIONS.includes(ext)) {
                allFiles.push(itemPath);
            }
        }
    }
    return allFiles;
}

function generateMarkdown() {
    console.log(`[INFO] Поиск файлов в проекте: ${PROJECT_ROOT}`);
    console.log(`[INFO] Игнорируемые директории: ${IGNORED_DIRS.join(', ')}`);
    console.log(`[INFO] Игнорируемые файлы: ${IGNORED_FILES.join(', ')}`);
    console.log(`[INFO] Разрешенные расширения: ${ALLOWED_EXTENSIONS.join(', ')}`);

    const filesToProcess = collectFiles(PROJECT_ROOT, PROJECT_ROOT);
    let markdownContent = `# Снимок кода проекта\n\n`;
    markdownContent += `Дата генерации: ${new Date().toISOString()}\n\n`;
    markdownContent += `Корень проекта: \`${PROJECT_ROOT}\`\n\n`;
    markdownContent += `Этот документ содержит исходный код файлов проекта, предназначенный для анализа нейронными сетями. Каждый файл представлен с указанием его относительного пути и содержимым, обрамленным в блок кода с указанием языка.\n\n`;
    markdownContent += `## Содержание файлов:\n\n`;

    if (filesToProcess.length === 0) {
        markdownContent += "Не найдено файлов для включения с указанными расширениями.\n";
        console.warn("[WARN] Не найдено файлов для включения.");
    } else {
        console.log(`[INFO] Найдено ${filesToProcess.length} файлов для обработки.`);
        filesToProcess.sort(); // Сортируем для консистентности

        for (const filePath of filesToProcess) {
            try {
                const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/'); // Нормализуем разделители для единообразия
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const languageType = getLanguageType(filePath);

                console.log(`[PROCESS] Добавление файла: ${relativePath} (язык: ${languageType})`);

                markdownContent += `--- \n\n`; // Горизонтальный разделитель для лучшей читаемости
                markdownContent += `### Файл: \`${relativePath}\`\n\n`;
                markdownContent += `**Тип содержимого:** ${languageType}\n\n`; // Дополнительная мета-информация
                markdownContent += `\`\`\`${languageType}\n`;
                markdownContent += fileContent.trim() + '\n'; // trim() чтобы убрать лишние пустые строки в начале/конце
                markdownContent += `\`\`\`\n\n`;
            } catch (error) {
                console.error(`[ERROR] Не удалось прочитать файл ${filePath}: ${error.message}`);
                markdownContent += `--- \n\n`;
                markdownContent += `### Файл: \`${path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/')}\`\n\n`;
                markdownContent += `**ОШИБКА:** Не удалось прочитать содержимое файла. Причина: ${error.message}\n\n`;
            }
        }
    }

    try {
        fs.writeFileSync(OUTPUT_FILE, markdownContent);
        console.log(`[SUCCESS] Снимок кода успешно сохранен в: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error(`[ERROR] Не удалось записать в файл ${OUTPUT_FILE}: ${error.message}`);
    }
}

// Запуск генерации
generateMarkdown();