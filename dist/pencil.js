export class Pencil {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    line(a, b) {
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
    }
    circle(p, r, color = "grey") {
        this.ctx.resetTransform();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();
    }
    text(p, text) {
        this.ctx.font = "40px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, p.x, p.y);
    }
}
