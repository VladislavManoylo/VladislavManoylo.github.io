const verbose = false;
const web = true;

//TODO: write tests
type sexpr = sexpr[] | string;

function tokens(str: string): string[] {
  let m = str.match(/[()]|[^()\s]+/g);
  return m === null ? [] : m;
}

function tokensToSexpr(tokens: string[]): [sexpr, number] {
  let ret: sexpr[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    if (t == "(") {
      const [s, i2] = tokensToSexpr(tokens.slice(i + 1));
      ret.push(s);
      i += i2;
    } else if (t == ")") {
      return [ret, i + 1];
    } else {
      ret.push(t);
    }
  }
  return [ret, tokens.length];
}

function stringToSexpr(str: string): sexpr {
  const t = tokens(str);
  const [s, i] = tokensToSexpr(t);
  if (i != t.length) {
    throw new Error(t.slice(i) + " not parsed");
  }
  return s;
}
// console.log(stringToSexpr("a bc 123 4+5"));
// console.log(stringToSexpr("(a (bc))"));
// console.log(stringToSexpr("a (bc (+ 1 2) 4"));

type LambdaExpr =
  | { type: "id"; val: string }
  | { type: "lambda"; val: Lambda }
  | { type: "apply"; val: [LambdaExpr, LambdaExpr] };

function exprString(expr: LambdaExpr): string {
  switch (expr.type) {
    case "id":
      return expr.val;
    case "lambda":
      return `λ${expr.val.arg}.${exprString(expr.val.body)}`;
    case "apply":
      return `(${exprString(expr.val[0])} ${exprString(expr.val[1])})`;
  }
}

function sexprToExpr(s: sexpr): LambdaExpr {
  if (!Array.isArray(s)) {
    return { type: "id", val: s };
  }
  s = s as sexpr[];
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
    let body: LambdaExpr = sexprToExpr(s[2]);
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
    if (s.length < 2) {
      throw new Error("not enough to apply " + s);
    }
    let l: LambdaExpr[] = s.map((x) => sexprToExpr(x));
    return l.slice(1).reduce((prev, curr) => {
      return { type: "apply", val: [prev, curr] };
    }, l[0]);
  }
}

interface Lambda {
  arg: string;
  body: LambdaExpr;
}

function evalLambda(expr: LambdaExpr, env: Env): LambdaExpr {
  // TODO: don't mutate expr
  // TODO: continuation instead of step-wise eval
  switch (expr.type) {
    case "id":
      if (verbose) console.log(expr.type, expr.val);
      let f = env[expr.val];
      if (f === undefined) return expr;
      else if (f.type == expr.type && f.val == expr.val) return f;
      else return evalLambda(f, env);
    case "lambda":
      if (verbose) console.log(expr.type, expr.val);
      expr.val.body = evalLambda(expr.val.body, env);
      return expr;
    case "apply":
      if (verbose) console.log(expr.type, expr.val);
      let fun: LambdaExpr = evalLambda(expr.val[0], env);
      let arg: LambdaExpr = evalLambda(expr.val[1], env);
      switch (fun.type) {
        case "lambda":
          return evalLambda(fun.val.body, { ...env, [fun.val.arg]: arg });
        case "id":
        case "apply":
          return { type: "apply", val: [fun, arg] };
      }
  }
}

type Env = { [key: string]: LambdaExpr };

class Interpreter {
  env: Env = {};
  expr: LambdaExpr;
  constructor(input: string) {
    let s: sexpr[] = stringToSexpr(input) as sexpr[];
    if (s.length % 2 == 0) {
      throw new Error("missing a body expression " + s.length);
    }
    this.expr = sexprToExpr(s.pop()!);
    for (let i = 0; i < s.length; i += 2) {
      this.env[s[i] as string] = sexprToExpr(s[i + 1]);
    }
  }
  toString(): string {
    return exprString(this.expr);
  }
  eval() {
    this.expr = evalLambda(this.expr, this.env);
    // TODO: keep history when evalStep doesn't mutate
  }
}

let start = `id (lambda (x) x)
true (lambda (x y) x)
false (lambda (x y) y)
0 (lambda (f x) x)
1 (lambda (f x) (f x))
2 (lambda (f x) (f (f x)))
++ (lambda (n f x) (f (n f x)))
3 (++ 2)
3
`;

let interpreter: Interpreter = new Interpreter(start);

if (web) {
  let output = document.getElementById("output") as HTMLTextAreaElement;
  let input = document.getElementById("input") as HTMLTextAreaElement;
  let button = document.getElementById("step") as HTMLButtonElement;

  input.textContent = start;
  output.textContent = interpreter.toString();

  input.addEventListener("input", (event) => {
    let k: string = (event.target as HTMLInputElement).value;
    interpreter = new Interpreter(k);
    output.textContent = interpreter.toString();
  });
  button.addEventListener("click", () => {
    interpreter.eval();
    output.textContent += "\n" + interpreter.toString();
  });
} else {
  interpreter.eval();
  console.log(interpreter.toString());
}
