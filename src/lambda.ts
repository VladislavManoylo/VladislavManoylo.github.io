import { sexpr, toSexpr } from "./sexpr";

export type LambdaExpr =
  | { type: "id"; val: string }
  | { type: "lambda"; val: Lambda }
  | { type: "apply"; val: [LambdaExpr, LambdaExpr] };

export interface Lambda {
  arg: string;
  body: LambdaExpr;
}

export function toLambdaExpr(s: sexpr): LambdaExpr {
  if (!Array.isArray(s)) {
    return { type: "id", val: s };
  }
  s = s as sexpr[];
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
    params = (params as sexpr[]).map((x) => x as string);
    if (params.length == 0) {
      throw new Error("nullary lambda disallowed");
    }
    let body: LambdaExpr = toLambdaExpr(s.slice(2));
    let lambda: Lambda = { arg: params.pop() as string, body };
    while (params.length > 0) {
      lambda = {
        arg: params.pop() as string,
        body: { type: "lambda", val: lambda },
      };
    }
    return { type: "lambda", val: lambda };
  } else {
    // application
    let l: LambdaExpr[] = s.map((x) => toLambdaExpr(x));
    return l.slice(1).reduce((prev, curr) => {
      return { type: "apply", val: [prev, curr] };
    }, l[0]);
  }
}

export function exprString(expr: LambdaExpr): string {
  switch (expr.type) {
    case "id":
      return expr.val;
    case "lambda":
      return `λ${expr.val.arg}.${exprString(expr.val.body)}`;
    case "apply":
      return `(${exprString(expr.val[0])} ${exprString(expr.val[1])})`;
  }
}
