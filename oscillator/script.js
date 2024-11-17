/** @type{HTMLInputElement[]} */
const phaseDials = document.getElementsByClassName("phase");
/** @type{HTMLInputElement[]} */
const hzDials = document.getElementsByClassName("hz");

const audioCtx = new AudioContext();
let nodes = [null, null];

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
