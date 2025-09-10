let bodyElement = document.body;

function changeBackgroundColour(){
  bodyElement.style.backgroundColor = "red";
}

let myButton = document.getElementById("exampleButton");
myButton.addEventListener("click", changeBackgroundColour);

myButton.addEventListener("click", () => {
  polySynth.triggerAttackRelease("c3", "8n");
});

///////////// Button

let buttonOutputText = document.getElementById("buttonOutput");
let buttonEventText = document.getElementById("currentButtonEvent");
let heldButtonText = document.getElementById("buttonHeldEvent");


myButton.addEventListener("mouseenter", () => { 
  buttonEventText.textContent = "mouseenter";
});

myButton.addEventListener("mouseleave", () => { 
  buttonEventText.textContent = "mouseleave";
});

myButton.addEventListener("mousedown", () => { 
  buttonEventText.textContent = "mousedown";
  heldButtonText.textContent = "true";
});

myButton.addEventListener("mouseup", () => { 
  buttonEventText.textContent = "mouseup";
  heldButtonText.textContent = "false";
});

///////////// Checkbox
let myCheckbox = document.getElementById("exampleCheckbox");
let checkboxOutputText = document.getElementById("checkboxOutput");
let checkboxCheckedText = document.getElementById("checkboxChecked");

myCheckbox.addEventListener("change", (e) => {
  checkboxOutputText.textContent = e.target.value;
  checkboxCheckedText.textContent = e.target.checked;
});

///////////// Checkbox Effects
let distCheckbox = document.getElementById("checkDist");
let verbCheckbox = document.getElementById("checkVerb");

distCheckbox.addEventListener("click", (e) => {
  let isChecked = e.target.checked;
  toggleDistortion(isChecked);
});

verbCheckbox.addEventListener("click", (e) => {
  let isChecked = e.target.checked;
  toggleReverb(isChecked);
});

///////////// Radio
let mySineRadio = document.getElementById("sine");
let myTriangleRadio = document.getElementById("triangle");
let radioOutputText = document.getElementById("radioOutput");

function listRadioSelection(e){
  radioOutputText.textContent = e.target.value;
}

mySineRadio.addEventListener("input", listRadioSelection);
myTriangleRadio.addEventListener("input", listRadioSelection);

///////////// Select
let mySelect = document.getElementById("pet-select");
let mySelectionOutputText = document.getElementById("selectOutput");

mySelect.addEventListener("change", (e) => {
  mySelectionOutputText.textContent = e.target.value;
});

///////////// Range
let myRange = document.getElementById("exampleRange");
let rangeOutputText = document.getElementById("rangeOutput");

myRange.addEventListener("change", (e) => {
  rangeOutputText.textContent = e.target.value;
});

function rangeEditStart(){
  
}
function rangeEditEnd(){
  console.log("mouse up event heard");
}

///////////// Color
let myColourPicker = document.getElementById("exampleColourPicker");
let colourOutputText = document.getElementById("colourOutput");

myColourPicker.addEventListener("input", listColourOutput);

function listColourOutput(e){
  colourOutputText.textContent = e.target.value;
  colourOutputText.style.backgroundColor = e.target.value;
  colourOutputText.style.color = `hsl(from ${e.target.value} calc(360 - h) s calc(100 - l))`;
}

///////////// Date/Time
let myTimePicker = document.getElementById("exampleTime");
let myDatePicker = document.getElementById("exampleDate");
let myDateTimePicker = document.getElementById("exampleDateTime");
let timeOutputText = document.getElementById("timeOutput");
let dateOutputText = document.getElementById("dateOutput");
let dateTimeOutputText = document.getElementById("dateTimeOutput");