import { Pencil } from "./pencil.js";
import { coefToPolynomial } from "./fun.js";
class Plot {
    constructor(canvas) {
        this.paths = [];
        this.canvas = document.getElementById(canvas);
        this.pencil = new Pencil(this.canvas);
    }
    plot(ys) {
        this.paths.push(ys);
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
        let ys = this.paths.flat();
        let max = Math.max(...ys);
        let height = max - Math.min(...ys);
        if (height === 0) {
            let y = this.canvas.height / 2;
            this.pencil.path([
                [0, y],
                [this.canvas.width, y],
            ]);
            return;
        }
        let dy = this.canvas.height / height;
        for (let ys of this.paths) {
            let dx = this.canvas.width / (ys.length - 1);
            // max - y, because y=0 is the top of the canvas
            this.pencil.path(ys.map((y, x) => [dx * x, dy * (max - y)]));
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
        let str = funInput.value;
        if (str !== "") {
            let coef = str.split(/\s+/).map(Number);
            plot.fun(coefToPolynomial(coef), x0, x1 - x0, 100);
        }
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
document.getElementById("+").addEventListener("click", () => {
    funList.insertAdjacentHTML("beforeend", `<li><input type="text" class="fun"></input></li>`);
});
document.getElementById("-").addEventListener("click", () => {
    if (funList.hasChildNodes())
        funList.removeChild(funList.lastChild);
});
