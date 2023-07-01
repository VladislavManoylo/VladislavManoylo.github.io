export function overlap(a, b, r) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy < r * r;
}
export function polarToPoint(a, r) {
    return [r * Math.cos(a), r * Math.sin(a)];
}
export class Pencil {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
    }
    clear() {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    line(a, b) {
        this.ctx.beginPath();
        this.ctx.moveTo(a[0], a[1]);
        this.ctx.lineTo(b[0], b[1]);
        this.ctx.stroke();
    }
    circle(p, r, color = "grey") {
        this.ctx.beginPath();
        this.ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();
    }
    text(p, text, font = "40px", align = "center") {
        this.ctx.font = font;
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = align;
        this.ctx.fillText(text, p[0], p[1]);
    }
    path(ps) {
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0][0], ps[0][1]);
        for (let p of ps) {
            this.ctx.lineTo(p[0], p[1]);
        }
        this.ctx.stroke();
    }
}
