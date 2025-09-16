let cards = document.querySelectorAll(".weather");
let activeIndex = 0;

function updateCards() {
  cards.forEach((card, i) => {
    card.classList.toggle("active", i === activeIndex);
  });
}

document.getElementById("weatherlast").addEventListener("click", () => {
  activeIndex = (activeIndex - 1 + cards.length) % cards.length;
  updateCards();
});

document.getElementById("weathernext").addEventListener("click", () => {
  activeIndex = (activeIndex + 1) % cards.length;
  updateCards();
});

// Show first card on load
updateCards();