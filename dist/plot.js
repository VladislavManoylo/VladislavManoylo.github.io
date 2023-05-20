var _a;
import { Pencil } from "./pencil.js";
import { coefToPolynomial } from "./fun.js";
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
        return h - a * h;
    }
    plot(ys) {
        let min = Math.min(...ys);
        let h = Math.max(...ys) - min;
        if (h == 0) {
            let y = this.canvas.height / 2;
            this.paths.push([
                [0, y],
                [this.canvas.width, y],
            ]);
            return;
        }
        let dx = this.canvas.width / (ys.length - 1);
        let path = [];
        for (let i = 0; i < ys.length; i++) {
            path.push([dx * i, this.rescale(ys[i], min, h)]);
        }
        this.paths.push(path);
    }
    fun(f, x0, width, samples) {
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
(_a = document.getElementById("fun")) === null || _a === void 0 ? void 0 : _a.addEventListener("input", (event) => {
    let text = event.target.value;
    let f = coefToPolynomial(text.split(/\s+/).map(Number));
    plot.clear();
    plot.fun(f, -1, 2, 100);
    plot.show();
});
