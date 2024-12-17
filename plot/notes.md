set canvas resolution (not size)
`<canvas width="500" height="500"></canvas>`

set canvas coordinates to [0,0] - [1,1]
`ctx.scale(canvas.width, -canvas.height);`

set origin to bottom left (after scaling)
`ctx.translate(0, -1);`
to center
`ctx.translate(0.5, -0.5);`

make lines bigger
`ctx.lineWidth = 0.05`

when drawing paths start with `ctx.beginPath()`, end with `ctx.stroke()`
stroke will draw every line since beginPath
