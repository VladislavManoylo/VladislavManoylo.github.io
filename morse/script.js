const webpage = {
    alpha: document.getElementById("alpha"),
    morse: document.getElementById("morse"),
    dit: document.getElementById("dit"),
    dah: document.getElementById("dah"),
    letterBr: document.getElementById("letterBr"),
    wordBr: document.getElementById("wordBr"),
    play: document.getElementById("play"),
    b: document.getElementById("b"),
    audio: new AudioContext(),
}

const morsecode = [
    ["a", ".-"],
    ["b", "-..."],
    ["c", "-.-."],
    ["d", "-.."],
    ["e", "."],
    ["f", "..-."],
    ["g", "--."],
    ["h", "...."],
    ["i", ".."],
    ["j", ".---"],
    ["k", "-.-"],
    ["l", ".-.."],
    ["m", "--"],
    ["n", "-."],
    ["o", "---"],
    ["p", ".--."],
    ["q", "--.-"],
    ["r", ".-."],
    ["s", "..."],
    ["t", "-"],
    ["u", "..-"],
    ["v", "...-"],
    ["w", ".--"],
    ["x", "-..-"],
    ["y", "-.--"],
    ["z", "--.."],
    ["0", "-----"],
    ["1", ".----"],
    ["2", "..---"],
    ["3", "...--"],
    ["4", "....-"],
    ["5", "....."],
    ["6", "-...."],
    ["7", "--..."],
    ["8", "---.."],
    ["9", "----."],
]

/**
 * Give button element callbacks for holding and releasing, and an optional keybind
 * @param {HTMLElement} button
 * @param {function} onhold
 * @param {function} onrelease
 * @param {string | undefined} [key=undefined]
 */
function holdButton(button, onhold, onrelease, key = undefined) {
    let held = false;
    const hold = () => {
        if (held) return;
        onhold();
        held = true;
        button.classList.add("held");
    };
    const release = () => {
        if (!held) return;
        onrelease();
        held = false;
        button.classList.remove("held");
    };
    button.addEventListener("pointerdown", hold);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    if (key !== undefined) {
        document.addEventListener("keydown", (e) => {
            if (document.activeElement.tagName === "TEXTAREA") return;
            if (e.key === key) hold();
        });
        document.addEventListener("keyup", (e) => {
            if (document.activeElement.tagName === "TEXTAREA") return;
            if (e.key === key) release();
        });
    }
}

const note = {
    signal: webpage.audio.createOscillator(),
    gain: webpage.audio.createGain(),
    started: false,
    start: function() {
        if (this.started) return;
        webpage.audio.resume();
        this.signal.connect(this.gain).connect(webpage.audio.destination);
        this.signal.frequency = 400;
        this.signal.start();
        this.gain.gain.value = 0;
        this.started = true;
    },
    stop: function() {
        this.signal.stop();
        this.gain.stop();
    },
    on: function() {
        this.start();
        this.gain.gain.value = 1;
    },
    off: function() {
        this.start();
        this.gain.gain.value = 0;
    },
    play: function(timings) {
        this.on();
        let t = webpage.audio.currentTime;
        for (let i = 0; i < timings.length; i++) {
            t += timings[i] / 1000;
            this.gain.gain.setValueAtTime(i % 2 === 0 ? 0 : 1, t);
        }
    },
}

const timer = {
    t: 0,
    lap: function() {
        const t = new Date().getTime();
        const res = t - this.t;
        this.t = t;
        return res;
    }
}

const telegraph = {
    tape: [], // alternating on/off times
    started: false,
    reset: function() {
        this.tape = [];
        this.started = false;
    },
    record: function() {
        changeMorse(tapeToMorse(this.tape));
    },
    on: function() {
        if (this.started) {
            this.tape.push(timer.lap());
        } else {
            timer.lap();
            this.started = true
        }
        this.record()
    },
    off: function() {
        this.tape.push(timer.lap());
        this.record()
    },
}

/**
 * @param{number} n
 * @param{number[]} near
 */
function roundTo(n, near) {
    return near.reduce((res, cur) => Math.abs(res - n) < Math.abs(cur - n) ? res : cur);
}

/**
 * tapeToMorse translates timings to morse code
 * @param {number[]} tape - timings of alternating on/off sections
 * @param {n} wpm - based on 50 dits per word
 * @returns {string}
 */
function tapeToMorse(tape, wpm = 20) {
    let res = "";
    const ditlength = (1 / wpm) * 60 / 50 * 1000; // in ms
    const onMorse = (n) => {
        switch (roundTo(n, [1, 3])) {
            case 1: return ".";
            case 3: return "-";
        }
    };
    const offMorse = (n) => {
        switch (roundTo(n, [1, 3, 7])) {
            case 1: return "";
            case 3: return " ";
            case 7: return "/";
        }
    };
    for (let i = 0; i < tape.length; i++) {
        const dits = tape[i] / ditlength;
        res += i % 2 === 0 ? onMorse(dits) : offMorse(dits);
    }
    return res;
}

/**
 * morseToTape translates morse code to on/off timings
 * @param {string} morse
 * @param {n} wpm - based on 50 dits per word
 * @returns {number[]}
 */
function morseToTape(morse, wpm = 20) {
    let res = [];
    const ditlength = (1 / wpm) * 60 / 50 * 1000; // in ms
    const dit1 = ditlength, dit3 = ditlength * 3, dit7 = ditlength * 7;
    let last = "/";
    for (let c of morse) {
        if (!".- /".includes(c)) continue;
        if (".-".includes(c) && ".-".includes(last))
            res.push(dit1);
        switch (c) {
            case ".": res.push(dit1); break;
            case "-": res.push(dit3); break;
            case " ": res.push(dit3); break;
            case "/": res.push(dit7); break;
        }
        last = c;
    }
    if (" /".includes(last)) res.pop();
    return res;
}

/**
 * @param {string} morse
 * @returns {string}
 */
function morseToAlpha(morse) {
    let res = "";
    for (const word of morse.split("/")) {
        for (const code of word.split(" ")) {
            const f = morsecode.find((x) => x[1] === code);
            res += f === undefined ? code : f[0];
        }
        res += " ";
    }
    return res;
}

/**
 * @param {string} morse
 * @returns {string}
 */
function alphaToMorse(alpha) {
    let res = "";
    for (const word of alpha.split(" ")) {
        for (const c of word) {
            const f = morsecode.find((x) => x[0] === c);
            res += f === undefined ? c : f[1];
            res += " ";
        }
        res += "/";
    }
    return res.replaceAll(/[ /]{2,}/g, "/");
}

holdButton(webpage.b,
    () => { note.start(); note.on(); telegraph.on(); },
    () => { note.start(); note.off(); telegraph.off(); },
    'b');

function changeMorse(morse) {
    morse ??= webpage.morse.value;
    webpage.morse.value = morse;
    webpage.alpha.value = morseToAlpha(morse);
}

function changeAlpha(alpha) {
    alpha ??= webpage.alpha.value;
    webpage.alpha.value = alpha;
    webpage.morse.value = alphaToMorse(alpha);
}

document.addEventListener("keydown", () => {
    if (document.activeElement.id === "morse") {
        changeMorse();
        telegraph.reset();
    }
    if (document.activeElement.id === "alpha") {
        changeAlpha();
        telegraph.reset();
    }
});

function appendMorse(c) {
    changeMorse(webpage.morse.value + c);
    telegraph.reset();
}

webpage.dit.addEventListener("click", () => { appendMorse("."); });
webpage.dah.addEventListener("click", () => { appendMorse("-"); });
webpage.letterBr.addEventListener("click", () => { appendMorse(" "); });
webpage.wordBr.addEventListener("click", () => { appendMorse("/"); });

webpage.play.addEventListener("click", () => {
    note.play(morseToTape(webpage.morse.value));
});
