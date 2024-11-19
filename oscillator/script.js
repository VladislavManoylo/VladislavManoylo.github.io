/** @typedef {"sine" | "square" | "triangle" | "sawtooth" | "custom" } wavetype */
/** @typedef {Object} node
 *  @property {number} phase
 *  @property {number} hz
 *  @property {number} detune
 *  @property {wavetype} wavetype
 *  @property {number[]} real - coefficients for custom wavetype
 *  @property {number[]} imag - coefficients for custom wavetype
 * */

/** @type{node} */
const defaultNode = {
    phase: 0,
    hz: 440,
    detune: 0,
    wavetype: "sine",
    real: [0, 0],
    imag: [0, 1],
};

const nums = (s) => s.split(/ +/).map(Number);

const audioCtx = new AudioContext();
/** @type{HTMLDivElement} */
const nodeContainer = document.getElementById("nodes");
/** @type{OscillatorNode[]} */
const nodes = [];
/** @type{node[]} */
const nodeVals = []

/**
 * create input with a label
 *
 * @param {string} label - label text
 * @param {string} value - default input value
 * @param {string} help - hover text for element
 * @param {string} content - tags inside the input element
 * @param {string|null} [labelOverwrite] - optionally used inside onchange function in place of label
 * @returns {string} html text
 */
function labeledInput(label, value, help, content, labelOverwrite = null) {
    return `
        <label title=${help}>${label}
            <input ${content} value="${value}" onchange="change(this, '${labelOverwrite ?? label}', this.value)">
        </label>
    `
}

/**
 * make div containing radio buttons
 *
 * @param {string} name - used for name of input elements and part of element ids
 * @param {string[]} values - values for radio buttons
 * @returns {HTMLDivElement}
 */
function makeRadioDiv(name, values) {
    const ret = document.createElement("div");
    ret.id = `${name}container`;
    ret.classList.add("radio");
    for (let i = 0; i < values.length; i++) {
        ret.innerHTML += labeledInput(values[i], values[i], "type of wave", `type="radio" name=${name} ${i == 0 ? "checked" : ""}`, "wavetype");
    }
    return ret;
}

/**
 * node div with values set
 *
 * @param {node} node
 * @returns {HTMLDivElement}
 */
function makeNodeDiv(node) {
    const ret = document.createElement("div");
    ret.classList.add("note");
    makeNodeDiv.i = (makeNodeDiv.i || 0) + 1;
    i = makeNodeDiv.i;
    ret.innerHTML =
        '<button class="x" type="button" onclick="rmNode(this.parentElement)" title="remove note">x</button>' +
        labeledInput("phase", node.phase, "set phase of wave- two identical waves with opposite phase wil cancel out", 'type="range" min="0" max="1" step="0.1"') +
        labeledInput("hz", node.hz, "frequency of note", 'type="number"') +
        labeledInput("detune", node.detune, "detune note by cents (100 cents per 12 EDO semitone)", 'type="number"');

    const wavetype = makeRadioDiv(`wavetype`, ["sine", "triangle", "square", "sawtooth", "custom"]);
    wavetype.innerHTML += `
        <div>
        ${labeledInput('real', node.real, 'real coefficients', 'type="text"')}
        ${labeledInput('imag', node.imag, 'imaginary coefficients', 'type="text"')}
        </div>
        `
    ret.appendChild(wavetype);
    return ret;
}

function addNode() {
    const n = structuredClone(defaultNode);
    nodeContainer.appendChild(makeNodeDiv(n));
    nodes.push(makeNodePlayer(n));
    nodeVals.push(n);
}

function rmNode(div) {
    const i = [...nodeContainer.children].indexOf(div);
    console.log("rm", i, div, nodes);
    nodes[i].stop();
    nodes.splice(i, 1);
    nodeVals.splice(i, 1);
    nodeContainer.removeChild(div);
}

function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.2; // extra time to get sync correct
    return t - (t % p) + phase * p;
}

/**
 * start an oscillator in the audio context
 *
 * @param {node} vals
 * @returns {OscillatorNode}
 */
function makeNodePlayer(vals) {
    const node = audioCtx.createOscillator();
    node.frequency.value = vals.hz;
    node.detune.value = vals.detune;
    if (vals.type == "custom") {
        node.setPeriodicWave(audioCtx.createPeriodicWave(vals.real, vals.imag));
    } else {
        node.type = vals.wavetype;
    }
    node.connect(audioCtx.destination);
    node.start(synctime(vals.phase, vals.hz));
    return node;
}

/**
 * node index that the div is inside of
 *
 * @param {HTMLElement} div
 * @returns {number | null}
 */
function nodeIndex(div) {
    let note = div;
    while (note !== null && !note.classList.contains("note")) {
        note = note.parentElement;
    }
    if (note === null) {
        console.error("changed element outside of a note");
        return null;
    }
    return [...document.getElementsByClassName("note")].indexOf(note);
}

/**
 * value changed in a div
 *
 * @param {HTMLInputElement} div - input div with changed value
 * @param {string} cls - key
 * @param {string} val - value
 */
function change(div, cls, val) {
    const i = nodeIndex(div);
    if (i === null) {
        return
    }
    nodeVals[i][cls] = val;
    console.log("change", i, cls, val);
    switch (cls) {
        case "phase": nodeVals[i][cls] = parseInt(val); break;
        case "hz": nodeVals[i][cls] = parseInt(val); break;
        case "detune": nodeVals[i][cls] = parseInt(val); break;
        case "wavetype": nodeVals[i][cls] = val; break;
        case "real": nodeVals[i][cls] = nums(val); break;
        case "imag": nodeVals[i][cls] = nums(val); break;
    }
    node[i].stop()
    node[i] = makeNodePlayer(nodeVals[i]);
}
