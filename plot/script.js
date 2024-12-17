/** given an input [-1,0,2,-3], returns "-x^3 + 2x - 3" */
function coefLabel(coefficients) {
    let res = ""
    let first = true;
    for (let i = 0; i < coefficients.length; i++) {
        let base = coefficients[i];
        if (base === 0)
            continue;
        if (base < 0) {
            res += first ? "-" : " - ";
            base = -base;
        } else if (!first) {
            res += " + ";
        }
        first = false;
        const exp = coefficients.length - 1 - i;
        if (exp === 0) {
            res += base.toString();
        } else {
            if (base !== 1) {
                res += base.toString();
            }
            res += "x";
            if (exp !== 1) {
                res += `<sup>${exp}</sup>`;
            }
        }
    }
    return res;
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

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width, -canvas.height);
ctx.translate(0, -1);
ctx.lineWidth = 0.05;
/** @param{number[][]} ps */
function path(ps) {
    ctx.beginPath();
    ctx.moveTo(ps[0][0], ps[0][1]);
    for (let p of ps) {
        ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
}

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

const x0Input = document.getElementById("x0");
const x1Input = document.getElementById("x1");
const y0Input = document.getElementById("y0");
const y1Input = document.getElementById("y1");
const autorangeInput = document.getElementById("autorange");
const funList = document.getElementById("funlist");

function extremum(arr) {
    return [Math.min(...arr), Math.max(...arr)];
}

function redraw() {
    const x0 = +x0Input.value;
    const x1 = +x1Input.value;
    const paths = [];
    for (const input of document.getElementsByClassName("fun")) {
        const coef = input.value.trim().split(/\s+/).map(Number);
        input.labels[0].innerHTML = coefLabel(coef);
        paths.push(sampleFunction(coefToPolynomial(coef), x0, x1, 100));
    }
    const [y0, y1] =
        autorangeInput.checked ?
            extremum(paths.flat()) :
            [+y0Input.value, +y1Input.value];
    y0Input.value = y0.toPrecision(5);
    y1Input.value = y1.toPrecision(5);
    // plot paths
    ctx.clearRect(0, 0, 1, 1);
    ctx.strokeRect(0, 0, 1, 1);
    const height = y1 - y0;
    if (height === 0) {
        path([
            [0, 0.5],
            [1, 0.5],
        ]);
        return;
    }
    const dy = 1 / height;
    for (const ys of paths) {
        const dx = 1 / (ys.length - 1);
        // max - y, because y=0 is the top of the canvas
        path(ys.map((y, x) => [dx * x, dy * (y - y0)]));
    }
}
redraw();

x0Input.addEventListener("input", () => { redraw(); });
x1Input.addEventListener("input", () => { redraw(); });
y0Input.addEventListener("input", () => { redraw(); });
y1Input.addEventListener("input", () => { redraw(); });
autorangeInput.addEventListener("input", () => { redraw(); });
funList.addEventListener("input", () => { redraw(); });

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
