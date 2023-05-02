function tokenize(text: string): string[] {
    const re = /([0-9]+)|([a-z]+)|\S/g
    let tokens: string[] = [];
    let m;
    while (m = re.exec(text)) {
        const token = m[0];
        tokens.push(token);
    }
    return tokens;
}

export function dothing(text: string) {
    console.log(tokenize(text));
}
