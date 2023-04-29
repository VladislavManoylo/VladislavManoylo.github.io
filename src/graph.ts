import * as v2 from "./v2.js"
type Vertex = number;

export class Graph {
  vertices: number = 0;
  edges: Vertex[][] = [];

  clear(): void {
    this.vertices = 0;
    this.edges = [];
  }

  addVertex(connected: Boolean = false): void {
    this.vertices++;
    this.edges.push([]);
    if (connected) {
      let j = this.vertices - 1;
      for (let i = 0; i < j; i++) {
        this.edges[i].push(j)
      }
      for (let i = 0; i < j; i++) {
        this.edges[j][i] = i;
      }
    }
  }

  deleteVertex(n: number): void {
    this.vertices--;
    this.edges.splice(n, 1);
    for (let i = 0; i < this.vertices; i++) {
      this.edges[i] = this.edges[i].filter(i => i == n);
    }
  }

  addEdge(i: number, j: number): void {
    if (this.edges[i].indexOf(j) !== -1) {
      this.edges[i].push(j);
      this.edges[j].push(i);
    }
  }

  private deleteEdgeIJ(i: number, j: number): void {
    let ei = this.edges[i].indexOf(j);
    if (ei !== -1) {
      this.edges[i].splice(ei, 1);
    }
  }

  deleteEdge(i: number, j: number): void {
    this.deleteEdgeIJ(i, j);
    this.deleteEdgeIJ(j, i);
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
  deleteEdge(i: number, j: number): void { this.graph.deleteEdge(i, j); }
  addEdge(i: number, j: number): void { this.graph.addEdge(i, j); }

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
    for (let i = 0; i < this.graph.vertices; i++) {
      for (let j of this.graph.edges[i]) {
        this.drawEdge(i, j);
      }
    }
    for (let i = 0; i < this.vertexPositions.length; i++) {
      this.drawCircle(this.vertexPositions[i], i.toString());
    }
  }

  /** drawEdge(i,j) connects vertex i with vertex j*/
  private drawEdge(i: number, j: number): void {
    // this.ctx.reset();
    let p1 = this.vertexPositions[i]
    let p2 = this.vertexPositions[j]
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
