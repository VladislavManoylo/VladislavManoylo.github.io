/**
 * @typedef {Object} Config
 * @prop {Object.<string, string>} env
 * @prop {string[]} history - expression as its partially evalauted
 * @prop {string[]} evalable - list of indexes that can be evaled at the latest point
 * @prop {HTMLTextAreaElement} input
 * @prop {HTMLDivElement} output
 */
/** @type {Config} */
const config = {
	env: {},
	history: [],
	evalable: [],
	envElement: document.getElementById("env"),
	input: document.getElementById("input"),
	output: document.getElementById("output"),
}


/**
 * @param {string} str
 * @returns {string[]}
 */
function toTokens(str) {
	let m = str.match(/[()]|[^()\s]+/g);
	return m === null ? [] : m;
}

/** @typedef {any[]|string} Sexpr */ // recursive types don't work in jsdoc
/**
 * @param {string[]} tokens
 * @returns {[Sexpr, number]}
 */
function tokensToSexpr(tokens) {
	let ret = [];
	for (let i = 0; i < tokens.length; i++) {
		let t = tokens[i];
		if (t == "(") {
			const [s, i2] = tokensToSexpr(tokens.slice(i + 1));
			ret.push(s);
			i += i2;
		}
		else if (t == ")") {
			return [ret, i + 1];
		}
		else {
			ret.push(t);
		}
	}
	return [ret, tokens.length];
}
/**
 * @param {string} str
 * @returns {Sexpr}
 */
function toSexpr(str) {
	const tokens = str.match(/[()]|[^()\s]+/g);
	if (tokens === null) return "";
	return tokensToSexpr(tokens)[0];
}

/**
 * @typedef {Object} Lambda
 * @prop {'var'} type
 * @prop {LambdaVar} val
 * @prop {'fun'} type
 * @prop {LambdaFun} val
 * @prop {'apply'} type
 * @prop {LambdaApply} val
 *
 * @typedef LambdaVar
 * @prop {string} id
 *
 * @typedef LambdaFun
 * @prop {string[]} id
 * @prop {Lambda} body
 *
 * @typedef LambdaApply
 * @prop {Lambda} left
 * @prop {Lambda} right
 */


/**
 * @param {Sexpr} s
 * @returns {Lambda}
 */
function toLambda(s) {
	if (!Array.isArray(s)) {
		return { type: "var", val: { id: s } };
	}
	if (s[0] == "lambda") {
		const ids = s[1];
		if (ids.length == 1) {
			return { type: "fun", val: { id: ids[0], body: toLambda(s.slice(2)) } };
		}
		s[1] = s[1].slice(1);
		return { type: "fun", val: { id: ids[0], body: toLambda(s) } };
	}
	let apply = toLambda(s[0]);
	for (let i = 1; i < s.length; i++) {
		apply = { type: "apply", val: { left: apply, right: toLambda(s[i]) } };
	}
	return apply;
}

/**
 * @param {string} str
 * @returns {Lambda}
 */
function parse(str) {
	return toLambda(toSexpr(str));
}

/**
 * @param {Lambda} expr
 * @returns {string}
 */
function format(expr) {
	switch (expr.type) {
		case "var":
			return expr.val.id;
		case "fun":
			return `(lambda (${expr.val.id}) ${format(expr.val.body)})`;
		case "apply":
			return `(${format(expr.val.left)} ${format(expr.val.right)})`;
	}
}

/**
 * @param {Lambda} expr
 * @param {string} from
 * @param {Lambda} to
 * @returns {Lambda}
 */
function subst(expr, from, to) {
	switch (expr.type) {
		case "var":
			return expr.val.id == from ? to : expr;
		case "fun":
			if (expr.val.id == from) return expr;
			expr.val.body = subst(expr.val.body, from, to);
			return expr;
		case "apply":
			expr.val.left = subst(expr.val.left, from, to);
			expr.val.right = subst(expr.val.right, from, to);
			return expr;
	}
}

/**
 * @param {Lambda} expr
 * @returns {string[]}
 * @example
 * freevars(parse("(lambda (x) x y)")) // ["y"]
 */
function freevars(expr) {
	switch (expr.type) {
		case "var":
			return [expr.val.id];
		case "fun":
			return freevars(expr.val.body).filter((id) => id !== expr.val.id);
		case "apply":
			return [...freevars(expr.val.left), ...freevars(expr.val.right)];
	}
}

/**
 * @param {Lambda} expr
 * @returns {string[]}
 * @example
 * freevars(parse("(lambda (x) x y)")) // ["x"]
 */
function boundvars(expr) {
	switch (expr.type) {
		case "var":
			return [];
		case "fun":
			return [expr.val.id, ...boundvars(expr.val.body)];
		case "apply":
			return [...boundvars(expr.val.left), ...boundvars(expr.val.right)];
	}
}

/**
 * @param {Lambda} expr
 * @param {string} from
 * @param {string} to
 * @returns {Lambda}
 * @example
 * format(rename(parse("(lambda (x) x y)")), "y", "z") // (lambda (x) x z)
 * format(rename(parse("x (lambda (x) x y)")), "x", "z") // (z (lambda (x) x y))
 */
function rename(expr, from, to) {
	// console.log("REEname", format(expr));
	switch (expr.type) {
		case "var":
			return expr.val.id == from ? { type: "var", val: { id: to } } : expr;
		case "fun":
			if (expr.val.id == from) {
				expr.val.id = to;
			}
			expr.val.body = rename(expr.val.body, from, to);
			return expr;
		case "apply":
			expr.val.left = rename(expr.val.left, from, to);
			expr.val.right = rename(expr.val.right, from, to);
			return expr;
	}
}
console.log(format(rename(parse("(lambda (x) x y)"), "y", "z")), "(lambda (x) x z)");
console.log(format(rename(parse("(lambda (x) x y)"), "x", "z")), "(lambda (z) z y)");

/**
 * @param {Lambda} expr
 * @param {string} index
 * @returns {Lambda}
 */
function evalAt(expr, index) {
	switch (expr.type) {
		case "var":
			const id = expr.val.id;
			if (/^\d+$/.test(id)) {
				const n = Number(id);
				return parse(`(lambda (f x) ${"(f".repeat(n)} x ${")".repeat(n)})`);
			}
			return parse(config.env[expr.val.id]);
		case "fun":
			expr.val.body = evalAt(expr.val.body, index);
			return expr;
		case "apply":
			if (!index) {
				if (expr.val.left.type != "fun") throw new Error("left side of apply isn't a function");
				/** @type {LambdaFun} */
				const l = expr.val.left;
				const rfree = freevars(expr.val.right);
				for (let id of boundvars(l.val.body)) {
					if (rfree.includes(id)) {
						l.val.body = rename(l.val.body, id, id + "'");
					}
				}
				return subst(l.val.body, l.val.id, expr.val.right);
			}
			if (index[0] == "L") {
				expr.val.left = evalAt(expr.val.left, index.slice(1));
			} else {
				expr.val.right = evalAt(expr.val.right, index.slice(1));
			}
			return expr;
	}
}

/**
 * @param {Lambda} expr
 * @param {string} index
 * @returns {HTMLDivElement}
 */
function toHtml(expr, index = "") {
	/** @param {HTMLDivElement} div */
	function evalme(div) {
		div.classList.add("eval");
		config.evalable.push(index);
		div.addEventListener("click", (event) => {
			event.stopPropagation();
			let expr = parse(config.history[config.history.length - 1]);
			config.history.push(format(evalAt(expr, index)));
			show();
		});
		div.addEventListener("mouseover", (event) => {
			event.stopPropagation();
			div.classList.add("eval-hover");
		});
		div.addEventListener("mouseout", () => {
			div.classList.remove("eval-hover");
		});
	}
	let ret = document.createElement("div");
	ret.classList.add("expr", expr.type);
	switch (expr.type) {
		case "var":
			const id = expr.val.id;
			ret.innerHTML = id;
			if (/^\d+$/.test(id)) {
				evalme(ret)
			} else if (id in config.env) {
				evalme(ret);
			}
			return ret;
		case "fun":
			ret.innerHTML = `<div>λ${expr.val.id}</div>`;
			ret.append(toHtml(expr.val.body, index));
			return ret;
		case "apply":
			const l = toHtml(expr.val.left, index + "L");
			const r = toHtml(expr.val.right, index + "R");
			if (l.classList.contains("fun")) {
				evalme(ret);
			}
			ret.append(l, r);
			return ret;
	}
}

/** @param {string} str */
function newInput(str) {
	config.input.value = str;
	config.history = [format(parse(str))];
	show();
}

/** @param {string} str */
function newEnv(str) {
	config.envElement.value = str;
	const exprs = toSexpr(str);
	for (let i = 0; i < exprs.length; i += 2) {
		config.env[exprs[i]] = format(toLambda(exprs[i + 1]));
	}
}

function show() {
	// config.input.value = format(config.history[0]);
	config.output.innerHTML = "";
	for (let i in config.history) {
		const d = document.createElement("div");
		d.innerHTML = config.history[i];
		if (i != 0) {
			d.classList.add("pop");
			d.addEventListener("click", (_) => {
				config.history.splice(i);
				show();
			});
		}
		config.output.append(d);
	}
	const last = config.history[config.history.length - 1];
	config.evalable = [];
	config.output.append(toHtml(parse(last)));
	config.output.lastChild.scrollIntoView(false);
}

config.input.addEventListener("input", (event) => { newInput(event.target.value); });
config.envElement.addEventListener("input", (event) => { newEnv(event.target.value); });

/** returns a comparator to choose between 2 strings for an evaluation strategy
 * e.g. an inner left strategy will choose L00 over L01 because it's more left
 * an inner right strategy will choose 0100 010 because it's more inner
 * @prop {Boolean} inner
 * @prop {Boolean} left
 */
function makeStrategy(inner, left) {
	return (a, b) => {
		let end = a.length < b.length ? a.length : b.length;
		for (let i = 0; i < end; i++) {
			if (a[i] !== b[i])
				return left === (a[i] === "0");
		}
		return inner === a.length > end;
	};
}

/** given a comparison function, return the best item in list l */
function best(l, cmp) {
	return l.reduce((found, current) => {
		if (cmp(found, current))
			return found;
		return current;
	});
}

document.addEventListener("keypress", (event) => {
	var _a;
	if (event.key === "Enter" && event.shiftKey) {
		// exit text box, without a timeout it immediately regains focus
		setTimeout(() => {
			input.blur();
		}, 30);
		return;
	}
	let strategies = {
		"1": makeStrategy(false, false), // outer right
		"2": makeStrategy(false, true), // outer left
		"3": makeStrategy(true, false), // inner right
		"4": makeStrategy(true, true), // inner left
	};
	if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.matches("body")) {
		switch (event.key) {
			case "-":
				if (config.history.length > 1)
					config.history.pop();
				show();
				break;
			case "1":
			case "2":
			case "3":
			case "4":
				if (config.evalable.length == 0) {
					return;
				}
				const last = config.history[config.history.length - 1];
				const index = best(config.evalable, strategies[event.key]);
				if (config.evalable.length !== 0) {
					config.history.push(format(evalAt(parse(last), index)));
				}
				show();
				break;
		}
	}
});

newEnv(`S (lambda (a b c) (a c) (b c))
K (lambda (a b) a)
I (lambda (a) a)
Ki (lambda (a b) b)
M (lambda (a) a a)
W (M M)
Y (lambda (f) (lambda (x) (f (x x))) (lambda (x) (f (x x))))
i (lambda (x) x S K)
True K
False Ki
Cons (lambda (a b) (lambda (p) (p a b)))
Car (lambda (l) l True)
Cdr (lambda (l) l False)
Nil (Lambda (p) True)
Nil? (lambda (l) (lambda (a b) False))
Not (lambda (p) p Ki K)
And (lambda (p q) p q p)
Or (lambda (p q) p p q)
Zero? (lambda (n) n (lambda (a) Ki) K)
Succ (lambda (n f x) f (n f x))
+ (lambda (a b) a Succ b)
* (lambda (a b) a (+ b) 0)
^ (lambda (b e) e b)
Pred (lambda (n) Car ((lambda (p) ((Cons (Cdr p)) (Succ (Cdr p)))) (Cons 0 0)))
- (lambda (a b) a Pred b)
<= (lambda (a b) Zero? (- a b))
>= (lambda (a b) <= b a)
> (lambda (a b) not (<= a b))
< (lambda (a b) not (<= b a))
`);
// newInput("S K K");
newInput("(lambda (x y) x y) (y w)");
