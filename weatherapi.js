const API_KEY = "e69dee4c8ee644c1a7314240251609"; // Replace with your WeatherAPI key

async function searchLocations() {
  const query = document.getElementById("searchbar").value.trim();
  if (!query) return alert("Please enter a location");

  try {
    const res = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`);
    const locations = await res.json();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!locations.length) {
      resultsDiv.textContent = "No matching locations found.";
      return;
    }

    locations.forEach(loc => {
      const div = document.createElement("div");
      div.textContent = `${loc.name}, ${loc.region}, ${loc.country}`;
      div.className = "location-option";
      div.onclick = () => fetchForecast(loc);
      resultsDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Error searching locations:", err);
  }
}

async function fetchForecast(location) {
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location.lat},${location.lon}&days=3`
    );
    const data = await res.json();
    displayWeather(data);
  } catch (err) {
    console.error("Error fetching forecast:", err);
  }
}

function displayWeather(data) {
  document.getElementById("results").innerHTML = "";

  const output = document.getElementById("weather-output");
  output.innerHTML = `<h3>${data.location.name}, ${data.location.country}</h3>`;

  data.forecast.forecastday.forEach(day => {
    output.innerHTML += `
      <p>
        <strong>${day.date}</strong>: 
        ${day.day.condition.text}, 
        High: ${day.day.maxtemp_c}°C, 
        Low: ${day.day.mintemp_c}°C
      </p>`;
  });
}