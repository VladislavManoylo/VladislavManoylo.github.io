/** @type{HTMLInputElement} */
const dial1 = document.getElementById("dial1");
/** @type{HTMLInputElement} */
const dial2 = document.getElementById("dial2");

const audioCtx = new AudioContext();
function synctime(phase, hz) {
    const p = 1 / hz;
    const t = audioCtx.currentTime + 0.1; // extra time to get sync correct
    return t - (t % p) + phase * p;
}
function makeNode() {
    const node = audioCtx.createOscillator();
    node.connect(audioCtx.destination);
    return node;
}
let n1 = null;
let n2 = null;

function change() {
    if (n1 !== null)
        n1.stop();
    if (n2 !== null)
        n2.stop();
    n1 = makeNode();
    n2 = makeNode();
    const d1 = dial1.value;
    const d2 = dial2.value;
    console.log(d1, d2);
    n1.start(synctime(d1, 440));
    n2.start(synctime(d2, 440));
}
