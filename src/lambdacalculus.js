/**
 * @type {Object}
 * @prop {Lambda[]} history
 * @prop {string[]} evalable
 * @prop {HTMLTextAreaElement} input
 * @prop {HTMLDivElement} output
 */
const config = {
	history: [],
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
 * @prop {string} id
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
	return { type: "fun", val: { id: s[1], body: toLambda(s[2]) } };
}

/**
 * @param {string} str
 * @returns {Lambda}
 */
function parse(str) {
	return toLambda(toSexpr(str)[0]);
}
console.log(parse("(a b)"));
console.log(parse("(λ (a) a)"));
console.log(parse("(λ (a) ((λ (b) (b a)) (λ (b) b)"));

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
			return expr;
		case "fun":
			expr.val.body = evalAt(expr.val.body, index);
			return expr;
		case "apply":
			if (!index) {
				const l = expr.val.left.val;
				return subst(l.body, l.id, expr.val.right);
			}
			if (index[0] == "L") {
				expr.val.left == evalAt(expr.val.left, index.slice(1));
			} else {
				expr.val.right == evalAt(expr.val.right, index.slice(1));
			}
			return expr;
	}
}

/**
 * @param {Lambda} expr
 * @param {string} index
 * @returns {HTMLDivElement}
 */
function toHtml(expr, index) {
	let ret = document.createElement("div");
	ret.classList.add("expr", expr.type);
	switch (expr.type) {
		case "var":
			ret.innerHTML = expr.val.id;
			return ret;
		case "fun":
			ret.innerHTML = `<div>λ${expr.val.id}</div>`;
			ret.append(toHtml(expr.val.body, index));
			return ret;
		case "apply":
			const l = toHtml(expr.val.left, index + "L");
			const r = toHtml(expr.val.right, index + "R");
			if (l.classList.contains("fun")) {
				ret.classList.add("eval");
				ret.addEventListener("click", (event) => {
					event.stopPropagation(); // only click most-nested element
					let expr = structuredClone(config.history[config.history.length - 1]);
					const next = evalAt(expr, index);
					config.history.push(next);
					show();
				});
			}
			ret.append(l, r);
			return ret;
	}
}

/**
 * @param {string} str
 */
function newInput(str) {
	config.input.value = str;
	config.history = [parse(str)];
	show();
}

function show() {
	// config.input.value = format(config.history[0]);
	config.output.innerHTML = "";
	for (let i in config.history) {
		const d = document.createElement("div");
		d.innerHTML = format(config.history[i]);
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
	config.output.append(toHtml(last));
}

config.input.addEventListener("input", (event) => { newInput(event.target.value); });
// newInput("(lambda (a) a)");
newInput("(lambda (a) ((lambda (b) (b a)) (lambda (c) c))");
