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
    return new Lambda((s[1] as sexpr[]).map(x => x as string), sexprToExpr(s[2]));
  }
  return s.map(x => sexprToExpr(x));
}

class Lambda {
  args: string[];
  body: LambdaExpr;

  constructor(args: string[], body: LambdaExpr) {
    this.args = args;
    this.body = body;
  }

  toString(): string {
    let args = this.args.length == 0 ? "" : `[${this.args}]`;
    return `${args} ${exprString(this.body)}`;
  }
}

class Console {
  env: Record<string, LambdaExpr> = {};
  expr: LambdaExpr;
  constructor(input: string) {
    let s: sexpr[] = stringToSexpr(input) as sexpr[];
    if (s.length % 2 != 1) {
      throw new Error("need body expression");
    }
    for (let i = 0; i < s.length; i += 2) {
      this.env[s[i] as string] = sexprToExpr(s[i+1]);
    }
    this.expr = sexprToExpr(s[s.length - 1]);
  }
  toString(): string {
    return exprString(this.expr);
  }
}

let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
input.addEventListener("input", (event) => {
  let k: string = (event.target as HTMLInputElement).value;
  let c = new Console(k);
  output.textContent = c.toString();
});
