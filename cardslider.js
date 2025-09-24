const slider = document.getElementById("slider");
const track = document.getElementById("track");
const upBtn = document.getElementById("up-btn");
const downBtn = document.getElementById("down-btn");
const locationInput = document.getElementById("location-input");

// Add skeuomorphic classes for styling
upBtn.classList.add("knob-btn");
downBtn.classList.add("knob-btn");
slider.classList.add("film-strip");

let cards = [];
let currentIndex = 0;
const apiKey = "e69dee4c8ee644c1a7314240251609"; // Replace with your WeatherAPI key

async function fetchWeather(location = "Melbourne") {
  try {
    const today = new Date();
    const dates = [];

    // Get past 3 days
    for (let i = 3; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    // Get today + next 3 days
    const forecastResponse = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=4&aqi=no&alerts=no`
    );
    const forecastData = await forecastResponse.json();

    const weatherDays = [];

    // Fetch history for past 3 days
    for (let date of dates) {
      const historyResponse = await fetch(
        `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${location}&dt=${date}`
      );
      const historyData = await historyResponse.json();
      weatherDays.push({
        date: historyData.forecast.forecastday[0].date,
        day: historyData.forecast.forecastday[0].day,
      });
    }

    // Append today + next 3 days
    forecastData.forecast.forecastday.forEach(d =>
      weatherDays.push({ date: d.date, day: d.day })
    );

    renderCards(weatherDays);
  } catch (error) {
    track.innerHTML = `<div style="padding:1rem;color:red;">Failed to fetch weather for "${location}".</div>`;
  }
}

function renderCards(weatherDays) {
  track.innerHTML = "";
  weatherDays.forEach((w) => {
    const card = document.createElement("div");
    // Add skeuomorphic classes
    card.classList.add("card");

    card.innerHTML = `
      <div class="lcd-display">${formatDate(w.date)}</div>
      <img src="${w.day.condition.icon}" alt="${w.day.condition.text}">
      <div class="lcd-display">${Math.round(w.day.avgtemp_c)}°C</div>
      <small class="lcd-display">${w.day.condition.text}</small>
    `;

    track.appendChild(card);
  });

  cards = Array.from(document.querySelectorAll(".card"));
  currentIndex = 3; // make "today" the active card
  setPosition(currentIndex);
}

function formatDate(dateString) {
  const options = { weekday: "short", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function getCardOffset() {
  if (cards.length === 0) return 0;
  const cardHeight = cards[0].offsetHeight;
  const margin = parseFloat(window.getComputedStyle(cards[0]).marginTop) +
                 parseFloat(window.getComputedStyle(cards[0]).marginBottom);
  return cardHeight + margin;
}

function setPosition(index) {
  if (cards.length === 0) return;
  const offset = -index * getCardOffset() + (slider.offsetHeight / 2 - cards[0].offsetHeight / 2);
  track.style.transform = `translateY(${offset}px)`;
  updateVisibleCards();
}

function updateVisibleCards() {
  cards.forEach((card, i) => {
    if (Math.abs(i - currentIndex) <= 1) {
      card.classList.add("visible");
    } else {
      card.classList.remove("visible");
    }
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
upBtn.addEventListener("click", goUp);
downBtn.addEventListener("click", goDown);
slider.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) goDown();
  else if (e.deltaY < 0) goUp();
});
window.addEventListener("resize", () => setPosition(currentIndex));

// Search bar
locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeather(locationInput.value.trim());
  }
});

// Initial load
fetchWeather();

