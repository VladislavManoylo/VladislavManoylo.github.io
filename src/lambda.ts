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

interface Debruijn {
    args: number;
    body: Lambda;
}

function toDebruijnHelp(args: string[], body: sexpr): Debruijn {
    if (Array.isArray(body)) {
        let newBody: Lambda[] = [];
        for (let it of body) {
            newBody.push(toDebruijnHelp(args, it).body);
        }
        return {args: args.length, body: newBody};
    }
    else {
        body = body as string;
        let id = args.indexOf(body);
        if (id != -1) {
            return {args: args.length, body: args.length - id};
        }
        return {args: args.length, body: body};
    }
}
// console.log(toDebruijnHelp(['f', 'x'], ['succ', ['f', 'x']]));

function toDebruijn(expr: sexpr): Debruijn {
    if (Array.isArray(expr)) {
        expr = expr as sexpr[];
        let args = (expr[1] as sexpr[]).map(x => x as string);
        let body = expr[2] as sexpr;
        return toDebruijnHelp(args, body);
    }
    else {
        return {args: 0, body: expr};
    }
}
// console.log(toDebruijn(["lambda", ['f', 'x'], ['succ', ['f', 'x']]]));

class Console {
    env: Record<string, Debruijn> = {};
    expr: Debruijn;
    constructor(input: string) {
        let s : sexpr[] = stringToSexpr(input) as sexpr[];
        // assert(s.length % 2 == 1);
        for (let i = 0; i < s.length; i += 2) {
            this.env[s[i] as string] = toDebruijn(s[i+1]);
        }
        this.expr = toDebruijn(s[s.length-1]);
    }
    toString(): string {
        return `[${this.expr.args}] ${this.expr.body.toString()}`;
    }
}

let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
input.addEventListener("input", (event) => {
    let k: string = (event.target as HTMLInputElement).value;
    let c = new Console(k);
    output.textContent = c.toString();
});
