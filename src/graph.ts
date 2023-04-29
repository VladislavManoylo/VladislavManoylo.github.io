export type Point = { x: number; y: number; };
export function overlap(p1: Point, p2: Point, r: number): Boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy < r * r;
}
export function polarToPoint(a: number, r: number) {
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}
export function addPoint(p1: Point, p2: Point) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}
export function subPoint(p1: Point, p2: Point) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}
export function angleBetween(p1: Point, p2: Point) {
  let d = subPoint(p2, p1);
  return Math.atan2(d.y, d.x);
}
export function distPoint(p1: Point, p2: Point): number {
  let x = p1.x - p2.x;
  let y = p1.y - p2.y;
  return x * x + y * y;
}

type Vertex = number;
type Edge = { i: Vertex, j: Vertex };
function swap(edge: Edge): Edge {
  return { i: edge.j, j: edge.i };
}
function equal(e1: Edge, e2: Edge) {
  return e1.i == e2.i && e1.j == e2.j;
}

export class Graph {
  vertices: number = 0;
  edges: Edge[] = [];

  clear(): void {
    this.vertices = 0;
    this.edges = [];
  }

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

export class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  vertexPositions: Point[] = [];
  radius: number;
  private graph: Graph = new Graph();
  constructor(radius: number) {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
    this.radius = radius;
  }
  clear(): void {
    this.vertexPositions = [];
    this.graph.clear();
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
    let i = this.vertexPositions.findIndex(it => overlap(point, it, this.radius));
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
    let offset = polarToPoint(angleBetween(p1, p2), this.radius);
    p1 = addPoint(p1, offset);
    p2 = subPoint(p2, offset);
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
  }

  /** draws a labeled circle, centered at a point, with a label */
  drawCircle(p: Point, label: string, r: number = this.radius, color = "grey"): void {
    // circle
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();
    // label
    // if (label !== "") {
    //   this.ctx.font = "40px Arial";
    //   this.ctx.fillStyle = "white";
    //   this.ctx.textAlign = "center";
    //   this.ctx.fillText(label, p.x, p.y);
    // }
  }
}
