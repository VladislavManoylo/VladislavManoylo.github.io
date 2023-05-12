import { toSexpr } from "../src/sexpr";

test("tokens", () => {
  expect(toSexpr("a bc 1.2-de_ f")).toStrictEqual(["a", "bc", "1.2-de_", "f"]);
  expect(toSexpr("a\tb\nc  \t\nd")).toStrictEqual(["a", "b", "c", "d"]);
});

test("nesting", () => {
  expect(toSexpr("a (b c) d")).toStrictEqual(["a", ["b", "c"], "d"]);
  expect(toSexpr("((a)b)c")).toStrictEqual([[["a"], "b"], "c"]);
  expect(toSexpr("a(b)((c))")).toStrictEqual(["a", ["b"], [["c"]]]);
});

test("omit close", () => {
  expect(toSexpr("(((a")).toStrictEqual([[[["a"]]]]);
  expect(toSexpr("a(b((c")).toStrictEqual(["a", ["b", [["c"]]]]);
});
