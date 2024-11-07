const keyboardButtons = [ // skipping some keys so all columns have 4 rows
    "1234567890", // skip `-=
    "qwertyuiop", // skip []\
    "asdfghjkl;", // skip '
    "zxcvbnm,./",
];
for (let i = 0; i < 4; i++) {
    let rowDiv = document.getElementById(`row${i}`);
    for (let j = 0; j < 10; j++) {
        let ele = document.createElement("div");
        ele.classList.add("accordion");
        ele.textContent = keyboardButtons[i][j];
        rowDiv.appendChild(ele);
    }
}

// note players
// C4 - B4, A4=440
// window.AudioContext = window.AudioContext || window.webkitAudioContext;
/** @type {AudioContext} */
const audioCtx = new AudioContext();
class MultiPlayer {
    constructor(players) {
        this.players = players;
    }
    play() {
        for (const x of this.players) {
            x.start();
            x.play();
        }
    }
    pause() {
        for (const x of this.players) x.pause();
    }
};

class NotePlayer {
    constructor(frequency) {
        this.playing = false;
        this.signal = audioCtx.createOscillator();
        this.signal.frequency.value = frequency
        this.signal.type = "sine";
        this.decayer = audioCtx.createGain();
        this.signal.connect(this.decayer).connect(audioCtx.destination);
        this.started = false;
    }
    start() {
        if (this.started) return;
        audioCtx.resume();
        this.signal.start();
        this.started = true;
    }
    play() {
        if (this.playing) return;
        const t = audioCtx.currentTime;
        this.decayer.gain.linearRampToValueAtTime(1, t + 0.1);
        this.playing = true;
    }
    pause() {
        if (!this.playing) return;
        const t = audioCtx.currentTime;
        this.decayer.gain.linearRampToValueAtTime(0, t + 0.1);
        this.playing = false;
    }
};

const range = [260, 1000];
const frequencies = [261.63, 277.18, 293.66, 311.13, 329.63, 348.23, 369.99, 392, 415.3, 440, 466.16, 493.88];
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notePlayers = [];
for (const x of frequencies) {
    const ar = []
    for (let f = x; f > range[0]; f /= 2)
        ar.push(new NotePlayer(f));
    for (let f = x * 2; f < range[1]; f *= 2)
        ar.push(new NotePlayer(f));
    notePlayers.push(new MultiPlayer(ar));
}

// keyboard -> accordion
const circleOfFifths = ["B", "E", "A", "D", "G", "C", "F", "A#", "D#", "G#", "C#", "F#"];
const stradellaroots = ["A#", "D#", "G#", "C#", "F#", "B", "E", "A", "D", "G", "C", "F", "A#", "D#", "G#", "C#", "F#", "B", "E", "A"];
const chords = { "counterbass": [4], "root": [0], "major": [0, 4, 7], "minor": [0, 3, 7], "7": [0, 4, 11], "dim7": [0, 4, 10] };
const keyboardOffset = 6;
const keyboardRows = ["root", "major", "minor", "7"];
function keypos(k) {
    for (let i = 0; i < 4; i++) {
        const j = keyboardButtons[i].indexOf(k);
        if (j != -1) return [i, j];
    }
    return null;
}

const heldKeys = new Set();
function updatePlayers() {
    const heldNotes = new Set();
    for (const k of heldKeys) {
        const kp = keypos(k);
        if (kp == null) continue;
        const root = circleOfFifths[(kp[1] + keyboardOffset) % 12];
        const rootI = notes.indexOf(root);
        const chord = keyboardRows[kp[0]];
        const intervals = chords[chord];
        for (const x of intervals)
            heldNotes.add((rootI + x) % 12);
    }
    for (let i = 0; i < 12; i++) {
        if (heldNotes.has(i))
            notePlayers[i].play()
        else
            notePlayers[i].pause()
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
