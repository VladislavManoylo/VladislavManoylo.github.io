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

const radius = 50;
const buttonRadius = 20;

class Drawer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  prev: Point = { x: 0, y: 0 };
  nodes: Point[] = [];
  constructor() {
    this.canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
    this.canvas.width = 1000;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext("2d")!;
  }

  addNode(point: Point): void {
    this.nodes.push(point);
  }

  deleteNode(i: number): void {
    this.nodes.splice(i, 1);
  }

  /** returns the highest index node that overlaps with the point */
  nodeAt(point: Point): number | undefined {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (overlap(point, this.nodes[i], radius)) {
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
    for (let i = 0; i < this.nodes.length; i++) {
      this.drawCircle(this.nodes[i], i.toString());
    }
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        this.drawEdge(i, j);
      }
    }
  }

  /** drawEdge(i,j) connects node i with node j*/
  drawEdge(i: number, j: number): void {
    let [x1, y1, x2, y2]: number[] = [this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y];
    let angle = Math.atan2(y2 - y1, x2 - x1);
    let offset = polarToPoint(angle, radius);
    let p1 = addPoint(this.nodes[i], offset);
    let p2 = subPoint(this.nodes[j], offset);
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
  }

  /** draws a labeled circle, centered at a point, with a label */
  drawCircle(p: Point, label: string, r: number = radius): void {
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
  constructor() {
    this.drawer.canvas.addEventListener("click", (event) => {
      const x = event.clientX - this.drawer.canvas.offsetLeft;
      const y = event.clientY - this.drawer.canvas.offsetTop;
      this.click({ x, y });
    });
  }
  click(pos: Point): void {
    let i = this.buttons?.buttonAt(pos)
    if (i !== undefined) {
      console.log('a');
      this.drawer.deleteNode(this.buttons!.selected);
      this.drawer.draw();
      this.buttons = undefined;
      return;
    }
    i = this.drawer.nodeAt(pos);
    if (i !== undefined) {
      console.log('b')
      this.buttons = new Buttons(this.drawer.ctx, this.drawer.nodes[i], i);
      this.drawer.draw();
      this.buttons.draw();
      return;
    }
    else {
      console.log('c');
      this.drawer.addNode(pos);
      this.buttons = undefined;
      this.drawer.draw();
      return;
    }
  }
}

new Controller();
