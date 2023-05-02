import { Pencil } from "./pencil.js"
import { v2 } from "./v2.js"
import { dothing } from "./fun.js"

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
    return h - (a * h);
  }
  plot(ys: number[]) {
    let dx = this.canvas.width / (ys.length - 1);
    let min = Math.min(...ys);
    let h = Math.max(...ys) - min;
    let path: v2[] = [];
    for (let i = 0; i < ys.length; i++) {
      path.push({ x: dx * i, y: this.rescale(ys[i], min, h) });
    }
    this.paths.push(path);
  }
  fun(f: (a: number) => number, x0: number, x1: number, samples: number) {
    let dx = (x1 - x0) / samples;
    let ys = [];
    for (let i = 0; i < samples; i++) {
      ys.push(f(x0));
      x0 += dx;
    }
    this.plot(ys);
  }
  show() {
    this.pencil.clear();
    for (let it of this.paths) {
      this.pencil.path(it);
    }
  }
}

document.getElementById("fun")?.addEventListener("input", (event) => {
    let text = (event.target as HTMLInputElement).value;
    dothing(text);
});


let plot = new Plot("canvas");
// plot.plot([0,1]);
plot.plot([0, 1, 0, -1, 0]);
plot.fun(Math.sin, 0, 2 * Math.PI, 100);
plot.show();
