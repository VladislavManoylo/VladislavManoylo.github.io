"use strict";
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
            return lambdaToString(expr.val);
        case "list":
            return `(${expr.val.map((x) => exprString(x)).join(" ")})`;
    }
}
function currify(args, body) {
    if (args.length == 0) {
        throw new Error("nullary lambda disallowed");
    }
    let lambda = { arg: args.pop(), body };
    while (args.length > 0) {
        lambda = {
            arg: args.pop(),
            body: { type: "lambda", val: lambda },
        };
    }
    return lambda;
}
function sexprToExpr(s) {
    if (!Array.isArray(s)) {
        return { type: "id", val: s };
    }
    s = s;
    if (s[0] != "lambda") {
        return { type: "list", val: s.map((x) => sexprToExpr(x)) };
    }
    return {
        type: "lambda",
        val: currify(s[1].map((x) => x), sexprToExpr(s[2])),
    };
}
function apply(expr, param, arg) {
    switch (expr.type) {
        case "id":
            return expr.val === param ? arg : expr;
        case "lambda":
            if (expr.val.arg === param) {
                return expr;
            }
            let body = apply(expr.val.body, param, arg);
            expr.val.body = body;
            return expr;
        case "list":
            return { type: "list", val: expr.val.map((x) => apply(x, param, arg)) };
    }
}
function lambdaToString(val) {
    // TODO: different printing formats
    return `λ${val.arg}.${exprString(val.body)}`;
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
    step() {
        // TODO: return next expr instead of mutating
        switch (this.expr.type) {
            case "id":
                if (this.expr.val in this.env) {
                    this.expr = this.env[this.expr.val];
                    return;
                }
                else {
                    throw new Error("can't find " + this.expr);
                }
            case "lambda":
                return;
            case "list":
                let expr = this.expr.val;
                let fun = expr[0];
                switch (fun.type) {
                    case "id":
                        expr[0] = this.env[fun.val];
                        return;
                    case "lambda":
                        this.expr = apply(fun.val.body, fun.val.arg, expr[1]);
                        return;
                    case "list":
                        throw new Error("can't apply list");
                }
        }
    }
}
let start = `id (lambda (x) x)
t (lambda (x y) x)
f (lambda (x y) y)
0 (lambda (f x) x)
1 (lambda (f x) (f x))
2 (lambda (f x) (f (f x)))
++ (lambda (n) (lambda (f x) (f (n f x))))
3 (++ 2)
(++ 3)
`;
let output = document.getElementById("output");
let input = document.getElementById("input");
let button = document.getElementById("step");
let interpreter = new Interpreter(start);
input.textContent = start;
output.textContent = interpreter.toString();
input.addEventListener("input", (event) => {
    let k = event.target.value;
    interpreter = new Interpreter(k);
    output.textContent = interpreter.toString();
});
button.addEventListener("click", () => {
    interpreter.step();
    output.textContent += "\n" + interpreter.toString();
});
