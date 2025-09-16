const handle = document.getElementById("temp-handle");
const mercury = document.getElementById("mercury");
const tempDisplay = document.getElementById("temp-display");
const thermometer = document.getElementById("thermometer");

// Add skeuomorphic classes for styling
thermometer.classList.add("metal-tube");
handle.classList.add("lens-knob");
tempDisplay.classList.add("lcd-display");

const minTemp = -40;
const maxTemp = 70;

let dragging = false;

handle.addEventListener("mousedown", e => {
  dragging = true;
  e.preventDefault();
});

window.addEventListener("mousemove", e => {
  if (!dragging) return;

  const rect = thermometer.getBoundingClientRect();
  let offsetY = e.clientY - rect.top;

  // Clamp offset within thermometer
  if (offsetY < 0) offsetY = 0;
  if (offsetY > rect.height) offsetY = rect.height;

  // Convert to temperature
  const temp = Math.round(maxTemp - ((offsetY / rect.height) * (maxTemp - minTemp)));

  // Update mercury height
  const mercuryHeight = ((temp - minTemp) / (maxTemp - minTemp)) * 100;
  mercury.style.height = mercuryHeight + "%";

  // Update handle position
  handle.style.top = offsetY + "px";

  // Update temperature display
  tempDisplay.textContent = temp + "°C";
});

window.addEventListener("mouseup", () => dragging = false);

// Initialize at 20°C
const initialTemp = 20;
const initialOffset = thermometer.clientHeight * (1 - (initialTemp - minTemp) / (maxTemp - minTemp));
handle.style.top = initialOffset + "px";
mercury.style.height = ((initialTemp - minTemp) / (maxTemp - minTemp) * 100) + "%";
tempDisplay.textContent = initialTemp + "°C";

