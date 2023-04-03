class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  counter: number = 0;
  prev = { x: 0, y: 0 };
  radius = 40;
  constructor() {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
  }

  circle(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "grey";
    this.ctx.fill();
    this.ctx.stroke();
    // label
    this.ctx.font = "40px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.counter.toString(), x, y);
    // edge
    let [x1, y1, x2, y2] : number[] = [this.prev.x, this.prev.y, x, y];
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
    // this.ctx.lineTo(this.prev.x + this.radius, this.prev.x + )
    // post
    this.counter++;
    this.prev.x = x;
    this.prev.y = y;
  }
}

const drawer = new Drawer();
drawer.canvas.addEventListener("click", (event) => {
  const x = event.clientX - drawer.canvas.offsetLeft;
  const y = event.clientY - drawer.canvas.offsetTop;
  drawer.circle(x, y);
});

