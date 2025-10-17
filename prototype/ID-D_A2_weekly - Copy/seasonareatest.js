const draggables = document.querySelectorAll(".draggable");
const dropZones = document.querySelectorAll(".outer-zone, .inner-zone");

// Add skeuomorphic classes to zones and draggables
dropZones.forEach(zone => zone.classList.add("lens-zone"));
draggables.forEach(drag => drag.classList.add("lens-dial"));

function getSeason(lat) {
  const now = new Date();
  const month = now.getMonth() + 1; // Jan = 1

  if (Math.abs(lat) < 23.5) {
    // Tropics → 2 seasons
    return month >= 11 || month <= 4 ? "Wet" : "Dry";
  } else {
    // 4 seasons
    const north = lat >= 0;
    const seasonsNorth = ["Winter", "Spring", "Summer", "Autumn"];
    const seasonsSouth = ["Summer", "Autumn", "Winter", "Spring"];
    
    const mapping = north ? seasonsNorth : seasonsSouth;
    
    if (month >= 3 && month <= 5) return mapping[1]; // Spring
    if (month >= 6 && month <= 8) return mapping[2]; // Summer
    if (month >= 9 && month <= 11) return mapping[3]; // Autumn
    return mapping[0]; // Winter
  }
}

let draggedElement = null;
let originalPosition = { x: 0, y: 0 };

draggables.forEach(el => {
  el.addEventListener("dragstart", e => {
    draggedElement = el;
    originalPosition = { x: el.offsetLeft, y: el.offsetTop };
    e.dataTransfer.effectAllowed = "move";
  });

  el.addEventListener("dragend", () => {
    // If we didn't drop in a zone, snap back
    if (draggedElement) {
      draggedElement.style.left = `${originalPosition.x}px`;
      draggedElement.style.top = `${originalPosition.y}px`;
      draggedElement = null;
    }
  });
});

dropZones.forEach(zone => {
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("drag-over");

    const container = document.querySelector(".circle-container");
    const containerRect = container.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();

    // Mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Calculate boundaries so draggable stays fully inside zone
    const minX = zoneRect.left - containerRect.left;
    const minY = zoneRect.top - containerRect.top;
    const maxX = minX + zoneRect.width - draggedElement.offsetWidth;
    const maxY = minY + zoneRect.height - draggedElement.offsetHeight;

    // Clamp final position
    const finalX = Math.max(minX, Math.min(mouseX - draggedElement.offsetWidth / 2, maxX));
    const finalY = Math.max(minY, Math.min(mouseY - draggedElement.offsetHeight / 2, maxY));

    // Move element to dropped position
    draggedElement.style.left = `${finalX}px`;
    draggedElement.style.top = `${finalY}px`;

    draggedElement = null;
  });
});

const container = document.querySelector(".circle-container");
const handle1 = document.getElementById("handle1");
const handle2 = document.getElementById("handle2");

// Add skeuomorphic knob styling
handle1.classList.add("lens-knob");
handle2.classList.add("lens-knob");

const radius = 120; // distance from center
const center = { x: container.offsetWidth/2, y: container.offsetHeight/2 };

// initial angles in degrees (opposite sides)
let angle1 = 0;
let angle2 = 180;

function updateHandles() {
  handle1.style.left = `${center.x + radius * Math.cos(angle1 * Math.PI/180)}px`;
  handle1.style.top  = `${center.y + radius * Math.sin(angle1 * Math.PI/180)}px`;

  handle2.style.left = `${center.x + radius * Math.cos(angle2 * Math.PI/180)}px`;
  handle2.style.top  = `${center.y + radius * Math.sin(angle2 * Math.PI/180)}px`;
}

// Dragging logic
function makeDraggable(handle, angleSetter) {
  let dragging = false;

  handle.addEventListener("mousedown", e => {
    dragging = true;
    e.preventDefault();
  });

  window.addEventListener("mousemove", e => {
    if (!dragging) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - center.x;
    const y = e.clientY - rect.top - center.y;

    let angle = Math.atan2(y, x) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    angleSetter(angle);
    updateHandles();
  });

  window.addEventListener("mouseup", () => dragging = false);
}

// Connect draggable handles to angles
makeDraggable(handle1, val => {
  angle1 = val;
  angle2 = (angle1 + 180) % 360; // keep opposite
});
makeDraggable(handle2, val => {
  angle2 = val;
  angle1 = (angle2 + 180) % 360; // keep opposite
});

updateHandles();

// ---- Radial Scroller for Sun/Moon ----
const ringHandle = document.getElementById("ring-handle");
const outerRing = document.querySelector(".outer-ring");

// Extra skeuomorphic style
if (ringHandle) ringHandle.classList.add("lens-knob");
if (outerRing) outerRing.classList.add("lens-ring");

let isDraggingRing = false;

ringHandle.addEventListener("mousedown", () => isDraggingRing = true);
document.addEventListener("mouseup", () => isDraggingRing = false);

document.addEventListener("mousemove", e => {
  if (!isDraggingRing) return;

  const rect = outerRing.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  let deg = angle * (180 / Math.PI) + 90; // 0° at top
  if (deg < 0) deg += 360;

  // Snap to nearest hour (15° increments)
  const snappedDeg = Math.round(deg / 15) * 15;
  ringHandle.style.transform = `translate(-50%, -50%) rotate(${snappedDeg}deg) translateY(-${rect.width/2 - 20}px)`;

  const hour = Math.round((snappedDeg / 360) * 24) % 24;
  document.body.style.background = hour >= 6 && hour < 18 
    ? "#f4f4f4"  // Day
    : "#1a1a2e"; // Night
});


