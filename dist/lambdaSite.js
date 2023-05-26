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
let exprStr = `(lambda (n f x) f (n f x)) (lambda (f x) f x)`;
let history = [read(exprStr)];
let input = document.getElementById("input");
let output = document.getElementById("output");
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
console.log("look", format(history[0]));
console.log("look", format(get(history[0], "")));
// id is the index of each element
// e.g. in (lambda (f x) (f (f x)))
// _ -> the whole thing
// L -> (f (f x))
// L0 -> outer f
// L1 -> (f x)
// L10 -> inner f
// L11 -> x
function toHtml(expr, id = "") {
    let ret = document.createElement("span");
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
            let param = document.createElement("span");
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
                    console.log("apply", id, format(get(history[0], id)));
                });
            }
            return ret;
    }
}
input.textContent = exprStr;
output.appendChild(toHtml(history[0]));
input.addEventListener("input", (event) => {
    let k = event.target.value;
    try {
        let expr = read(k);
        history = [expr];
    }
    catch (err) {
        // console.log("invalid", k);
    }
    output.innerHTML = "";
    output.appendChild(toHtml(history[0]));
});
