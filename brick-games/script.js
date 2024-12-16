const heldKeys = {
    keys: new Set(),
    /** @param {str} x @returns {boolean} */
    has: function(x) { return this.keys.has(x); },
    press: function(x) { this.keys.add(x); },
    release: function(x) { this.keys.delete(x); },
};
document.addEventListener("keydown", (e) => heldKeys.press(e.key));
document.addEventListener("keyup", (e) => heldKeys.release(e.key));

function createButton(id) {
    const ret = document.createElement("div");
    ret.id = id;
    ret.classList.add("button");
    return ret;
}

const controls = {
    div: document.getElementById("controls"),
    buttons: ["up", "down", "left", "right", "a"],
    buttonDivs: undefined,
    get up() { return heldKeys.has("ArrowUp") || heldKeys.has("w") },
    get down() { return heldKeys.has("ArrowDown") || heldKeys.has("s") },
    get left() { return heldKeys.has("ArrowLeft") || heldKeys.has("a") },
    get right() { return heldKeys.has("ArrowRight") || heldKeys.has("d") },
    get a() { return heldKeys.has(" "); },
    render: function() {
        if (this.buttonDivs === undefined) {
            this.buttonDivs = [];
            for (const x of this.buttons) {
                const b = createButton(x);
                this.buttonDivs.push(b);
                this.div.appendChild(b);
            }
        }
        for (let i = 0; i < this.buttons.length; i++) {
            if (this[this.buttons[i]])
                this.buttonDivs[i].classList.add("held");
            else
                this.buttonDivs[i].classList.remove("held");
        }
    }
}
controls.render();
const controlkeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "];
document.addEventListener("keydown", (e) => {
    if (controlkeys.includes(e.key)) controls.render();
});
document.addEventListener("keyup", (e) => {
    if (controlkeys.includes(e.key)) controls.render();
});

const view = {
    /** @type{HTMLDivElement[]} */
    cells: Array.from({ length: 200 }, () => document.createElement("div")),
    /** @type{HTMLDivElement} */
    griddiv: document.getElementById("grid"),
    /** @type{HTMLDivElement} */
    scorediv: document.getElementById("score"),
    /** @param {str} frame */
    drawFrame: function(frame) {
        const z = '0'.charCodeAt(0);
        const a = 'a'.charCodeAt(0);
        const A = 'A'.charCodeAt(0);
        const k = 'k'.charCodeAt(0);
        for (let i = 0; i < 200; i++) {
            const j = frame.charCodeAt(i);
            let on = j - z;
            if (on >= 0 && on < 10) {
                this.cells[i].className = `on${on}`;
                continue;
            }
            on = j - a;
            if (on >= 0 && on < 10) {
                this.cells[i].className = `on_${on}`;
                continue;
            }
            on = j - A;
            if (on >= 0 && on < 10) {
                this.cells[i].className = `on_-${on}`;
                continue;
            }
            on = j - k;
            if (on >= 0 && on < 10) {
                this.cells[i].className = `on-${on}`;
                continue;
            }
        }
    },
}

for (let i = 0; i < 200; i++) view.griddiv.appendChild(view.cells[i]);


/** @type{string} */
const frame = `
0123456789
0123456789
0123456789
0123456789
..........
klmnopqrst
klmnopqrst
klmnopqrst
klmnopqrst
..........
abcdefghij
abcdefghij
abcdefghij
abcdefghij
..........
ABCDEFGHIJ
ABCDEFGHIJ
ABCDEFGHIJ
ABCDEFGHIJ
..........
`.replaceAll('\n', '');
view.drawFrame(frame);

function gameloop() {
    requestAnimationFrame(gameloop);
}
gameloop();

