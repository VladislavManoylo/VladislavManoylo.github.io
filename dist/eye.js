import { Pencil, polarToPoint } from "./pencil.js";
let canvas = document.getElementById("canvas");
let pencil = new Pencil(canvas);
function randColor() {
    return ("#" +
        Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, "0"));
}
function plus(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}
function times(a, b) {
    return [a[0] * b, a[1] * b];
}
class Eye {
    constructor(pos) {
        this.i = 0;
        this.c = Math.floor(10 * Math.random());
        this.iris = randColor();
        this.wander = Math.random() * 30;
        this.pos = pos;
        this.look = [0, 0];
    }
    randomLook() {
        this.look = polarToPoint(Math.random() * 2 * Math.PI, Math.random());
    }
    update() {
        this.i++;
        if (this.i > this.c) {
            this.i = 0;
            if (Math.random() < 0.1) {
                this.c = Math.floor(10 * Math.random());
            }
            this.iris = randColor();
            this.wander = Math.random() * 30;
            this.randomLook();
        }
        this.pos[0] += this.look[0] * this.wander;
        this.pos[1] += this.look[1] * this.wander;
    }
    draw() {
        pencil.circle(this.pos, 50, "white");
        pencil.circle(plus(this.pos, times(this.look, 25)), 25, this.iris);
        pencil.circle(plus(this.pos, times(this.look, 35)), 10, "black");
    }
}
let mouse = [Math.random() * canvas.width, Math.random() * canvas.height];
let eyes;
function resetEyes() {
    eyes = [];
    let d = 150;
    for (let x = 0; x <= canvas.width + d; x += d) {
        for (let y = 0; y <= canvas.height + d; y += d) {
            eyes.push(new Eye([x, y]));
        }
    }
}
function drawEyes() {
    pencil.clear();
    for (let it of eyes) {
        it.update();
        it.draw();
    }
}
function draw() {
    if (canvas.width != window.innerWidth ||
        canvas.height != window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resetEyes();
    }
    drawEyes();
    let fps = 24;
    setTimeout(() => {
        window.requestAnimationFrame(draw);
    }, 1000 / fps);
}
draw();
