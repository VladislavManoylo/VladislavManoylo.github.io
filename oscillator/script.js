const detuned = (hz, detune) => hz * Math.pow(2, detune / 1200);

const parseFraction = (s) => {
    const [a, b] = s.split('/');
    return b ? parseFloat(a) / parseFloat(b) : parseFloat(a);
}

function tablerow(...cells) {
    let ret = "<tr>"
    for (const x of cells) {
        ret += `<td>${x}</td>`;
    }
    ret += "</tr>";
    return ret;
}

function counter() {
    counter.i ??= 0;
    counter.i += 1;
    return counter.i;
}

/**
 * e.g. series(1, 5, ["1/n", "0"]) => [1, 0, 1/3, 0, 1/5]
 *
 * @param {number} start
 * @param {number} end
 * @param {string[]} patterns
 * @returns {number[]}
 */
function series(start, end, patterns) {
    const l = end - start + 1;
    if (patterns.length === 0) return Array(l).fill(0);
    const ret = [];
    for (let i = 0; i < l; i++)
        ret.push(patterns[i % patterns.length].replace(/n/g, i + start));
    return ret;
}

/** @typedef {"sine" | "square" | "triangle" | "sawtooth" | "custom" } wavetype */

class Note {
    constructor() {
        this.phase = 0;
        this.hz = 220;
        this.detune = 0;
        this.wavetype = "sine";
        this.dcoffset = 0;
        this.cos = ["0"];
        this.sin = ["1"];
        this.terms = 1;
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
        const wavetype = makeRadioDiv(`wavetype${counter()}`, ["sine", "triangle", "square", "sawtooth", "custom"], this.wavetype);
        wavetype.innerHTML += `
        <div>
        ${labeledInput("dc offset", this.dcoffset, "dcoffset", 'type="number"')}
        <div>${labeledInput("terms", this.terms, "number of terms to use for expansions", 'type="number" min="1"')}</div>
        <div>${labeledInput("cos", this.cos, "cos coefficients of harmonics", 'class="series" type="text"')}</div>
        <div>${labeledInput("sin", this.sin, "sin coefficients of harmonics", 'class="series" type="text"')}</div>
        `
        ret.appendChild(wavetype);
        return ret;
    }

    /**
     * even/cos and odd/sin coefficients of harmonics
     *
     * @returns {[number[], number[]}
     */
    getHarmonics() {
        return [series(1, this.terms, this.cos).map(eval), series(1, this.terms, this.sin).map(eval)]
    }

    makePlayer() {
        const ret = audioCtx.createOscillator();
        ret.frequency.value = this.hz;
        ret.detune.value = this.detune;
        if (this.wavetype == "custom") {
            const [r, i] = this.getHarmonics();
            ret.setPeriodicWave(audioCtx.createPeriodicWave([this.dcoffset, ...r], [0, ...i]));
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
        switch (this.wavetype) {
            case "sine":
                return (t) => Math.sin(2 * Math.PI * inphase(t));
            case "triangle":
                return (t) => {
                    t = inphase(t);
                    // peak/trough should match sine wave peak/trough
                    t = (t + 0.25) % 1;
                    return 1 - 4 * Math.abs(t - 0.5);
                };
            case "square":
                return (t) => {
                    t = inphase(t);
                    // t = (t + 0.25) % 1;
                    return t < 0.5 ? 1 : -1;
                };
            case "sawtooth":
                return (t) => {
                    t = inphase(t);
                    // peak should match end of square wave peak
                    t = (t + 0.5) % 1;
                    return 2 * t - 1;
                };
            case "custom":
                let [c, s] = this.getHarmonics();
                return (t) => {
                    t = inphase(t);
                    let ret = this.dcoffset;
                    for (let i = 0; i < c.length; i++) {
                        ret += c[i] * Math.cos(2 * Math.PI * (i + 1) * t);
                        ret += s[i] * Math.sin(2 * Math.PI * (i + 1) * t);
                    }
                    return ret;
                };
        }
    }
}

const view = {
    /** @type{HTMLDivElement} */
    notes: document.getElementById("notes"),
    /** @type{HTMLTableElement} */
    wavetable: document.getElementById("table"),
    /** @type{HTMLCanvasElement} */
    canvas: document.getElementById("plot"),
    /** @type{HTMLDivElement} */
    plotControls: document.getElementById("plot controls"),
}

const audioCtx = new AudioContext();
const ctx = view.canvas.getContext("2d");
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
        <label title="${help}">${label}
            <input ${content} value="${value}" onchange="change(this, '${labelOverwrite ?? label}', this.value)">
        </label>
    `
}

/**
 * make div containing radio buttons
 *
 * @param {string} name - used for name of input elements and part of element ids
 * @param {string[]} values - values for radio buttons
 * @param {string} check - checked value
 * @returns {HTMLDivElement}
 */
function makeRadioDiv(name, values, check = "") {
    const ret = document.createElement("div");
    ret.id = `${name}container`;
    ret.classList.add("radio");
    for (let i = 0; i < values.length; i++) {
        const checked = values[i] == check ? "checked" : "";
        ret.innerHTML += labeledInput(values[i], values[i], "type of wave", `type="radio" name=${name} ${checked}`, "wavetype");
    }
    return ret;
}

function addNote(preset = null) {
    const note = new Note();
    const presets = {
        "reverse sawtooth": ["-1/n", "1/n"],
        "sawtooth": ["-1/n"],
        "square": ["1/n", "0"],
        "triangle": ["1/(n*n)", "0", "-1/(n*n)", "0"]
    }
    if (preset in presets) {
        note.sin = presets[preset];
        note.wavetype = "custom";
        note.terms = 5;
    }
    view.notes.appendChild(note.makeDiv());
    notePlayers.push(note.makePlayer());
    notes.push(note);
    display();
}

function rmNote(div) {
    const i = [...view.notes.children].indexOf(div);
    notePlayers[i].stop();
    notePlayers.splice(i, 1);
    notes.splice(i, 1);
    view.notes.removeChild(div);
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
    let refresh = false;
    switch (cls) {
        case "phase": notes[i][cls] = Number(val); break;
        case "hz": notes[i][cls] = Number(val); break;
        case "detune": notes[i][cls] = Number(val); break;
        case "wavetype": notes[i][cls] = val; break;
        case "dc offset": notes[i].dcoffset = Number(val); refresh = true; break;
        case "cos": notes[i][cls] = val.split(","); refresh = true; break;
        case "sin": notes[i][cls] = val.split(","); refresh = true; break;
        case "terms": notes[i][cls] = parseInt(val); refresh = true; break;
    }
    if (refresh) {
        notes[i].wavetype = "custom";
        view.notes.replaceChild(notes[i].makeDiv(), view.notes.children[i]);
    }
    notePlayers[i].stop()
    notePlayers[i] = notes[i].makePlayer();
    display();
}

/**
 * plot path on canvas
 *
 * @param {number[]|null} xs - give null to use evenly spaced ys
 * @param {number[]} ys
 * @param {string} color
 * @param {[number, number]} [xview]
 * @param {[number, number]} [yview]
 */
function plotpath(xs, ys, color, xview = [0, 1], yview = [0, 1]) {
    if (xs === null) {
        xs = xrange(xview[0], xview[1], ys.length);
    }
    const l = xs.length;
    if (l !== ys.length) {
        console.error("bad lengths", xs.length, ys.length);
    }
    yview = [yview[1], yview[0]]; // because canvas (0,0) is top left
    const xscale = view.canvas.width / (xview[1] - xview[0]);
    const yscale = view.canvas.height / (yview[1] - yview[0]);
    const canvasx = (x) => (x - xview[0]) * xscale;
    const canvasy = (y) => (y - yview[0]) * yscale;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(canvasx(xs[0]), canvasy(ys[0]));
    for (let i = 1; i < l; i++) {
        ctx.lineTo(canvasx(xs[i]), canvasy(ys[i]));
    }
    ctx.stroke();
}

/**
 * generate samples values from a to b
 *
 * @param {number} start
 * @param {number} end
 * @param {number} samples
 * @returns {number[]}
 */
function xrange(start, end, samples) {
    const ret = [];
    for (let i = 0; i < samples; i++) {
        ret.push((i / samples) * (end - start) - start);
    }
    return ret;
}

/**
 * plot a function on the canvas
 *
 * @param {Function} f - function to plot
 * @param {[number, number]} [xview] - domain to plot
 * @param {[number, number]} [yview] - range to plot
 * @param {string} [color] - line color
 */
function plotfunc(f, xview, yview, color) {
    const xs = xrange(xview[0], xview[1], 1000);
    const ys = xs.map(f);
    plotpath(xs, ys, color, xview, yview);
}


const plotvals = {
    xview: function() { return [0, parseFraction(this.width)] },
    yview: function() { return [-this.height, this.height] },
    width: "1/110",
    height: 4,
    fourier: false,
    makeDiv: function() {
        return `
<label title="change plot to fourier transform">fourier
    <input type="checkbox" ${this.fourier ? "checked" : ""}onchange="changePlot('fourier', this.checked)">
</label>
<label title="length of plot in seconds">period
    <input type="text" value="${this.width}" onchange="changePlot('width', this.value)">
</label>
<label title="height of plot above and below x axis">amplitude
    <input type="number" min="1" value="${this.height}" onchange="changePlot('height', this.value)">
</label>
            `
    }
}

function changePlot(id, val) {
    switch (id) {
        case "width":
            plotvals.width = val;
            break;
        case "height":
            plotvals.height = val;
            break;
        case "fourier":
            plotvals.fourier = val;
            break;
    }
    display();
}

/**
 * @param {number[][]} ars
 * @returns {number[]}
 */
function sumCols(ars) {
    const ret = Array(ars[0].length).fill(0);
    for (let i = 0; i < ars.length; i++) {
        for (let j = 0; j < ret.length; j++) {
            ret[j] += ars[i][j];
        }
    }
    return ret;
}

function display() {
    ctx.clearRect(0, 0, view.canvas.width, view.canvas.height);
    let html = "<thead><th>frequency</th><th>phase</th></thead><tbody>";
    const xview = plotvals.xview();
    const yview = plotvals.yview();
    const xs = xrange(xview[0], xview[1], 1000);
    const yss = [];
    let total = Array(xs.length).fill(0);
    const frequencies = [];
    for (let i = 0; i < notes.length; i++) {
        frequencies.push(notes[i].frequency());
        yss.push(xs.map(notes[i].getFunc()));
        html += tablerow(frequencies[i], notes[i].phase);
    }
    total = sumCols([total, ...yss]);
    if (plotvals.fourier) {
        plotpath([0, 0], [0, 1], "black");
        plotpath([0, 1], [0, 0], "black");
        plotfunc((x) => x, [0, 1], [0, 1]);
    }
    else {
        plotpath([0, 0], [0, 1], "black");
        plotpath([0, 1], [0.5, 0.5], "black");
    }
    for (let i = 0; i < yss.length; i++) {
        plotpath(xs, yss[i], "blue", xview, yview);
    }
    plotpath(xs, total, "white", xview, yview);

    html += "</tbody>";
    view.wavetable.innerHTML = html
}
view.plotControls.innerHTML = plotvals.makeDiv();
display();
