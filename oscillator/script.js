/** @typedef {"sine" | "square" | "triangle" | "sawtooth" | "custom" } wavetype */
/** @typedef {Object} note
 *  @property {number} phase
 *  @property {number} hz
 *  @property {number} detune
 *  @property {wavetype} wavetype
 *  @property {number[]} real - coefficients for custom wavetype
 *  @property {number[]} imag - coefficients for custom wavetype
 * */

/** @type{note} */
const defaultNote = {
    phase: 0,
    hz: 440,
    detune: 0,
    wavetype: "sine",
    real: [0, 0],
    imag: [0, 1],
};

const nums = (s) => s.split(",").map(Number);

const audioCtx = new AudioContext();
/** @type{HTMLDivElement} */
const noteContainer = document.getElementById("notes");
/** @type{OscillatorNode[]} */
const notePlayers = [];
/** @type{note[]} */
const notes = []

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
 * note div with values set
 *
 * @param {note} note
 * @returns {HTMLDivElement}
 */
function makeNoteDiv(note) {
    const ret = document.createElement("div");
    ret.classList.add("note");
    makeNoteDiv.i = (makeNoteDiv.i || 0) + 1;
    i = makeNoteDiv.i;
    ret.innerHTML =
        '<button class="x" type="button" onclick="rmNode(this.parentElement)" title="remove note">x</button>' +
        labeledInput("phase", note.phase, "set phase of wave- two identical waves with opposite phase wil cancel out", 'type="range" min="0" max="1" step="0.1"') +
        labeledInput("hz", note.hz, "frequency of note", 'type="number"') +
        labeledInput("detune", note.detune, "detune note by cents (100 cents per 12 EDO semitone)", 'type="number"');

    const wavetype = makeRadioDiv(`wavetype`, ["sine", "triangle", "square", "sawtooth", "custom"]);
    wavetype.innerHTML += `
        <div>
        ${labeledInput('real', note.real, 'real coefficients', 'type="text"')}
        ${labeledInput('imag', note.imag, 'imaginary coefficients', 'type="text"')}
        </div>
        `
    ret.appendChild(wavetype);
    return ret;
}

function addNote() {
    const n = structuredClone(defaultNote);
    noteContainer.appendChild(makeNoteDiv(n));
    notePlayers.push(makeNotePlayer(n));
    notes.push(n);
}

function rmNote(div) {
    const i = [...noteContainer.children].indexOf(div);
    console.log("rm", i, div, notePlayers);
    notePlayers[i].stop();
    notePlayers.splice(i, 1);
    notes.splice(i, 1);
    noteContainer.removeChild(div);
}

function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.2; // extra time to get sync correct
    return t - (t % p) + phase * p;
}

/**
 * start an oscillator in the audio context
 *
 * @param {note} note
 * @returns {OscillatorNode}
 */
function makeNotePlayer(note) {
    const ret = audioCtx.createOscillator();
    ret.frequency.value = note.hz;
    ret.detune.value = note.detune;
    if (note.type == "custom") {
        ret.setPeriodicWave(audioCtx.createPeriodicWave(note.real, note.imag));
    } else {
        ret.type = note.wavetype;
    }
    ret.connect(audioCtx.destination);
    ret.start(synctime(note.phase, note.hz));
    return ret;
}

/**
 * position inside the note container
 *
 * @param {HTMLElement} div
 * @returns {number | null}
 */
function containerIndex(div) {
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
    const i = containerIndex(div);
    if (i === null) {
        return
    }
    notes[i][cls] = val;
    console.log("change", i, cls, val);
    switch (cls) {
        case "phase": notes[i][cls] = parseInt(val); break;
        case "hz": notes[i][cls] = parseInt(val); break;
        case "detune": notes[i][cls] = parseInt(val); break;
        case "wavetype": notes[i][cls] = val; break;
        case "real": notes[i][cls] = nums(val); break;
        case "imag": notes[i][cls] = nums(val); break;
    }
    notePlayers[i].stop()
    notePlayers[i] = makeNotePlayer(notes[i]);
}
