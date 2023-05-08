"use strict";
function tokens(str) {
    let m = str.match(/[()]|[^()\s]+/g);
    return m === null ? [] : m;
}
function toSexpr(tokens) {
    let ret = [];
    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i];
        if (t == "(") {
            const [s, i2] = toSexpr(tokens.slice(i + 1));
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
    const [s, i] = toSexpr(t);
    if (i != t.length) {
        throw new Error(t.slice(i) + " not parsed");
    }
    return s;
}
class Debruijn {
    debruijn(body) {
        if (Array.isArray(body)) {
            return body.map(x => this.debruijn(x));
        }
        let id = this.args.indexOf(body);
        return id == -1 ? body : this.args.length - id;
    }
    constructor(expr) {
        if (Array.isArray(expr)) {
            expr = expr;
            this.args = expr[1].map(x => x);
            this.body = this.debruijn(expr[2]);
        }
        else {
            this.args = [];
            this.body = expr;
        }
    }
    // console.log(toDebruijn(["lambda", ['f', 'x'], ['succ', ['f', 'x']]]));
    exprString(expr = this.body) {
        return Array.isArray(expr)
            ? "(" + expr.map(x => this.exprString(x)).join(" ") + ")"
            : expr.toString();
    }
    toString() {
        return `[${this.args}] ${this.exprString()}`;
    }
}
class Console {
    constructor(input) {
        this.env = {};
        let s = stringToSexpr(input);
        // assert(s.length % 2 == 1);
        for (let i = 0; i < s.length; i += 2) {
            this.env[s[i]] = new Debruijn(s[i + 1]);
        }
        this.expr = new Debruijn(s[s.length - 1]);
    }
    toString() {
        return this.expr.toString();
    }
}
let output = document.getElementById("output");
let input = document.getElementById("input");
input.addEventListener("input", (event) => {
    let k = event.target.value;
    let c = new Console(k);
    output.textContent = c.toString();
});
