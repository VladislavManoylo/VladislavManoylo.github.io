import { Pencil } from "./pencil.js";
import { v2 } from "./v2.js";
import { coefToPolynomial } from "./fun.js";

class Plot {
  canvas: HTMLCanvasElement;
  pencil: Pencil;
  private paths: v2[][];
  constructor(canvas: string) {
    this.canvas = document.getElementById(canvas) as HTMLCanvasElement;
    this.pencil = new Pencil(this.canvas);
    this.paths = [];
  }
  private rescale(a: number, min: number, height: number) {
    a -= min;
    a /= height;
    let h = this.canvas.height;
    return h - a * h;
  }
  plot(ys: number[]) {
    let min = Math.min(...ys);
    let h = Math.max(...ys) - min;
    if (h == 0) {
      let y = this.canvas.height / 2;
      this.paths.push([
        { x: 0, y },
        { x: this.canvas.width, y },
      ]);
      return;
    }
    let dx = this.canvas.width / (ys.length - 1);
    let path: v2[] = [];
    for (let i = 0; i < ys.length; i++) {
      path.push({ x: dx * i, y: this.rescale(ys[i], min, h) });
    }
    this.paths.push(path);
  }
  fun(f: (a: number) => number, x0: number, width: number, samples: number) {
    let dx = width / samples;
    let ys = [];
    for (let i = 0; i < samples; i++) {
      ys.push(f(x0));
      x0 += dx;
    }
    this.plot(ys);
  }
  clear() {
    this.paths = [];
  }
  show() {
    this.pencil.clear();
    for (let it of this.paths) {
      this.pencil.path(it);
    }
  }
}

let plot = new Plot("canvas");
plot.fun(Math.sin, 0, 2 * Math.PI, 100);
plot.show();
document.getElementById("fun")?.addEventListener("input", (event) => {
  let text = (event.target as HTMLInputElement).value;
  let f = coefToPolynomial(text.split(/\s+/).map(Number));
  plot.clear();
  plot.fun(f, -1, 2, 100);
  plot.show();
});
