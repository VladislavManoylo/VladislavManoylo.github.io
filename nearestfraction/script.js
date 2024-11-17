/** @type{HTMLInputElement} */
const equationInput = document.getElementById("equation");
/** @type{HTMLDivElement} */
const evalDiv = document.getElementById("eval");
/** @type{HTMLTableElement} */
const outputTable = document.getElementById("output");

// load url
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
equationInput.value = params.get("equation") ?? equationInput.value;


/** adds row to output table */
function row(...cells) {
    const r = outputTable.insertRow();
    for (const x of cells)
        r.insertCell().innerHTML = x;
}

/** @param {String | undefined} value */
function input(value) {
    equationInput.value = value ?? equationInput.value;
    url.searchParams.set("equation", equationInput.value);
    updateOutput();
}

function updateOutput() {
    history.replaceState(null, '', url);
    const precision = 17;
    const val = parseFloat(Number(eval(equationInput.value)).toPrecision(precision));
    evalDiv.innerHTML = `<div>= ${val}</div>`;
    outputTable.innerHTML = "";
    row("fraction", "value", "diff");
    for (let [[n, denom], value, diff] of
        nearestFractions(val, 100000, precision))
        row(`${n} / ${denom}`, value, diff);
}

/** @param {number} value
 *  @param {number} maxDenominator
 *  @param {number} precision
 *  @returns {[[number, number], number, number][]}
 * */
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
