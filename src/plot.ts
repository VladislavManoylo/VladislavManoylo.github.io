import { Pencil } from "./pencil.js";

function tokenize(text: string): string[] {
  const re = /([0-9.]+)|([a-z]+)|\S/g;
  let tokens: string[] = [];
  let m;
  while ((m = re.exec(text))) {
    const token = m[0];
    tokens.push(token);
  }
  return tokens;
}

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
type Expr = Sum;
type Sum = Product | { op: "+" | "-"; lhs: Sum; rhs: Product };
type Product = Power | { op: "*" | "/"; lhs: Product; rhs: Power };
type Power = { lhs: Power; rhs: Term };
type Term = number | string | Expr | Fun;
type Fun = { fun: "sin" | "cos" | "tan" | "ln"; arg: Expr };

function coefToPolynomial(coefficients: number[]): (x: number) => number {
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

let paths: number[][] = [];
let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let pencil = new Pencil(canvas);

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

function show(range: [number, number]) {
  pencil.clear();
  pencil.rect(0, 0, canvas.width, canvas.height);
  // plot paths
  let height: number = range[1] - range[0];
  if (height === 0) {
    let y = canvas.height / 2;
    pencil.path([
      [0, y],
      [canvas.width, y],
    ]);
    return;
  }
  let dy: number = canvas.height / height;
  for (let ys of paths) {
    let dx: number = canvas.width / (ys.length - 1);
    // max - y, because y=0 is the top of the canvas
    pencil.path(ys.map((y, x) => [dx * x, dy * (range[1] - y)]));
  }
}

paths.push(sampleFunction(Math.sin, 0, 2 * Math.PI, 100));
show([-2, 2]);

let x0Input = document.getElementById("x0") as HTMLInputElement;
let x1Input = document.getElementById("x1") as HTMLInputElement;
let y0Input = document.getElementById("y0") as HTMLInputElement;
let y1Input = document.getElementById("y1") as HTMLInputElement;
let autorangeInput = document.getElementById("autorange") as HTMLInputElement;
let funList = document.getElementById("funlist") as HTMLUListElement;

function redraw() {
  let x0 = +x0Input.value;
  let x1 = +x1Input.value;
  paths = [];
  for (let funInput of document.getElementsByClassName("fun")) {
    let str: string = (funInput as HTMLInputElement).value;
    // console.log(tokenize(str));
    if (str !== "") {
      let coef = str.split(/\s+/).map(Number);
      paths.push(sampleFunction(coefToPolynomial(coef), x0, x1, 100));
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
  show([y0, y1]);
}

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

(document.getElementById("+") as HTMLButtonElement).addEventListener(
  "click",
  () => {
    funList.insertAdjacentHTML(
      "beforeend",
      `<li><input type="text" class="fun"></input></li>`
    );
  }
);
(document.getElementById("-") as HTMLButtonElement).addEventListener(
  "click",
  () => {
    if (funList.hasChildNodes()) funList.removeChild(funList.lastChild!);
  }
);
