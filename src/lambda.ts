const verbose = false;
import { sexpr, toSexpr } from "./sexpr";

type LambdaExpr =
  | { type: "id"; val: string }
  | { type: "lambda"; val: Lambda }
  | { type: "apply"; val: [LambdaExpr, LambdaExpr] };

function exprString(expr: LambdaExpr): string {
  switch (expr.type) {
    case "id":
      return expr.val;
    case "lambda":
      return `λ${expr.val.arg}.${exprString(expr.val.body)}`;
    case "apply":
      return `(${exprString(expr.val[0])} ${exprString(expr.val[1])})`;
  }
}

function sexprToExpr(s: sexpr): LambdaExpr {
  if (!Array.isArray(s)) {
    return { type: "id", val: s };
  }
  s = s as sexpr[];
  if (s[0] == "lambda") {
    // (lambda (params...) body)
    let params = s[1];
    if (!Array.isArray(params)) {
      throw new Error("need parameters");
    }
    params = (params as sexpr[]).map((x) => x as string);
    if (params.length == 0) {
      throw new Error("nullary lambda disallowed");
    }
    let body: LambdaExpr = sexprToExpr(s[2]);
    let lambda: Lambda = { arg: params.pop() as string, body };
    while (params.length > 0) {
      lambda = {
        arg: params.pop() as string,
        body: { type: "lambda", val: lambda },
      };
    }
    return { type: "lambda", val: lambda };
  } else {
    // application
    if (s.length < 2) {
      throw new Error("not enough to apply " + s);
    }
    let l: LambdaExpr[] = s.map((x) => sexprToExpr(x));
    return l.slice(1).reduce((prev, curr) => {
      return { type: "apply", val: [prev, curr] };
    }, l[0]);
  }
}

interface Lambda {
  arg: string;
  body: LambdaExpr;
}

function evalLambda(expr: LambdaExpr, env: Env): LambdaExpr {
  // TODO: don't mutate expr
  // TODO: continuation instead of step-wise eval
  switch (expr.type) {
    case "id":
      if (verbose) console.log(expr.type, expr.val);
      let f = env[expr.val];
      if (f === undefined) return expr;
      else if (f.type == expr.type && f.val == expr.val) return f;
      else return evalLambda(f, env);
    case "lambda":
      if (verbose) console.log(expr.type, expr.val);
      expr.val.body = evalLambda(expr.val.body, env);
      return expr;
    case "apply":
      if (verbose) console.log(expr.type, expr.val);
      let fun: LambdaExpr = evalLambda(expr.val[0], env);
      let arg: LambdaExpr = evalLambda(expr.val[1], env);
      switch (fun.type) {
        case "lambda":
          return evalLambda(fun.val.body, { ...env, [fun.val.arg]: arg });
        case "id":
        case "apply":
          return { type: "apply", val: [fun, arg] };
      }
  }
}

function readExpr(str: string): LambdaExpr {
  console.log("A", str);
  console.log("B", toSexpr(str));
  console.log("C", sexprToExpr(toSexpr(str)));
  return sexprToExpr(toSexpr(str)[0]);
}

type Env = { [key: string]: LambdaExpr };
function readEnv(str: string): Env {
  let ret: Env = {};
  let s: sexpr[] = toSexpr(str) as sexpr[];
  for (let i = 0; i < s.length; i += 2) {
    ret[s[i] as string] = sexprToExpr(s[i + 1]);
  }
  return ret;
}

let envStr = `ID (lambda (x) x)
T (lambda (x y) x)
F (lambda (x y) y)
NOT (lambda (p) (p F T))
AND (lambda (p q) (p q p))
OR (lambda (p q) (p p q))
0 (lambda (f x) x)
SUCC (lambda (n f x) (f (n f x)))
PLUS (lambda (m n) (m SUCC n))
MULT (lambda (m n) (m (plus n) 0))
POW (lambda (b e) (e b))
1 (lambda (f x) (f x))
2 (lambda (f x) (f (f x)))
3 (SUCC 2)
4 (SUCC 3)
`;
let exprStr = `SUCC 0`;

let env: Env = readEnv(envStr);
let expr: LambdaExpr = readExpr(exprStr);
let output: LambdaExpr = evalLambda(expr, env);

let envText = document.getElementById("env") as HTMLTextAreaElement;
let outputText = document.getElementById("output") as HTMLTextAreaElement;
let exprText = document.getElementById("input") as HTMLTextAreaElement;

envText.textContent = envStr;
exprText.textContent = exprStr;
outputText.textContent = exprString(expr) + '\n' + exprString(output);

envText.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  env = readEnv(k);
});
exprText.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  expr = readExpr(k);
  outputText.textContent += exprString(expr);
  output = evalLambda(expr, env);
  outputText.textContent += '\n' + exprString(output);
});
