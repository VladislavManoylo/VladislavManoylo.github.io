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
/** each subexpression index that can be evaluated on each line */
let clickableSubexprs = [];
let env = {};
let envTable = document.getElementById("env");
let input = document.getElementById("input");
let output = document.getElementById("output");
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
        ["Cons", "(lambda (a b) (lambda (p) p a b))"],
        ["Car", "(lambda (l) (l K))"],
        ["Cdr", "(lambda (l) (l Ki))"],
        ["Nil", "(lambda (p) K)"],
        ["Nil?", "(lambda (l) (l (lambda (a b) Ki)))"],
        ["Not", "(lambda (p) (p I))"],
        ["And", "(lambda (p q) (p q p))"],
        ["Or", "(lambda (p q) (p p q))"],
        ["Zero?", "(lambda (n) n (lambda (a) Ki) K)"],
        ["Succ", "(lambda (n f x) (f (n f x)))"],
        // ["Pred", "(lambda (n) (Cdr (n (lambda (l) (Cons (Cdr l) (Succ (Cdr l)))) (Cons 0 0))))"],
        ["+", "(lambda (m n) (m Succ n))"],
        ["*", "(lambda (m n) (m (+ n) 0))"],
        ["^", "(lambda (b e) (e b))"],
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
    clickableSubexprs.push([]); // is filled by toHtml
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.appendChild(toHtml(expr));
    //console.log("filled", clickableSubexprs[clickableSubexprs.length-1]);
    tr.appendChild(td);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "simple")}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "short")}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "debruijn")}</td>`);
    output.appendChild(tr);
}
function popExpr() {
    history.pop();
    clickableSubexprs.pop();
    output.removeChild(output.lastChild);
}
function evalAt(i, index) {
    while (history.length > i)
        popExpr();
    if (history.length < i)
        throw new Error("unreachable");
    let expr = structuredClone(history[i - 1]);
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
    scrollTo(0, document.body.scrollHeight);
}
/**
 * converts a lambda into a structured div, with event listeners tied to divs that can compute parts of the expression.
 * only used by pushExpr, is a separate function for convenience and recursion
 */
function toHtml(expr, id = "") {
    let ret = document.createElement("div");
    ret.classList.add("expr");
    ret.id = id;
    let click = false;
    switch (expr.type) {
        case "var":
            ret.classList.add("var");
            if (expr.val.i == 0) {
                ret.classList.add("free");
                if (expr.val.s in env || expr.val.s.match(/^\d+$/))
                    click = true;
            }
            ret.innerHTML = expr.val.s;
            break;
        case "lambda":
            ret.classList.add("lambda");
            let param = document.createElement("div");
            param.innerHTML = `λ${expr.val.param}.`;
            ret.append(param, toHtml(expr.val.body, id + "L"));
            break;
        case "apply":
            ret.classList.add("apply");
            let [l, r] = [
                toHtml(expr.val[0], id + "0"),
                toHtml(expr.val[1], id + "1"),
            ];
            ret.append(l, r);
            if (l.classList.contains("lambda"))
                click = true;
            break;
    }
    let i = history.length;
    if (clickableSubexprs.length !== i)
        throw new Error("unreachable");
    if (click) {
        ret.classList.add("clickable");
        clickableSubexprs[i - 1].push(id);
        ret.addEventListener("click", (event) => {
            event.stopPropagation();
            evalAt(i, id);
        });
    }
    return ret;
}
function inputText(str) {
    str = str.replace(/\\/g, "(λ");
    input.value = str;
    let expr;
    try {
        expr = parse(str);
        history = [];
        clickableSubexprs = [];
        output.innerHTML = "";
        pushExpr(expr);
    }
    catch (err) {
        // console.log("invalid", k);
    }
    input.focus();
}
input.addEventListener("input", (event) => {
    inputText(event.target.value);
});
inputText("(λa.(λb.a)) (λa.a)");
/** returns a comparator to choose between 2 strings for an evaluation strategy
* e.g. an inner left strategy will choose L00 over L01 because it's more left
* an inner right strategy will choose 0100 010 because it's more inner*/
function makeStrategy(inner, left) {
    return (a, b) => {
        let end = a.length < b.length ? a.length : b.length;
        for (let i = 0; i < end; i++) {
            if (a[i] !== b[i])
                return left === (a[i] === "0");
        }
        return inner === a.length > end;
    };
}
function best(l, cmp) {
    return l.reduce((found, current) => {
        if (cmp(found, current))
            return found;
        return current;
    });
}
document.addEventListener("keypress", (event) => {
    var _a;
    if (event.key === "Enter" && event.shiftKey) {
        setTimeout(() => {
            input.blur();
        }, 100);
        return;
    }
    let strategies = {
        "1": makeStrategy(true, true),
        "2": makeStrategy(false, true),
        "3": makeStrategy(true, false),
        "4": makeStrategy(false, false), // outer left
    };
    if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.matches("body")) {
        let i = history.length;
        if (event.key in strategies) {
            let row = clickableSubexprs[i - 1];
            if (row.length === 0)
                return;
            evalAt(i, best(row, strategies[event.key]));
            return;
        }
        switch (event.key) {
            case "-":
                if (i > 0)
                    popExpr();
                if (i == 1)
                    inputText("");
                break;
            case "`":
                input.focus();
                break;
        }
    }
});
