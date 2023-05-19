import { evalLambda, format, read, Env } from "../src/lambda";

function reformat(str: string): string {
  return format(read(str));
}

test("format id", () => {
  expect(reformat("x")).toBe("x");
  expect(reformat("1")).toBe("1");
});

test("format apply", () => {
  expect(reformat("(x y)")).toBe("(x y)");
  expect(reformat("x y")).toBe("(x y)");
  expect(reformat("x y z")).toBe("((x y) z)");
  expect(reformat("x (y z)")).toBe("(x (y z))");
});

test("format lambda", () => {
  expect(reformat("lambda (x) x")).toBe("λx.x");
  expect(reformat("(lambda (x) (x))")).toBe("λx.x");
  expect(reformat("(lambda (x y) x)")).toBe("λx.λy.x");
  expect(reformat("(lambda (x) (lambda (y) x))")).toBe("λx.λy.x");
  expect(reformat("(lambda (x) ?)")).toBe("λx.?");
});

test("format", () => {
  expect(reformat("(lambda (f x) f x)")).toBe("λf.λx.(f x)");
  expect(reformat("(lambda (x) y)")).toBe("λx.y"); // has a free variable, but parser doesn't check
  expect(reformat("(lambda (f) (lambda (x) f x))")).toBe("λf.λx.(f x)");
  expect(reformat("(lambda (a) a (lambda (b) b))")).toBe("λa.(a λb.b)");
  expect(reformat("(lambda (a) a (lambda (b) b a))")).toBe("λa.(a λb.(b a))");
});

test("format errors", () => {
  expect(() => {
    reformat("(lambda (x) )");
  }).toThrowError("empty expr");
  expect(() => {
    reformat("(lambda () x)");
  }).toThrow("need parameters");
  expect(() => {
    reformat("(lambda x x)");
  }).toThrow("need parameters");
});

function evaltest(str: string, env: Env = {}): string {
  return format(evalLambda(read(str), env));
}

test("eval simple", () => {
  // expect(evaltest("(lambda (x) x) (lambda (y) y) (lambda (z) z)")).toBe("λz.z");
  expect(evaltest("a")).toBe("a");
  expect(evaltest("(lambda (x) x)")).toBe("λx.x");
  expect(evaltest("(lambda (x) y)")).toBe("λx.y");
  expect(evaltest("(lambda (x) x) a")).toBe("a");
  expect(evaltest("(lambda (x) y) a")).toBe("y");
  expect(evaltest("(lambda (x y) x) a b")).toBe("a");
  expect(evaltest("(lambda (x y) y) a b")).toBe("b");
  expect(evaltest("(lambda (x y) x) a")).toBe("λy.a");
});

test("eval name collision", () => {
  expect(evaltest("(lambda (x x) x) a b")).toBe("b");
});

test("eval num", () => {
  let n: string[] = [
    "(lambda (f x) x)",
    "(lambda (f x) (f x))",
    "(lambda (f x) (f (f x)))",
    "(lambda (f x) (f (f (f x))))",
  ];
  let nf: string[] = [
    "λf.λx.x",
    "λf.λx.(f x)",
    "λf.λx.(f (f x))",
    "λf.λx.(f (f (f x)))",
  ];
  let succ: string = "(lambda (n f x) (f (n f x)))";
  let plus: string = `(lambda (m n) ((m ${succ}) n))`;
  expect(evaltest(`(${succ} ${n[0]})`)).toBe(nf[1]);
  expect(evaltest(`(${succ} ${n[1]})`)).toBe(nf[2]);
  expect(evaltest(`(${succ} ${n[2]})`)).toBe(nf[3]);
  expect(evaltest(`(${succ} (${succ} ${n[0]}))`)).toBe(nf[2]);
  expect(evaltest(`(${succ} (${succ} ${n[1]}))`)).toBe(nf[3]);
  expect(evaltest(`(${succ} (${succ} (${succ} ${n[0]})))`)).toBe(nf[3]);
  expect(evaltest(`(${plus} ${n[0]} ${n[0]})`)).toBe(nf[0]);
  expect(evaltest(`(${plus} ${n[0]} ${n[1]})`)).toBe(nf[1]);
  // expect(evaltest(`(${plus} ${n[1]} ${n[0]})`)).toBe(nf[1]);
  // for (let i = 0; i < 4; i++) {
  //   for (let j = 0; j < 4 - i; j++) {
  //     expect(evaltest(`(${plus} ${n[i]} ${n[j]})`)).toBe(nf[i + j]);
  //   }
  // }
});

test("eval bool", () => {
  let b = ["(lambda (x y) y)", "(lambda (x y) x)"];
  let bf = ["λx.λy.y", "λx.λy.x"];
  let not: string = `(lambda (b) (b ${b[0]} ${b[1]}))`;
  expect(evaltest(`${not} ${b[0]}`)).toBe(bf[1]);
  // console.log("huh", `${not} ${b[1]}`);
  // expect(evaltest(`${not} ${b[1]}`)).toBe(bf[0]);
  // let and: string = `(lambda (a b) (a b ${b[0]}))`
});
