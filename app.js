
let audioContext;
let analyser;
let dataArray;

let targetNote = null;
let targetFreq = null;

let holdStart = null;
let holdTimeRequired = 1000;

const notes = [
    { name: "Do", freq: 261.63 },
    { name: "Re", freq: 293.66 },
    { name: "Mi", freq: 329.63 },
    { name: "Fa", freq: 349.23 },
    { name: "So", freq: 392.00 },
    { name: "La", freq: 440.00 },
    { name: "Ti", freq: 493.88 },
    { name: "Do (High)", freq: 523.25 }
];

/*
Pick closest displayed note (UI only)
*/
function getClosestNote(freq) {
    let closest = notes[0];
    let minDiff = Math.abs(freq - closest.freq);

    for (let note of notes) {
        const diff = Math.abs(freq - note.freq);
        if (diff < minDiff) {
            minDiff = diff;
            closest = note;
        }
    }

    return closest;
}

/*
Pitch detection (autocorrelation)
Returns Hz or 0 if no stable pitch
*/
function getPitch() {
    analyser.getFloatTimeDomainData(dataArray);

    let bestOffset = -1;
    let maxCorrelation = 0;

    for (let offset = 50; offset < 1000; offset++) {
        let correlation = 0;

        for (let i = 0; i < dataArray.length - offset; i++) {
            correlation += dataArray[i] * dataArray[i + offset];
        }

        correlation /= dataArray.length;

        if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestOffset = offset;
        }
    }

    if (bestOffset === -1 || maxCorrelation < 0.002) {
        return 0;
    }

    return audioContext.sampleRate / bestOffset;
}

/*
Check if current frequency matches target
*/
function isMatch(freq) {
    const tolerance = 15;
    return Math.abs(freq - targetFreq) < tolerance;
}

/*
Set new random target note
*/
function setRandomTarget() {
    const i = Math.floor(Math.random() * notes.length);

    targetNote = notes[i];
    targetFreq = targetNote.freq;

    document.getElementById("target").innerText =
        "Sing: " + targetNote.name;
}

/*
Start microphone input
*/
async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    audioContext = new AudioContext();
    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    dataArray = new Float32Array(analyser.fftSize);

    source.connect(analyser);

    setRandomTarget();
    update();
}

/*
========================================================
🎤 COMMENT SYSTEM (NEW ADDITION)
========================================================
*/
function getPitchComment(freq) {
    if (!targetFreq || freq === 0) return "Lab try mo gumawa ng note";

    const tolerance = 15;

    /*
    🔥 EDIT THESE TEXTS IF YOU WANT DIFFERENT UI WORDING
    */
    const TEXT_CORRECT = "PERPEK LAB PARANG IKAW";
    const TEXT_HIGH = "LAB! ang taas, pakibaba boses, pataas ang confidence";
    const TEXT_LOW = "Ang cute mo lab >~< kaso ambaba, taas mo pa";

    if (Math.abs(freq - targetFreq) <= tolerance) {
        return TEXT_CORRECT;
    }

    if (freq > targetFreq) {
        return TEXT_HIGH;
    } else {
        return TEXT_LOW;
    }
}

/*
Main loop
*/
function update() {
    const freq = getPitch();
    const now = Date.now();

    if (freq > 50) {
        const note = getClosestNote(freq);

        document.getElementById("note").innerText = note.name;
        document.getElementById("freq").innerText =
            freq.toFixed(2) + " Hz";

        // 🎤 COMMENT TEXT UPDATE (THIS IS WHAT YOU ASKED FOR)
        document.getElementById("commentsniloise").innerText =
            getPitchComment(freq);

        if (isMatch(freq)) {

            document.getElementById("status").innerText = "Hold...";

            if (!holdStart) {
                holdStart = now;
            }

            if (now - holdStart >= holdTimeRequired) {
                setRandomTarget();
                document.getElementById("status").innerText = "✔ Good!";
                holdStart = null;
            }

        } else {
            holdStart = null;
            document.getElementById("status").innerText = "GO LAB LAB KOOOO";
        }

    } else {
        holdStart = null;
        document.getElementById("status").innerText = "Lab try mo gumawa ng note";
        document.getElementById("note").innerText = "-";
        document.getElementById("freq").innerText = "0 Hz";

        // fallback UI text
        document.getElementById("commentsniloise").innerText = "Lab try mo gumawa ng note";
    }

    requestAnimationFrame(update);
}