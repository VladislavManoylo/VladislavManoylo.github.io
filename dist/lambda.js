import { toSexpr } from "./sexpr.js";
function toLambdaExpr(s, e = []) {
    if (!Array.isArray(s)) {
        return { type: "var", val: { i: e.indexOf(s) + 1, s } };
    }
    s = s;
    if (s.length == 0) {
        throw new Error("empty expr");
    }
    if (s.length == 1) {
        // unnesting
        return toLambdaExpr(s[0], e);
    }
    if (s[0] == "lambda") {
        // (lambda (params...) body)
        if (!Array.isArray(s[1]) || s[1].length == 0) {
            throw new Error("need parameters");
        }
        let params = s[1].map((x) => x).reverse();
        let body = toLambdaExpr(s.slice(2), [...params, ...e]);
        let lambda = { param: params[0], body };
        for (let i = 1; i < params.length; i++)
            lambda = { param: params[i], body: { type: "lambda", val: lambda } };
        return { type: "lambda", val: lambda };
    }
    else {
        // application
        let l = s.map((x) => toLambdaExpr(x, e));
        return l.slice(1).reduce((prev, curr) => {
            return { type: "apply", val: [prev, curr] };
        }, l[0]);
    }
}
function parseSexpr(str) {
    return toLambdaExpr(toSexpr(str));
}
/** parses (λa.(λb.a)) as (lambda (a) (lambda (b) a)) */
function parse(str) {
    return parseSexpr(str.replace(/λ([^.])+\./g, "lambda ($1) "));
}
function formatSimple(expr) {
    switch (expr.type) {
        case "var":
            return expr.val.s;
        case "lambda":
            return `(λ${expr.val.param}.${formatSimple(expr.val.body)})`;
        case "apply":
            return `(${formatSimple(expr.val[0])} ${formatSimple(expr.val[1])})`;
    }
}
function formatDebruijn(expr) {
    switch (expr.type) {
        case "var":
            return expr.val.i === 0 ? expr.val.s : expr.val.i.toString();
        case "lambda":
            return `λ ${formatDebruijn(expr.val.body)}`;
        case "apply":
            return `(${formatDebruijn(expr.val[0])} ${formatDebruijn(expr.val[1])})`;
    }
}
function formatShort(expr, index = "0", space = false) {
    let ret = "";
    switch (expr.type) {
        case "var":
            if (index === "L")
                ret += ".";
            ret += expr.val.s;
            break;
        case "lambda":
            if (index !== "L")
                ret += " λ";
            ret += expr.val.param;
            if (space)
                ret += " ";
            ret += formatShort(expr.val.body, "L", space);
            break;
        case "apply":
            if (index === "L")
                ret += ".";
            if (index === "1")
                ret += " (";
            ret += formatShort(expr.val[0], "0", space);
            if (space)
                ret += " ";
            ret += formatShort(expr.val[1], "1", space);
            if (index === "1")
                ret += ")";
            break;
    }
    return ret;
}
function format(expr, fmt = "simple") {
    switch (fmt) {
        case "simple":
            return formatSimple(expr);
        case "debruijn":
            return formatDebruijn(expr);
        case "short":
            return formatShort(expr);
    }
}
function subst(expr, param, arg) {
    switch (expr.type) {
        case "var":
            return expr.val.s === param ? arg : expr;
        case "lambda":
            if (expr.val.param === param)
                return expr;
            expr.val.body = subst(expr.val.body, param, arg);
            return expr;
        case "apply":
            expr.val[0] = subst(expr.val[0], param, arg);
            expr.val[1] = subst(expr.val[1], param, arg);
            return expr;
    }
}
/**
 * index into the lambda expresion
 * e.g. in (lambda (f x) (f (f x)))
 * "" -> the whole thing
 * "L"   -> (f (f x))
 * "L0"  -> outer f
 * "L1"  -> (f x)
 * "L10" -> inner f
 * "L11" -> x
 */
function get(expr, index) {
    if (index.length === 0)
        return expr;
    let rest = index.slice(1);
    switch (index[0]) {
        case "L":
            if (expr.type != "lambda")
                throw new Error("bad index");
            return get(expr.val.body, rest);
        case "0":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[0], rest);
        case "1":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[1], rest);
        default:
            throw new Error("unknown index");
    }
}
/** puts val at index, doesn't work for starting index because javascript */
function swapout(expr, val, index) {
    if (index.length === 0)
        throw new Error("empty index");
    let parent = get(expr, index.slice(0, index.length - 1));
    switch (index[index.length - 1]) {
        case "L":
            if (parent.type != "lambda")
                throw new Error("bad index");
            parent.val.body = val;
            break;
        case "0":
            if (parent.type != "apply")
                throw new Error("bad index");
            parent.val[0] = val;
            break;
        case "1":
            if (parent.type != "apply")
                throw new Error("bad index");
            parent.val[1] = val;
            break;
    }
}
/** converts whole number to church numeral */
function church(n) {
    return parseSexpr(`lambda (f x) ${"(f".repeat(n)} x`);
}
// site start
/** each step of an expression being computed */
let history = [];
let env = {};
let envTable = document.getElementById("env");
let input = document.getElementById("input");
let output = document.getElementById("output");
{
    // sample starting state
    let exprStr = "(λa.(λb.a)) (λa.a)";
    input.textContent = exprStr;
    pushExpr(parse(exprStr));
}
{
    let sampleEnv = [
        ["S", "(lambda (a b c) a c (b c))"],
        ["K", "(lambda (a b) a)"],
        ["I", "(lambda (a) a)"],
        ["I*", "S K K"],
        ["i", "(lambda (x) x S K"],
        ["Ki", "(lambda (a b) b)"],
        ["M", "(lambda (a) a a)"],
        ["Omega", "M M"],
        ["Y", "(lambda (a) Y (lambda (b) a (b b)))"],
        ["True", "K"],
        ["False", "Ki"],
        ["Not", "(lambda (p) (p I))"],
        ["And", "(lambda (p q) (p q p))"],
        ["Or", "(lambda (p q) (p p q))"],
        ["Zero?", "(lambda (n) n (lambda (a) Ki) K)"],
        ["Succ", "(lambda (n f x) (f (n f x)))"],
        ["+", "(lambda (m n) (m Succ n))"],
        ["*", "(lambda (m n) (m (+ n) 0))"],
        ["^", "(lambda (b e) (e b))"],
        ["Cons", "(lambda (a b) (lambda (p) p a b))"],
        ["Car", "(lambda (l) (l K))"],
        ["Cdr", "(lambda (l) (l Ki))"],
        ["Nil", "(lambda (p) K)"],
        ["Nil?", "(lambda (l) (l (lambda (a b) Ki)))"],
    ];
    for (let it of sampleEnv) {
        let e = parseSexpr(it[1]);
        env[it[0]] = e;
        envTable.insertAdjacentHTML("beforeend", `<tr><td>${it[0]}</td><td>${format(e, "simple")}</td></tr>`);
    }
}
/** Add a new step to the expression being computed */
function pushExpr(expr) {
    history.push(expr);
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.appendChild(toHtml(expr));
    tr.appendChild(td);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "simple")}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "short")}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "debruijn")}</td>`);
    output.appendChild(tr);
}
/** returns an event handler for reducing the lambda expression at the index */
function clickLambda(index) {
    let length = history.length;
    return (event) => {
        event.stopPropagation(); // only reduce inner-most possible expression
        while (history.length > length) {
            // rewind expressions past this point
            history.pop();
            output.removeChild(output.lastChild);
        }
        if (history.length < length)
            throw new Error("unreachable");
        let expr = structuredClone(history[length - 1]);
        let subexpr = get(expr, index);
        let result;
        if (subexpr.type === "var" && subexpr.val.i === 0) {
            // free variabe
            let s = subexpr.val.s;
            if (s in env)
                result = structuredClone(env[s]);
            else if (/^\d+$/.test(s))
                result = church(+s); // church numeral support
        }
        else if (subexpr.type == "apply" && subexpr.val[0].type == "lambda") {
            let [l, r] = subexpr.val;
            result = subst(l.val.body, l.val.param, r);
        }
        if (result !== undefined) {
            if (index === "")
                pushExpr(result); // swapout doesn't work at empty index
            else {
                swapout(expr, result, index);
                pushExpr(expr);
            }
        }
    };
}
/**
 * converts a lambda into a structured div, with event listeners tied to divs that can compute parts of the expression.
 * the id parameter is used for convenience in recursion, don't pass anything in.
 */
function toHtml(expr, id = "") {
    let ret = document.createElement("div");
    ret.classList.add("expr");
    ret.id = id;
    switch (expr.type) {
        case "var":
            ret.classList.add("var");
            if (expr.val.i == 0) {
                ret.classList.add("free");
                ret.classList.add("clickable");
                ret.addEventListener("click", clickLambda(id));
            }
            ret.innerHTML = expr.val.s;
            return ret;
        case "lambda":
            ret.classList.add("lambda");
            let param = document.createElement("div");
            param.innerHTML = `λ${expr.val.param}.`;
            ret.append(param, toHtml(expr.val.body, id + "L"));
            return ret;
        case "apply":
            ret.classList.add("apply");
            let [l, r] = [
                toHtml(expr.val[0], id + "0"),
                toHtml(expr.val[1], id + "1"),
            ];
            ret.append(l, r);
            if (l.classList.contains("lambda")) {
                ret.classList.add("clickable");
                ret.addEventListener("click", clickLambda(id));
            }
            return ret;
    }
}
input.addEventListener("input", (event) => {
    let k = event.target.value;
    k = k.replace(/\\/g, "(λ");
    input.value = k;
    let expr;
    try {
        expr = parse(k);
        history = [];
        output.innerHTML = "";
        pushExpr(expr);
    }
    catch (err) {
        // console.log("invalid", k);
    }
});
