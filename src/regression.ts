import { Pencil } from "./pencil.js";

function superscript(x: number): string {
    let ret = "";
    let m: Record<string, string> = {
        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹",
    };
    for (let a of x.toFixed(0)) {
        ret += m[a]!;
    }
    return ret;
}

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let phiElement = document.getElementById("phi") as HTMLInputElement;
let functionElement = document.getElementById("function") as HTMLSpanElement;
let solveElement = document.getElementById("solve") as HTMLSelectElement;
let lrElement = document.getElementById("lr") as HTMLInputElement;
let iterationsElement = document.getElementById(
    "iterations"
) as HTMLInputElement;
let pencil = new Pencil(canvas);

let x0 = 0;
let x1 = 10;
let y0 = 0;
let y1 = 10;
let margin = 50;
let plotSize = [canvas.width - margin, canvas.height - margin];
// given arbitrary values to start with
let [xs, ys]: [number[], number[]] = [
    [3, 6, 9],
    [9, 6, 3],
];

/** take samples of the function f between x0 and x1
 * should have at least 2 samples to work as expected
 */
function sampleFunction(
    f: (a: number) => number,
    x0: number,
    x1: number,
    samples: number
): number[] {
    // samples-1 to get start and end in plot
    let dx = (x1 - x0) / (samples - 1);
    let ys = [];
    for (let i = 0; i < samples; i++) {
        ys.push(f(x0));
        x0 += dx;
    }
    return ys;
}

interface matrix {
    val: number[];
    rows: number;
    cols: number;
}

function inverse(a: matrix): matrix {
    let v = structuredClone(a.val);
    let d = a.rows;
    if (d !== a.cols) throw new Error("non-square matrix");
    let ret = Array(v.length).fill(0);
    for (let i = 0; i < v.length; i += d + 1) ret[i] = 1;
    // gauss-jordan elimination
    // ret is an identity matrix
    // v is the matrix to be inversed
    // console.log(v, "I= ", ret);
    // aftwards v will be identity and vi will be the inverse of v
    // ---
    // getting to an upper triangular matrix with row operations
    for (let i = 0; i < d; i++) {
        for (let j = i + 1; j < d; j++) {
            let a = -v[j * d + i] / v[i * d + i];
            for (let k = 0; k < d; k++) {
                v[j * d + k] += a * v[i * d + k];
                ret[j * d + k] += a * ret[i * d + k];
            }
        }
    }
    // console.log("U= ", v, ret);
    // ---
    // getting to a diagonal matrix
    for (let i = 0; i < d; i++) {
        for (let j = i + 1; j < d; j++) {
            let a = -v[i * d + j] / v[j * d + j];
            for (let k = 0; k < d; k++) {
                v[i * d + k] += a * v[j * d + k];
                ret[i * d + k] += a * ret[j * d + k];
            }
        }
    }
    // console.log("D= ", v, ret);
    // ---
    // getting to an identity matrix
    for (let i = 0; i < d; i++) {
        let a = 1 / v[i * d + i];
        for (let j = 0; j < d; j++) {
            v[i * d + j] *= a;
            ret[i * d + j] *= a;
        }
    }
    // console.log("I= ", v, ret);
    return { val: ret, rows: d, cols: d };
}

function redraw() {
    pencil.clear();
    {
        // axes
        let left = margin - 5;
        pencil.text(y1.toFixed(0), [left, 20], "1em Arial", "right");
        pencil.text(y0.toFixed(0), [left, plotSize[1]], "1em Arial", "right");
        let bottom = plotSize[1] + 20;
        pencil.text(x0.toFixed(0), [left, bottom], "1em Arial", "left");
        pencil.text(x1.toFixed(0), [canvas.width, bottom], "1em Arial", "right");
    }
    pencil.ctx.translate(margin, plotSize[1]);
    pencil.ctx.scale(1, -1);
    pencil.ctx.strokeRect(0, 0, plotSize[0], plotSize[1]);

    // linear regression
    let gd = solveElement.selectedOptions[0].value == "gd";
    let phi = phiElement.valueAsNumber;
    {
        let label = "";
        let m = ["x", "1", "x + 1", "x² + x + 1"];
        if (phi < 4) label = m[phi];
        else label = `x${superscript(phi - 1)} + ... + 1`;
        (document.getElementById("phiLabel") as HTMLSpanElement).innerText = label;
    }
    let w: number[] = [];
    if (gd) {
        let lr = lrElement.valueAsNumber;
        let iterations = iterationsElement.valueAsNumber;
        if (phi === 0) {
            w = [0];
            for (let i = 0; i < iterations; i++) {
                let wi = [0];
                for (let i in xs) {
                    let x = xs[i];
                    let y = ys[i];
                    wi[0] += (w[0] * x - y) * x;
                }
                w[0] -= lr * wi[0];
            }
        } else {
            w = Array(phi).fill(0);
            for (let i = 0; i < iterations; i++) {
                let wi = Array(phi).fill(0);
                for (let i in xs) {
                    let x = xs[i];
                    let y = ys[i];
                    let phiX = [1];
                    let a = 1;
                    for (let i = 1; i < phi; i++) {
                        a *= x;
                        phiX[i] = a;
                    }
                    let c = -y;
                    for (let i in phiX) c += w[i] * phiX[i];
                    for (let i in phiX) wi[i] += c * phiX[i];
                }
                for (let i in w) w[i] -= lr * wi[i];
            }
        }
    } else {
        if (phi === 0) {
            // special case of no basis expansion
            let xtx = 0;
            for (let x of xs) xtx += x * x;
            let xtxi = 1 / xtx;
            let xty = 0;
            for (let i in xs) xty += xs[i] * ys[i];
            w = [xtxi * xty];
        } else {
            // solve for w = (X^T X)^-1 (X^T) Y
            let xtx = Array(phi * phi);
            {
                // calculate (phi(x)^T phi(x)) and put into xtx
                let sums = Array(phi * 2 - 1).fill(0);
                for (let x of xs) {
                    let a = 1;
                    for (let i in sums) {
                        sums[i] += a;
                        a *= x;
                    }
                }
                for (let i = 0; i < phi; i++)
                    for (let j = 0; j < phi; j++) xtx[i * phi + j] = sums[i + j];
            }
            let xtxi = inverse({ val: xtx, rows: phi, cols: phi }).val;
            w = Array(phi).fill(0);
            for (let i in xs) {
                let x = xs[i];
                let phiX: number[] = Array(phi);
                phiX[0] = 1;
                for (let i = 1; i < phiX.length; i++) phiX[i] = phiX[i - 1] * x;
                let tmp: number[] = Array(phi).fill(0);
                for (let j = 0; j < phi; j++)
                    for (let k = 0; k < phi; k++) tmp[j] += xtxi[j * phi + k] * phiX[k];
                let y = ys[i];
                for (let j in w) w[j] += tmp[j] * y;
            }
        }
    }

    functionElement.innerText =
        "y = " + w.map((v, i) => `${v.toFixed(2)}x${superscript(i)}`).join(" + ");
    let plot = sampleFunction(
        (x) => {
            let ret = 0;
            let a = 1;
            for (let it of w) {
                ret += a * it;
                a *= x;
            }
            return ret;
        },
        x0,
        x1,
        100
    );
    let dx = plotSize[0] / (plot.length - 1);
    let dy = plotSize[1] / (y1 - y0);
    pencil.path(plot.map((y, x) => [dx * x, Math.max(0, dy * (y - y0))]));
    // points
    for (let i in xs) {
        let [x, y] = [xs[i], ys[i]];
        x = (x - x0) / (x1 - x0);
        y = (y - y0) / (y1 - y0);
        pencil.ctx.fillRect(x * plotSize[0], y * plotSize[1], 2, 2);
    }
}
redraw();

canvas.addEventListener("click", (event) => {
    let bounds = canvas.getBoundingClientRect();
    let x = event.x - bounds.left - margin;
    let y = canvas.height - margin - (event.y - bounds.top);
    if (x > 0 && y > 0) {
        x = x * (x1 - x0) + x0;
        y = y * (y1 - y0) + y0;
        xs.push(x / plotSize[0]);
        ys.push(y / plotSize[1]);
        redraw();
    }
});

(document.getElementById("clear") as HTMLButtonElement).addEventListener(
    "click",
    () => {
        xs = [];
        ys = [];
        redraw();
    }
);

phiElement.addEventListener("change", () => redraw());
solveElement.addEventListener("change", () => redraw());
lrElement.addEventListener("change", () => {
    if (solveElement.selectedOptions[0].value == "gd") redraw();
});
iterationsElement.addEventListener("change", () => {
    if (solveElement.selectedOptions[0].value == "gd") redraw();
});
