const detuned = (hz, detune) => hz * Math.pow(2, detune / 1200);
const nums = (s) => s.split(",").map(Number);
function sumFunctions(functions) {
    return function(...args) {
        return functions.reduce((sum, func) => sum + func(...args), 0);
    };
}
function tablerow(...cells) {
    let ret = "<tr>"
    for (const x of cells) {
        ret += `<td>${x}</td>`;
    }
    ret += "</tr>";
    return ret;
}

/** @typedef {"sine" | "square" | "triangle" | "sawtooth" | "custom" } wavetype */

class Note {
    constructor() {
        this.phase = 0;
        this.hz = 220;
        this.detune = 0;
        this.wavetype = "sine";
        this.real = [0, 0];
        this.imag = [0, 1];
    }

    frequency() {
        return detuned(this.hz, this.detune);
    }

    makeDiv() {
        const ret = document.createElement("div");
        ret.classList.add("note");
        ret.innerHTML =
            '<button class="x" type="button" onclick="rmNote(this.parentElement)" title="remove note">x</button>' +
            labeledInput("phase", this.phase, "set phase of wave- two identical waves with opposite phase wil cancel out", 'type="range" min="0" max="1" step="0.05"') +
            labeledInput("hz", this.hz, "frequency of note", 'type="number"') +
            labeledInput("detune", this.detune, "detune note by cents (100 cents per 12 EDO semitone)", 'type="number"');
        const wavetype = makeRadioDiv(`wavetype`, ["sine", "triangle", "square", "sawtooth", "custom"]);
        wavetype.innerHTML += `
        <div>
        ${labeledInput('real', this.real, 'real coefficients', 'type="text"')}
        ${labeledInput('imag', this.imag, 'imaginary coefficients', 'type="text"')}
        </div>
        `
        ret.appendChild(wavetype);
        return ret;
    }

    makePlayer() {
        const ret = audioCtx.createOscillator();
        ret.frequency.value = this.hz;
        ret.detune.value = this.detune;
        if (this.wavetype == "custom") {
            let r = this.real;
            let i = this.imag;
            const dl = r.length - i.length;
            if (dl > 0) {
                i = [...i, ...Array(dl).fill(0)];
            } else if (dl < 0) {
                r = [...r, ...Array(-dl).fill(0)];
            }
            ret.setPeriodicWave(audioCtx.createPeriodicWave(r, i));
        } else {
            ret.type = this.wavetype;
        }
        ret.connect(audioCtx.destination);
        ret.start(synctime(this.phase, this.hz));
        return ret;
    }

    getFunc() {
        const period = 1 / this.frequency();
        const inphase = (t) => {
            t = t % period / period; // 0-1 phase
            t -= this.phase; // include phase
            return t < 0 ? t + 1 : t;
        }
        // console.log("phase", this.phase, this.frequency());
        switch (this.wavetype) {
            case "sine":
                return (t) => Math.sin(2 * Math.PI * inphase(t));
            case "triangle":
                return (t) => {
                    t = inphase(t);
                    // peak/trough should match sine wave peak/trough
                    t = (t + 0.25) % 1;
                    return 1 - 4 * Math.abs(t - 0.5);
                }
            case "square":
                return (t) => {
                    t = inphase(t);
                    // t = (t + 0.25) % 1;
                    return t < 0.5 ? 1 : -1;
                }
            case "sawtooth":
                return (t) => {
                    t = inphase(t);
                    // peak should match end of square wave peak
                    t = (t + 0.25) % 1;
                    return 2 * t - 1;
                }
        }
    }
}

const audioCtx = new AudioContext();
/** @type{HTMLDivElement} */
const noteContainer = document.getElementById("notes");
/** @type{HTMLTableElement} */
const wavetableContainer = document.getElementById("table");
/** @type{HTMLCanvasElement} */
const canvas = document.getElementById("plot");
const ctx = canvas.getContext("2d");
/** @type{OscillatorNode[]} */
const notePlayers = [];
/** @type{Note[]} */
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

function addNote() {
    const n = new Note();
    noteContainer.appendChild(n.makeDiv());
    notePlayers.push(n.makePlayer());
    notes.push(n);
    display();
}

function rmNote(div) {
    const i = [...noteContainer.children].indexOf(div);
    // console.log("rm", i, div, notePlayers);
    notePlayers[i].stop();
    notePlayers.splice(i, 1);
    notes.splice(i, 1);
    noteContainer.removeChild(div);
    display();
}

function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.2; // extra time to get sync correct
    return t - (t % p) + phase * p;
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
    switch (cls) {
        case "phase": notes[i][cls] = parseFloat(val); break;
        case "hz": notes[i][cls] = parseFloat(val); break;
        case "detune": notes[i][cls] = parseFloat(val); break;
        case "wavetype": notes[i][cls] = val; break;
        case "real": notes[i][cls] = nums(val); break;
        case "imag": notes[i][cls] = nums(val); break;
    }
    // console.log("change", i, cls, val, notes[i]);
    notePlayers[i].stop()
    notePlayers[i] = notes[i].makePlayer();
    display();
}

/**
 * plot a function on the canvas
 *
 * @param {Function} f - function to plot
 * @param {[number, number]} [xrange] - range of x values to plot
 * @param {[number, number]} [yrange] - range of y values to plot
 * @param {string} [color] - line color
 */
function plotfunc(f, xrange, yrange, color = "black") {
    yrange = [yrange[1], yrange[0]]; // because canvas (0,0) is top left
    const xscale = canvas.width / (xrange[1] - xrange[0]);
    const yscale = canvas.height / (yrange[1] - yrange[0]);
    const cf = (x) => (f(x / xscale + xrange[0]) - yrange[0]) * yscale;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, cf(0));
    for (let x = 1; x < canvas.width; x++) {
        ctx.lineTo(x, cf(x));
    }
    ctx.stroke();
}


function display() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let html = "<thead><th>frequency</th><th>phase</th></thead><tbody>";
    const funcs = [];
    const frequencies = [];
    const xrange = [0, 1 / 220];
    const yrange = [-2, 2];
    plotfunc((t) => 0, [0, 1], [-1, 1]);
    for (let i = 0; i < notes.length; i++) {
        frequencies.push(notes[i].frequency());
        funcs.push(notes[i].getFunc());
        plotfunc(funcs[i], xrange, yrange, "blue");
        html += tablerow(frequencies[i], notes[i].phase);
    }
    plotfunc(sumFunctions(funcs), xrange, yrange, "white");
    html += "</tbody>";
    wavetableContainer.innerHTML = html
}
display();
