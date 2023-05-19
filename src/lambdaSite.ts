import { sexpr, toSexpr } from "./sexpr.js";
import {
  LambdaExpr,
  Env,
  toLambdaExpr,
  exprString,
  evalLambda,
} from "./lambda.js";

function readEnv(str: string): Env {
  let ret: Env = {};
  let s: sexpr[] = toSexpr(str) as sexpr[];
  for (let i = 0; i < s.length; i += 2) {
    ret[s[i] as string] = toLambdaExpr(s[i + 1]);
  }
  return ret;
}

function readExpr(str: string): LambdaExpr {
  return toLambdaExpr(toSexpr(str)[0]);
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
outputText.textContent = exprString(expr) + "\n" + exprString(evalLambda(output));

envText.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  env = readEnv(k);
});
exprText.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  expr = readExpr(k);
  outputText.textContent += exprString(expr);
  output = evalLambda(expr, env);
  outputText.textContent += "\n" + exprString(output);
});
