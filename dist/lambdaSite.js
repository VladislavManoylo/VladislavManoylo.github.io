import { format, read } from "./lambda.js";
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
/** each step of an expression being computed */
let history = [];
let input = document.getElementById("input");
let output = document.getElementById("output");
{
    // sample starting state
    let exprStr = `(lambda (n f x) f (n f x)) (lambda (f x) f x)`;
    input.textContent = exprStr;
    pushExpr(read(exprStr));
}
/** Add a new step to the expression being computed */
function pushExpr(expr) {
    history.push(expr);
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.appendChild(toHtml(expr));
    tr.appendChild(td);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr)}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td>${format(expr, "debruijn")}</td>`);
    output.appendChild(tr);
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
    switch (index[0]) {
        case "L":
            if (expr.type != "lambda")
                throw new Error("bad index");
            return get(expr.val.body, index.slice(1));
        case "0":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[0], index.slice(1));
        case "1":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[1], index.slice(1));
        default:
            return expr;
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
/** returns a copy of the given expr, but with val at the id location
 * TODO: if expressions could be modified with get(...), this function could be removed*/
function swapout(expr, id, val) {
    switch (id[0]) {
        case "L":
            if (expr.type != "lambda")
                throw new Error(`bad index ${format(expr)} ${id}`);
            return {
                type: expr.type,
                val: {
                    param: expr.val.param,
                    body: swapout(expr.val.body, id.slice(1), val),
                },
            };
        case "0":
            if (expr.type != "apply")
                throw new Error(`bad index ${format(expr)} ${id}`);
            return {
                type: expr.type,
                val: [swapout(expr.val[0], id.slice(1), val), expr.val[1]],
            };
        case "1":
            if (expr.type != "apply")
                throw new Error(`bad index ${format(expr)} ${id}`);
            return {
                type: expr.type,
                val: [expr.val[0], swapout(expr.val[1], id.slice(1), val)],
            };
        default:
            return val;
    }
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
            ret.classList.add(expr.val.i == 0 ? "free" : "bound");
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
            let length = history.length;
            if (l.classList.contains("lambda")) {
                ret.addEventListener("click", () => {
                    if (history.length > length)
                        history = history.slice(0, length);
                    if (history.length < length)
                        throw new Error("unreachable");
                    let expr = history[length - 1];
                    let subexpr = get(expr, id);
                    if (subexpr.type != "apply" || subexpr.val[0].type != "lambda")
                        throw new Error("can't apply - unreachable");
                    let [l, r] = subexpr.val;
                    let result = subst(l.val.body, l.val.param, r);
                    pushExpr(swapout(expr, id, result));
                });
            }
            return ret;
    }
}
input.addEventListener("input", (event) => {
    let k = event.target.value;
    let expr;
    try {
        expr = read(k);
        history = [];
        output.innerHTML = "";
        pushExpr(expr);
    }
    catch (err) {
        // console.log("invalid", k);
    }
});
