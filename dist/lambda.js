export function toLambdaExpr(s) {
    if (!Array.isArray(s)) {
        return { type: "id", val: s };
    }
    s = s;
    if (s.length == 0) {
        throw new Error("empty expr");
    }
    if (s.length == 1) { // unnesting
        return toLambdaExpr(s[0]);
    }
    if (s[0] == "lambda") {
        // (lambda (params...) body)
        let params = s[1];
        if (!Array.isArray(params)) {
            throw new Error("need parameters");
        }
        params = params.map((x) => x);
        if (params.length == 0) {
            throw new Error("nullary lambda disallowed");
        }
        let body = toLambdaExpr(s.slice(2));
        let lambda = { arg: params.pop(), body };
        while (params.length > 0) {
            lambda = {
                arg: params.pop(),
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
export function exprString(expr) {
    switch (expr.type) {
        case "id":
            return expr.val;
        case "lambda":
            return `λ${expr.val.arg}.${exprString(expr.val.body)}`;
        case "apply":
            return `(${exprString(expr.val[0])} ${exprString(expr.val[1])})`;
    }
}
export function evalLambda(expr, env) {
    // TODO: continuation instead of step-wise eval
    // console.log("call", exprString(expr), env);
    switch (expr.type) {
        case "id":
            // console.log("lookup", expr.val);
            let f = env[expr.val];
            if (f === undefined)
                return expr;
            return f;
        case "lambda":
            expr.val.body = evalLambda(expr.val.body, env);
            return expr;
        case "apply":
            let fun = evalLambda(expr.val[0], env);
            let arg = evalLambda(expr.val[1], env);
            switch (fun.type) {
                case "lambda":
                    // let newEnv = { ...env, [fun.val.arg]: arg };
                    // console.log("env", env, "->", newEnv);
                    return evalLambda(fun.val.body, Object.assign(Object.assign({}, env), { [fun.val.arg]: arg }));
                case "id":
                case "apply":
                    return { type: "apply", val: [fun, arg] };
            }
    }
}
