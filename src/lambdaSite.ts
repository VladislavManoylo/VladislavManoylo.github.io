import { LambdaExpr, format, read } from "./lambda.js";

/** each step of an expression being computed */
let history: LambdaExpr[] = [];
let env: Record<string, LambdaExpr> = {};
let envTable = document.getElementById("env") as HTMLTableElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
let output = document.getElementById("output") as HTMLTableElement;

{
  // sample starting state
  // let exprStr = `(lambda (n f x) f (n f x)) (lambda (f x) f x)`;
  let exprStr = `SUCC 0`;
  input.textContent = exprStr;
  pushExpr(read(exprStr));
}

{
  let sampleEnv = [
    ["ID", "(lambda (x) x)"],
    ["T", "(lambda (x y) x)"],
    ["F", "(lambda (x y) y)"],
    ["NOT", "(lambda (p) (p F T))"],
    ["AND", "(lambda (p q) (p q p))"],
    ["OR", "(lambda (p q) (p p q))"],
    ["SUCC", "(lambda (n f x) (f (n f x)))"],
    ["PLUS", "(lambda (m n) (m SUCC n))"],
    ["MULT", "(lambda (m n) (m (plus n) 0))"],
    ["POW", "(lambda (b e) (e b))"],
  ];
  for (let it of sampleEnv) {
    let e = read(it[1]);
    env[it[0]] = e;
    envTable.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${it[0]}</td><td>${format(e)}</td></tr>`
    );
  }
}

/** Add a new step to the expression being computed */
function pushExpr(expr: LambdaExpr) {
  history.push(expr);
  let tr = document.createElement("tr");
  let td = document.createElement("td");
  td.appendChild(toHtml(expr));

  tr.appendChild(td);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr)}</td>`);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "debruijn")}</td>`);
  output.appendChild(tr);
}

/** Rewind history to only have n expressions */
function rewindExprs(n: number) {
  while (history.length > n) {
    history.pop();
    output.removeChild(output.lastChild!);
  }
}

/**
 * index into the lambda expresion
 * e.g. in (lambda (f x) (f (f x)))
 * "" -> the whole thing
 * "L"   -> (f (f x))
 * "L0"  -> outer f
 * "L1"  -> (f x)
 * "L10" -> inner f
 * "L11" -> x
 */
function get(expr: LambdaExpr, index: string): LambdaExpr {
  switch (index[0]) {
    case "L":
      if (expr.type != "lambda") throw new Error("bad index");
      return get(expr.val.body, index.slice(1));
    case "0":
      if (expr.type != "apply") throw new Error("bad index");
      return get(expr.val[0], index.slice(1));
    case "1":
      if (expr.type != "apply") throw new Error("bad index");
      return get(expr.val[1], index.slice(1));
    default:
      return expr;
  }
}

function subst(expr: LambdaExpr, param: string, arg: LambdaExpr): LambdaExpr {
  switch (expr.type) {
    case "var":
      return expr.val.s === param ? arg : expr;
    case "lambda":
      if (expr.val.param === param) return expr;
      expr.val.body = subst(expr.val.body, param, arg);
      return expr;
    case "apply":
      expr.val[0] = subst(expr.val[0], param, arg);
      expr.val[1] = subst(expr.val[1], param, arg);
      return expr;
  }
}

/** returns a copy of the given expr, but with val at the id location
 * TODO: if expressions could be modified with get(...), this function could be removed*/
function swapout(expr: LambdaExpr, id: string, val: LambdaExpr): LambdaExpr {
  switch (id[0]) {
    case "L":
      if (expr.type != "lambda")
        throw new Error(`bad index ${format(expr)} ${id}`);
      return {
        type: expr.type,
        val: {
          param: expr.val.param,
          body: swapout(expr.val.body, id.slice(1), val),
        },
      };
    case "0":
      if (expr.type != "apply")
        throw new Error(`bad index ${format(expr)} ${id}`);
      return {
        type: expr.type,
        val: [swapout(expr.val[0], id.slice(1), val), expr.val[1]],
      };
    case "1":
      if (expr.type != "apply")
        throw new Error(`bad index ${format(expr)} ${id}`);
      return {
        type: expr.type,
        val: [expr.val[0], swapout(expr.val[1], id.slice(1), val)],
      };
    default:
      return val;
  }
}

/** looks for a symbol in the environment, and church numerals */
function lookup(s: string): LambdaExpr | undefined {
  if (s in env) return env[s];
  if (/^\d+$/.test(s)) {
    let n = +s;
    return read(`lambda (f x) ${"(f".repeat(n)} x ${")".repeat(n)}`);
  }
  return undefined;
}

/**
 * converts a lambda into a structured div, with event listeners tied to divs that can compute parts of the expression.
 * the id parameter is used for convenience in recursion, don't pass anything in.
 */
function toHtml(expr: LambdaExpr, id: string = ""): HTMLDivElement {
  let ret: HTMLDivElement = document.createElement("div");
  ret.classList.add("expr");
  ret.id = id;
  switch (expr.type) {
    case "var":
      ret.classList.add("var");
      if (expr.val.i == 0) {
        ret.classList.add("free");
        ret.classList.add("clickable");
        let length = history.length;
        ret.addEventListener("click", (event) => {
          event.stopPropagation();
          if (history.length > length) rewindExprs(length);
          if (history.length < length) throw new Error("unreachable");
          let expr = history[length - 1];
          let subexpr = get(expr, id);
          if (subexpr.type != "var" || subexpr.val.i != 0)
            throw new Error("can't apply - unreachable");
          let result = lookup(subexpr.val.s);
          if (result !== undefined) {
            pushExpr(swapout(expr, id, result));
          }
        });
      }
      ret.innerHTML = expr.val.s;
      return ret;
    case "lambda":
      ret.classList.add("lambda");
      let param = document.createElement("div");
      param.innerHTML = `λ${expr.val.param}.`;
      ret.append(param, toHtml(expr.val.body, id + "L"));
      return ret;
    case "apply":
      ret.classList.add("apply");
      let [l, r] = [
        toHtml(expr.val[0], id + "0"),
        toHtml(expr.val[1], id + "1"),
      ];
      ret.append(l, r);
      let length = history.length;
      if (l.classList.contains("lambda")) {
        ret.classList.add("clickable");
        ret.addEventListener("click", (event) => {
          event.stopPropagation();
          if (history.length > length) rewindExprs(length);
          if (history.length < length) throw new Error("unreachable");
          let expr = history[length - 1];
          let subexpr = get(expr, id);
          if (subexpr.type != "apply" || subexpr.val[0].type != "lambda")
            throw new Error("can't apply - unreachable");
          let [l, r] = subexpr.val;
          let result = subst(l.val.body, l.val.param, r);
          pushExpr(swapout(expr, id, result));
        });
      }
      return ret;
  }
}

input.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  let expr: LambdaExpr;
  try {
    expr = read(k);
    history = [];
    output.innerHTML = "";
    pushExpr(expr);
  } catch (err) {
    // console.log("invalid", k);
  }
});
