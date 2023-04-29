import * as v2 from "./v2.js"
import { Pencil } from "./pencil.js"
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
  pencil: Pencil;
  vertexPositions: v2.v2[] = [];
  radius: number;
  private graph: Graph = new Graph();
  private labeled: Boolean;
  constructor(radius: number, labeled: Boolean = false) {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.pencil = new Pencil(this.canvas);
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
  draw(): void {
    this.pencil.clear();
    for (let i = 0; i < this.graph.vertices; i++) {
      for (let j of this.graph.edges[i]) {
        let p1 = this.vertexPositions[i]
        let p2 = this.vertexPositions[j]
        this.pencil.line(p1, p2);
      }
    }
    for (let i = 0; i < this.vertexPositions.length; i++) {
      this.pencil.circle(this.vertexPositions[i], this.radius);
      if (this.labeled) {
        this.pencil.text(this.vertexPositions[i], i.toString());
      }
    }
  }
}
