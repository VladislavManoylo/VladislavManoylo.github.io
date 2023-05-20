import { Drawer } from "./graph.js";
import { Pencil, v2, overlap } from "./pencil.js";

enum ButtonChoice {
  MoveVertex,
  DeleteVertex,
  DeleteEdge,
  AddEdge,
}

function polarToPoint(a: number, r: number): v2 {
  return [r * Math.cos(a), r * Math.sin(a)];
}
function plus(a: v2, b: v2): v2 {
  return [a[0] + b[0], a[1] + b[1]];
}

class Buttons {
  radius: number = 20;
  pencil: Pencil;
  buttons: v2[];
  selected: number; // the selected vertex in the graph
  constructor(pencil: Pencil, pos: v2, selected: number) {
    this.pencil = pencil;
    this.selected = selected;
    this.buttons = [pos];
    let buttonOffsets: v2[] = [-1 / 6, -1 / 2, -5 / 6].map((x) =>
      polarToPoint(x, this.radius)
    );
    for (const a of buttonOffsets) {
      this.buttons.push(plus(pos, a));
    }
  }
  buttonAt(pos: v2): ButtonChoice | undefined {
    let i = this.buttons.findIndex((it) => overlap(it, pos, this.radius));
    return i >= 0 ? i : undefined;
  }
  draw(): void {
    for (const it of this.buttons) {
      this.pencil.circle(it, this.radius, "red");
    }
  }
}

class Controller {
  buttons: Buttons | undefined = undefined;
  lastButton: ButtonChoice | undefined = undefined;
  drawer: Drawer = new Drawer("graph-canvas", 50, true); // setting size of nodes here
  deletingEdge: Boolean = false;
  addingEdge: Boolean = false;
  constructor() {
    this.drawer.canvas.addEventListener("click", (event) => {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
      const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
      this.click([x, y]);
    });
  }
  click(pos: v2): void {
    let button = this.buttons?.buttonAt(pos);
    if (button !== undefined) {
      console.log("a");
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
      console.log("b");
      // console.log('b', ButtonChoice[this.lastButton])
      switch (this.lastButton) {
        case ButtonChoice.DeleteEdge:
          this.drawer.deleteEdge(i, this.buttons!.selected);
          break;
        case ButtonChoice.AddEdge:
          this.drawer.addEdge(i, this.buttons!.selected);
          break;
        case undefined:
        default:
          this.buttons = new Buttons(
            this.drawer.pencil,
            this.drawer.vertexPositions[i],
            i
          );
          this.lastButton = undefined;
          break;
      }
      this.drawer.draw();
      this.buttons?.draw();
      return;
    } else {
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
