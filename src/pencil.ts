export type v2 = [number, number];

export function overlap(a: v2, b: v2, r: number) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy < r * r;
}

export function polarToPoint(a: number, r: number): v2 {
  return [r * Math.cos(a), r * Math.sin(a)];
}

export class Pencil {
  ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }
  clear() {
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
  line(a: v2, b: v2) {
    this.ctx.beginPath();
    this.ctx.moveTo(a[0], a[1]);
    this.ctx.lineTo(b[0], b[1]);
    this.ctx.stroke();
  }
  circle(p: v2, r: number, color = "grey") {
    this.ctx.beginPath();
    this.ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();
  }
  text(p: v2, text: string) {
    this.ctx.font = "40px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, p[0], p[1]);
  }
  path(ps: v2[]) {
    this.ctx.beginPath();
    this.ctx.moveTo(ps[0][0], ps[0][1]);
    for (let p of ps) {
      this.ctx.lineTo(p[0], p[1]);
    }
    this.ctx.stroke();
  }
}
