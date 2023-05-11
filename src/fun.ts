function tokenize(text: string): string[] {
  const re = /([0-9]+)|([a-z]+)|\S/g;
  let tokens: string[] = [];
  let m;
  while ((m = re.exec(text))) {
    const token = m[0];
    tokens.push(token);
  }
  return tokens;
}

export function coefToPolynomial(
  coefficients: number[]
): (x: number) => number {
  console.log(coefficients);
  return (x: number) => {
    let v = 1;
    let sum = 0;
    for (let i = 0; i < coefficients.length; i++) {
      sum += coefficients[i] * v;
      v *= x;
    }
    return sum;
  };
}
