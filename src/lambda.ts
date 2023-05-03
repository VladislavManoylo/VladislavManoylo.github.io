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

type Env = Record<string, Debruijn>;

function toDebruijn(args: string[], body: sexpr): Debruijn {
    if (Array.isArray(body)) {
        let newBody: Lambda[] = [];
        for (let it of body) {
            newBody.push(toDebruijn(args, it).body);
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
console.log(toDebruijn(['f', 'x'], ['succ', ['f', 'x']]));

/*
    let output = document.getElementById("output") as HTMLTextAreaElement;
let input = document.getElementById("input") as HTMLTextAreaElement;
input.addEventListener("input", (event) => {
    let k: string = (event.target as HTMLInputElement).value;
    let s: sexpr = stringToSexpr(k);
    console.log(s);
    output.textContent = s.toString();
});
*/
