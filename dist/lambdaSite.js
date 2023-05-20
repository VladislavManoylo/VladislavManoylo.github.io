import { evalLambda, read, format, } from "./lambda.js";
// let envStr = `ID (lambda (x) x)
// T (lambda (x y) x)
// F (lambda (x y) y)
// NOT (lambda (p) (p F T))
// AND (lambda (p q) (p q p))
// OR (lambda (p q) (p p q))
// 0 (lambda (f x) x)
// SUCC (lambda (n f x) (f (n f x)))
// PLUS (lambda (m n) (m SUCC n))
// MULT (lambda (m n) (m (plus n) 0))
// POW (lambda (b e) (e b))
// 1 (lambda (f x) (f x))
// 2 (lambda (f x) (f (f x)))
// 3 (SUCC 2)
// 4 (SUCC 3)
// `;
let exprStr = `(lambda (n f x) f (n f x)) (lambda (f x) f x)`;
// let env: Env = readEnv(envStr);
let expr = read(exprStr);
let output = evalLambda(expr);
// let envText = document.getElementById("env") as HTMLTextAreaElement;
let outputText = document.getElementById("output");
let exprText = document.getElementById("input");
// envText.textContent = envStr;
exprText.textContent = exprStr;
outputText.textContent = format(expr) + "\n" + format(evalLambda(output));
// envText.addEventListener("input", (event) => {
//   let k: string = (event.target as HTMLInputElement).value;
//   env = readEnv(k);
// });
exprText.addEventListener("input", (event) => {
    let k = event.target.value;
    expr = read(k);
    outputText.textContent += format(expr);
    output = evalLambda(expr);
    outputText.textContent += "\n" + format(output);
});
