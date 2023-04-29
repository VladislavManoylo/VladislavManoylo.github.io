import * as v2 from "./v2.js"
import { Drawer } from "./graph.js"

enum ButtonChoice {
  MoveVertex,
  DeleteVertex,
  DeleteEdge,
  AddEdge,
}
class Buttons {
  radius: number = 20;
  ctx: CanvasRenderingContext2D;
  buttons: v2.v2[];
  selected: number; // the selected vertex in the graph
  constructor(ctx: CanvasRenderingContext2D, pos: v2.v2, selected: number) {
    this.ctx = ctx;
    this.selected = selected;
    this.buttons = [pos];
    for (const a of [-1 / 6, -1 / 2, -5 / 6]) {
      this.buttons.push(v2.addPoint(pos, v2.polarToPoint(a * Math.PI, this.radius)))
    }
  }
  buttonAt(pos: v2.v2): ButtonChoice | undefined {
    let i = this.buttons.findIndex(it => v2.overlap(it, pos, this.radius));
    return i >= 0 ? i : undefined;
  }
  draw(): void {
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
  buttons: Buttons | undefined = undefined;
  lastButton: ButtonChoice | undefined = undefined;
  drawer: Drawer = new Drawer(50, true); // setting size of nodes here
  deletingEdge: Boolean = false;
  addingEdge: Boolean = false;
  constructor() {
    this.drawer.canvas.addEventListener("click", (event) => {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
      const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
      this.click({ x, y });
    });
  }
  click(pos: v2.v2): void {
    let button = this.buttons?.buttonAt(pos)
    if (button !== undefined) {
      console.log('a');
      this.lastButton = button;
      switch (button) {
        case ButtonChoice.DeleteVertex:
          this.drawer.deleteVertex(this.buttons!.selected);
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
          this.drawer.deleteEdge({ i, j: this.buttons!.selected });
          break;
        case ButtonChoice.AddEdge:
          this.drawer.addEdge({ i, j: this.buttons!.selected });
          break;
        case undefined:
        default:
          this.buttons = new Buttons(this.drawer.ctx, this.drawer.vertexPositions[i], i);
          this.lastButton = undefined;
          break;
      }
      this.drawer.draw();
      this.buttons?.draw();
      return;
    }
    else {
      if (this.lastButton == ButtonChoice.MoveVertex) {
        this.drawer.vertexPositions[this.buttons!.selected] = pos;
      } else if (this.buttons == undefined) {
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
