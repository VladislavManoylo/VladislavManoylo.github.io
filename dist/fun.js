function tokenize(text) {
    const re = /([0-9]+)|([a-z]+)|\S/g;
    let tokens = [];
    let m;
    while (m = re.exec(text)) {
        const token = m[0];
        tokens.push(token);
    }
    return tokens;
}
export function dothing(text) {
    console.log(tokenize(text));
}
