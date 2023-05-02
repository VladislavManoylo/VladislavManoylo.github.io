import { Pencil } from "./pencil.js";
class Plot {
    constructor(canvas) {
        this.canvas = document.getElementById(canvas);
        this.pencil = new Pencil(this.canvas);
        this.paths = [];
    }
    rescale(a, min, height) {
        a -= min;
        a /= height;
        let h = this.canvas.height;
        return h - (a * h);
    }
    plot(ys) {
        let dx = this.canvas.width / (ys.length - 1);
        let min = Math.min(...ys);
        let h = Math.max(...ys) - min;
        let path = [];
        for (let i = 0; i < ys.length; i++) {
            path.push({ x: dx * i, y: this.rescale(ys[i], min, h) });
        }
        this.paths.push(path);
    }
    fun(f, x0, x1, samples) {
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
let plot = new Plot("canvas");
// plot.plot([0,1]);
plot.plot([0, 1, 0, -1, 0]);
plot.fun(Math.sin, 0, 2 * Math.PI, 100);
plot.show();
