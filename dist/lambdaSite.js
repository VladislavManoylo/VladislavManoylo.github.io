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
let history = [];
let input = document.getElementById("input");
let output = document.getElementById("output");
{
    // sample starting state
    let exprStr = `(lambda (n f x) f (n f x)) (lambda (f x) f x)`;
    input.textContent = exprStr;
    pushRow(read(exprStr));
}
function pushRow(expr) {
    history.push(expr);
    let tr = document.createElement("tr");
    let td1 = document.createElement("td");
    td1.appendChild(toHtml(expr));
    let td2 = document.createElement("td");
    td2.innerHTML = format(expr);
    let td3 = document.createElement("td");
    td3.innerHTML = format(expr, "debruijn");
    tr.append(td1, td2, td3);
    output.appendChild(tr);
}
function get(expr, id) {
    switch (id[0]) {
        case "L":
            if (expr.type != "lambda")
                throw new Error("bad index");
            return get(expr.val.body, id.slice(1));
        case "0":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[0], id.slice(1));
        case "1":
            if (expr.type != "apply")
                throw new Error("bad index");
            return get(expr.val[1], id.slice(1));
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
// id is the index of each element
// e.g. in (lambda (f x) (f (f x)))
// _ -> the whole thing
// L -> (f (f x))
// L0 -> outer f
// L1 -> (f x)
// L10 -> inner f
// L11 -> x
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
            ret.append("(", l, r, ")");
            if (l.classList.contains("lambda")) {
                ret.addEventListener("click", () => {
                    let expr = get(history[0], id);
                    console.log("apply", id, format(expr));
                    if (expr.type != "apply" || expr.val[0].type != "lambda")
                        throw new Error("can't apply");
                    let [l, r] = expr.val;
                    let result = subst(l.val.body, l.val.param, r);
                    pushRow(result);
                    console.log("yep", id, format(result));
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
        pushRow(expr);
    }
    catch (err) {
        // console.log("invalid", k);
    }
});
