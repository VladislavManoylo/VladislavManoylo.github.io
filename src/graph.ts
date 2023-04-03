type Point = { x: number; y: number; };
class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  prev: Point = { x: 0, y: 0 };
  radius = 40;
  nodes: Point[] = [];
  constructor() {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
  }

  addNode(point: Point) {
    this.nodes.push(point);
    this.draw()
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.nodes.length; i++) {
      this.drawNode(this.nodes[i], i.toString());
    }
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        this.drawEdge(i, j);
      }
    }
  }

  drawEdge(i: number, j: number) {
    let [x1, y1, x2, y2]: number[] = [this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y];
    let angle = Math.atan2(y2 - y1, x2 - x1);
    let dx = this.radius * Math.cos(angle);
    let dy = this.radius * Math.sin(angle);
    x1 += dx;
    x2 -= dx;
    y1 += dy;
    y2 -= dy;
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  drawNode(p: Point, label: string) {
    // circle
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, this.radius, 0, 2 * Math.PI);
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

const drawer = new Drawer();
drawer.canvas.addEventListener("click", (event) => {
  const x = event.clientX - drawer.canvas.offsetLeft;
  const y = event.clientY - drawer.canvas.offsetTop;
  drawer.addNode({ x, y })
});

