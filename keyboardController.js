/* this is where you'd change out what the keyboard is controlling */
/* as its imported AFTER script.js where polySynth is defined I can assign it here */
let keyboardSynth = polySynth;
//let keyboardSynth = sampler;

/* find keys by their class and add to array */
let allKeys = Array.from(document.getElementsByClassName("whiteKey")).concat(
  Array.from(document.getElementsByClassName("blackKey"))
);

/* set default octace : we will update based on keys later on */
let octave = 3;

let mouseHeld = false;

window.addEventListener("mousedown", () => {
  mouseHeld = true;
});

window.addEventListener("mouseup", () => {
  mouseHeld = false;
});


/* add an event listener to each key */
allKeys.forEach((key) => {
  key.addEventListener("mousedown", (e) => {
    let note = e.target.dataset.note;
    polySynth.triggerAttack(note + octave);
    key.style.backgroundColor = "red";
  });
  key.addEventListener("mouseup", (e) => {
    let note = e.target.dataset.note;
    polySynth.triggerRelease(note + octave);
    key.style.backgroundColor = "var(--col02)";
  });
  key.addEventListener("mouseenter", (e) => {
    if (mouseHeld === false) {
      return;
    }
    let note = e.target.dataset.note;
    polySynth.triggerAttack(note + octave);
    key.style.backgroundColor = "red";
  });
  key.addEventListener("mouseleave", (e) => {
    let note = e.target.dataset.note;
    polySynth.triggerRelease(note + octave);
    key.style.backgroundColor = "var(--col02)";
  });
});

let keyHeld = false;

/* event listener for keyboard (qwerty) */
window.addEventListener("keydown", (e) => {
  if(keyCodeToNote[e.code]){
    if(keyHeld === false){
      polySynth.triggerAttack(keyCodeToNote[e.code]);
      keyHeld = true;
    }    
  }
});
window.addEventListener("keyup", (e) => {
  if(keyCodeToNote[e.code]){
    polySynth.triggerRelease(keyCodeToNote[e.code]);
    keyHeld = false;
  }
});

