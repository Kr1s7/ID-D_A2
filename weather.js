const buttons = document.querySelectorAll(".weathernav");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    buttons.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
  });
});