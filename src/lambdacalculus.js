/**
 * @type {Object}
 * @prop {Object.<string, string>} env
 * @prop {string[]} history
 * @prop {string[]} evalable
 * @prop {HTMLTextAreaElement} input
 * @prop {HTMLDivElement} output
 */
const config = {
	env: {},
	history: [],
	envElement: document.getElementById("env"),
	input: document.getElementById("input"),
	output: document.getElementById("output"),
}

/**
 * @typedef Sexpr
 * @type {Sexpr[]|string}
 */

/**
 * @param {string} str
 * @returns {string[]}
 */
function toTokens(str) {
	let m = str.match(/[()]|[^()\s]+/g);
	return m === null ? [] : m;
}

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
 * @param {Sexpr} str
 * @returns {Lambda}
 */
function toLambda(s) {
	if (!Array.isArray(s)) {
		return { type: "var", val: { id: s } };
	}
	if (s.length == 2) {
		return { type: "apply", val: { left: toLambda(s[0]), right: toLambda(s[1]) } };
	}
	const ids = s[1];
	if (ids.length == 1) {
		return { type: "fun", val: { id: ids[0], body: toLambda(s[2]) } };
	} else {
		s[1] = s[1].slice(1);
		return { type: "fun", val: { id: ids[0], body: toLambda(s) } };
	}
}

/**
 * @param {string} str
 * @returns {Lambda}
 */
function parse(str) {
	return toLambda(toSexpr(str)[0]);
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
				const l = expr.val.left.val;
				return subst(l.body, l.id, expr.val.right);
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
		div.addEventListener("click", (event) => {
			event.stopPropagation();
			let expr = parse(config.history[config.history.length - 1]);
			config.history.push(format(evalAt(expr, index)));
			show();
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
	config.output.append(toHtml(parse(last)));
}

config.input.addEventListener("input", (event) => { newInput(event.target.value); });
config.envElement.addEventListener("input", (event) => { newEnv(event.target.value); });
newEnv(`S (lambda (a b c) ((a c) (b c)))
K (lambda (a b) a)
I (lambda (a) a)
Ki (lambda (a b) b)
M (lambda (a) a a)
W (M M)
Y (lambda (f) ((lambda (x) (f (x x))) (lambda (x) (f (x x)))))
True K
False Ki
Cons (lambda (a b) (lambda (p) ((p a) b)))
Car (lambda (l) (l True))
Cdr (lambda (l) (l False))
Nil (Lambda (p) True)
Nil? (lambda (l) (lambda (a b) False))
`);
newInput("(S K)");
