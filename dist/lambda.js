export function toLambdaExpr(s) {
    if (!Array.isArray(s)) {
        return { type: "id", val: s };
    }
    s = s;
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
        let body = toLambdaExpr(s[2]);
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
        if (s.length < 2) {
            throw new Error("not enough to apply " + s);
        }
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
