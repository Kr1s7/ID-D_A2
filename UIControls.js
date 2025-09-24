// Intro Modal popup
let introModal = document.getElementById("introDialog");
introModal.showModal();
document.getElementById("dialogCloseButton").addEventListener("click", () => {
  introModal.close();
});
introModal.addEventListener("close", toneInit);

let myButton = document.getElementById("weathernav");
myButton.addEventListener("click", changeBackgroundColour);

myButton.addEventListener("click", () => {
  polySynth.triggerAttackRelease("c3", "8n");
});

// Oscillator
let acceptedOscTypes = ["fatsine", "fatsquare", "fatsawtooth", "fattriangle"];
function changeOscillatorType(newOscType) {
  if (acceptedOscTypes.includes(newOscType)) {
    polySynth.set({ oscillator: { type: newOscType } });
  }
}
function changeDetuneSpread(newSpreadAmt) {
  polySynth.set({ oscillator: { spread: Math.floor(newSpreadAmt) } });
}

// Amp Envelope
function changeAmpAttack(newAttack) {
  polySynth.set({ envelope: { attack: newAttack } });
}
function changeAmpDecay(newDecay) {
  polySynth.set({ envelope: { decay: newDecay } });
}
function changeAmpSustain(newSustain) {
  polySynth.set({ envelope: { sustain: newSustain } });
}
function changeAmpRelease(newRelease) {
  polySynth.set({ envelope: { release: newRelease } });
}

// Distortion
function changeDistortionAmount(newDistAmt) {
  if (newDistAmt >= 0 && newDistAmt < 1) {
    distortion.set({ distortion: newDistAmt });
  }
}
function toggleDistortion(on) {
  distortion.wet.value = on ? 1 : 0;
}
changeDistortionAmount(0.9);
toggleDistortion(false);

// Reverb
function changeReverbDecay(newDecay) {
  reverb.set({ decay: newDecay });
}
function toggleReverb(on) {
  reverb.wet.value = on ? 1 : 0;
}
changeReverbDecay(2);
toggleReverb(false);

// Filter
let acceptedFilterTypes = ["lowpass", "highpass", "bandpass", "notch"];
function changeFilterType(type) {
  if (acceptedFilterTypes.includes(type)) filter.set({ type });
}
function changeFilterFreq(freq) {
  if (freq >= 0 && freq <= 20000) filter.frequency.value = freq;
}
function changeFilterQ(q) {
  if (q >= 0 && q <= 20) filter.Q.value = q;
}

// Meter
setInterval(checkMeter, 500);
function checkMeter() {
  let meterValue = meter.getValue();
  let clamped = clamp(meterValue, -100, 0);
  let colorRange = remappedRange(clamped, -80, 0, 0, 1);
  meterOutput.textContent = meterValue;
  document.body.style.backgroundColor = `color-mix(in hsl, red, blue ${colorRange}%)`;
}