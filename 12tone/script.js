const webpage = {
    /** @type{HTMLDivElement[]} */
    keyboardRows: document.getElementsByClassName("row"),
    /** @type{HTMLDivElement[]} */
    noteDivs: [],
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
        return document.getElementById("cosTerms").value;
    },
    set cosTerms(value) {
        document.getElementById("cosTerms").value = value;
    },
    get sinTerms() {
        return document.getElementById("sinTerms").value;
    },
    set sinTerms(value) {
        document.getElementById("sinTerms").value = value;
    },
}

function updateNumTerms(n) {
    webpage.numTerms = n;
    updateSound();
}

const keyboard = // padded with spaces to make 4x14
    "1234567890-=" +
    "qwertyuiop[]" +
    "asdfghjkl;' " +
    "zxcvbnm,./  ";

/**
 * @type {Object<string, (a: number, b: number) => number | null>}
 */
const keyboardLayouts = {
    janko: (r, c) => 2 * c + r,
    jankoSplit: (r, c) => 2 * c + r - 12 * Math.floor(r / 2),
    hayden: (r, c) => 2 * c - 5 * r,
    moscow: (r, c) => 3 * c + r,
    western: (r, c) => 3 * c + 2 * r,
    piano: (r, c) => {
        const roff = Math.floor(r / 2);
        const coff = Math.floor(c / 7);
        const layout = [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [1, 3], [0, 4], [1, 4], [0, 5], [1, 5], [0, 6], [1, 6]]
        r %= 2;
        c %= 7;
        for (let i = 0; i < 12; i++) { //lmao, (let i in layout) returns a string
            if (layout[i][0] == r && layout[i][1] == c)
                return i + 12 * (roff + roff + coff);
        }
        return null;
    }
};

function toNoteName(i) {
    const letter = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][(i % 12 + 12) % 12];
    const octave = Math.floor(i / 12);
    return [letter, octave];
}

const heldKeys = new Set();
function updatePlayers() {
    // press down screen buttons
    for (let i in keyboard) {
        const k = keyboard[i];
        if (k == " ") continue;
        const button = webpage.noteDivs[i];
        if (heldKeys.has(k)) {
            button.classList.add("pressed");
        } else {
            button.classList.remove("pressed");
        }
    }
}

document.addEventListener("keydown", (e) => {
    heldKeys.add(e.key);
    updatePlayers();
})
document.addEventListener("keyup", (e) => {
    heldKeys.delete(e.key);
    updatePlayers();
})

// rendering
const p = [0, 24];
for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
        const note = document.createElement("div");
        note.classList.add("note");
        webpage.noteDivs.push(note);
        webpage.keyboardRows[r].appendChild(note);
    }
}

function updateSound() {
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
            const noteName = toNoteName(note);
            if (noteName[0].includes("#"))
                div.classList.add("sharp");
            else
                div.classList.remove("sharp");
            div.innerHTML = noteName;
        }
    }
}
updateLayout();
