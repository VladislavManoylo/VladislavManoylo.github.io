type sexpr = sexpr[] | string;

function tokens(str: string): string[] {
    let m = str.match(/[()]|[^()\s]+/g);
    return m === null ? [] : m;
}

function toSexpr(tokens: string[]): [sexpr, number] {
    let ret: sexpr = [];
    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i];
        if (t == "(") {
            const [s, i2] = toSexpr(tokens.slice(i + 1));
            ret.push(s);
            i += i2;
        }
        else if (t == ")") {
            return [ret, i + 1];
        }
        else {
            ret.push(t);
        }
    }
    return [ret, tokens.length];
}

function stringToSexpr(str: string): sexpr {
    const t = tokens(str);
    const [s, i] = toSexpr(t);
    if (i != t.length) {
        throw new Error(t.slice(i) + " not parsed");
    }
    return s;
}
// console.log(stringToSexpr("a bc 123 4+5"));
// console.log(stringToSexpr("(a (bc))"));
// console.log(stringToSexpr("a (bc (+ 1 2) 4"));

type Lambda = Lambda[] | number | string;

class Debruijn {
    args: string[];
    body: Lambda;

    debruijn(body: sexpr): Lambda {
        if (Array.isArray(body)) {
            return body.map(x => this.debruijn(x));
        }
        let id = this.args.indexOf(body as string);
        return id == -1 ? body : this.args.length - id;
    }

    constructor(expr: sexpr) {
        if (Array.isArray(expr)) {
            expr = expr as sexpr[];
            this.args = (expr[1] as sexpr[]).map(x => x as string);
            this.body = this.debruijn(expr[2] as sexpr);
        }
        else {
            this.args = [];
            this.body = expr;
        }
    }
    // console.log(toDebruijn(["lambda", ['f', 'x'], ['succ', ['f', 'x']]]));

    exprString(expr: Lambda = this.body): string {
        return Array.isArray(expr) 
            ? "(" + expr.map(x => this.exprString(x)).join(" ") + ")"
            : expr.toString();
    }

    toString(): string {
        return `[${this.args}] ${this.exprString()}`;
    }
}

class Console {
    env: Record<string, Debruijn> = {};
    expr: Debruijn;
    constructor(input: string) {
        let s : sexpr[] = stringToSexpr(input) as sexpr[];
        // assert(s.length % 2 == 1);
        for (let i = 0; i < s.length; i += 2) {
            this.env[s[i] as string] = new Debruijn(s[i+1]);
        }
        this.expr = new Debruijn(s[s.length-1]);
    }
    toString(): string {
        return this.expr.toString();
    }
}

let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
input.addEventListener("input", (event) => {
    let k: string = (event.target as HTMLInputElement).value;
    let c = new Console(k);
    output.textContent = c.toString();
});
