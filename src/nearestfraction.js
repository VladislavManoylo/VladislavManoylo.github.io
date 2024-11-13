/** @type{HTMLInputElement} */
const equationInput = document.getElementById("equation");
/** @type{HTMLDivElement} */
const evalDiv = document.getElementById("eval");
/** @type{HTMLInputElement} */
const denomInput = document.getElementById("maxdenom");
/** @type{HTMLTableElement} */
const outputTable = document.getElementById("output");

function row(a, b, c) {
    const r = outputTable.insertRow();
    r.insertCell().innerHTML = a;
    r.insertCell().innerHTML = b;
    r.insertCell().innerHTML = c;
}

/** @param {String | undefined} value */
function input(value) {
    equationInput.value = value ?? equationInput.value;
    updateOutput();
}

/** @param {String | undefined} value */
function denom(value) {
    denomInput.value = value ?? denomInput.value;
    updateOutput();
}

function updateOutput() {
    const precision = 17;
    const val = parseFloat(Number(eval(equationInput.value)).toPrecision(precision));
    evalDiv.innerHTML = `<div>= ${val}</div>`;
    row("fraction", "value", "diff");
    for (let [[n, denom], value, diff] of
        nearestFractions(val, denomInput.value, precision))
        row(`${n} / ${denom}`, value, diff);
}

function nearestFractions(value, maxDenominator, precision) {
    let diff = Infinity;
    const ret = [];
    for (let denom = 1; denom < maxDenominator; denom++) {
        if (diff == 0) break;
        n = Math.round(value * denom);
        let v = parseFloat((n / denom).toPrecision(precision));
        let d = parseFloat(Math.abs(value - v).toPrecision(precision));
        if (d < diff) {
            diff = d;
            ret.push([[n, denom], v, diff]);
        }
    }
    return ret;
}

updateOutput()
