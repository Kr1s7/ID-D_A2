import { getFull5DayRangeWeather } from "./weatherFetch.js";

const slider = document.getElementById("slider");
const track = document.getElementById("track");
const locationInput = document.getElementById("location-input");

let cards = [];
let currentIndex = 0;

// Check DOM
if (!slider || !track) console.error("Missing slider/track elements.");
// Fetch + Render Forecast
async function fetchAndRenderForecast(city = "Melbourne") {
  console.log(`Fetching full 5-day range for: ${city}`);
  try {
    const weather = await getFull5DayRangeWeather(city);
    console.log("Full 5-day range received:", weather);
    renderForecastCards(weather.forecast, weather.location.name);
  } catch (error) {
    console.error("Full 5-day fetch failed:", error);
  }
}

// Render Forecast Cards
function renderForecastCards(forecast, cityName) {
  track.innerHTML = "";

  forecast.forEach((day, index) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const isToday =
      new Date(day.date).toDateString() === new Date().toDateString();
    const dateLabel = isToday
      ? "Today"
      : new Date(day.date).toLocaleDateString(undefined, { weekday: "short" });

    card.innerHTML = `
      <div class="lcd-display">${dateLabel}</div>
      <img src="https:${day.icon}" alt="${day.condition}" width="64" height="64">
      <div class="lcd-display">${Math.round(day.avgTemp)}°C</div>
      <small>${day.condition}</small>
    `;

    track.appendChild(card);
  });

  cards = Array.from(document.querySelectorAll(".card"));

  // Center today
  const todayIndex = forecast.findIndex(d =>
    new Date(d.date).toDateString() === new Date().toDateString()
  );
  currentIndex = todayIndex >= 0 ? todayIndex : 2;
  setPosition(currentIndex);

  console.log(`Rendered ${cards.length} forecast cards for ${cityName}`);
}

// Slider mechanics
function getCardOffset() {
  if (cards.length === 0) return 0;
  const cardHeight = cards[0].offsetHeight;
  const margin =
    parseFloat(window.getComputedStyle(cards[0]).marginTop) +
    parseFloat(window.getComputedStyle(cards[0]).marginBottom);
  return cardHeight + margin;
}

function setPosition(index) {
  if (cards.length === 0) return;
  const offset =
    -index * getCardOffset() +
    (slider.offsetHeight / 2 - cards[0].offsetHeight / 2);
  track.style.transform = `translateY(${offset}px)`;
  updateVisibleCards();
}

function updateVisibleCards() {
  cards.forEach((card, i) => {
    card.classList.toggle("visible", Math.abs(i - currentIndex) <= 1);
    card.classList.toggle("active", i === currentIndex);
  });
}

function clampIndex(index) {
  return Math.max(0, Math.min(index, cards.length - 1));
}

function goUp() {
  currentIndex = clampIndex(currentIndex - 1);
  setPosition(currentIndex);
}

function goDown() {
  currentIndex = clampIndex(currentIndex + 1);
  setPosition(currentIndex);
}

// Events
slider?.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) goDown();
  else if (e.deltaY < 0) goUp();
});
window.addEventListener("resize", () => setPosition(currentIndex));

// Update forecast when user types or selects a city
locationInput?.addEventListener("input", (e) => {
  const city = e.target.value.trim();
  if (city) fetchAndRenderForecast(city);
});

fetchAndRenderForecast();
