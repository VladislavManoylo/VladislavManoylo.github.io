import * as v2 from "./v2.js"
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

  addVertex(connected: Boolean = false): void {
    if (connected) {
      for (let i = 0; i < this.vertices; i++) {
        this.edges.push({ i, j: this.vertices });
      }
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
  vertexPositions: v2.v2[] = [];
  radius: number;
  private graph: Graph = new Graph();
  private labeled: Boolean;
  constructor(radius: number, labeled: Boolean = false) {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
    this.radius = radius;
    this.labeled = labeled;
  }
  clear(): void {
    this.vertexPositions = [];
    this.graph.clear();
  }

  addVertex(point: v2.v2, connected: Boolean = false): void {
    this.graph.addVertex(connected);
    this.vertexPositions.push(point);
  }
  deleteVertex(i: number): void {
    this.graph.deleteVertex(i);
    this.vertexPositions.splice(i, 1);
  }
  deleteEdge(edge: Edge): void { this.graph.deleteEdge(edge); }
  addEdge(edge: Edge): void { this.graph.addEdge(edge); }

  /** returns the highest index vertex that overlaps with the point */
  vertexAt(point: v2.v2): number | undefined {
    let i = this.vertexPositions.findIndex(it => v2.overlap(point, it, this.radius));
    return i >= 0 ? i : undefined;
  }

  /** clears the screen and draws all vertices and edges */
  draw(clear: Boolean = true): void {
    if (clear) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    for (const e of this.graph.edges) {
      this.drawEdge(e);
    }
    for (let i = 0; i < this.vertexPositions.length; i++) {
      this.drawCircle(this.vertexPositions[i], i.toString());
    }
  }

  /** drawEdge(i,j) connects vertex i with vertex j*/
  private drawEdge(e: Edge): void {
    // this.ctx.reset();
    this.ctx.resetTransform()
    let p1 = this.vertexPositions[e.i]
    let p2 = this.vertexPositions[e.j]
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
  }

  /** draws a labeled circle, centered at a point, with a label */
  drawCircle(p: v2.v2, label: string, r: number = this.radius, color = "grey"): void {
    // circle
    this.ctx.resetTransform()
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.stroke();
    // label
    if (this.labeled && label !== "") {
      this.ctx.font = "40px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.fillText(label, p.x, p.y);
    }
  }
}
