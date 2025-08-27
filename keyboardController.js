/* this is where you'd change out what the keyboard is controlling */
/* as its imported AFTER script.js where polySynth is defined I can assign it here */
let keyboardSynth = polySynth;

/* find keys by their class and add to array */
let allKeys = Array.from(document.getElementsByClassName("whiteKey")).concat(
  Array.from(document.getElementsByClassName("blackKey"))
);

/* set default octace : we will update based on keys later on */
let octave = 3;

let keyPressed = false;

window.addEventListener ("mousedown" , () => {
  keyPressed = falsee;
});
window.addEventListener ("mouseup" , () => {
  keyPressed = true;
});

window.addEventListener ("mouseenter" , (e) => {
  keyPressed = false;
});

/* add an event listener to each key */
allKeys.forEach((key) => {
  key.addEventListener("mousedown", (e) => {
    keyPressed = true;
    let note = e.target.dataset.note;
    polySynth.triggerAttackRelease(note + octave, "8n");
  });
  key.addEventListener("mouseup", (e) => {
    let note = e.target.dataset.note;
    polySynth.triggerRelease(note + octave);
  });
  key.addEventListener("mouseenter", (e) => {
    if (keyPressed === false) {
      return;
    }
    let note = e.target.dataset.note;
    polySynth.triggerAttackRelease(note + octave, "8n");
  });
  key.addEventListener("mouseleave", (e) => {
    let note = e.target.dataset.note;
    polySynth.triggerRelease(note + octave);
  });
});

