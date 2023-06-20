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

function fun(
  f: (a: number) => number,
  x0: number,
  width: number,
  samples: number
): number[] {
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
  let height: number = max - Math.min(...ys);
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
    pencil.path(ys.map((y, x) => [dx * x, dy * (max - y)]));
  }
}

paths.push(fun(Math.sin, 0, 2 * Math.PI, 100));
show();

let x0Input = document.getElementById("x0") as HTMLInputElement;
let x1Input = document.getElementById("x1") as HTMLInputElement;
let funList = document.getElementById("funlist") as HTMLUListElement;

function redraw() {
  let x0 = +x0Input.value;
  let x1 = +x1Input.value;
  paths = [];
  for (let funInput of document.getElementsByClassName("fun")) {
    let str: string = (funInput as HTMLInputElement).value;
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
