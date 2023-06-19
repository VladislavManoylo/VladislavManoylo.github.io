export function tokenize(text: string): string[] {
  const re = /([0-9.]+)|([a-z]+)|\S/g;
  let tokens: string[] = [];
  let m;
  while ((m = re.exec(text))) {
    const token = m[0];
    tokens.push(token);
  }
  return tokens;
}

/**
 * EXPR ::= SUM
 * SUM ::= SUM +/- PRODUCT
 *       | PRODUCT
 * PRODUCT ::= PRODUCT *|/ POWER
 *           | POWER
 * POWER ::= POWER ^ TERM
 * TERM ::= number
 *        | x
 *        | pi | e
 *        | ( EXPR )
 *        | sin|cos|... EXPR
 */
type Expr = Sum;
type Sum = Product | { op: "+" | "-"; lhs: Sum; rhs: Product };
type Product = Power | { op: "*" | "/"; lhs: Product; rhs: Power };
type Power = { lhs: Power; rhs: Term };
type Term = number | string | Expr | Fun;
type Fun = { fun: "sin" | "cos" | "tan" | "ln"; arg: Expr };

export function coefToPolynomial(
  coefficients: number[]
): (x: number) => number {
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
