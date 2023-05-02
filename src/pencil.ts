import { v2 } from "./v2.js"
export class Pencil {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  line(a: v2, b: v2) {
    this.ctx.beginPath()
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }
  circle(p: v2, r: number, color = "grey") {
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();
  }
  text(p: v2, text: string) {
    this.ctx.font = "40px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, p.x, p.y);
  }
  path(ps: v2[]) {
    this.ctx.beginPath();
    this.ctx.moveTo(ps[0].x, ps[0].y);
    for (let p of ps) {
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();
  }
}