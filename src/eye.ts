import { Pencil, v2, polarToPoint } from "./pencil.js";

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let pencil = new Pencil(canvas);

function randColor(): string {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}
let iris = randColor();
let mouse: v2 = [Math.random() * canvas.width, Math.random() * canvas.height];

function drawEyes() {
  pencil.clear();
  // iris = randColor();
  let d = 150;
  for (let x = 0; x <= canvas.width + d; x += d) {
    for (let y = 0; y <= canvas.height + d; y += d) {
      let pos: v2 = [x, y];
      pencil.circle(pos, 50, "white");
      let a = Math.random() * 2 * Math.PI;
      let d: v2 = polarToPoint(a, Math.random());
      pos[0] += d[0] * 25;
      pos[1] += d[1] * 25;
      pencil.circle(pos, 25, iris);
      pos[0] += d[0] * 10;
      pos[1] += d[1] * 10;
      pencil.circle(pos, 10, "black");
    }
  }
}

function draw() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawEyes();
  let fps = 5;
  setTimeout(() => {
    window.requestAnimationFrame(draw);
  }, 1000 / fps);
}
draw();
