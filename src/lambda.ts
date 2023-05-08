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

type LambdaExpr = string | Lambda | LambdaExpr[];
function getType(e: LambdaExpr): "id" | "lambda" | "list" {
  if (e instanceof Lambda) {
    return "lambda";
  }
  if (Array.isArray(e)) {
    return "list";
  }
  return "id";
}

function exprString(expr: LambdaExpr): string {
  switch (getType(expr)) {
    case "id":
      return expr as string;
    case "lambda":
      return (expr as Lambda).toString();
    case "list":
      return `(${(expr as LambdaExpr[]).map((x) => exprString(x)).join(" ")})`;
  }
}

function sexprToExpr(s: sexpr): LambdaExpr {
  if (!Array.isArray(s)) {
    return s;
  }
  s = s as sexpr[];
  if (s[0] != "lambda") {
    return s.map((x) => sexprToExpr(x));
  }
  return new Lambda(
    (s[1] as sexpr[]).map((x) => x as string),
    sexprToExpr(s[2])
  );
}

function apply(expr: LambdaExpr, param: string, arg: LambdaExpr): LambdaExpr {
  switch (getType(expr)) {
    case "id":
      return expr === param ? arg : expr;
    case "lambda":
      return expr;
    case "list":
      return (expr as LambdaExpr[]).map((x) => apply(x, param, arg));
  }
}

class Lambda {
  // TODO: change to unary only
  args: string[];
  body: LambdaExpr;

  constructor(args: string[], body: LambdaExpr) {
    this.args = args;
    this.body = body;
  }

  toString(): string {
    let args = this.args.length == 0 ? "" : `${this.args.join(".")}`;
    return `λ${args}.${exprString(this.body)}`;
  }
}

type Env = Record<string, LambdaExpr>;

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
  step() {
    switch (getType(this.expr)) {
      case "id": {
        let expr = this.expr as string;
        if (expr in this.env) {
          this.expr = this.env[expr];
          return;
        } else {
          throw new Error("can't find " + this.expr);
        }
      }
      case "lambda":
        return;
      case "list": {
        let expr = this.expr as LambdaExpr[];
        let fun = expr[0];
        if (!(fun instanceof Lambda)) {
          expr[0] = this.env[fun as string];
          return;
        }
        fun.args = fun.args.slice(1);
        fun.body = apply(fun.body, fun.args[0], expr[1]);
        if (fun.args.length == 0) {
          if (expr.length > 2) {
            throw new Error("Too many arguments");
          }
          this.expr = fun.body;
          return;
        }
        this.expr = expr.slice(2);
      }
    }
  }
}

let start = `id (lambda (x) x)
t (lambda (x y) x)
f (lambda (x y) y)
0 (lambda (f x) x)
1 (lambda (f x) (f x))
2 (lambda (f x) (f (f x)))
++ (lambda (n) (lambda (f x) (f (n f x))))
3 (++ 2)
(++ 3)
`;

let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
let button = document.getElementById("step") as HTMLButtonElement;

let interpreter: Interpreter = new Interpreter(start);
input.textContent = start;
output.textContent = interpreter.toString();

input.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  interpreter = new Interpreter(k);
  output.textContent = interpreter.toString();
});
button.addEventListener("click", () => {
  interpreter.step();
  output.textContent += "\n" + interpreter.toString();
});
