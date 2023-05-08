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
    if (expr instanceof Lambda) {
        return expr.toString();
    }
    if (Array.isArray(expr)) {
        return "(" + expr.map((x) => exprString(x)).join(" ") + ")";
    }
    return expr;
}
function sexprToExpr(s) {
    if (!Array.isArray(s)) {
        return s;
    }
    s = s;
    if (s[0] == "lambda") {
        return new Lambda(s[1].map((x) => x), sexprToExpr(s[2]));
    }
    return s.map((x) => sexprToExpr(x));
}
function apply(expr, param, arg) {
    if (expr instanceof Lambda) {
        return expr;
    }
    if (Array.isArray(expr)) {
        return expr.map((x) => apply(x, param, arg));
    }
    return expr === param ? arg : expr;
}
class Lambda {
    constructor(args, body) {
        this.args = args;
        this.body = body;
    }
    toString() {
        let args = this.args.length == 0 ? "" : `${this.args.join(".")}`;
        return `λ${args}.${exprString(this.body)}`;
    }
}
// type Env = new Map<string, LambdaExpr>();
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
        if (this.expr instanceof Lambda) {
            return;
        }
        if (!Array.isArray(this.expr)) {
            if (this.expr in this.env) {
                this.expr = this.env[this.expr];
                return;
            }
            else {
                throw new Error("can't find " + this.expr);
            }
        }
        let fun = this.expr[0];
        if (!(fun instanceof Lambda)) {
            this.expr[0] = this.env[fun];
            return;
        }
        fun.args = fun.args.slice(1);
        fun.body = apply(fun.body, fun.args[0], this.expr[1]);
        if (fun.args.length == 0) {
            if (this.expr.length > 2) {
                throw new Error("Too many arguments");
            }
            this.expr = fun.body;
            return;
        }
        this.expr = this.expr.slice(2);
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
