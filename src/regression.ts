import { Pencil } from "./pencil.js";

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let phiElement = document.getElementById("phi") as HTMLSelectElement;
let functionElement = document.getElementById("function") as HTMLSpanElement;
let solveElement = document.getElementById("solve") as HTMLSelectElement;
let lrElement = document.getElementById("lr") as HTMLInputElement;
let iterationsElement = document.getElementById(
  "iterations"
) as HTMLInputElement;
let pencil = new Pencil(canvas);

let x0 = 0;
let x1 = 1;
let y0 = 0;
let y1 = 1;
let margin = 50;
let plotSize = [canvas.width - margin, canvas.height - margin];
// given arbitrary values to start with
let [xs, ys]: [number[], number[]] = [
  [0.3, 0.6, 0.9],
  [0.9, 0.6, 0.3],
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

  let plot: number[] = [];
  // linear regression
  let gd = solveElement.selectedOptions[0].value == "gd";
  if (gd) {
    let lr = lrElement.valueAsNumber;
    let iterations = iterationsElement.valueAsNumber;
    switch (phiElement.selectedOptions[0].value) {
      case "x": {
        let w = 0;
        for (let i = 0; i < iterations; i++) {
          for (let i in xs) {
            let x = xs[i];
            let y = ys[i];
            w -= lr * (w * x - y) * x;
          }
        }
        functionElement.innerText = `y = ${w.toFixed(2)}x`;
        plot = sampleFunction((x) => w * x, x0, x1, 100);
        break;
      }
      case "x + 1": {
        let w = [0, 0];
        for (let i = 0; i < iterations; i++) {
          let wi = [0, 0];
          for (let j in xs) {
            let x = xs[j];
            let y = ys[j];
            let c = w[0] + w[1] * x - y;
            wi[0] += c;
            wi[1] += c * x;
          }
          w[0] -= lr * wi[0];
          w[1] -= lr * wi[1];
        }
        let coef = w.map((x) => x.toFixed(2));
        functionElement.innerText = `y = ${coef[1]}x + ${coef[0]}`;
        plot = sampleFunction((x) => w[0] + w[1] * x, x0, x1, 100);
        break;
      }
      case "x² + x + 1": {
        let w = [0, 0, 0];
        for (let i = 0; i < iterations; i++) {
          let wi = [0, 0, 0];
          for (let j in xs) {
            let x = xs[j];
            let x2 = x * x;
            let y = ys[j];
            let c = w[0] + w[1] * x + w[2] * x2 - y;
            wi[0] += c;
            wi[1] += c * x;
            wi[2] += c * x2;
          }
          w[0] -= lr * wi[0];
          w[1] -= lr * wi[1];
          w[2] -= lr * wi[2];
        }
        let coef = w.map((x) => x.toFixed(2));
        functionElement.innerText = `y = ${coef[2]}x² + ${coef[1]}x + ${coef[0]}`;
        plot = sampleFunction(
          (x) => w[0] + w[1] * x + w[2] * x * x,
          x0,
          x1,
          100
        );
        break;
      }
      default:
        throw new Error("unreachable");
    }
  } else {
    switch (phiElement.selectedOptions[0].value) {
      case "x": {
        let xtx = 0;
        for (let x of xs) xtx += x * x;
        let xtxi = 1 / xtx;
        let xty = 0;
        for (let i in xs) xty += xs[i] * ys[i];
        let w = xtxi * xty;
        functionElement.innerText = `y = ${w.toFixed(2)}x`;
        plot = sampleFunction((x) => w * x, x0, x1, 100);
        break;
      }
      case "x + 1": {
        let sums = [0, 0, 0];
        for (let x of xs) {
          sums[0] += 1;
          sums[1] += x;
          sums[2] += x * x;
        }
        let det = sums[0] * sums[2] - sums[1] * sums[1];
        sums = sums.map((x) => x / det);
        let ptpi = [
          [sums[2], -sums[1]],
          [-sums[1], sums[0]],
        ];
        let w = [0, 0];
        for (let i in xs) {
          w[0] += (ptpi[0][0] + ptpi[0][1] * xs[i]) * ys[i];
          w[1] += (ptpi[1][0] + ptpi[1][1] * xs[i]) * ys[i];
        }
        let coef = w.map((x) => x.toFixed(2));
        functionElement.innerText = `y = ${coef[1]}x + ${coef[0]}`;
        plot = sampleFunction((x) => w[0] + w[1] * x, x0, x1, 100);
        break;
      }
      case "x² + x + 1": {
        // closed form solution is W = (X^T X)^-1 X^T Y
        // using X = [phi(x_1), phi(x_2), ..., phi(x_n)]
        // the values in (X^T X) are the same across every diagonal
        // e.g. [a b c]
        //      [b c d]
        //      [c d e]
        // d is the values in that diagonal
        let d = [0, 0, 0, 0, 0];
        for (let x of xs) {
          let x2 = x * x;
          let x3 = x2 * x;
          let x4 = x3 * x;
          d[0] += 1;
          d[1] += x;
          d[2] += x2;
          d[3] += x3;
          d[4] += x4;
        }
        // the inverse of (X^T X) is the adjoint matrix divided by the determinant
        // adjoint is the transpose of the cofactor matrix, but because the (X^T X) is symmetric
        // transpose is redundant, and we only need half the matrix
        // u is the upper triangle of the cofactor matrix
        let u = [
          d[2] * d[4] - d[3] * d[3],
          d[3] * d[2] - d[1] * d[4],
          d[1] * d[3] - d[2] * d[2],
          d[4] * d[0] - d[2] * d[2],
          d[2] * d[1] - d[3] * d[0],
          d[0] * d[2] - d[1] * d[1],
        ];
        // determinant reuses values in the cofactor matrix
        let det = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
        u = u.map((x) => x / det);
        // ptpi is now (X^T X)^-1
        let ptpi = [
          [u[0], u[1], u[2]],
          [u[1], u[3], u[4]],
          [u[2], u[4], u[5]],
        ];
        let w = [0, 0, 0];
        for (let i in xs) {
          let x = xs[i];
          let y = ys[i];
          let x2 = x * x;
          w[0] += (ptpi[0][0] + ptpi[0][1] * x + ptpi[0][2] * x2) * y;
          w[1] += (ptpi[1][0] + ptpi[1][1] * x + ptpi[1][2] * x2) * y;
          w[2] += (ptpi[2][0] + ptpi[2][1] * x + ptpi[2][2] * x2) * y;
        }
        let coef = w.map((x) => x.toFixed(2));
        functionElement.innerText = `y = ${coef[2]}x² + ${coef[1]}x + ${coef[0]}`;
        plot = sampleFunction(
          (x) => w[0] + w[1] * x + w[2] * x * x,
          x0,
          x1,
          100
        );
        break;
      }
      default:
        throw new Error("unreachable");
    }
  }

  let dx = plotSize[0] / (plot.length - 1);
  let dy = plotSize[1] / (y1 - y0);
  pencil.path(plot.map((y, x) => [dx * x, Math.max(0, dy * (y - y0))]));
  // points
  for (let i in xs) {
    let [x, y] = [xs[i], ys[i]];
    pencil.ctx.fillRect(x * plotSize[0], y * plotSize[1], 2, 2);
  }
}
redraw();

canvas.addEventListener("click", (event) => {
  let bounds = canvas.getBoundingClientRect();
  let x = event.x - bounds.left - margin;
  let y = canvas.height - margin - (event.y - bounds.top);
  if (x > 0 && y > 0) {
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
