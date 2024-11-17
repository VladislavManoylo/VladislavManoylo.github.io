import { Pencil } from "../pencil.js";
/**
 * EXPR ::= SUM
 * SUM ::= SUM +/- PRODUCT
 *       | PRODUCT
 * PRODUCT ::= PRODUCT *|/ POWER
 *           | POWER
 * POWER ::= POWER ^ TERM
 * TERM ::= number
 *        | x
 *        | pi | e
 *        | ( EXPR )
 *        | sin|cos|... EXPR
 */
/*
type Expr = Sum;
type Sum = Product | { op: "+" | "-"; lhs: Sum; rhs: Product };
type Product = Power | { op: "*" | "/"; lhs: Product; rhs: Power };
type Power = { lhs: Power; rhs: Term };
type Term = number | string | Expr | Fun;
type Fun = { fun: "sin" | "cos" | "tan" | "ln"; arg: Expr };
*/
/** given an input [1,0,2,3], returns "x^3 + 2x + 3" */
function coefLabel(coefficients) {
    return coefficients
        .map((v, i) => {
        let base = v;
        let exp = coefficients.length - 1 - i;
        if (base === 0)
            return "";
        if (exp === 0)
            return base.toString();
        let ret = "";
        if (base !== 1)
            ret += base.toString();
        ret += "x";
        if (exp !== 1)
            ret += `^${exp}`;
        return ret;
    })
        .filter((s) => s.length > 0)
        .join(" + ");
}
/** given an input [1,2,3], returns the function (x) => (x^2 + 2x + 3) */
function coefToPolynomial(coefficients) {
    coefficients.reverse();
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
//console.log("139=", coefToPolynomial([1,10,100])(3));
let canvas = document.getElementById("canvas");
let pencil = new Pencil(canvas);
/** take samples of the function f between x0 and x1
 * should have at least 2 samples to work as expected
 */
function sampleFunction(f, x0, x1, samples) {
    // samples-1 to get start and end in plot
    let dx = (x1 - x0) / (samples - 1);
    let ys = [];
    for (let i = 0; i < samples; i++) {
        ys.push(f(x0));
        x0 += dx;
    }
    return ys;
}
let x0Input = document.getElementById("x0");
let x1Input = document.getElementById("x1");
let y0Input = document.getElementById("y0");
let y1Input = document.getElementById("y1");
let autorangeInput = document.getElementById("autorange");
let funList = document.getElementById("funlist");
function redraw() {
    let x0 = +x0Input.value;
    let x1 = +x1Input.value;
    let paths = [];
    for (let funInput of document.getElementsByClassName("fun")) {
        let input = funInput;
        let str = input.value;
        if (str !== "") {
            let coef = str.split(/\s+/).map(Number);
            input.labels[0].innerHTML = coefLabel(coef);
            paths.push(sampleFunction(coefToPolynomial(coef), x0, x1, 100));
        }
        else {
            input.labels[0].innerHTML = "";
        }
    }
    let y0 = +y0Input.value;
    let y1 = +y1Input.value;
    if (autorangeInput.checked) {
        let ys = paths.flat();
        y0 = Math.min(...ys);
        y1 = Math.max(...ys);
        y0Input.value = y0.toString();
        y1Input.value = y1.toString();
    }
    // plot paths
    pencil.clear();
    let margin = 50;
    {
        // axes
        let left = margin - 5;
        let bottom = canvas.height - margin;
        pencil.text(y1.toFixed(0), [left, 20], "1em Arial", "right");
        pencil.text(y0.toFixed(0), [left, bottom], "1em Arial", "right");
        bottom += 20;
        pencil.text(x0.toFixed(0), [left, bottom], "1em Arial", "left");
        pencil.text(x1.toFixed(0), [canvas.width, bottom], "1em Arial", "right");
    }
    pencil.ctx.translate(margin, canvas.height - margin);
    pencil.ctx.scale(1, -1);
    pencil.ctx.strokeRect(0, 0, canvas.width - margin, canvas.height - margin);
    let height = y1 - y0;
    if (height === 0) {
        let y = canvas.height / 2;
        pencil.path([
            [0, y],
            [canvas.width, y],
        ]);
        return;
    }
    let dy = (canvas.height - margin) / height;
    for (let ys of paths) {
        let dx = (canvas.width - margin) / (ys.length - 1);
        // max - y, because y=0 is the top of the canvas
        pencil.path(ys.map((y, x) => [dx * x, dy * (y - y0)]));
    }
}
redraw();
x0Input.addEventListener("input", () => {
    redraw();
});
x1Input.addEventListener("input", () => {
    redraw();
});
y0Input.addEventListener("input", () => {
    redraw();
});
y1Input.addEventListener("input", () => {
    redraw();
});
autorangeInput.addEventListener("input", () => {
    redraw();
});
funList.addEventListener("input", () => {
    redraw();
});
document.getElementById("+").addEventListener("click", () => {
    let i = funList.childNodes.length;
    funList.insertAdjacentHTML("beforeend", `<li>
        <input type="text" class="fun" id="fun${i}">
        <label for="fun${i}"></label>
      </li>`);
});
document.getElementById("-").addEventListener("click", () => {
    if (funList.hasChildNodes())
        funList.removeChild(funList.lastChild);
});
