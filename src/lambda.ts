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

type LambdaExpr = LambdaExpr[] | Lambda | string;

function exprString(expr: LambdaExpr): string {
  if (expr instanceof Lambda) {
    return expr.toString();
  }
  if (Array.isArray(expr)) {
    return "(" + expr.map((x) => exprString(x)).join(" ") + ")";
  }
  return expr;
}

function sexprToExpr(s: sexpr): LambdaExpr {
  if (!Array.isArray(s)) {
    return s;
  }
  s = s as sexpr[];
  if (s[0] == "lambda") {
    return new Lambda(
      (s[1] as sexpr[]).map((x) => x as string),
      sexprToExpr(s[2])
    );
  }
  return s.map((x) => sexprToExpr(x));
}

function apply(expr: LambdaExpr, param: string, arg: LambdaExpr): LambdaExpr {
  if (expr instanceof Lambda) {
    return expr;
  }
  if (Array.isArray(expr)) {
    return expr.map((x) => apply(x, param, arg));
  }
  return expr === param ? arg : expr;
}

class Lambda { // TODO: change to unary only
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

// type Env = Record<string, LambdaExpr>;
type Env = { [key: string]: LambdaExpr };
// type Env = new Map<string, LambdaExpr>();

class Interpreter {
  env: Env = {};
  expr: LambdaExpr;
  constructor(input: string) {
    let s: sexpr[] = stringToSexpr(input) as sexpr[];
    if (s.length % 2 == 0) {
      throw new Error("missing a body expression " + s.length);
    }
    this.expr = sexprToExpr(s.pop()!);
    console.log("adding", this.expr);
    for (let i = 0; i < s.length; i += 2) {
      this.env[s[i] as string] = sexprToExpr(s[i + 1]);
    }
  }
  toString(): string {
    return exprString(this.expr);
  }
  step() {
    if (this.expr instanceof Lambda) {
      return;
    }
    if (!Array.isArray(this.expr)) {
      if (this.expr in this.env) {
        this.expr = this.env[this.expr];
        return;
      } else {
        throw new Error("can't find " + this.expr);
      }
    }
    let fun = this.expr[0];
    if (!(fun instanceof Lambda)) {
      this.expr[0] = this.env[fun as string];
      return;
    }
    if (this.expr.length < 2) {
      throw new Error("Not enough arguments");
    }
    fun.args = fun.args.slice(1);
    fun.body = apply(fun.body, fun.args[0], this.expr[1]);
    if (fun.args.length == 0) {
      if (this.expr.length > 2) {
        throw new Error("Too many arguments");
      }
      this.expr = fun.body;
      return;
    }
    this.expr = this.expr.slice(2);
  }
}

let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
let button = document.getElementById("step") as HTMLButtonElement;
let interpreter: Interpreter = new Interpreter("x");
input.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  interpreter = new Interpreter(k);
  output.textContent = interpreter.toString();
});
button.addEventListener("click", () => {
  interpreter.step();
  output.textContent += "\n" + interpreter.toString();
});
