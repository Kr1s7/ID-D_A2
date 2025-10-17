// === weatherFetch.js ===
// Handles WeatherAPI fetching and update dispatching

const apiKey = "e69dee4c8ee644c1a7314240251609";

// === DOM Elements ===
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("locationinput");

// === Core Fetchers ===
export async function getFullWeatherData(city) {
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("WeatherAPI request failed");
  const data = await res.json();

  const { name, region, country, lat, lon, localtime, tz_id } = data.location;
  const { temp_c, condition, wind_kph, humidity, is_day } = data.current;

  const formatted = {
    location: { name, region, country, lat, lon, localtime, tz_id },
    time: {
      localtime,
      isNight: detectNight(localtime, is_day),
    },
    weather: {
      temperature: temp_c,
      condition: condition.text,
      windSpeed: wind_kph,
      humidity,
    },
    season: detectSeason(lat, new Date(localtime).getMonth() + 1),
  };

  // Dispatch for listeners
  dispatchWeather("weatherDataReady", formatted);

  // Notify temperature subscribers
  updateTemperatureSubscribers(temp_c);

  // Notify season subscribers
  updateSeasonSubscribers(formatted.season);

  return formatted;
}

export async function getForecastWeather(city, days = 5) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast fetch failed");
  const data = await res.json();

  return {
    location: data.location,
    forecast: data.forecast.forecastday.map(f => ({
      date: f.date,
      condition: f.day.condition.text,
      icon: f.day.condition.icon,
      avgTemp: f.day.avgtemp_c,
      maxTemp: f.day.maxtemp_c,
      minTemp: f.day.mintemp_c,
      wind: f.day.maxwind_kph,
      humidity: f.day.avghumidity,
    })),
  };
}

// === New: Full 5-day range (2 past + today + 2 future) ===
export async function getFull5DayRangeWeather(city) {
  const today = new Date();
  const datesPast = [
    new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
    new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
  ];

  const forecastResults = [];

  // --- Fetch past days using history endpoint ---
  for (const date of datesPast) {
    const dateStr = date.toISOString().split("T")[0];
    try {
      const url = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(
        city
      )}&dt=${dateStr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("History fetch failed");
      const data = await res.json();
      forecastResults.push({
        date: dateStr,
        condition: data.forecast.forecastday[0].day.condition.text,
        icon: data.forecast.forecastday[0].day.condition.icon,
        avgTemp: data.forecast.forecastday[0].day.avgtemp_c,
        maxTemp: data.forecast.forecastday[0].day.maxtemp_c,
        minTemp: data.forecast.forecastday[0].day.mintemp_c,
        wind: data.forecast.forecastday[0].day.maxwind_kph,
        humidity: data.forecast.forecastday[0].day.avghumidity,
      });
    } catch (err) {
      console.warn("⚠️ Past day fetch failed:", err);
    }
  }

  // --- Add today + next 2 days using forecast endpoint ---
  try {
    const weather = await getForecastWeather(city, 3); // today + 2 future days
    forecastResults.push(...weather.forecast);
  } catch (err) {
    console.warn("⚠️ Forecast fetch failed:", err);
  }

  return {
    location: getLatestWeatherData()?.location || { name: city },
    forecast: forecastResults,
  };
}

// === Detection Utilities ===
function detectSeason(lat, month) {
  const north = lat >= 0;
  const tropic = Math.abs(lat) < 23.5;
  if (tropic) return month >= 5 && month <= 10 ? "wet" : "dry";
  const seasons = north
    ? ["winter", "spring", "summer", "autumn"]
    : ["summer", "autumn", "winter", "spring"];
  return seasons[Math.floor(((month % 12) / 3))];
}

function detectNight(localtime, apiIsDay) {
  if (typeof apiIsDay === "number") return apiIsDay === 0;
  const hr = parseInt(localtime.split(" ")[1].split(":")[0]);
  return hr < 6 || hr >= 18;
}

// Data Export / Listener System
let latestWeatherData = null;
let onWeatherTimeUpdate = null;

// Temperature Subscription System
const temperatureSubscribers = new Set();
let latestTemperature = null;

export function subscribeTemperature(callback) {
  if (typeof callback === "function") {
    temperatureSubscribers.add(callback);
    if (latestTemperature !== null) callback(latestTemperature);
  }
  return () => temperatureSubscribers.delete(callback);
}

function updateTemperatureSubscribers(temp) {
  latestTemperature = temp;
  for (const cb of temperatureSubscribers) {
    try {
      cb(temp);
    } catch (err) {
      console.warn("Temperature subscriber failed:", err);
    }
  }
}

// NEW: Season Subscription System
const seasonSubscribers = new Set();
let latestSeason = null;

export function subscribeSeason(callback) {
  if (typeof callback === "function") {
    seasonSubscribers.add(callback);
    if (latestSeason !== null) callback(latestSeason);
  }
  return () => seasonSubscribers.delete(callback);
}

function updateSeasonSubscribers(season) {
  latestSeason = season;
  for (const cb of seasonSubscribers) {
    try {
      cb(season);
    } catch (err) {
      console.warn("Season subscriber failed:", err);
    }
  }
}

// Listener / Dispatch
export function listenForWeatherUpdates(callback) {
  document.addEventListener("weatherDataReady", e => callback(e.detail));
  document.addEventListener("weatherDataUpdated", e => callback(e.detail));
}

export function getLatestWeatherData() {
  return latestWeatherData;
}

export function onTimeLocationUpdate(callback) {
  onWeatherTimeUpdate = callback;
}

// Keep latest data synced internally
listenForWeatherUpdates(data => {
  latestWeatherData = data;
  logWeatherSummary(data, "🔄 Live Update");

  if (typeof onWeatherTimeUpdate === "function") {
    onWeatherTimeUpdate(data);
  }
});

// Input Bridges
async function fetchAndDispatch(city, type = "weatherDataReady") {
  try {
    const data = await getFullWeatherData(city);
    dispatchWeather(type, data);

    if (data.weather && typeof data.weather.temperature === "number") {
      updateTemperatureSubscribers(data.weather.temperature);
    }
  } catch (err) {
    console.error("Weather fetch failed:", err);
  }
}

if (searchBtn && cityInput) {
  searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchAndDispatch(city, "weatherDataReady");
    else alert("Please enter a city name!");
  });
}

if (cityInput) {
  cityInput.addEventListener("change", e => {
    const city = e.target.value.trim();
    if (city) fetchAndDispatch(city, "weatherDataUpdated");
  });
}

// Geolocation Fetch
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const { latitude, longitude } = coords;
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}`
      );
      const data = await res.json();
      if (data?.location) {
        dispatchWeather("weatherDataUpdated", data);

        if (data?.current?.temp_c !== undefined) {
          updateTemperatureSubscribers(data.current.temp_c);
        }

        const season = detectSeason(latitude, new Date().getMonth() + 1);
        updateSeasonSubscribers(season);
      }
    } catch (err) {
      console.warn("Geo weather fetch failed:", err);
    }
  });
}

// Helpers
const dispatchWeather = (type, detail) =>
  document.dispatchEvent(new CustomEvent(type, { detail }));

function logWeatherSummary(data, label = "✅ Weather") {
  try {
    const loc = data.location?.name || data.location?.region || "Unknown";
    const cond = data.weather?.condition || data.current?.condition?.text;
    const temp = data.weather?.temperature || data.current?.temp_c;
    console.log(`${label}: ${loc} • ${temp}°C • ${cond}`);
  } catch {
    // Fail
  }
}
