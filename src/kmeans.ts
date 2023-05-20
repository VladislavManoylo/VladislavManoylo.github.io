import { Drawer } from "./graph.js";
import { v2 } from "./pencil.js";

const radius = 10;

function dist(a: v2, b: v2): number {
  let x = a[0] - b[0];
  let y = a[1] - b[1];
  return x * x + y * y;
}

class KMeans {
  centroids: v2[] = [];
  points: v2[] = [];
  centroidAssignment: number[] = [];
  drawer: Drawer = new Drawer("kmeans-canvas", radius);
  constructor() {
    this.resetCentroids(3);
    document.getElementById("k")?.addEventListener("input", (event) => {
      let k = +(event.target as HTMLInputElement).value;
      if (Number.isFinite(k)) this.resetCentroids(k);
    });
    // document.getElementById("reset")?.addEventListener("click", this.reset);
    document.getElementById("reset")?.addEventListener("click", () => {
      this.resetCentroids(this.centroids.length);
    });
    document.getElementById("assign")?.addEventListener("click", () => {
      this.centroidAssignment = [];
      for (let p of this.points) {
        let bj = 0;
        let bd = null;
        for (let j = 0; j < this.centroids.length; j++) {
          let d = dist(p, this.centroids[j]);
          if (bd === null || d < bd) {
            bd = d;
            bj = j;
          }
        }
        this.centroidAssignment.push(bj);
      }
      this.draw();
    });
    document.getElementById("nudge")?.addEventListener("click", () => {
      for (let i = 0; i < this.centroids.length; i++) {
        let c = 0;
        let p: v2 = [0, 0];
        for (let j = 0; j < this.centroidAssignment.length; j++) {
          if (this.centroidAssignment[j] == i) {
            c++;
            p[0] += this.points[j][0];
            p[1] += this.points[j][1];
          }
        }
        if (c != 0) this.centroids[i] = [p[0] / c, p[1] / c];
      }
      this.draw();
    });
    this.drawer.canvas.addEventListener("click", (event) => {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
      const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
      this.points.push([x, y]);
      this.draw();
    });
  }
  resetCentroids(k: number): void {
    this.centroids = [];
    this.centroidAssignment = [];
    for (let i = 0; i < k; i++) {
      let x = Math.random() * this.drawer.canvas.width;
      let y = Math.random() * this.drawer.canvas.height;
      this.centroids.push([x, y]);
    }
    this.draw();
  }
  draw(): void {
    this.drawer.clear();
    for (let p of this.centroids) {
      this.drawer.addVertex(p);
    }
    for (let p of this.points) {
      this.drawer.addVertex(p);
    }
    let lp = this.centroidAssignment.length;
    let k = this.centroids.length;
    for (let i = 0; i < lp; i++) {
      this.drawer.addEdge(this.centroidAssignment[i], k + i);
    }
    this.drawer.draw();
    for (let p of this.centroids) {
      this.drawer.pencil.circle(p, radius, "red");
    }
  }
}

// setting variable makes inspection easier from browser
// let controller = new Controller();
let kmeans = new KMeans();
