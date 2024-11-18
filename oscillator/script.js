/** @type{HTMLInputElement[]} */
const phaseDials = document.getElementsByClassName("phase");
/** @type{HTMLInputElement[]} */
const hzDials = document.getElementsByClassName("hz");

const audioCtx = new AudioContext();
let nodes = [null, null];

function makeNodeDiv(i) {
    return `
    <div>
        <label for="phase${i}">phase
            <input id="phase${i}" class="phase" type="range" min="0" max="1" step="0.1" onchange="change()">
        </label>
        <label for="hz${i}">hz
            <input id="hz${i}" class="hz" type="number" value="440" onchange="change()">
        </label>
    </div>
        `
}
document.body.innerHTML = makeNodeDiv(1) + makeNodeDiv(2);

function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.1; // extra time to get sync correct
    return t - (t % p) + phase * p;
}

function makeNode(hz = 440) {
    const node = audioCtx.createOscillator();
    node.frequency.value = hz;
    node.connect(audioCtx.destination);
    return node;
}

function change() {
    for (let i = 0; i < 2; i++) {
        if (nodes[i] !== null)
            nodes[i].stop();
        const phase = phaseDials[i].value;
        const hz = hzDials[i].value;
        console.log(i, phase, hz);
        nodes[i] = makeNode(hz);
        nodes[i].start(synctime(phase, hz));
    }
}
