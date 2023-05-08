"use strict";
const verbose = false;
const web = true;
function tokens(str) {
    let m = str.match(/[()]|[^()\s]+/g);
    return m === null ? [] : m;
}
function tokensToSexpr(tokens) {
    let ret = [];
    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i];
        if (t == "(") {
            const [s, i2] = tokensToSexpr(tokens.slice(i + 1));
            ret.push(s);
            i += i2;
        }
        else if (t == ")") {
            return [ret, i + 1];
        }
        else {
            ret.push(t);
        }
    }
    return [ret, tokens.length];
}
function stringToSexpr(str) {
    const t = tokens(str);
    const [s, i] = tokensToSexpr(t);
    if (i != t.length) {
        throw new Error(t.slice(i) + " not parsed");
    }
    return s;
}
function exprString(expr) {
    switch (expr.type) {
        case "id":
            return expr.val;
        case "lambda":
            return `λ${expr.val.arg}.${exprString(expr.val.body)}`;
        case "apply":
            return `(${exprString(expr.val[0])} ${exprString(expr.val[1])})`;
    }
}
function sexprToExpr(s) {
    if (!Array.isArray(s)) {
        return { type: "id", val: s };
    }
    s = s;
    if (s[0] == "lambda") {
        // (lambda (params...) body)
        let params = s[1];
        if (!Array.isArray(params)) {
            throw new Error("need parameters");
        }
        params = params.map((x) => x);
        if (params.length == 0) {
            throw new Error("nullary lambda disallowed");
        }
        let body = sexprToExpr(s[2]);
        let lambda = { arg: params.pop(), body };
        while (params.length > 0) {
            lambda = {
                arg: params.pop(),
                body: { type: "lambda", val: lambda },
            };
        }
        return { type: "lambda", val: lambda };
    }
    else {
        // application
        if (s.length < 2) {
            throw new Error("not enough to apply " + s);
        }
        let l = s.map((x) => sexprToExpr(x));
        return l.slice(1).reduce((prev, curr) => {
            return { type: "apply", val: [prev, curr] };
        }, l[0]);
    }
}
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
class Interpreter {
    constructor(input) {
        this.env = {};
        let s = stringToSexpr(input);
        if (s.length % 2 == 0) {
            throw new Error("missing a body expression " + s.length);
        }
        this.expr = sexprToExpr(s.pop());
        for (let i = 0; i < s.length; i += 2) {
            this.env[s[i]] = sexprToExpr(s[i + 1]);
        }
    }
    toString() {
        return exprString(this.expr);
    }
    eval() {
        this.expr = evalLambda(this.expr, this.env);
        // TODO: keep history when evalStep doesn't mutate
    }
}
let start = `id (lambda (x) x)
true (lambda (x y) x)
false (lambda (x y) y)
0 (lambda (f x) x)
1 (lambda (f x) (f x))
2 (lambda (f x) (f (f x)))
++ (lambda (n f x) (f (n f x)))
3 (++ 2)
3
`;
let interpreter = new Interpreter(start);
if (web) {
    let output = document.getElementById("output");
    let input = document.getElementById("input");
    let button = document.getElementById("step");
    input.textContent = start;
    output.textContent = interpreter.toString();
    input.addEventListener("input", (event) => {
        let k = event.target.value;
        interpreter = new Interpreter(k);
        output.textContent = interpreter.toString();
    });
    button.addEventListener("click", () => {
        interpreter.eval();
        output.textContent += "\n" + interpreter.toString();
    });
}
else {
    interpreter.eval();
    console.log(interpreter.toString());
}
