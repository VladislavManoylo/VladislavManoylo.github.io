const size = 7;
// initialize grid
const grid = [];
for (let i = 0; i < size; i++) {
	grid.push([]);
	for (let j = 0; j < size; j++) {
		grid[i].push('')
	}
}

// initialize table
const gridContainer = document.getElementById('grid');
for (let i = 0; i < size; i++) {
	const row = document.createElement('tr');
	for (let j = 0; j < size; j++) {
		const cell = document.createElement('td');
		row.appendChild(cell);
	}
	gridContainer.appendChild(row);
}

function celltype(i, j) {
	if (i%2==0 && j%2==0) return "rod";
	if (i%2==0 || j%2==0) return "bridge";
	return "grass";
}

function occ(s, c) {
	ret = 0
	for (let i = 0; i < s.length; i++) {
		if (s[i] == c) {
			ret++
		}
	}
	return ret
}

function updateTable() {
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			gridcell = grid[i][j];
			tablecell = gridContainer.rows[i].cells[j];
			switch (celltype(i, j)) {
				case "rod":
					if (gridcell.length > 0) {
						tablecell.textContent = grid[i][j].length
						tablecell.classList.add('rod')
					}
					break;
				case "bridge":
					if (gridcell.length > 0) {
						tablecell.textContent = occ(gridcell, "b");
						tablecell.classList.add('bridge')
					}
					break;
				case "grass":
					if (gridcell.length > 0) {
						tablecell.textContent = occ(gridcell, "g");
						tablecell.classList.add('grass')
					}
					break;
			}
		}
	}
}
updateTable();

// Function to handle click event and update table values
gridContainer.addEventListener('click', function(event) {
	const target = event.target;
	if (target.tagName === 'TD') {
		const i = target.parentNode.rowIndex;
		const j = target.cellIndex;
		console.log("Row Index: " + i + ", Column Index: " + j);
		switch (celltype(i, j)) {
			case "rod":
				grid[i][j] += "r"
				break;
			case "bridge":
				if (i%2==0 && grid[i][j-1]==grid[i][j+1]) {
					h = grid[i][j-1].length
					grid[i][j] += " ".repeat(h-grid[i][j].length);
					grid[i][j] += "b";
					grid[i][j-1] += "r";
					grid[i][j+1] += "r";
				}
				if (j%2==0 && grid[i-1][j]==grid[i+1][j]) {
					h = grid[i-1][j].length
					grid[i][j] += " ".repeat(h-grid[i][j].length);
					grid[i][j] += "b";
					grid[i-1][j] += "r";
					grid[i+1][j] += "r";
				}
				break;
			case "grass":
				h = grid[i-1][j-1].length
				if (h == grid[i-1][j+1].length && h==grid[i+1][j-1].length && h==grid[i+1][j+1].length) {
					grid[i][j] += "g";
					grid[i-1][j-1] += "r";
					grid[i-1][j+1] += "r";
					grid[i+1][j-1] += "r";
					grid[i+1][j+1] += "r";
				}
				break;
		}
	}
	updateTable();
});

