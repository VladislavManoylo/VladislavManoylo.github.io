function tokenize(text) {
    const re = /([0-9]+)|([a-z]+)|\S/g;
    let tokens = [];
    let m;
    while ((m = re.exec(text))) {
        const token = m[0];
        tokens.push(token);
    }
    return tokens;
}
export function coefToPolynomial(coefficients) {
    console.log(coefficients);
    return (x) => {
        let v = 1;
        let sum = 0;
        for (let i = 0; i < coefficients.length; i++) {
            sum += coefficients[i] * v;
            v *= x;
        }
        return sum;
    };
}
