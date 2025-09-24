const weatherButtons = document.querySelectorAll(".weathernav");
const seasonButtons = document.querySelectorAll(".seasonnav");
const dayNightButton = document.getElementById("daynightnav");

weatherButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    weatherButtons.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
  });
});

seasonButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    seasonButtons.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
  });
});

daynightButton.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    dayNightButton.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
  });
});

daynightButton.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    dayNightButton.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
  });
});