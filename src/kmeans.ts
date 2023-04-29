import { Point, Drawer, distPoint, addPoint } from "./graph.js"

const radius = 10;

class KMeans {
  centroids: Point[] = [];
  points: Point[] = [];
  centroidAssignment: number[] = [];
  drawer: Drawer = new Drawer(radius);
  k: number = 3;
  constructor() {
    document.getElementById("k")?.addEventListener("input", (event) => {
      let k = +(event.target as HTMLInputElement).value;
      if (Number.isFinite(k)) {
        this.k = k;
        this.reset();
      }
    });
    // document.getElementById("reset")?.addEventListener("click", this.reset);
    document.getElementById("reset")?.addEventListener("click", () => { this.reset() });
    document.getElementById("assign")?.addEventListener("click", () => {
      this.centroidAssignment = [];
      for (let p of this.points) {
        let bj = 0;
        let bd = null;
        for (let j = 0; j < this.k; j++) {
          let d = distPoint(p, this.centroids[j]);
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
        let p = { x: 0, y: 0 };
        for (let j = 0; j < this.centroidAssignment.length; j++) {
          if (this.centroidAssignment[j] == i) {
            c++;
            p = addPoint(p, this.points[j]);
          }
        }
        if (c != 0) {
          this.centroids[i] = { x: p.x / c, y: p.y / c };
        }
        else { // cheating
          console.log("ohno");
          // let x = Math.random() * this.drawer.canvas.width;
          // let y = Math.random() * this.drawer.canvas.height;
          // this.centroids[i] = { x, y };
        }
      }
      this.draw();
    });
    this.drawer.canvas.addEventListener("click", (event) => {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const x = event.clientX - this.drawer.canvas.offsetLeft + scrollX;
      const y = event.clientY - this.drawer.canvas.offsetTop + scrollY;
      this.points.push({ x, y });
      let huh = Math.floor(Math.random() * this.k)
      console.log("huh", huh);
      // this.centroidAssignment.push(huh);
      this.draw();
    });
  }
  reset(): void {
    this.centroids = [];
    this.centroidAssignment = [];
    for (let i = 0; i < this.k; i++) {
      let x = Math.random() * this.drawer.canvas.width;
      let y = Math.random() * this.drawer.canvas.height;
      this.centroids.push({ x, y });
    }
    this.draw();
    // this.draw();
  };
  draw(): void {
    this.drawer.clear();
    for (let p of this.centroids) {
      this.drawer.addVertex(p);
    }
    for (let p of this.points) {
      this.drawer.addVertex(p);
    }
    let lp = this.centroidAssignment.length;
    for (let i = 0; i < lp; i++) {
      this.drawer.addEdge({
        i: this.centroidAssignment[i],
        j: this.k + i
      })
    }
    this.drawer.draw();
    for (let p of this.centroids) {
      this.drawer.drawCircle(p, "", radius, "red");
    }
  }
}



// setting variable makes inspection easier from browser
// let controller = new Controller();
let kmeans = new KMeans();