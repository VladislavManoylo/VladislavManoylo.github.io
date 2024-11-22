const heldKeys = {
    keys: new Set(),
    /** @param {str} x @returns {boolean} */
    has: function(x) { return this.keys.has(x); },
    press: function(x) { this.keys.add(x); },
    release: function(x) { this.keys.delete(x); },
};
document.addEventListener("keydown", (e) => heldKeys.press(e.key));
document.addEventListener("keyup", (e) => heldKeys.release(e.key));

function makeButton(id) {
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
                const b = makeButton(x);
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
