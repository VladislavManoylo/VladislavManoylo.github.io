export function overlap(p1, p2, r) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy < r * r;
}
export function polarToPoint(a, r) {
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
}
export function addPoint(p1, p2) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}
export function subPoint(p1, p2) {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}
export function angleBetween(p1, p2) {
    let d = subPoint(p2, p1);
    return Math.atan2(d.y, d.x);
}
export function distPoint(p1, p2) {
    let x = p1.x - p2.x;
    let y = p1.y - p2.y;
    return x * x + y * y;
}
