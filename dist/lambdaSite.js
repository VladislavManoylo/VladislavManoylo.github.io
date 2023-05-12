import { toSexpr } from "./sexpr";
import { toLambdaExpr, exprString } from "./lambda";
const verbose = false;
function evalLambda(expr, env) {
    // TODO: don't mutate expr
    // TODO: continuation instead of step-wise eval
    switch (expr.type) {
        case "id":
            if (verbose)
                console.log(expr.type, expr.val);
            let f = env[expr.val];
            if (f === undefined)
                return expr;
            else if (f.type == expr.type && f.val == expr.val)
                return f;
            else
                return evalLambda(f, env);
        case "lambda":
            if (verbose)
                console.log(expr.type, expr.val);
            expr.val.body = evalLambda(expr.val.body, env);
            return expr;
        case "apply":
            if (verbose)
                console.log(expr.type, expr.val);
            let fun = evalLambda(expr.val[0], env);
            let arg = evalLambda(expr.val[1], env);
            switch (fun.type) {
                case "lambda":
                    return evalLambda(fun.val.body, Object.assign(Object.assign({}, env), { [fun.val.arg]: arg }));
                case "id":
                case "apply":
                    return { type: "apply", val: [fun, arg] };
            }
    }
}
function readExpr(str) {
    return toLambdaExpr(toSexpr(str)[0]);
}
function readEnv(str) {
    let ret = {};
    let s = toSexpr(str);
    for (let i = 0; i < s.length; i += 2) {
        ret[s[i]] = toLambdaExpr(s[i + 1]);
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
let env = readEnv(envStr);
let expr = readExpr(exprStr);
let output = evalLambda(expr, env);
let envText = document.getElementById("env");
let outputText = document.getElementById("output");
let exprText = document.getElementById("input");
envText.textContent = envStr;
exprText.textContent = exprStr;
outputText.textContent = exprString(expr) + '\n' + exprString(output);
envText.addEventListener("input", (event) => {
    let k = event.target.value;
    env = readEnv(k);
});
exprText.addEventListener("input", (event) => {
    let k = event.target.value;
    expr = readExpr(k);
    outputText.textContent += exprString(expr);
    output = evalLambda(expr, env);
    outputText.textContent += '\n' + exprString(output);
});
