import { exprString, toLambdaExpr } from "../src/lambda";
import { toSexpr } from "../src/sexpr";

function reprint(str: string): string {
  return exprString(toLambdaExpr(toSexpr(str)));
}

test("sexpr->expr id", () => {
  expect(reprint("x")).toBe("x");
  expect(reprint("1")).toBe("1");
});

test("sexpr->expr apply", () => {
  expect(reprint("(x y)")).toBe("(x y)");
  expect(reprint("x y")).toBe("(x y)");
  expect(reprint("x y z")).toBe("((x y) z)");
  expect(reprint("x (y z)")).toBe("(x (y z))");
});

test("sexpr->expr lambda", () => {
  expect(reprint("lambda (x) x")).toBe("λx.x");
  expect(reprint("(lambda (x) (x))")).toBe("λx.x");
  expect(reprint("(lambda (x y) x)")).toBe("λx.λy.x");
  expect(reprint("(lambda (x) (lambda (y) x))")).toBe("λx.λy.x");
  expect(reprint("(lambda (x) ?)")).toBe("λx.?");
});

test("sexpr->expr", () => {
  expect(reprint("(lambda (f x) f x)")).toBe("λf.λx.(f x)");
  expect(reprint("(lambda (x) y)")).toBe("λx.y"); // has a free variable, but parser doesn't check
  expect(reprint("(lambda (f) (lambda (x) f x))")).toBe("λf.λx.(f x)");
  expect(reprint("(lambda (a) a (lambda (b) b))")).toBe("λa.(a λb.b)");
  expect(reprint("(lambda (a) a (lambda (b) b a))")).toBe("λa.(a λb.(b a))");
});

test("sexpr->expr errors", () => {
  expect(() => {
    reprint("(lambda (x) )");
  }).toThrowError("empty expr");
  expect(() => {
    reprint("(lambda () x)");
  }).toThrow("nullary lambda");
});
