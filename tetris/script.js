const controlDiv = document.getElementById("controls");

function makeButton(id) {
    const ret = document.createElement("div");
    ret.id = id;
    ret.classList.add("button");
    return ret;
}

const bindings = {
    "ArrowUp": "up",
    "w": "up",
    "ArrowLeft": "left",
    "a": "left",
    "ArrowDown": "down",
    "s": "down",
    "ArrowRight": "right",
    "d": "right",
    " ": "a",
}

const held = {
    up: true,
    down: false,
    left: false,
    right: false,
    a: false,
}

const buttonDivs = {
    up: makeButton("up"),
    down: makeButton("down"),
    left: makeButton("left"),
    right: makeButton("right"),
    a: makeButton("a"),
}

function press(k, val) {
    if (!(k in bindings)) return;
    const b = bindings[k];
    held[b] = val;
    if (val) {
        buttonDivs[b].classList.add("held");
    } else {
        buttonDivs[b].classList.remove("held");
    }
}

for (const v of Object.values(buttonDivs)) {
    controlDiv.appendChild(v);
}

document.addEventListener("keydown", (e) => press(e.key, true));
document.addEventListener("keyup", (e) => press(e.key, false));
