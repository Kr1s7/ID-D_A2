const draggables = document.querySelectorAll(".draggable");
const dropZones = document.querySelectorAll(".outer-zone, .inner-zone");

let draggedElement = null;
let originalPosition = { x: 0, y: 0 };

draggables.forEach(el => {
  el.addEventListener("dragstart", e => {
    draggedElement = el;
    originalPosition = { x: el.offsetLeft, y: el.offsetTop };
    e.dataTransfer.effectAllowed = "move";
  });

  el.addEventListener("dragend", () => {
    // Snap back if not dropped in a zone
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

    const zoneRect = zone.getBoundingClientRect();
    const containerRect = document.querySelector(".circle-container").getBoundingClientRect();

    const zoneCenterX = zoneRect.left + zoneRect.width / 2 - containerRect.left;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2 - containerRect.top;

    draggedElement.style.left = `${zoneCenterX - draggedElement.offsetWidth / 2}px`;
    draggedElement.style.top = `${zoneCenterY - draggedElement.offsetHeight / 2}px`;

    draggedElement = null;
  });
});