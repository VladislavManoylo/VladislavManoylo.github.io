import { Pencil } from "./pencil.js";
function tokenize(text) {
    const re = /([0-9.]+)|([a-z]+)|\S/g;
    let tokens = [];
    let m;
    while ((m = re.exec(text))) {
        const token = m[0];
        tokens.push(token);
    }
    return tokens;
}
function coefToPolynomial(coefficients) {
    return (x) => {
        let v = 1;
        let sum = 0;
        for (let i = 0; i < coefficients.length; i++) {
            sum += coefficients[i] * v;
            v *= x;
        }
        return sum;
    };
}
let paths = [];
let canvas = document.getElementById("canvas");
let pencil = new Pencil(canvas);
function fun(f, x0, width, samples) {
    let dx = width / samples;
    let ys = [];
    for (let i = 0; i < samples; i++) {
        ys.push(f(x0));
        x0 += dx;
    }
    return ys;
}
function show() {
    pencil.clear();
    // draw border
    let [x, y] = [canvas.width, canvas.height];
    pencil.path([
        [0, 0],
        [x, 0],
    ]);
    pencil.path([
        [0, y],
        [x, y],
    ]);
    pencil.path([
        [0, 0],
        [0, y],
    ]);
    pencil.path([
        [x, 0],
        [x, y],
    ]);
    // plot paths
    let ys = paths.flat();
    let max = Math.max(...ys);
    let height = max - Math.min(...ys);
    if (height === 0) {
        let y = canvas.height / 2;
        pencil.path([
            [0, y],
            [canvas.width, y],
        ]);
        return;
    }
    let dy = canvas.height / height;
    for (let ys of paths) {
        let dx = canvas.width / (ys.length - 1);
        // max - y, because y=0 is the top of the canvas
        pencil.path(ys.map((y, x) => [dx * x, dy * (max - y)]));
    }
}
paths.push(fun(Math.sin, 0, 2 * Math.PI, 100));
show();
let x0Input = document.getElementById("x0");
let x1Input = document.getElementById("x1");
let funList = document.getElementById("funlist");
function redraw() {
    let x0 = +x0Input.value;
    let x1 = +x1Input.value;
    paths = [];
    for (let funInput of document.getElementsByClassName("fun")) {
        let str = funInput.value;
        console.log(tokenize(str));
        if (str !== "") {
            let coef = str.split(/\s+/).map(Number);
            paths.push(fun(coefToPolynomial(coef), x0, x1 - x0, 100));
        }
    }
    show();
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
