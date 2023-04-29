import { Drawer, addPoint, polarToPoint, overlap } from "./graph.js";
var ButtonChoice;
(function (ButtonChoice) {
    ButtonChoice[ButtonChoice["MoveVertex"] = 0] = "MoveVertex";
    ButtonChoice[ButtonChoice["DeleteVertex"] = 1] = "DeleteVertex";
    ButtonChoice[ButtonChoice["DeleteEdge"] = 2] = "DeleteEdge";
    ButtonChoice[ButtonChoice["AddEdge"] = 3] = "AddEdge";
})(ButtonChoice || (ButtonChoice = {}));
class Buttons {
    constructor(ctx, pos, selected) {
        this.radius = 20;
        this.ctx = ctx;
        this.selected = selected;
        this.buttons = [pos];
        for (const a of [-1 / 6, -1 / 2, -5 / 6]) {
            this.buttons.push(addPoint(pos, polarToPoint(a * Math.PI, this.radius)));
        }
    }
    buttonAt(pos) {
        let i = this.buttons.findIndex(it => overlap(it, pos, this.radius));
        return i >= 0 ? i : undefined;
    }
    draw() {
        for (const it of this.buttons) {
            this.ctx.beginPath();
            this.ctx.arc(it.x, it.y, this.radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = "red";
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
}
class Controller {
    constructor() {
        this.buttons = undefined;
        this.lastButton = undefined;
        this.drawer = new Drawer(50, true); // setting size of nodes here
        this.deletingEdge = false;
        this.addingEdge = false;
        this.drawer.canvas.addEventListener("click", (event) => {
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
            const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
            this.click({ x, y });
        });
    }
    click(pos) {
        var _a, _b;
        let button = (_a = this.buttons) === null || _a === void 0 ? void 0 : _a.buttonAt(pos);
        if (button !== undefined) {
            console.log('a');
            this.lastButton = button;
            switch (button) {
                case ButtonChoice.DeleteVertex:
                    this.drawer.deleteVertex(this.buttons.selected);
                    this.drawer.draw();
                    this.buttons = undefined;
                    break;
            }
            return;
        }
        let i = this.drawer.vertexAt(pos);
        if (i !== undefined) {
            console.log('b');
            // console.log('b', ButtonChoice[this.lastButton])
            switch (this.lastButton) {
                case ButtonChoice.DeleteEdge:
                    this.drawer.deleteEdge({ i, j: this.buttons.selected });
                    break;
                case ButtonChoice.AddEdge:
                    this.drawer.addEdge({ i, j: this.buttons.selected });
                    break;
                case undefined:
                default:
                    this.buttons = new Buttons(this.drawer.ctx, this.drawer.vertexPositions[i], i);
                    this.lastButton = undefined;
                    break;
            }
            this.drawer.draw();
            (_b = this.buttons) === null || _b === void 0 ? void 0 : _b.draw();
            return;
        }
        else {
            if (this.lastButton == ButtonChoice.MoveVertex) {
                this.drawer.vertexPositions[this.buttons.selected] = pos;
            }
            else if (this.buttons == undefined) {
                this.drawer.addVertex(pos, true);
            }
            this.buttons = undefined;
            this.drawer.draw();
            this.lastButton = undefined;
            return;
        }
    }
}
// setting variable makes inspection easier from browser
let controller = new Controller();
