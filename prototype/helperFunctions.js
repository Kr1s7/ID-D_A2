///////// Helper Functions


/* 
This takes a value within one range and converts it to another. 
For example, if we input a value within a range of 0 - 1, we can convert it to a range of 50 - 100
In this case an input of 0.5 would output 75
*/
function remapRange(value, min1, max1, min2, max2){
  return min2 + (max2 - min2) * (value - min1) / (max1 - min1);
}

/* 
This stops a value from going outside a range.
For exampe if we input a value within a range of 0 - 1, it would always stay within it
An input of -10 would output 0
An input of 1.4 would output 1
An input of 0.43 would output 0.43
*/
function clamp(value, min, max){
  return Math.min(Math.max(value, min), max);
}

/* 
This takes in a keycode and returns a note for the synth
*/

let keyCodeToNote = {
  KeyA: "c3",
  KeyW: "c#3",
  KeyS: "d3",
  KeyE: "d#3",
  KeyD: "e3",
  KeyF: "f3",
  KeyT: "f#3",
  KeyG: "g3",
  KeyY: "g#3",
  KeyH: "a3",
  KeyU: "a#3",
  KeyJ: "b3",
  KeyK: "c4",
  KeyO: "c#4",
  KeyL: "d4",
  KeyP: "d#4",
}
