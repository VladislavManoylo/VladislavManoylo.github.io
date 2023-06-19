import { Pencil } from "./pencil.js";
import { coefToPolynomial } from "./fun.js";
class Plot {
    constructor(canvas) {
        this.canvas = document.getElementById(canvas);
        this.pencil = new Pencil(this.canvas);
        this.paths = [];
    }
    plot(ys) {
        let min = Math.min(...ys);
        let height = Math.max(...ys) - min;
        if (height == 0) {
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
            // y, scaled to canvas height
            let y = (ys[i] - min) / height;
            let h = this.canvas.height;
            y = h - y * h;
            path.push([dx * i, y]);
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
        // draw border
        let [x, y] = [this.canvas.width, this.canvas.height];
        this.pencil.path([
            [0, 0],
            [x, 0],
        ]);
        this.pencil.path([
            [0, y],
            [x, y],
        ]);
        this.pencil.path([
            [0, 0],
            [0, y],
        ]);
        this.pencil.path([
            [x, 0],
            [x, y],
        ]);
        // plot paths
        for (let it of this.paths) {
            this.pencil.path(it);
        }
    }
}
let plot = new Plot("canvas");
plot.fun(Math.sin, 0, 2 * Math.PI, 100);
plot.show();
let x0Input = document.getElementById("x0");
let x1Input = document.getElementById("x1");
let funList = document.getElementById("funlist");
function redraw() {
    let x0 = +x0Input.value;
    let x1 = +x1Input.value;
    plot.clear();
    for (let funInput of document.getElementsByClassName("fun")) {
        let fun = funInput;
        let f = coefToPolynomial(fun.value.split(/\s+/).map(Number));
        plot.fun(f, x0, x1 - x0, 100);
    }
    plot.show();
}
x0Input.addEventListener("input", () => {
    redraw();
});
x1Input.addEventListener("input", () => {
    redraw();
});
funList.addEventListener("input", () => {
    redraw();
});
