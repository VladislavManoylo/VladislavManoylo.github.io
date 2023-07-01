import { Pencil } from "./pencil.js";
/** given an input [1,2,3], returns the function (x) => (x^2 + 2x + 3) */
function coefToPolynomial(coefficients) {
    coefficients.reverse();
    return (x) => {
        let v = 1;
        let sum = 0;
        for (let i = 0; i < coefficients.length; i++) {
            sum += coefficients[i] * v;
            v *= x;
        }
        return sum;
    };
}
//console.log("139=", coefToPolynomial([1,10,100])(3));
let canvas = document.getElementById("canvas");
let pencil = new Pencil(canvas);
let x0 = 0;
let x1 = 1;
let y0 = 0;
let y1 = 1;
let margin = 50;
let points = [];
function redraw() {
    pencil.clear();
    {
        // axes
        let left = margin - 5;
        let bottom = canvas.height - margin;
        pencil.text(y1.toFixed(0), [left, 20], "1em Arial", "right");
        pencil.text(y0.toFixed(0), [left, bottom], "1em Arial", "right");
        bottom += 20;
        pencil.text(x0.toFixed(0), [left, bottom], "1em Arial", "left");
        pencil.text(x1.toFixed(0), [canvas.width, bottom], "1em Arial", "right");
    }
    pencil.ctx.translate(margin, canvas.height - margin);
    pencil.ctx.scale(1, -1);
    pencil.ctx.strokeRect(0, 0, canvas.width - margin, canvas.height - margin);
    // points
    for (let it of points)
        pencil.ctx.fillRect(it[0], it[1], 1, 1);
}
redraw();
canvas.addEventListener("click", (event) => {
    console.log(event.x, event.y);
    let x = event.x - margin;
    let y = canvas.height - margin - event.y;
    if (x > 0 && y > 0) {
        points.push([x, y]);
    }
    redraw();
});
