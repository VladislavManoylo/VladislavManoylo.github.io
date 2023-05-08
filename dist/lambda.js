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
        return new Lambda(s[1].map(x => x), sexprToExpr(s[2]));
    }
    return s.map(x => sexprToExpr(x));
}
class Lambda {
    constructor(args, body) {
        this.args = args;
        this.body = body;
    }
    toString() {
        let args = this.args.length == 0 ? "" : `[${this.args}]`;
        return `${args} ${exprString(this.body)}`;
    }
}
class Console {
    constructor(input) {
        this.env = {};
        let s = stringToSexpr(input);
        if (s.length % 2 != 1) {
            throw new Error("need body expression");
        }
        for (let i = 0; i < s.length; i += 2) {
            this.env[s[i]] = sexprToExpr(s[i + 1]);
        }
        this.expr = sexprToExpr(s[s.length - 1]);
    }
    toString() {
        return exprString(this.expr);
    }
}
let output = document.getElementById("output");
let input = document.getElementById("input");
input.addEventListener("input", (event) => {
    let k = event.target.value;
    let c = new Console(k);
    output.textContent = c.toString();
});
