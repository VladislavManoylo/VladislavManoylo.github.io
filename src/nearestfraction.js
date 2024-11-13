/** @type{HTMLInputElement} */
const inputInput = document.getElementById("input");
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

/** @param {String | null} str */
function input(str) {
    str = str ?? inputInput.value;
    inputInput.value = str;
    const p = 16;
    const val = parseFloat(Number(eval(str)).toPrecision(p));
    evalDiv.innerHTML = `<div>= ${val}</div>`;
    let diff = Infinity;
    outputTable.innerHTML = "";
    row("fraction", "value", "diff");
    const max = denomInput.value;
    for (let denom = 1; denom < max; denom++) {
        if (diff == 0) break;
        n = Math.round(val * denom);
        let v = parseFloat((n / denom).toPrecision(p));
        let d = parseFloat(Math.abs(val - v).toPrecision(p));
        if (d < diff) {
            diff = d;
            row(`${n} / ${denom}`, v, diff);
        }
    }
}

input("Math.PI");
