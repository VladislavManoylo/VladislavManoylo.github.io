import { toSexpr } from "./sexpr.js";
import { toLambdaExpr, exprString, evalLambda, } from "./lambda.js";
function readEnv(str) {
    let ret = {};
    let s = toSexpr(str);
    for (let i = 0; i < s.length; i += 2) {
        ret[s[i]] = toLambdaExpr(s[i + 1]);
    }
    return ret;
}
function readExpr(str) {
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
let env = readEnv(envStr);
let expr = readExpr(exprStr);
let output = evalLambda(expr, env);
let envText = document.getElementById("env");
let outputText = document.getElementById("output");
let exprText = document.getElementById("input");
envText.textContent = envStr;
exprText.textContent = exprStr;
outputText.textContent = exprString(expr) + "\n" + exprString(evalLambda(output));
envText.addEventListener("input", (event) => {
    let k = event.target.value;
    env = readEnv(k);
});
exprText.addEventListener("input", (event) => {
    let k = event.target.value;
    expr = readExpr(k);
    outputText.textContent += exprString(expr);
    output = evalLambda(expr, env);
    outputText.textContent += "\n" + exprString(output);
});
