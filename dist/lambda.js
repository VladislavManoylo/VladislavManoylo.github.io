import { toSexpr } from "./sexpr";
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
export function read(str) {
    return toLambdaExpr(toSexpr(str));
}
function formatSimple(expr) {
    switch (expr.type) {
        case "var":
            return expr.val.s;
        case "lambda":
            return `λ${expr.val.param}.${formatSimple(expr.val.body)}`;
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
export function format(expr, fmt = "debruijn") {
    switch (fmt) {
        case "simple":
            return formatSimple(expr);
        case "debruijn":
            return formatDebruijn(expr);
    }
}
export function evalLambda(expr, env = []) {
    // TODO: continuation instead of step-wise eval
    // console.log( "call", expr.type, format(expr), env.map((x) => format(x)));
    switch (expr.type) {
        case "var":
            return env[env.length - expr.val.i] || expr;
        case "lambda":
            expr.val.body = evalLambda(expr.val.body, env.concat(undefined));
            return expr;
        case "apply":
            // let fun: LambdaExpr = expr.val[0];
            let fun = evalLambda(expr.val[0], env);
            let arg = evalLambda(expr.val[1], env);
            switch (fun.type) {
                case "lambda":
                    return evalLambda(fun.val.body, env.concat(arg));
                case "var":
                case "apply":
                    return { type: "apply", val: [fun, arg] };
            }
    }
}
