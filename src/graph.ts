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

type Edge = { i: number, j: number };
function swap(edge: Edge): Edge {
  return { i: edge.j, j: edge.i };
}
function equal(e1: Edge, e2: Edge) {
  return e1.i == e2.i && e1.j == e2.j;
}

class Graph {
  nodes: number = 0;
  edges: Edge[] = [];

  addNode(): void {
    for (let i = 0; i < this.nodes; i++) {
      this.edges.push({ i, j: this.nodes });
    }
    this.nodes++;
  }

  deleteNode(i: number): void {
    this.nodes--;
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
    // have to check both directions for undirected graph
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
    if (i2 >= 0) {
      return i2;
    }
    return undefined;
  }

}

class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  nodePositions: Point[] = [];
  private graph: Graph = new Graph();
  constructor() {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
  }

  addNode(point: Point): void {
    this.graph.addNode();
    this.nodePositions.push(point);
  }
  deleteNode(i: number): void {
    this.graph.deleteNode(i);
    this.nodePositions.splice(i, 1);
  }
  deleteEdge(edge: Edge): void { this.graph.deleteEdge(edge); }
  addEdge(edge: Edge): void { this.graph.addEdge(edge); }

  /** returns the highest index node that overlaps with the point */
  nodeAt(point: Point): number | undefined {
    for (let i = this.nodePositions.length - 1; i >= 0; i--) {
      if (overlap(point, this.nodePositions[i], radius)) {
        return i;
      }
    }
    return undefined;
  }

  /** clears the screen and draws all nodes and edges */
  draw(clear: Boolean = true): void {
    if (clear) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    for (let i = 0; i < this.nodePositions.length; i++) {
      this.drawCircle(this.nodePositions[i], i.toString());
    }
    for (const e of this.graph.edges) {
      this.drawEdge(e);
    }
  }

  /** drawEdge(i,j) connects node i with node j*/
  private drawEdge(e: Edge): void {
    let p1 = this.nodePositions[e.i]
    let p2 = this.nodePositions[e.j]
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

class Buttons {
  ctx: CanvasRenderingContext2D;
  buttons: Point[];
  selected: number; // the selected node in the graph
  constructor(ctx: CanvasRenderingContext2D, pos: Point, selected: number) {
    this.ctx = ctx;
    this.selected = selected;
    this.buttons = [];
    for (const a of [-1 / 6, -1 / 2, -5 / 6]) {
      this.buttons.push(addPoint(pos, polarToPoint(a * Math.PI, radius)))
    }
  }
  buttonAt(pos: Point): number | undefined {
    for (let i = 0; i < this.buttons.length; i++) {
      if (overlap(pos, this.buttons[i], buttonRadius)) {
        return i;
      }
    }
    return undefined;
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
    let i = this.buttons?.buttonAt(pos)
    if (i !== undefined) {
      console.log('a');
      if (i == 0) { // delete node
        this.drawer.deleteNode(this.buttons!.selected);
        this.drawer.draw();
        this.buttons = undefined;
        this.deletingEdge = false;
      }
      else if (i == 1) { // delete edge
        this.deletingEdge = true;
        this.addingEdge = false;
      }
      else if (i == 2) { // add edge
        this.addingEdge = true;
        this.deletingEdge = false;
      }
      return;
    }
    i = this.drawer.nodeAt(pos);
    if (i !== undefined) {
      console.log('b')
      if (this.deletingEdge) {
        this.drawer.deleteEdge({ i, j: this.buttons!.selected });
        this.buttons = undefined;
        this.drawer.draw();
      } else if (this.addingEdge) {
        this.drawer.addEdge({ i, j: this.buttons!.selected });
        this.buttons = undefined;
        this.drawer.draw();
      } else {
        this.buttons = new Buttons(this.drawer.ctx, this.drawer.nodePositions[i], i);
        this.drawer.draw();
        this.buttons.draw();
      }
      this.deletingEdge = false;
      this.addingEdge = false;
      return;
    }
    else {
      console.log('c');
      this.drawer.addNode(pos);
      this.buttons = undefined;
      this.drawer.draw();
      this.deletingEdge = false;
      this.addingEdge = false;
      return;
    }
  }
}

// setting variable makes inspection easier from browser
let controller = new Controller();
