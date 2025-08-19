////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Global definitions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let testRange = document.getElementById("frequencySlider");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Intro Modal popup
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* find modal */
let introModal = document.getElementById("introDialog");
/* to get the backdrop working we need to open the modal with js */
document.getElementById("introDialog").showModal();
/* find modal close button and add an eventlistener */
document.getElementById("dialogCloseButton").addEventListener("click", () => {
  introModal.close();
});
/* finally we want to initialize the synthesizer when the modal is closed */
/* because this can be through the above button, or by pressing esc, we tie it to the actual close event */
/* the referenced toneInit function is defined in toneSetup.js */
introModal.addEventListener("close", toneInit);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Oscillator Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let acceptedOscTypes = ["fatsine", "fatsquare", "fatsawtooth", "fattriangle"];

function changeOscillatorType(newOscType) {
  /* check to see if parameter matches one of the accepted types in the above array */
  if (acceptedOscTypes.includes(newOscType)) {
    polySynth.set({
      oscillator: { type: newOscType },
    });
  }
}

function changeDetuneSpread(newSpreadAmt) {
  /* make sure parameter is an int : note this rounds DOWN */
  let roundedSpread = Math.floor(newSpreadAmt);
  polySynth.set({
    oscillator: {
      spread: roundedSpread,
    },
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Amp Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function changeAmpAttack(newAttack){
  polySynth.set({
    envelope: {
      attack: newAttack
    }
  });
}
function changeAmpDecay(newDecay){
  polySynth.set({
    envelope: {
      decay: newDecay
    }
  });
}
function changeAmpSustain(newSustain){
  polySynth.set({
    envelope: {
      sustain: newSustain
    }
  });
}
function changeAmpAttack(newRelease){
  polySynth.set({
    envelope: {
      release: newRelease
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Distortion Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function changeDistortionAmount(newDistAmt) {
  /* check to see if parameter within expected range */
  if (newDistAmt >= 0 && newDistAmt < 1) {
    distortion.set({ distortion: newDistAmt });
  }
}

function toggleDistortion(distortionOn){
  if(distortionOn){
    distortion.wet.value = 1;
  } else {
    distortion.wet.value = 0;
  }
}

/* set initial amount and bypass it */
changeDistortionAmount(0.9);
toggleDistortion(false);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Reverb Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function changeReverbDecay(newVerbDecayAmt) {
  reverb.set({ decay: newVerbDecayAmt });
}

function toggleReverb(verbOn){
  if(verbOn){
    reverb.wet.value = 1;
  } else {
    reverb.wet.value = 0;
  }
}

/* set initial amount and bypass it */
changeReverbDecay(2);
toggleReverb(false);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Filter Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let acceptedFilterTypes = ["lowpass", "highpass", "bandpass", "notch"];

function changeFilterType(newFilterType) {
  /* check to see if parameter matches one of the accepted types in the above array */
  if (acceptedFilterTypes.includes(newFilterType)) {
    filter.set({
      type: newFilterType,
    });
  }
}

function changeFilterFreq(newFilterFreq) {
  /* check to see if parameter within expected range */
  if (newFilterFreq >= 0 && newFilterFreq < 20000) {
    filter.frequency.value = newFilterFreq;
  }
}

function changeFilterQ(newFilterQ) {
  /* check to see if parameter within expected range */
  if (newFilterQ >= 0 && newFilterQ < 20) {
    filter.Q.value = newFilterQ;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////// Connections
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testRange.addEventListener("input", (e) => {
  let rangeValue = e.target.value;
  changeFilterFreq(rangeValue);
});