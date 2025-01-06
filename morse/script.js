const webpage = {
    alpha: document.getElementById("alpha"),
    morse: document.getElementById("morse"),
    dit: document.getElementById("dit"),
    dah: document.getElementById("dah"),
    letterBr: document.getElementById("letterBr"),
    wordBr: document.getElementById("wordBr"),
    play: document.getElementById("play"),
    b: document.getElementById("b"),
    delSym: document.getElementById("delSym"),
    delLetter: document.getElementById("delLetter"),
    delWord: document.getElementById("delWord"),
    delAll: document.getElementById("delAll"),
    wpm: document.getElementById("wpm"),
    hz: document.getElementById("hz"),
    audio: new AudioContext(),
}

const morsecode = [
    ["A", ".-"],
    ["B", "-..."],
    ["C", "-.-."],
    ["D", "-.."],
    ["E", "."],
    ["F", "..-."],
    ["G", "--."],
    ["H", "...."],
    ["I", ".."],
    ["J", ".---"],
    ["K", "-.-"],
    ["L", ".-.."],
    ["M", "--"],
    ["N", "-."],
    ["O", "---"],
    ["P", ".--."],
    ["Q", "--.-"],
    ["R", ".-."],
    ["S", "..."],
    ["T", "-"],
    ["U", "..-"],
    ["V", "...-"],
    ["W", ".--"],
    ["X", "-..-"],
    ["Y", "-.--"],
    ["Z", "--.."],
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
    ["&", ".-..."],
    ["'", ".----."],
    ["@", ".--.-."],
    [")", "-.--.-"],
    ["(", "-.--."],
    [":", "---..."],
    [",", "--..--"],
    ["=", "-...-"],
    ["!", "-.-.--"],
    [".", ".-.-.-"],
    ["-", "-....-"],
    ["×", "-..-"],
    ["%", "-..-."],
    ["+", ".-.-."],
    ["\"", ".-..-."],
    ["?", "..--.."],
    ["/", "-..-."],
    ["À", ".--.-"],
    ["Å", ".--.-"],
    ["Ä", ".-.-"],
    ["Ą", ".-.-"],
    ["Æ", ".-.-"],
    ["Ć", "-.-.."],
    ["Ĉ", "-.-.."],
    ["Ç", "-.-.."],
    ["Ch", "----"],
    ["Ĥ", "----"],
    ["Š", "----"],
    ["È", ".-..-"],
    ["Ł", ".-..-"],
    ["Ĝ", "--.-."],
    ["Ĵ", ".---."],
    ["Ń", "--.--"],
    ["Ñ", "--.--"],
    ["Ó", "---."],
    ["Ö", "---."],
    ["Ø", "---."],
    ["Ś", "...-..."],
    ["Ŝ", "...-."],
    ["Þ", ".--.."],
    ["Ü", "..--"],
    ["Ŭ", "..--"],
    ["Ź", "--..-."],
    ["Ż", "--..-"],
    ["<AA>", ".-.-"],
    ["<AR>", ".-.-."],
    ["<AS>", ".-..."],
    ["<BK>", "-...-.-"],
    ["<BT>", "-...-"],
    ["<CL>", "-.-..-.."],
    ["<CT>", "-.-.-"],
    ["<DO>", "-..---"],
    ["<KA>", "-.-.-"],
    ["<KN>", "-.--."],
    ["<SK>", "...-.-"],
    ["<SN>", "...-."],
    ["<SOS>", "...---..."],
];


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
            if (document.activeElement.id === "alpha") return;
            if (e.key === key) hold();
        });
        document.addEventListener("keyup", (e) => {
            if (document.activeElement.id === "alpha") return;
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
        if (timings.length === 0) return;
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
    on: function() {
        if (this.tape.length > 0)
            this.tape.push(timer.lap());
        timer.lap();
    },
    off: function() {
        this.tape.push(timer.lap());
        changeMorse(tapeToMorse(this.tape));
    },
    get morse() {
        return tapeToMorse(this.tape);
    },
    set morse(morse) {
        this.tape = morseToTape(morse);
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
 * @returns {string}
 */
function tapeToMorse(tape) {
    let res = "";
    const wpm = webpage.wpm.value;
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
 * @returns {number[]}
 */
function morseToTape(morse) {
    let res = [];
    const wpm = webpage.wpm.value;
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
    const codeToLetter = (code) => {
        const f = morsecode.find((x) => x[1] === code);
        return f === undefined ? "" : f[0];
    }
    return morse
        .split("/")
        .map((word) => word.split(" ").map(codeToLetter).join(""))
        .join(" ");
}

/**
 * @param {string} morse
 * @returns {string}
 */
function alphaToMorse(alpha) {
    const letterToCode = (letter) => {
        letter = letter.toUpperCase();
        const f = morsecode.find((x) => x[0] === letter);
        return f === undefined ? "" : f[1];
    }
    return alpha
        .split(" ")
        .map((word) => word.split("").map(letterToCode).join(" "))
        .join("/");
}

holdButton(webpage.b,
    () => { note.start(); note.on(); telegraph.on(); },
    () => { note.start(); note.off(); telegraph.off(); },
    'b');

function changeMorse(morse) {
    morse ??= webpage.morse.value;
    morse = morse.replaceAll(/[^ /.-]/g, "");
    morse = morse.replaceAll(/[ /]{2,}/g, "/");
    webpage.morse.value = morse;
    webpage.alpha.value = morseToAlpha(morse);
    telegraph.morse = morse;
}

function changeAlpha(alpha) {
    changeMorse(alphaToMorse(alpha ?? webpage.alpha.value));
}

document.addEventListener("keyup", () => {
    if (document.activeElement.id === "morse")
        changeMorse();
    if (document.activeElement.id === "alpha")
        changeAlpha();
});

webpage.hz.addEventListener("change", () => {
    note.signal.frequency.value = webpage.hz.value;
});

webpage.alpha.addEventListener("input", (e) => {
    if (e.data === null) return;
    note.play(morseToTape(alphaToMorse(e.data)));
});

// telegraph keyboard

function appendMorse(c) {
    changeMorse(webpage.morse.value + c);
}

webpage.dit.addEventListener("click", () => { appendMorse("."); });
webpage.dah.addEventListener("click", () => { appendMorse("-"); });
webpage.letterBr.addEventListener("click", () => { appendMorse(" "); });
webpage.wordBr.addEventListener("click", () => { appendMorse("/"); });

webpage.play.addEventListener("click", () => {
    note.play(morseToTape(webpage.morse.value));
});

function delSym() {
    changeMorse(webpage.morse.value.slice(0, -1));
}
function delLetter() {
    const s = webpage.morse.value.slice(0, -1);
    changeMorse(s.substring(0, Math.max(s.lastIndexOf("/"), s.lastIndexOf(" "))) + " ");
}
function delWord() {
    const s = webpage.morse.value.slice(0, -1);
    changeMorse(s.substring(0, s.lastIndexOf("/")) + "/");
}
function delAll() {
    changeMorse("");
}

webpage.delSym.addEventListener("click", delSym);
webpage.delLetter.addEventListener("click", delLetter);
webpage.delWord.addEventListener("click", delWord);
webpage.delAll.addEventListener("click", delAll);

document.addEventListener("keydown", (e) => {
    if (document.activeElement.id === "morse" &&
        (".- /".includes(e.key) || e.key === "Backspace")) {
        document.activeElement.blur();
    }
});

document.addEventListener("keyup", (e) => {
    if (document.activeElement.id === "alpha") return;
    if (document.activeElement.id === "morse") document.activeElement.blur();
    switch (e.key) {
        case ".": appendMorse("."); note.play(morseToTape(".")); break;
        case "-": appendMorse("-"); note.play(morseToTape("-")); break;
        case " ": appendMorse(" "); break;
        case "/": appendMorse("/"); break;
        case "Backspace":
            if (e.shiftKey) delAll();
            else if (e.ctrlKey) delWord();
            else if (e.altKey) delSym();
            else delLetter();
            break;
    }
});
