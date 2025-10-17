// Syncs weather condition to .weathernav buttons, overlay image, and Tone playback

import { getLatestWeatherData, listenForWeatherUpdates } from "./weatherFetch.js";

// DOM Elements
const weatherButtons = document.querySelectorAll(".weathernav");
const weatherImg = document.getElementById("weatherimg");

let activePlayer = null;
let manualOverride = false;
let lastLocation = null;

// Noise Filter
const filter = new Tone.Filter(18000, "lowpass").toDestination();
const noise = new Tone.Noise("pink").start();
const noiseGain = new Tone.Gain(0).connect(filter);
noise.connect(noiseGain);

// Weather presets
const weatherFilterMap = {
  clear: { cutoff: 18000, noise: 0.0 },
  cloudy: { cutoff: 9000, noise: 0.02 },
  rainy: { cutoff: 4000, noise: 0.04 },
  thunder: { cutoff: 3000, noise: 0.06 },
  windy: { cutoff: 6000, noise: 0.03 },
  snowy: { cutoff: 2500, noise: 0.02 },
};

function applyWeatherFilter(weatherType) {
  const settings = weatherFilterMap[weatherType];
  if (!settings) return;
  filter.frequency.rampTo(settings.cutoff, 1.2);
  noiseGain.gain.rampTo(settings.noise, 1.2);
  console.log(`🎚 Weather filter: ${weatherType}`, settings);
}

// Condition map
const conditionMap = [
  { key: "sun", id: "clear" },
  { key: "clear", id: "clear" },
  { key: "cloud", id: "cloudy" },
  { key: "overcast", id: "cloudy" },
  { key: "mist", id: "cloudy" },
  { key: "fog", id: "cloudy" },
  { key: "haze", id: "cloudy" },
  { key: "rain", id: "rainy" },
  { key: "drizzle", id: "rainy" },
  { key: "shower", id: "rainy" },
  { key: "thunder", id: "thunder" },
  { key: "storm", id: "thunder" },
  { key: "wind", id: "windy" },
  { key: "gale", id: "windy" },
  { key: "blizzard", id: "windy" },
  { key: "snow", id: "snowy" },
  { key: "ice", id: "snowy" },
  { key: "sleet", id: "snowy" },
];

// Activate weather button
async function activateWeatherButton(btn) {
  if (!btn) return;

  if (activePlayer) {
    activePlayer.stop();
    activePlayer.dispose();
  }

  if (Tone.context.state !== "running") {
    await Tone.start();
  }

  weatherButtons.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  applyWeatherFilter(btn.id);
}

// Auto activate based on condition
function autoSetWeatherFromData(conditionText) {
  if (!conditionText) return;

  const lower = conditionText.toLowerCase();
  const matched = conditionMap.find(({ key }) => lower.includes(key));
  if (!matched) {
    console.warn("No match found for condition:", conditionText);
    return;
  }

  const targetBtn = document.getElementById(matched.id);
  if (targetBtn) {
    console.log(`🌦 Auto-selecting weather: ${matched.id}`);
    activateWeatherButton(targetBtn);
  }
}

// Listen for weather updates
listenForWeatherUpdates((data) => {
  const condition =
    data.current?.condition?.text ||
    data.weather?.condition ||
    data.condition?.text;
  const locationName = data?.location?.name || "unknown";

  // ✅ Reset manual override when user searches a new location
  if (locationName !== lastLocation) {
    console.log(`📍 New location detected: ${locationName}, resetting manual override.`);
    manualOverride = false;
    lastLocation = locationName;
  }

  // Only apply auto updates when not manually overridden
  if (!manualOverride) {
    autoSetWeatherFromData(condition);
  } else {
    console.log("⚙️ Manual override active – skipping auto weather update");
  }
});

// Manual button control
weatherButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    manualOverride = true;
    await activateWeatherButton(btn);
  });
});

// Initial activation
const initialData = getLatestWeatherData();
if (initialData?.weather?.condition) {
  lastLocation = initialData?.location?.name || null;
  autoSetWeatherFromData(initialData.weather.condition);
}
