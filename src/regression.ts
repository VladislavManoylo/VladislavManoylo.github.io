import { Pencil } from "./pencil.js";

/** given an input [1,2,3], returns the function (x) => (x^2 + 2x + 3) */
function coefToPolynomial(coefficients: number[]): (x: number) => number {
  coefficients.reverse();
  return (x: number) => {
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

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let pencil = new Pencil(canvas);

function redraw() {
  let x0 = 0;
  let x1 = 1;
  let y0 = 0;
  let y1 = 1;
  let range = [y0, y1];
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
  let height: number = range[1] - range[0];
  if (height === 0) {
    let y = canvas.height / 2;
    pencil.path([
      [0, y],
      [canvas.width, y],
    ]);
    return;
  }
}
redraw();
