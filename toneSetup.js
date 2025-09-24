// Polyphonic Synthesizer
let polySynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "fatsawtooth",
    count: 3,
    spread: 10,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.1,
    attackCurve: "exponential",
  },
});

// Sampler
let sampler = new Tone.Sampler({
  urls: { C3: "malimba.m4a" },
  baseUrl: "./assets/audioSamples/",
}).toDestination();

// Audio Effects
const filter = new Tone.Filter(20000, "lowpass");
const distortion = new Tone.Distortion(0);
const reverb = new Tone.Reverb(2);
const meter = new Tone.Meter({ smoothing: 0.1 });

// Init
function toneInit() {
  polySynth.chain(filter, distortion, reverb, meter, Tone.Destination);
}

// Event Listener for Weather Image
const dayNightNav = document.getElementById("weatherimg");
dayNightNav.addEventListener("click", async () => {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }
  sampler.triggerAttackRelease("C3", "1n");
});
