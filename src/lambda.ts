import { sexpr, toSexpr } from "./sexpr.js";

type LambdaExpr =
  | { type: "var"; val: variable }
  | { type: "lambda"; val: Lambda }
  | { type: "apply"; val: [LambdaExpr, LambdaExpr] };

interface variable {
  i: number; // debruijn index, or 0 for free variables
  s: string;
}

interface Lambda {
  param: string;
  body: LambdaExpr;
}

function toLambdaExpr(s: sexpr, e: string[] = []): LambdaExpr {
  if (!Array.isArray(s)) {
    return { type: "var", val: { i: e.indexOf(s) + 1, s } };
  }
  s = s as sexpr[];
  if (s.length == 0) {
    throw new Error("empty expr");
  }
  if (s.length == 1) {
    // unnesting
    return toLambdaExpr(s[0], e);
  }
  if (s[0] == "lambda") {
    // (lambda (params...) body)
    if (!Array.isArray(s[1]) || s[1].length == 0) {
      throw new Error("need parameters");
    }
    let params: string[] = s[1].map((x) => x as string).reverse();
    let body: LambdaExpr = toLambdaExpr(s.slice(2), [...params, ...e]);
    let lambda: Lambda = { param: params[0] as string, body };
    for (let i = 1; i < params.length; i++)
      lambda = { param: params[i], body: { type: "lambda", val: lambda } };
    return { type: "lambda", val: lambda };
  } else {
    // application
    let l: LambdaExpr[] = s.map((x) => toLambdaExpr(x, e));
    return l.slice(1).reduce((prev, curr) => {
      return { type: "apply", val: [prev, curr] };
    }, l[0]);
  }
}

function parseSexpr(str: string): LambdaExpr {
  return toLambdaExpr(toSexpr(str));
}

/** parses (λa.(λb.a)) as (lambda (a) (lambda (b) a)) */
function parse(str: string): LambdaExpr {
  return parseSexpr(str.replace(/λ([^.])+\./g, "lambda ($1) "));
}

function formatSimple(expr: LambdaExpr): string {
  switch (expr.type) {
    case "var":
      return expr.val.s;
    case "lambda":
      return `(λ${expr.val.param}.${formatSimple(expr.val.body)})`;
    case "apply":
      return `(${formatSimple(expr.val[0])} ${formatSimple(expr.val[1])})`;
  }
}

function formatDebruijn(expr: LambdaExpr): string {
  switch (expr.type) {
    case "var":
      return expr.val.i === 0 ? expr.val.s : expr.val.i.toString();
    case "lambda":
      return `λ ${formatDebruijn(expr.val.body)}`;
    case "apply":
      let l = formatDebruijn(expr.val[0]);
      if (expr.val[0].type === "lambda" && expr.val[1].type !== "lambda")
        l = `(${l})`;
      return `(${l} ${formatDebruijn(expr.val[1])})`;
  }
}

function formatShort(
  expr: LambdaExpr,
  index: "L" | "0" | "1" = "0",
  space: boolean = false
) {
  let ret = "";
  switch (expr.type) {
    case "var":
      if (index === "L") ret += ".";
      ret += expr.val.s;
      break;
    case "lambda":
      if (index !== "L") ret += " λ";
      ret += expr.val.param;
      if (space) ret += " ";
      ret += formatShort(expr.val.body, "L", space);
      break;
    case "apply":
      if (index === "L") ret += ".";
      if (index === "1") ret += " (";
      ret += formatShort(expr.val[0], "0", space);
      if (space) ret += " ";
      ret += formatShort(expr.val[1], "1", space);
      if (index === "1") ret += ")";
      break;
  }
  return ret;
}

/** finds and swaps out church numerals in a debruijn expression
 *
 * e.g.
 *   SUCC (2 (2 (2 1))) -> SUCC #3
 * 	 ((+ λ λ (2 (2 1))) λ λ 1) -> ((+ #2) #0)
 * */
function swapNumerals(debruijn: string): string {
  let found = [];
  for (let it of debruijn.matchAll(/λ λ 1/g)) {
    found.push([it.index!, 5, 0]);
  }
  for (let it of debruijn.matchAll(/λ λ \(/g)) {
    let str = debruijn.substring(it.index! + 4);
    let matchLeft = str.match(/^(\(2 )*1/);
    if (!matchLeft) continue;
    let matchLeftStr = matchLeft![0];
    let n = (matchLeftStr.length - 1) / 3;
    let matchRight =
      str.substring(matchLeftStr.length, matchLeftStr.length + n) ==
      ")".repeat(n);
    if (!matchRight) continue;
    // matched a number e.g. λ λ (2 (2 (2 1)))
    // "λ λ " + "(2 "*n + "1" + ")"*n
    found.push([it.index!, 4 + n * 3 + 1 + n, n]);
  }
  found.sort((a, b) => a[0] - b[0]);
  let i = 0;
  let ret = "";
  for (let it of found) {
    ret += debruijn.substring(i, it[0]);
    ret += "#" + it[2].toString();
    i = it[0] + it[1];
  }
  ret += debruijn.substring(i);
  return ret;
}

function format(
  expr: LambdaExpr,
  fmt: "simple" | "debruijn" | "short" | "eta" = "simple"
): string {
  switch (fmt) {
    case "simple":
      return formatSimple(expr);
    case "debruijn":
      return formatDebruijn(expr);
    case "short":
      return formatShort(expr);
    case "eta":
      return swapNumerals(formatDebruijn(expr));
  }
}

function rename(expr: LambdaExpr, from: string, to: string) {
  switch (expr.type) {
    case "var":
      if (expr.val.s === from) expr.val.s = to;
      break;
    case "lambda":
      if (expr.val.param === from) expr.val.param = to;
      rename(expr.val.body, from, to);
      break;
    case "apply":
      rename(expr.val[0], from, to);
      rename(expr.val[1], from, to);
      break;
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
  if (index.length === 0) return expr;
  let rest = index.slice(1);
  switch (index[0]) {
    case "L":
      if (expr.type != "lambda") throw new Error("bad index");
      return get(expr.val.body, rest);
    case "0":
      if (expr.type != "apply") throw new Error("bad index");
      return get(expr.val[0], rest);
    case "1":
      if (expr.type != "apply") throw new Error("bad index");
      return get(expr.val[1], rest);
    default:
      throw new Error("unknown index");
  }
}

/** puts val at index, doesn't work for starting index because javascript */
function swapout(expr: LambdaExpr, val: LambdaExpr, index: string) {
  if (index.length === 0) throw new Error("empty index");
  let parent = get(expr, index.slice(0, index.length - 1));
  switch (index[index.length - 1]) {
    case "L":
      if (parent.type != "lambda") throw new Error("bad index");
      parent.val.body = val;
      break;
    case "0":
      if (parent.type != "apply") throw new Error("bad index");
      parent.val[0] = val;
      break;
    case "1":
      if (parent.type != "apply") throw new Error("bad index");
      parent.val[1] = val;
      break;
  }
}

/** converts whole number to church numeral */
function church(n: number): LambdaExpr {
  return parseSexpr(`lambda (f x) ${"(f".repeat(n)} x`);
}

// site start

/** each step of an expression being computed */
let history: LambdaExpr[] = [];
/** each subexpression index that can be evaluated on each line */
let clickableSubexprs: string[][] = [];
let env: Record<string, LambdaExpr> = {};
let envTable = document.getElementById("env") as HTMLTableElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
let output = document.getElementById("output") as HTMLTableElement;

{
  let sampleEnv = [
    ["S", "(lambda (a b c) a c (b c))"],
    ["K", "(lambda (a b) a)"],
    ["I", "(lambda (a) a)"],
    ["I*", "S K K"],
    ["i", "(lambda (x) x S K"],
    ["Ki", "(lambda (a b) b)"],
    ["M", "(lambda (a) a a)"],
    ["Omega", "M M"],
    ["Y", "(lambda (a) Y (lambda (b) a (b b)))"],
    ["True", "K"],
    ["False", "Ki"],
    ["Cons", "(lambda (a b) (lambda (p) p a b))"],
    ["Car", "(lambda (l) (l K))"],
    ["Cdr", "(lambda (l) (l Ki))"],
    ["Nil", "(lambda (p) K)"],
    ["Nil?", "(lambda (l) (l (lambda (a b) Ki)))"],
    ["Not", "(lambda (p) (p I))"],
    ["And", "(lambda (p q) (p q p))"],
    ["Or", "(lambda (p q) (p p q))"],
    ["Zero?", "(lambda (n) n (lambda (a) Ki) K)"],
    ["Succ", "(lambda (n f x) (f (n f x)))"],
    ["+", "(lambda (m n) (m Succ n))"],
    ["*", "(lambda (m n) (m (+ n) 0))"],
    ["^", "(lambda (b e) (e b))"],
    /*
    [
      "Pred",
      // TODO: only outer first evaluations (2 & 4) work correctly on Pred 1,
      // too much recursion on any higher predecessor
      "(lambda (n) (Car (n (lambda (p) (Cons (Cdr p) (Succ (Cdr p)))) (Cons 0 0))))",
    ],
    ["-", "(lambda (m n) (m Pred n))"],
    */
  ];
  for (let it of sampleEnv) {
    let e = parseSexpr(it[1]);
    env[it[0]] = e;
    envTable.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${it[0]}</td><td>${format(e, "simple")}</td></tr>`
    );
  }
}

/** Add a new step to the expression being computed */
function pushExpr(expr: LambdaExpr) {
  history.push(expr);
  clickableSubexprs.push([]); // is filled by toHtml
  let tr = document.createElement("tr");
  let td = document.createElement("td");
  td.appendChild(toHtml(expr));
  //console.log("filled", clickableSubexprs[clickableSubexprs.length-1]);

  tr.appendChild(td);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "simple")}</td>`);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "short")}</td>`);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "debruijn")}</td>`);
  tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "eta")}</td>`);
  output.appendChild(tr);
}

function popExpr() {
  history.pop();
  clickableSubexprs.pop();
  output.removeChild(output.lastChild!);
}

function names(expr: LambdaExpr): string[] {
  switch (expr.type) {
    case "var":
      return expr.val.i === 0 ? [] : [expr.val.s];
    case "lambda":
      return names(expr.val.body);
    case "apply":
      return names(expr.val[0]).concat(names(expr.val[1]));
  }
}

function evalAt(i: number, index: string) {
  while (history.length > i) popExpr();
  if (history.length < i) throw new Error("unreachable");
  let expr = structuredClone(history[i - 1]);
  let subexpr = get(expr, index);
  let result;
  if (subexpr.type === "var" && subexpr.val.i === 0) {
    // free variabe
    let s = subexpr.val.s;
    if (s in env) result = structuredClone(env[s]);
    else if (/^\d+$/.test(s)) result = church(+s); // church numeral support
  } else if (subexpr.type == "apply" && subexpr.val[0].type == "lambda") {
    let [l, r] = subexpr.val;
    {
      // alpha substitution- a.k.a. rename conflicting variables
      let [lnames, rnames] = [new Set(names(l)), new Set(names(r))];
      for (let it of rnames) {
        if (lnames.has(it)) {
          let [from, to] = [it, it + "'"];
          while (lnames.has(to)) to += "'";
          rename(l, from, to);
          lnames.delete(from);
          lnames.add(to);
        }
      }
    }
    result = subst(l.val.body, l.val.param, r);
  }
  if (result !== undefined) {
    if (index === "") pushExpr(result); // swapout doesn't work at empty index
    else {
      swapout(expr, result, index);
      pushExpr(expr);
    }
  }
  scrollTo(0, document.body.scrollHeight);
}

/**
 * converts a lambda into a structured div, with event listeners tied to divs that can compute parts of the expression.
 * only used by pushExpr, is a separate function for convenience and recursion
 */
function toHtml(expr: LambdaExpr, id: string = ""): HTMLDivElement {
  let ret: HTMLDivElement = document.createElement("div");
  ret.classList.add("expr");
  ret.id = id;
  let click = false;
  switch (expr.type) {
    case "var":
      ret.classList.add("var");
      if (expr.val.i == 0) {
        ret.classList.add("free");
        if (expr.val.s in env || expr.val.s.match(/^\d+$/)) click = true;
      }
      ret.innerHTML = expr.val.s;
      break;
    case "lambda":
      ret.classList.add("lambda");
      let param = document.createElement("div");
      param.innerHTML = `λ${expr.val.param}.`;
      ret.append(param, toHtml(expr.val.body, id + "L"));
      break;
    case "apply":
      ret.classList.add("apply");
      let [l, r] = [
        toHtml(expr.val[0], id + "0"),
        toHtml(expr.val[1], id + "1"),
      ];
      ret.append(l, r);
      if (l.classList.contains("lambda")) click = true;
      break;
  }
  let i = history.length;
  if (clickableSubexprs.length !== i) throw new Error("unreachable");
  if (click) {
    ret.classList.add("clickable");
    clickableSubexprs[i - 1].push(id);
    ret.addEventListener("click", (event) => {
      event.stopPropagation(); // only click most-nested element
      evalAt(i, id);
    });
  }
  return ret;
}

function inputText(str: string) {
  str = str.replace(/\\/g, "(λ");
  input.value = str;
  let expr: LambdaExpr;
  try {
    expr = parse(str);
    history = [];
    clickableSubexprs = [];
    output.innerHTML = "";
    pushExpr(expr);
  } catch (err) {
    // console.log("invalid", k);
  }
  input.focus();
}

input.addEventListener("input", (event) => {
  inputText((event.target as HTMLInputElement).value);
});
inputText("(λa.(λb.b a)) (λb.b)");

type cmp = (a: string, b: string) => boolean;

/** returns a comparator to choose between 2 strings for an evaluation strategy
 * e.g. an inner left strategy will choose L00 over L01 because it's more left
 * an inner right strategy will choose 0100 010 because it's more inner*/
function makeStrategy(inner: boolean, left: boolean): cmp {
  return (a: string, b: string) => {
    let end = a.length < b.length ? a.length : b.length;
    for (let i = 0; i < end; i++) {
      if (a[i] !== b[i]) return left === (a[i] === "0");
    }
    return inner === a.length > end;
  };
}

/** given a comparison function, return the best item in list l */
function best(l: string[], cmp: cmp): string {
  return l.reduce((found, current) => {
    if (cmp(found, current)) return found;
    return current;
  });
}

document.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && event.shiftKey) {
    // exit text box, without a timeout it immediately regains focus
    setTimeout(() => {
      input.blur();
    }, 30);
    return;
  }
  let strategies: Record<string, cmp> = {
    "1": makeStrategy(true, true), // inner left
    "2": makeStrategy(false, true), // outer left
    "3": makeStrategy(true, false), // inner right
    "4": makeStrategy(false, false), // outer right
  };
  if (document.activeElement?.matches("body")) {
    let i = history.length;
    switch (event.key) {
      case "-":
        if (i > 0) popExpr();
        if (i == 1) inputText("");
        break;
      case "`":
        scrollTo(0, 0);
        input.select();
        break;
      case "1":
      case "2":
      case "3":
      case "4":
        let row = clickableSubexprs[i - 1];
        if (row.length !== 0) evalAt(i, best(row, strategies[event.key]));
        break;
    }
  }
});
