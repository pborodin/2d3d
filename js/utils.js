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