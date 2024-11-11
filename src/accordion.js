// intervals
// root, major, minor, 7
const keyboardRows = [[0], [0, 4, 7], [0, 3, 7], [4, 11]];
function noteCheckbox(i, j) { return `key_${i}_${j}`; }
for (let i = 0; i < 4; i++) {
    const key = '<input id="{0}" type="checkbox" onchange="updateIntervals()" /><label class="{1}" for="{0}"></label>';
    const w = key.replace("{1}", "whitekey");
    const b = key.replace("{1}", "blackkey");
    const keys = [w, b, w, b, w, w, b, w, b, w, b, w];
    for (let j = 0; j < 12; j++) {
        keys[j] = keys[j].replaceAll("{0}", noteCheckbox(i, j));
    }
    document.getElementsByClassName("chordrow")[i].innerHTML = keys.join("");
}

/** @param {number[][]| undefined} [assign]
 * set the row checkboxes to the intervals passed in,
 * or set the keyboard rows to the values from the checkboxes
 * */
function updateIntervals(assign) {
    function noteDiv(i, j) { return document.getElementById(noteCheckbox(i, j)); }
    for (let i = 0; i < 4; i++) {
        if (assign) {
            for (let j = 0; j < 12; j++) {
                const x = noteDiv(i, j);
                if (assign[i].includes(j))
                    x.checked = true;
                else
                    x.checked = false;
            }
        } else {
            const row = [];
            for (let j = 0; j < 12; j++) {
                if (noteDiv(i, j).checked) row.push(j);
            }
            keyboardRows[i] = row;
        }
    }
}
updateIntervals(keyboardRows);

// buttons
const keyboardButtons = [ // skipping some keys so all columns have 4 rows
    "1234567890", // skip `-=
    "qwertyuiop", // skip []\
    "asdfghjkl;", // skip '
    "zxcvbnm,./",
];
/** @type {HTMLDivElement[][]}*/
const buttonDivs = [[], [], [], []];
const circleOfFifths = ["B", "E", "A", "D", "G", "C", "F", "A#", "D#", "G#", "C#", "F#"];
let keyboardOffset = 8;
function slide() {
    keyboardOffset++;
    relabel();
}
function relabel() {
    let rowDiv = document.getElementById("row0");
    rowDiv.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        let ele = document.createElement("div");
        ele.classList.add("accordion-column-label");
        ele.textContent = circleOfFifths[(keyboardOffset + i) % 10];
        rowDiv.appendChild(ele);
    }
}
relabel();
for (let i = 0; i < 4; i++) {
    let rowDiv = document.getElementById(`row${i + 1}`);
    for (let j = 0; j < 10; j++) {
        let ele = document.createElement("div");
        ele.classList.add("accordion-button");
        ele.textContent = keyboardButtons[i][j];
        buttonDivs[i].push(ele);
        rowDiv.appendChild(ele);
    }
}

/** @type {AudioContext} */
const audioCtx = new AudioContext();
class Reed {
    /** @param {Note[]} notes  */
    constructor(notes) {
        this.notes = notes;
    }
    play() {
        for (const x of this.notes) {
            x.play();
        }
    }
    pause() {
        for (const x of this.notes) x.pause();
    }
};

class Note {
    constructor(frequency, type = "square") {
        this.set(frequency, type);
    }
    set(frequency, type) {
        this.playing = false;
        this.signal = audioCtx.createOscillator();
        this.signal.frequency.value = frequency
        this.signal.type = type;
        this.decayer = audioCtx.createGain();
        this.signal.connect(this.decayer).connect(audioCtx.destination);
        this.started = false;
    }
    reset(frequency, type) {
        if (this.signal.frequency.value == frequency && this.signal.type == type)
            return;
        this.decayer.disconnect();
        this.signal.disconnect();
        this.set(frequency, type);
    }
    play() {
        if (!this.started) {
            audioCtx.resume();
            this.signal.start();
            this.started = true;
        }
        if (!this.playing) {
            const t = audioCtx.currentTime;
            this.decayer.gain.linearRampToValueAtTime(1, t + 0.1);
            this.playing = true;
        }
    }
    pause() {
        if (this.playing) {
            const t = audioCtx.currentTime;
            this.decayer.gain.linearRampToValueAtTime(0, t + 0.1);
            this.playing = false;
        }
    }
};

/** @type{Reed[]} */
let Reeds = [];
/** @param {[number, number]} range
 * @return {Reed[]} 12 reeds C-B
 * */
function makeReeds(range) {
    // C - B, A=440
    const frequencies = [261.63, 277.18, 293.66, 311.13, 329.63, 348.23, 369.99, 392, 415.3, 440, 466.16, 493.88];
    ret = []
    for (const x of frequencies) {
        const ar = []
        for (let f = x; f > range[0]; f /= 2)
            ar.push(new Note(f));
        for (let f = x * 2; f < range[1]; f *= 2)
            ar.push(new Note(f));
        ret.push(new Reed(ar));
    }
    return ret;
}
function updateRange() {
    const lownote = document.getElementById("lownote").value;
    const highnote = document.getElementById("highnote").value;
    Reeds = makeReeds([lownote, highnote]);
}
updateRange();

function changeSound() {
    const sound = document.getElementById("selectsound").value;
    for (let x of Reeds) {
        for (let y of x.notes) {
            y.reset(y.signal.frequency.value, sound);
        }
    }
}

// keyboard -> accordion
function keypos(k) {
    for (let i = 0; i < 4; i++) {
        const j = keyboardButtons[i].indexOf(k);
        if (j != -1) return [i, j];
    }
    return null;
}

const heldKeys = new Set();
function updatePlayers() {
    // press down screen buttons
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 10; j++) {
            const k = keyboardButtons[i][j];
            const button = buttonDivs[i][j];
            if (heldKeys.has(k))
                button.classList.add("pressed");
            else
                button.classList.remove("pressed");
        }
    }
    // find all notes being held
    const frequencyOrder = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const heldNotes = new Set();
    for (const k of heldKeys) {
        const kp = keypos(k);
        if (kp == null) continue;
        const root = circleOfFifths[(kp[1] + keyboardOffset) % 12];
        const rootI = frequencyOrder.indexOf(root);
        for (const x of keyboardRows[kp[0]])
            heldNotes.add((rootI + x) % 12);
    }
    // play held notes
    for (let i = 0; i < 12; i++) {
        if (heldNotes.has(i))
            Reeds[i].play()
        else
            Reeds[i].pause()
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
