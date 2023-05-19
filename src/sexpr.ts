export type sexpr = sexpr[] | string;

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

export function toSexpr(str: string): sexpr {
  const t = tokens(str);
  const [s, i] = tokensToSexpr(t);
  if (i != t.length) {
    throw new Error(t.slice(i) + " not parsed");
  }
  return s;
}
