const audioCtx = new AudioContext();
/** @type{HTMLDivElement} */
const nodeContainer = document.getElementById("nodes");
/** @type{OscillatorNode[]} */
const nodes = [];

function makeNodeDiv(i) {
    return `
    <div>
        <label for="phase${i}">phase
            <input id="phase${i}" class="phase" type="range" min="0" max="1" step="0.1" onchange="change()">
        </label>
        <label for="hz${i}">hz
            <input id="hz${i}" class="hz" type="number" value="440" onchange="change()">
        </label>
        <label for="detune${i}">detune
            <input id="detune${i}" class="detune" type="number" value="0" onchange="change()">
        </label>
        <button class="x" type="button" onclick="rmNode(${i})">x</button>
    </div>
        `
}

function addNode() {
    nodeContainer.insertAdjacentHTML("beforeend", makeNodeDiv(nodes.length));
    nodes.push(makeNode());
    change();
}

function rmNode(i) {
    console.log(i, nodes);
    nodeContainer.removeChild(nodeContainer.children[i]);
    nodes[i].stop();
    nodes.splice(i, 1);
}

function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.2; // extra time to get sync correct
    return t - (t % p) + phase * p;
}

function makeNode(phase = 0, hz = 440, detune = 0) {
    const node = audioCtx.createOscillator();
    node.frequency.value = hz;
    node.detune.value = detune;
    node.connect(audioCtx.destination);
    node.start(synctime(phase, hz));
    return node;
}

function change() {
    const phaseDials = document.getElementsByClassName("phase");
    const hzDials = document.getElementsByClassName("hz");
    const detuneDials = document.getElementsByClassName("detune");
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].stop();
        const phase = phaseDials[i].value;
        const hz = hzDials[i].value;
        const detune = detuneDials[i].value;
        console.log(i, phase, hz);
        nodes[i] = makeNode(phase, hz, detune);
    }
}
