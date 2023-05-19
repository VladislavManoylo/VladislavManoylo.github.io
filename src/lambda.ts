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
  if (s.length == 1) {
    // unnesting
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

export type Env = Record<string, LambdaExpr>;

function varNames(expr: LambdaExpr): Set<string> {
  switch (expr.type) {
    case "id":
      return new Set<string>();
    case "lambda":
      return varNames(expr.val.body).add(expr.val.arg);
    case "apply":
      return new Set<string>(
        ...varNames(expr.val[0]),
        ...varNames(expr.val[1])
      );
  }
}

function nextName(expr: LambdaExpr, str: string): string {
  let names = varNames(expr);
  while (names.has(str)) {
    str += "'";
  }
  return str;
}

function rename(
  expr: LambdaExpr,
  from: string,
  to: string = nextName(expr, from)
): LambdaExpr {
  switch (expr.type) {
    case "id":
      if (expr.val === from) expr.val = to;
      break;
    case "lambda":
      if (expr.val.arg === from) expr.val.arg = to;
      expr.val.body = rename(expr.val.body, from, to);
      break;
    case "apply":
      expr.val = [rename(expr.val[0], from, to), rename(expr.val[1], from, to)];
      break;
  }
  return expr;
}

export function evalLambda(expr: LambdaExpr, env: Env): LambdaExpr {
  // TODO: continuation instead of step-wise eval
  // console.log("call", exprString(expr), env);
  switch (expr.type) {
    case "id":
      return env[expr.val] || expr;
    case "lambda":
      if (expr.val.arg in env) {
        expr = rename(expr, expr.val.arg);
        if (expr.type != "lambda")
          throw new Error("rename changed the type somehow");
      }
      expr.val.body = evalLambda(expr.val.body, env);
      return expr;
    case "apply":
      let fun: LambdaExpr = evalLambda(expr.val[0], env);
      let arg: LambdaExpr = evalLambda(expr.val[1], env);
      switch (fun.type) {
        case "lambda":
          let newEnv = { ...env, [fun.val.arg]: arg };
          // console.log("env", env, "->", newEnv);
          return evalLambda(fun.val.body, newEnv);
        case "id":
        case "apply":
          return { type: "apply", val: [fun, arg] };
      }
  }
}
