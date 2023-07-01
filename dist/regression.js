import { Pencil } from "./pencil.js";
let canvas = document.getElementById("canvas");
let pencil = new Pencil(canvas);
let x0 = 0;
let x1 = 1;
let y0 = 0;
let y1 = 1;
let margin = 50;
let plotSize = [canvas.width - margin, canvas.height - margin];
let points = [];
function redraw() {
    pencil.clear();
    {
        // axes
        let left = margin - 5;
        pencil.text(y1.toFixed(0), [left, 20], "1em Arial", "right");
        pencil.text(y0.toFixed(0), [left, plotSize[1]], "1em Arial", "right");
        let bottom = plotSize[1] + 20;
        pencil.text(x0.toFixed(0), [left, bottom], "1em Arial", "left");
        pencil.text(x1.toFixed(0), [canvas.width, bottom], "1em Arial", "right");
    }
    pencil.ctx.translate(margin, plotSize[1]);
    pencil.ctx.scale(1, -1);
    pencil.ctx.strokeRect(0, 0, plotSize[0], plotSize[1]);
    // points
    for (let it of points) {
        console.log("point", it[0], it[1]);
        pencil.ctx.fillRect(it[0] * plotSize[0], it[1] * plotSize[1], 1, 1);
    }
}
redraw();
canvas.addEventListener("click", (event) => {
    console.log(event.x, event.y);
    let x = event.x - margin;
    let y = canvas.height - margin - event.y;
    if (x > 0 && y > 0) {
        points.push([x / plotSize[0], y / plotSize[1]]);
        redraw();
    }
});
