const webpage = {
    /** @type{HTMLDivElement[]} */
    keyboardRows: document.getElementsByClassName("row"),
    audioCtx: new AudioContext(),
    get a4() {
        return document.getElementById("A4").value;
    },
    set a4(value) {
        document.getElementById("A4").value = value;
    },
    get layout() {
        for (const x of document.getElementsByName("layout"))
            if (x.checked) return x.value;
        return undefined;
    },
    set layout(value) {
        for (const x of document.getElementsByName("layout"))
            x.checked = x.value == value;
    },
    get waveform() {
        for (const x of document.getElementsByName("waveform"))
            if (x.checked) return x.value;
        return undefined;
    },
    set waveform(value) {
        for (const x of document.getElementsByName("waveform"))
            x.checked = x.value == value;
    },
    get numTerms() {
        return document.getElementById("numTerms").value;
    },
    set numTerms(value) {
        document.getElementById("numTerms").value = value;
    },
    get cosTerms() {
        return document.getElementById("cosTerms").value.split(",");
    },
    set cosTerms(value) {
        document.getElementById("cosTerms").value = value;
    },
    get sinTerms() {
        return document.getElementById("sinTerms").value.split(",");
    },
    set sinTerms(value) {
        document.getElementById("sinTerms").value = value;
    },
}

const keyboard = [// padded with spaces to make 4x12
    "1234567890-=",
    "qwertyuiop[]",
    "asdfghjkl;' ",
    "zxcvbnm,./  "]

const posmod = (a, b) => (a % b + b) % b;

/**
 * @type {Object<string, (a: number, b: number) => number | null>}
 */
const keyboardLayouts = {
    janko: (r, c) => 2 * c + r,
    jankoSplit: (r, c) => 2 * c + r - 12 * Math.floor(r / 2),
    hayden: (r, c) => 2 * c - 5 * r,
    moscow: (r, c) => 3 * c + r - 12,
    western: (r, c) => 3 * c + 2 * r - 12,
    piano: (r, c) => {
        const roff = Math.floor(r / 2);
        const coff = Math.floor(c / 7);
        const layout = [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [1, 3], [0, 4], [1, 4], [0, 5], [1, 5], [0, 6], [1, 6]]
        for (let i = 0; i < 12; i++) { //lmao, (let i in layout) returns a string
            if (layout[i][0] == posmod(r, 2) && layout[i][1] == posmod(c, 7))
                return i + 12 * (roff + roff + coff);
        }
        return null;
    }
};

function toNoteName(i) {
    const letter = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][posmod(i, 12)];
    const octave = Math.floor(i / 12) - 1;
    return [letter, octave];
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

function getHarmonics() {
    return [series(1, webpage.numTerms, webpage.cosTerms).map(eval), series(1, webpage.numTerms, webpage.sinTerms).map(eval)]
}

class Note {
    constructor(frequency) {
        this.playing = false;
        this.signal = webpage.audioCtx.createOscillator();
        this.signal.frequency.value = frequency
        this.decayer = webpage.audioCtx.createGain();
        this.signal.connect(this.decayer).connect(webpage.audioCtx.destination);
        this.started = false;
        const type = webpage.waveform;
        if (type == "custom") { // cannot set type directly to custom
            const [r, i] = getHarmonics();
            this.signal.setPeriodicWave(webpage.audioCtx.createPeriodicWave([0, ...r], [0, ...i]));
        } else {
            this.signal.type = webpage.waveform
        }
    }
    play() {
        if (!this.started) {
            webpage.audioCtx.resume();
            this.signal.start();
            this.started = true;
        }
        if (!this.playing) {
            const t = webpage.audioCtx.currentTime;
            this.decayer.gain.linearRampToValueAtTime(1, t + 0.1);
            this.playing = true;
        }
    }
    stop() {
        if (this.started) {
            this.signal.stop();
        }
    }
    pause() {
        if (this.playing) {
            const t = webpage.audioCtx.currentTime;
            this.decayer.gain.linearRampToValueAtTime(0, t + 0.1);
            this.playing = false;
        }
    }
};

/**
 * @type {Object<string, (i: number) => number}
 */
const tunings = {
    edo: i => webpage.a4 * Math.pow(2, (i - 69) / 12),
}

/** @param{HTMLDivElement} div*/
function createNote(div) {
    let i = 0;
    for (const c of div.classList) {
        if (c.startsWith("noteI")) {
            i = +c.substring(5);
            break;
        }
    }
    return new Note(tunings.edo(i));
}

const playNotes = {};
const heldNotes = new Set();
const heldKeys = new Set();
function updatePlayers() {
    // press down screen buttons
    heldNotes.clear()
    for (let r in keyboard) {
        for (let c in keyboard[r]) {
            const k = keyboard[r][c];
            if (k == " ") continue;
            const button = webpage.keyboardRows[r].children[c];
            if (heldKeys.has(k)) {
                heldNotes.add(button.innerHTML);
                button.classList.add("pressed");
            } else {
                button.classList.remove("pressed");
            }
        }
    }
    for (const note in playNotes) {
        if (heldNotes.has(note))
            playNotes[note].play();
        else
            playNotes[note].pause();
    }
}

// rendering
const p = [0, 20];
for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
        const note = document.createElement("div");
        note.classList.add("note");
        webpage.keyboardRows[r].appendChild(note);
    }
}

function updateSound() {
    for (let note in playNotes) {
        playNotes[note].stop();
        delete playNotes[note];
    }
    for (let r in keyboard) {
        for (let c in keyboard[r]) {
            const k = keyboard[r][c];
            if (k == " ") continue;
            const button = webpage.keyboardRows[r].children[c];
            playNotes[button.innerHTML] = playNotes[button.innerHTML] || createNote(button);
        }
    }
}

function updateLayout() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 12; c++) {
            const div = webpage.keyboardRows[r].children[c];
            const note = keyboardLayouts[webpage.layout](p[0] + r, p[1] + c);
            div.className = "note";
            if (note == null) {
                div.classList.add("null");
                continue;
            }
            div.classList.add(`noteI${note}`); // AWFUL hack to save the note
            const noteName = toNoteName(note);
            if (noteName[0].includes("#"))
                div.classList.add("sharp");
            else
                div.classList.remove("sharp");
            div.innerHTML = noteName;
        }
    }
    updateSound();
}
updateLayout();

document.addEventListener("keydown", (e) => {
    heldKeys.add(e.key);
    updatePlayers();
});
document.addEventListener("keyup", (e) => {
    heldKeys.delete(e.key);
    updatePlayers();
});
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowLeft":
            p[1] -= 1;
            updateLayout();
            break;
        case "ArrowRight":
            p[1] += 1;
            updateLayout();
            break;
        case "ArrowUp":
            p[0] -= 1;
            updateLayout();
            break;
        case "ArrowDown":
            p[0] += 1;
            updateLayout();
            break;
    }
});
