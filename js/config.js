// js/config.js
export const SNAP_DISTANCE = 0.5;
export const VERTEX_HIT_RADIUS = 8;
export const WALL_HIT_TOLERANCE = 5;
export const DEFAULT_WALL_HEIGHT = 2.5; // meters

// --- НОВЫЕ ---
export const DEFAULT_WALL_THICKNESS = 0.2; // Общая толщина по умолчанию
export const DEFAULT_WALL_THICKNESS_LEFT = DEFAULT_WALL_THICKNESS / 2; // Толщина "слева" от осевой линии
export const DEFAULT_WALL_THICKNESS_RIGHT = DEFAULT_WALL_THICKNESS / 2; // Толщина "справа" от осевой линии
// --- КОНЕЦ НОВЫХ ---

export const FURNITURE_PLACEMENT_LIMIT = 10 - 0.5; // Уменьшено, т.к. DEFAULT_FLOOR_SIZE убран

export const COLORS = {
    WALL_DEFAULT: 0xa0a0a0,
    // FLOOR_DEFAULT: 0x777777, // Цвет для PlaneGeometry, теперь задаем для ShapeGeometry
    FLOOR_DEFAULT: 0x888888, // Может, сделать чуть светлее?
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