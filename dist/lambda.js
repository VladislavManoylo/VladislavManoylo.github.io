"use strict";
function tokens(str) {
    let m = str.match(/[()]|[^()\s]+/g);
    return m === null ? [] : m;
}
function toSexpr(tokens) {
    let ret = [];
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
function stringToSexpr(str) {
    const t = tokens(str);
    const [s, i] = toSexpr(t);
    if (i != t.length) {
        throw new Error(t.slice(i) + " not parsed");
    }
    return s;
}
function toDebruijn(args, body) {
    if (Array.isArray(body)) {
        let newBody = [];
        for (let it of body) {
            newBody.push(toDebruijn(args, it).body);
        }
        return { args: args.length, body: newBody };
    }
    else {
        body = body;
        let id = args.indexOf(body);
        if (id != -1) {
            return { args: args.length, body: args.length - id };
        }
        return { args: args.length, body: body };
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
