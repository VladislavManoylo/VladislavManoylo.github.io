import { Pencil, v2 } from "./pencil.js";

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let pencil = new Pencil(canvas);

let x0 = 0;
let x1 = 1;
let y0 = 0;
let y1 = 1;
let margin = 50;
let plotSize = [canvas.width - margin, canvas.height - margin];
// given arbitrary values to start with
let [xs, ys]: [number[], number[]] = [[], []];

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
  // points
  for (let i in xs) {
    let [x, y] = [xs[i], ys[i]];
    pencil.ctx.fillRect(x * plotSize[0], y * plotSize[1], 2, 2);
  }
  // linear regression
  // W = (phi^T phi)^-1 (phi^T Y)
  // phi(x) = [1, x]
  // ptpi = (phi^T phi) ^ -1
  let ptpi: number[][] = [
    [0, 0],
    [0, 0],
  ];
  for (let x of xs) {
    ptpi[0][0] += 1;
    ptpi[0][1] += x;
    ptpi[1][0] += x;
    ptpi[1][1] += x * x;
  }
  // calculate the inverse
  {
    let determinant = ptpi[0][0] * ptpi[1][1] - ptpi[1][0] * ptpi[0][1];
    ptpi = [
      [ptpi[1][1] / determinant, -ptpi[1][0] / determinant],
      [-ptpi[0][1] / determinant, ptpi[0][0] / determinant],
    ];
  }
  let w = [0, 0];
  for (let i in xs) {
    w[0] += (ptpi[0][0] + ptpi[0][1] * xs[i]) * ys[i];
    w[1] += (ptpi[1][0] + ptpi[1][1] * xs[i]) * ys[i];
  }
  let plot = sampleFunction((x) => w[0] + w[1] * x, x0, x1, 100);

  /* solution for y = mx + 0 commented out
  let xtx = 0;
  for (let x of xs) xtx += x * x;
  let xtxi = 1 / xtx;
  let xty = 0;
  for (let i in xs) xty += xs[i] * ys[i];
  let w = xtxi * xty;
  let plot = sampleFunction((x) => w * x, x0, x1, 100);
  */

  let dx = plotSize[0] / (plot.length - 1);
  let dy = plotSize[1] / (y1 - y0);
  pencil.path(plot.map((y, x) => [dx * x, Math.max(0, dy * (y - y0))]));
  console.log(w);
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
