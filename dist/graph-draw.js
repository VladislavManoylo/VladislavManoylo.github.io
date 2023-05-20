import { Drawer } from "./graph.js";
import { overlap, polarToPoint } from "./pencil.js";
var ButtonChoice;
(function (ButtonChoice) {
    ButtonChoice[ButtonChoice["MoveVertex"] = 0] = "MoveVertex";
    ButtonChoice[ButtonChoice["DeleteVertex"] = 1] = "DeleteVertex";
    ButtonChoice[ButtonChoice["DeleteEdge"] = 2] = "DeleteEdge";
    ButtonChoice[ButtonChoice["AddEdge"] = 3] = "AddEdge";
})(ButtonChoice || (ButtonChoice = {}));
function plus(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}
class Buttons {
    constructor(pencil, pos, selected) {
        this.radius = 20;
        this.pencil = pencil;
        this.selected = selected;
        this.buttons = [pos];
        let buttonOffsets = [-1 / 6, -1 / 2, -5 / 6].map((x) => polarToPoint(x, this.radius));
        for (const a of buttonOffsets) {
            this.buttons.push(plus(pos, a));
        }
    }
    buttonAt(pos) {
        let i = this.buttons.findIndex((it) => overlap(it, pos, this.radius));
        return i >= 0 ? i : undefined;
    }
    draw() {
        for (const it of this.buttons) {
            this.pencil.circle(it, this.radius, "red");
        }
    }
}
class Controller {
    constructor() {
        this.buttons = undefined;
        this.lastButton = undefined;
        this.drawer = new Drawer("graph-canvas", 50, true); // setting size of nodes here
        this.deletingEdge = false;
        this.addingEdge = false;
        this.drawer.canvas.addEventListener("click", (event) => {
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
            const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
            this.click([x, y]);
        });
    }
    click(pos) {
        var _a, _b;
        let button = (_a = this.buttons) === null || _a === void 0 ? void 0 : _a.buttonAt(pos);
        if (button !== undefined) {
            console.log("a");
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
            console.log("b");
            // console.log('b', ButtonChoice[this.lastButton])
            switch (this.lastButton) {
                case ButtonChoice.DeleteEdge:
                    this.drawer.deleteEdge(i, this.buttons.selected);
                    break;
                case ButtonChoice.AddEdge:
                    this.drawer.addEdge(i, this.buttons.selected);
                    break;
                case undefined:
                default:
                    this.buttons = new Buttons(this.drawer.pencil, this.drawer.vertexPositions[i], i);
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
