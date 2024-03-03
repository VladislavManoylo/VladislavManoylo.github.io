const config = {
	trials: 1000,
	rounds: 20,
	workers: 10,
	stations: 10,
	held: 4,
}

/** @type {Array.<{name: String, input: HTMLInputElement}>} */
const inputs = [];
for (const x of ["rounds", "stations", "workers", "held"]) {
	inputs.push({ name: x, input: document.getElementById(x) });
}
for (const x of inputs) {
	x.input.value = config[x.name];
	x.input.addEventListener("input", (event) => {
		config[x.name] = Number(event.target.value);
		startGame();
	});
}

const game = {
	inventory: [0],
	workers: [0],
	roll: [0],
	freeWorkers: 0,
	round: 0,
	wastedPips: 0,
	sold: 0,
}

function addWorker(i) {
	if (game.freeWorkers == 0) {
		return;
	}
	game.freeWorkers--;
	game.workers[i]++;
	show();
}
function removeWorker(i) {
	if (game.workers[i] == 0) {
		return;
	}
	game.freeWorkers++;
	game.workers[i]--;
	show();
}

function startGame() {
	console.log("start");
	game.inventory = Array(config.stations).fill(config.held);
	// game.inventory[game.inventory.length-1] = 0;
	game.inventory[0] = Infinity;
	game.workers = Array(config.stations).fill(0);
	game.freeWorkers = config.workers;
	game.roll = Array(config.stations).fill(0);
	game.round = 0;
	game.wastedPips = 0;
	game.sold = 0;
	applyStrategy();
	show();
}

/**
 * Calculates the sum of all numbers in an array.
 * @param {number[]} array - The array of numbers to be summed.
 * @param {number} start - starting index
 * @param {number} end - ending index
 * @returns {number}
 */
function sum(ar, start = 0, end = ar.length) {
	let ret = 0;
	for (let i = start; i < end; i++) {
		ret += ar[i]
	}
	return ret;
}

function show() {
	/** @type {HTMLDivElement} */
	const progress = document.getElementById("progress");
	progress.innerHTML = `workers ${game.freeWorkers}/${config.workers}</br>round ${game.round}/${config.rounds}`;

	/** @type {HTMLParagraphElement> */
	const report = document.getElementById("report");
	const excess = sum(game.inventory, 1);
	report.innerHTML = `sold: ${game.sold}<br>per worker per round: ${game.sold / config.workers / game.round}<br>excess per station: ${excess / (config.stations - 1)}<br>wasted work: ${game.wastedPips}`

	/** @type {HTMLDivElement} */
	const gamediv = document.getElementById("game");

	gamediv.innerHTML = "";
	for (let i = 0; i < config.stations; i++) {
		const box = document.createElement("div");
		box.classList.add("station");
		box.innerHTML = `held: ${game.inventory[i]}<br>workers: ${game.workers[i]}<br>roll: ${game.roll[i]}<br><button type='button' onclick='addWorker(${i})'>+</button><button type='button' onclick='removeWorker(${i})'>-</button>`
		gamediv.appendChild(box);
	}
	const sold = document.createElement("div");
	sold.classList.add("station");
	sold.classList.add("sold");
	sold.innerHTML = `Sold: ${game.sold}`;
	gamediv.appendChild(sold);
}

function gameover() {
	return game.round == config.rounds;
}
function updateGame() {
	if (gameover()) return;
	for (let i = config.stations - 1; i > 0; i--) {
		let pips = rollDice(game.workers[i]);
		game.roll[i] = pips;
		const available = game.inventory[i];
		if (pips > available) {
			game.wastedPips += pips - available;
			pips = available;
		}
		if (i == config.stations - 1) {
			game.sold += pips;
		} else {
			game.inventory[i + 1] += pips;
		}
		game.inventory[i] -= pips;
	}
	game.inventory[1] += rollDice(game.workers[0]);
	game.round++;
	applyStrategy();
	show();
}
function fastforward() {
	while (!gameover()) updateGame();
}
document.getElementById("update").addEventListener("click", () => { updateGame(); })
document.getElementById("fastforward").addEventListener("click", () => { fastforward(); })
document.getElementById("restart").addEventListener("click", () => { startGame(); })

/**
 * Simulates rolling a six-sided dice multiple times.
 * @param {number} n - The number of times to roll the dice.
 * @returns {number} An array containing the result of each dice roll.
 */
function rollDice(n) {
	let ret = n;
	for (let i = 0; i < n; i++) {
		ret += Math.floor(Math.random() * 6);
	}
	return ret;
}

/** @type {HTMLSelectElement} */
const selectstrategy = document.getElementById("strategy")
function applyStrategy() {
	s = selectstrategy.options[selectstrategy.selectedIndex].value;
	if (s == "none") return;
	game.workers = Array(config.stations).fill(0);
	game.freeWorkers = config.workers;
	switch (s) {
		case "random":
			while (game.freeWorkers > 0) {
				addWorker(Math.floor(Math.random() * config.stations));
			}
			break;
		case "nowaste":
			for (let i = config.stations - 1; i > 0; i--) {
				for (let n = Math.floor(game.inventory[i] / 6); n > 0; n--) {
					addWorker(i);
				}
			}
			while (game.freeWorkers > 0) {
				addWorker(0);
			}
			break;
		case "expedite":
			const j = Math.max(0, config.stations - (config.rounds - game.round));
			for (let i = config.stations - 1; i > j; i--) {
				for (let n = Math.floor(game.inventory[i] / 6); n > 0; n--) {
					addWorker(i);
				}
			}
			while (game.freeWorkers > 0) {
				addWorker(j);
			}
			break;
	}
	show();
}
selectstrategy.addEventListener("change", () => applyStrategy());

startGame();
