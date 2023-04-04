type Point = { x: number; y: number; };
function overlap(p1: Point, p2: Point, r: number): Boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy < r * r;
}
function polarToPoint(a: number, r: number) {
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}
function addPoint(p1: Point, p2: Point) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}
function subPoint(p1: Point, p2: Point) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}
function angleBetween(p1: Point, p2: Point) {
  let d = subPoint(p2, p1);
  return Math.atan2(d.y, d.x);
}

const radius = 50;
const buttonRadius = 20;

type Vertex = number;
type Edge = { i: Vertex, j: Vertex };
function swap(edge: Edge): Edge {
  return { i: edge.j, j: edge.i };
}
function equal(e1: Edge, e2: Edge) {
  return e1.i == e2.i && e1.j == e2.j;
}

class Graph {
  vertices: number = 0;
  edges: Edge[] = [];

  addVertex(): void {
    for (let i = 0; i < this.vertices; i++) {
      this.edges.push({ i, j: this.vertices });
    }
    this.vertices++;
  }

  deleteVertex(i: number): void {
    this.vertices--;
    let removeI = (x: number) => { return x > i ? x - 1 : x };
    this.edges = this.edges
      .filter(e => e.i != i && e.j != i)
      .map(e => { return { i: removeI(e.i), j: removeI(e.j) } });
  }

  addEdge(edge: Edge): void {
    if (this.findEdge(edge) === undefined) {
      this.edges.push(edge);
    }
  }

  deleteEdge(edge: Edge): void {
    let i = this.findEdge(edge);
    if (i !== undefined) {
      this.edges.splice(i, 1);
    }
  }

  private findEdge(edge: Edge): number | undefined {
    // currently checking both directions for undirected graph
    let i1 = this.edges.findIndex(e => equal(e, edge));
    if (i1 >= 0) {
      return i1;
    }
    let i2 = this.edges.findIndex(e => equal(e, swap(edge)));
    return i2 >= 0 ? i2 : undefined;
  }
}

class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  vertexPositions: Point[] = [];
  private graph: Graph = new Graph();
  constructor() {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
  }

  addVertex(point: Point): void {
    this.graph.addVertex();
    this.vertexPositions.push(point);
  }
  deleteVertex(i: number): void {
    this.graph.deleteVertex(i);
    this.vertexPositions.splice(i, 1);
  }
  deleteEdge(edge: Edge): void { this.graph.deleteEdge(edge); }
  addEdge(edge: Edge): void { this.graph.addEdge(edge); }

  /** returns the highest index vertex that overlaps with the point */
  vertexAt(point: Point): number | undefined {
    let i = this.vertexPositions.findIndex(it => overlap(point, it, radius));
    return i >= 0 ? i : undefined;
  }

  /** clears the screen and draws all vertices and edges */
  draw(clear: Boolean = true): void {
    if (clear) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    for (let i = 0; i < this.vertexPositions.length; i++) {
      this.drawCircle(this.vertexPositions[i], i.toString());
    }
    for (const e of this.graph.edges) {
      this.drawEdge(e);
    }
  }

  /** drawEdge(i,j) connects vertex i with vertex j*/
  private drawEdge(e: Edge): void {
    let p1 = this.vertexPositions[e.i]
    let p2 = this.vertexPositions[e.j]
    let offset = polarToPoint(angleBetween(p1, p2), radius);
    p1 = addPoint(p1, offset);
    p2 = subPoint(p2, offset);
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
  }

  /** draws a labeled circle, centered at a point, with a label */
  private drawCircle(p: Point, label: string, r: number = radius): void {
    // circle
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = "grey";
    this.ctx.fill();
    this.ctx.stroke();
    // label
    this.ctx.font = "40px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(label, p.x, p.y);
  }
}

enum ButtonChoice {
  MoveVertex,
  DeleteVertex,
  DeleteEdge,
  AddEdge,
}
class Buttons {
  ctx: CanvasRenderingContext2D;
  buttons: Point[];
  selected: number; // the selected vertex in the graph
  constructor(ctx: CanvasRenderingContext2D, pos: Point, selected: number) {
    this.ctx = ctx;
    this.selected = selected;
    this.buttons = [pos];
    for (const a of [-1 / 6, -1 / 2, -5 / 6]) {
      this.buttons.push(addPoint(pos, polarToPoint(a * Math.PI, radius)))
    }
  }
  buttonAt(pos: Point): ButtonChoice | undefined {
    let i = this.buttons.findIndex(it => overlap(it, pos, buttonRadius));
    return i >= 0 ? i : undefined;
  }
  draw(): void {
    for (const it of this.buttons) {
      this.ctx.beginPath();
      this.ctx.arc(it.x, it.y, buttonRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = "red";
      this.ctx.fill();
      this.ctx.stroke();
    }
  }
}

class Controller {
  buttons: Buttons | undefined = undefined;
  lastButton: ButtonChoice | undefined = undefined;
  drawer: Drawer = new Drawer();
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
  click(pos: Point): void {
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
      console.log('c');
      if (this.lastButton == ButtonChoice.MoveVertex) {
          this.drawer.vertexPositions[this.buttons!.selected] = pos;
      } else if (this.buttons == undefined) {
        this.drawer.addVertex(pos);
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
