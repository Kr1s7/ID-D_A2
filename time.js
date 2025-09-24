function formatDayMonth(day) {
  if (day > 3 && day < 21) return day + "th"; // 11th - 20th always use "th"
  switch (day % 10) {
    case 1: return day + "st";
    case 2: return day + "nd";
    case 3: return day + "rd";
    default: return day + "th";
  }
}

function changeDate() {
  const today = new Date();
  let dayweek = today.toLocaleString("default", { weekday: "long" }); // "Monday"
  let daymonth = today.getDate();
  let month = today.toLocaleString("default", { month: "long" }); // "January"

  formatDate = `${dayweek}, ${month} ${formatDayMonth(daymonth)}`;
  const dateEl = document.getElementById("date");
  dateEl.innerHTML = formatDate;
  dateEl.classList.add("lcd-display"); // skeuomorphic class
}

changeDate();

function changeTime() {
  const today = new Date();
  let hours = today.getHours();
  let minutes = today.getMinutes();
  let seconds = today.getSeconds();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  let time = hours + ':' + minutes;

  const timeEl = document.getElementById("time");
  timeEl.innerHTML = time;

  setTimeout(changeTime, 1000);
}

changeTime();

function changeLocation() {
  let location = navigator.geolocation;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
  const locEl = document.getElementById("location");
  locEl.textContent = location;
  locEl.classList.add("lcd-display"); // skeuomorphic class
}

changeLocation();

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  console.log("Latitude: " + lat + ", Longitude: " + lon);
  // You can use the latitude and longitude to fetch weather data or other location-based information
}
