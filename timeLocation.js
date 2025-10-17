import { onTimeLocationUpdate } from "./weatherFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentHour = 0;
  let currentMinute = 0;
  let currentWeekday = "";
  let currentLocationName = "Melbourne, Australia";
  let usingLaptopTime = true; // default uses laptop time

  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");
  const locationEl = document.getElementById("location");

  function updateClockDisplay() {
    const hourStr = String(currentHour).padStart(2, "0");
    const minuteStr = String(currentMinute).padStart(2, "0");

    if (timeEl) timeEl.textContent = `${hourStr}:${minuteStr}`;
    if (dateEl) dateEl.textContent = currentWeekday;
    if (locationEl) locationEl.textContent = currentLocationName;
  }

  function tickLaptopTime() {
    if (!usingLaptopTime) return; // don’t overwrite city time
    const now = new Date();
    currentHour = now.getHours();
    currentMinute = now.getMinutes();
    currentWeekday = now.toLocaleDateString(undefined, { weekday: "long" });
    currentLocationName = "Melbourne, Australia";
    updateClockDisplay();
  }

  function tickCityTime() {
    if (usingLaptopTime) return; // skip if using laptop time
    currentMinute++;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
      if (currentHour >= 24) currentHour = 0;
    }
    updateClockDisplay();
  }

  // Initialize laptop time
  tickLaptopTime();
  setInterval(tickLaptopTime, 60_000);
  setInterval(tickCityTime, 60_000); // tick city time every minute

  // Update time from API (other cities)
  onTimeLocationUpdate((data) => {
    if (data?.time?.localtime && data?.location) {
      usingLaptopTime = false;
      const [datePart, timePart] = data.time.localtime.split(" ");
      const [hour, minute] = timePart.split(":").map(Number);

      currentHour = hour;
      currentMinute = minute;
      currentWeekday = new Date(datePart).toLocaleDateString(undefined, { weekday: "long" });
      currentLocationName = `${data.location.name}, ${data.location.country}`;
      updateClockDisplay();
    }
  });
});
