import { exprString, toLambdaExpr } from "../src/lambda"
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
  expect(reprint("x (y z)")).toBe("((x y) z)");
});

test("sexpr->expr lambda", () => {
  expect(reprint("lambda (x) x")).toBe("λx.x");
  expect(reprint("(lambda (x) x)")).toBe("λx.x");
  expect(reprint("(lambda (x y) x)")).toBe("λx.λy.x");
  expect(reprint("(lambda (x) )")).toThrow("");
  expect(reprint("(lambda () x)")).toThrow("");
  // not the parsers job to check for free variables
  // and could mean something in the environment
  expect(reprint("(lambda (x) ?)")).toBe("λx.?");
});

// test("sexpr->expr", () => {
//   expect(reprint("").toBe("");
// });
