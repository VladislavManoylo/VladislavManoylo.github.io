/**
 * @type {Object}
 * @prop {Lambda[]} history
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
 * @returns {string}
 */
function toHtml(expr) {
	let ret = document.createElement("div");
	ret.classList.add("expr", expr.type);
	switch (expr.type) {
		case "var":
			ret.innerHTML = expr.val.id;
			return ret;
		case "fun":
			ret.innerHTML = `<div>λ${expr.val.id}</div>`;
			ret.append(toHtml(expr.val.body));
			return ret;
		case "apply":
			ret.append(toHtml(expr.val.left), toHtml(expr.val.right));
			return ret;
	}
}

/**
 * @param {string} str
 */
function newInput(str) {
	console.log("go", str);
	config.input.value = str;
	config.history = [parse(str)];
	config.output.innerHTML = format(config.history[0]) + "<br>";
	config.output.append(toHtml(config.history[0]));
}

config.input.addEventListener("input", (event) => { newInput(event.target.value); });
// newInput("(lambda (a) a)");
newInput("((lambda (a) (lambda (b) (b a))) (lambda (c) c))");
