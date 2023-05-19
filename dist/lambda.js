export function toLambdaExpr(s, e = []) {
    if (!Array.isArray(s)) {
        return { type: "var", val: { i: e.indexOf(s), s } };
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
        let params = s[1].map((x) => x);
        let body = toLambdaExpr(s.slice(2), [...params, ...e]);
        let lambda = { param: params.pop(), body };
        while (params.length > 0) {
            lambda = {
                param: params.pop(),
                body: { type: "lambda", val: lambda },
            };
        }
        return { type: "lambda", val: lambda };
    }
    else {
        // application
        let l = s.map((x) => toLambdaExpr(x));
        return l.slice(1).reduce((prev, curr) => {
            return { type: "apply", val: [prev, curr] };
        }, l[0]);
    }
}
export function format(expr) {
    switch (expr.type) {
        case "var":
            return expr.val.s;
        case "lambda":
            return `λ${expr.val.param}.${format(expr.val.body)}`;
        case "apply":
            return `(${format(expr.val[0])} ${format(expr.val[1])})`;
    }
}
function varNames(expr) {
    switch (expr.type) {
        case "var":
            return new Set();
        case "lambda":
            return varNames(expr.val.body).add(expr.val.param);
        case "apply":
            return new Set(...varNames(expr.val[0]), ...varNames(expr.val[1]));
    }
}
function nextName(expr, str) {
    let names = varNames(expr);
    while (names.has(str)) {
        str += "'";
    }
    return str;
}
function rename(expr, from, to = nextName(expr, from)) {
    switch (expr.type) {
        case "var":
            if (expr.val.s === from)
                expr.val.s = to;
            break;
        case "lambda":
            if (expr.val.param === from)
                expr.val.param = to;
            expr.val.body = rename(expr.val.body, from, to);
            break;
        case "apply":
            expr.val = [rename(expr.val[0], from, to), rename(expr.val[1], from, to)];
            break;
    }
    return expr;
}
export function evalLambda(expr, env) {
    // TODO: continuation instead of step-wise eval
    // console.log("call", exprString(expr), env);
    switch (expr.type) {
        case "var":
            return env[expr.val.s] || expr;
        case "lambda":
            if (expr.val.param in env) {
                expr = rename(expr, expr.val.param);
                if (expr.type != "lambda")
                    throw new Error("rename changed the type somehow");
            }
            expr.val.body = evalLambda(expr.val.body, env);
            return expr;
        case "apply":
            let fun = evalLambda(expr.val[0], env);
            let arg = evalLambda(expr.val[1], env);
            switch (fun.type) {
                case "lambda":
                    let newEnv = Object.assign(Object.assign({}, env), { [fun.val.param]: arg });
                    // console.log("env", env, "->", newEnv);
                    return evalLambda(fun.val.body, newEnv);
                case "var":
                case "apply":
                    return { type: "apply", val: [fun, arg] };
            }
    }
}
