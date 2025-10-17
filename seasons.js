// Handles season visuals, 4-phase day/night, looped audio per season, and temperature-based reverb
import { subscribeSeason, getLatestWeatherData, listenForWeatherUpdates } from "./weatherFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM
  const seasonButtons = document.querySelectorAll(".seasonnav");
  const weatherImg = document.getElementById("weatherimg");
  const dayNightButton = document.getElementById("daynightnav");
  const slider = document.getElementById("thermometer");
  const sliderValue = document.getElementById("thermo-value");

  if (!seasonButtons.length || !weatherImg || !dayNightButton || !slider || !sliderValue) {
    console.error("⚠️ DOM elements missing for seasons-temperature.js");
    return;
  }

  // Season
  let activeSeasonBtn = null;
  let currentPhase = "day";
  let manualOverride = false;
  let toneReady = false;
  let activeSeasonPlayer = null;
  let audioPaused = false; // 🆕 toggle state

  const phaseReverbMap = { dawn: 0.6, day: 0.2, dusk: 0.5, night: 0.8 };

  const seasonData = {
    spring: { dawn: "assets/springdawn.jpeg", day: "assets/springday.jpeg", dusk: "assets/springdusk.jpeg", night: "assets/springnight.jpeg", sample: "assets/spring.wav" },
    summer: { dawn: "assets/summerdawn.jpeg", day: "assets/summerday.jpeg", dusk: "assets/summerdusk.jpeg", night: "assets/summernight.jpeg", sample: "assets/summer.wav" },
    winter: { dawn: "assets/winterdawn.jpeg", day: "assets/winterday.jpeg", dusk: "assets/winternight.jpeg", night: "assets/winternight.jpeg", sample: "assets/winter.wav" },
    autumn: { dawn: "assets/autumndawn.jpeg", day: "assets/autumnday.jpeg", dusk: "assets/autumndusk.jpeg", night: "assets/autumnnight.jpeg", sample: "assets/autumn.wav" },
    dry: { dawn: "assets/drydawn.jpeg", day: "assets/dryday.jpeg", dusk: "assets/drydusk.jpeg", night: "assets/drynight.jpeg", sample: "assets/dry.wav" },
    wet: { dawn: "assets/wetdawn.jpeg", day: "assets/wetday.jpeg", dusk: "assets/wetdusk.jpeg", night: "assets/wetnight.jpeg", sample: "assets/wet.wav" }
  };

  // Tone.js
  const playersMap = new Map();
  const gainNodes = new Map();
  const reverb = new Tone.Reverb({ decay: 2, wet: 0 }).toDestination();

  function preloadAllSamples() {
    Object.entries(seasonData).forEach(([season, data]) => {
      if (!data.sample) return;
      if (!playersMap.has(season)) {
        const gain = new Tone.Gain(0).connect(reverb);
        const player = new Tone.Player({ url: data.sample, loop: true, autostart: false }).connect(gain);
        playersMap.set(season, player);
        gainNodes.set(season, gain);
      }
    });
  }

  async function startToneAndPreload() {
    if (Tone.context.state !== "running") await Tone.start();
    toneReady = true;
    preloadAllSamples();
  }

  startToneAndPreload();

  // Playback helpers
  function stopCurrentPlayerSmooth(season) {
    const gain = gainNodes.get(season);
    if (!gain) return;
    gain.gain.rampTo(0, 1);
  }

  function playSeasonSmooth(season) {
    if (!toneReady) return;
    const player = playersMap.get(season);
    const gain = gainNodes.get(season);
    if (!player || !gain) return;

    if (player.state !== "started") player.start();
    reverb.wet.rampTo(phaseReverbMap[currentPhase] || 0.2, 1);
    gain.gain.rampTo(1, 1);

    activeSeasonPlayer = player;
    audioPaused = false;
  }

  function updateWeatherImg() {
    if (!activeSeasonBtn) return;
    const season = activeSeasonBtn.dataset.season;
    const data = seasonData[season];
    if (!data) return;
    weatherImg.src = data[currentPhase];
  }

  function applySeason(btn) {
    if (!btn) return;
    if (activeSeasonBtn && activeSeasonBtn !== btn) {
      activeSeasonBtn.classList.remove("active");
      stopCurrentPlayerSmooth(activeSeasonBtn.dataset.season);
    }

    activeSeasonBtn = btn;
    btn.classList.add("active");

    updateWeatherImg();
    playSeasonSmooth(btn.dataset.season);
  }

  // === Season buttons ===
  seasonButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      manualOverride = true;
      applySeason(btn);
    });
  });

  // === Day/Night button ===
  dayNightButton.addEventListener("click", () => {
    manualOverride = true;
    cyclePhase();
    updateDayNightBtn();
    updateWeatherImg();
    if (activeSeasonBtn) playSeasonSmooth(activeSeasonBtn.dataset.season);
  });

  function cyclePhase() {
    const phases = ["dawn", "day", "dusk", "night"];
    let idx = phases.indexOf(currentPhase);
    idx = (idx + 1) % phases.length;
    currentPhase = phases[idx];
  }

  function updateDayNightBtn() {
    dayNightButton.textContent =
      currentPhase === "day" ? "☀️" :
      currentPhase === "night" ? "🌙" :
      currentPhase === "dawn" ? "🌅" : "🌇";
    dayNightButton.style.fontSize = "2.5rem";
  }

  // === Auto phase ===
  function updatePhaseFromWeather(data) {
    if (!data || manualOverride) return;
    const localTimeStr = data?.location?.localtime || data?.current?.last_updated;
    if (!localTimeStr) return;

    const hr = new Date(localTimeStr.replace(" ", "T")).getHours();
    let phaseNow;
    if (hr >= 5 && hr < 8) phaseNow = "dawn";
    else if (hr >= 8 && hr < 18) phaseNow = "day";
    else if (hr >= 18 && hr < 20) phaseNow = "dusk";
    else phaseNow = "night";

    if (phaseNow !== currentPhase) {
      currentPhase = phaseNow;
      updateDayNightBtn();
      updateWeatherImg();
      if (activeSeasonBtn) playSeasonSmooth(activeSeasonBtn.dataset.season);
    }
  }

  listenForWeatherUpdates(data => {
    manualOverride = false;
    updatePhaseFromWeather(data);
  });

  const initialData = getLatestWeatherData();
  if (initialData) updatePhaseFromWeather(initialData);

  subscribeSeason(season => {
    const btn = Array.from(seasonButtons).find(b => b.dataset.season === season);
    if (btn) applySeason(btn);
  });

  if (!initialData) {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 8) currentPhase = "dawn";
    else if (hr >= 8 && hr < 18) currentPhase = "day";
    else if (hr >= 18 && hr < 20) currentPhase = "dusk";
    else currentPhase = "night";
    updateDayNightBtn();
  }

  // === Temperature → Reverb ===
  function updateReverbByTemperature(tempC) {
    if (!activeSeasonPlayer) return;

    const clampedTemp = Math.min(50, Math.max(-30, tempC));
    const wet = Tone.Math.mapLinear(clampedTemp, -30, 50, 0.7, 0.1);

    reverb.wet.rampTo(wet, 0.5);
    sliderValue.textContent = `${Math.round(tempC)}°C`;
  }

  slider.addEventListener("input", e => {
    const value = parseFloat(e.target.value);
    updateReverbByTemperature(value);
  });

  listenForWeatherUpdates(data => {
    const temperature = data?.weather?.temperature;
    if (typeof temperature === "number") {
      slider.value = temperature;
      updateReverbByTemperature(temperature);
    }
  });

  updateReverbByTemperature(parseFloat(slider.value) || 0);

  // Pause/resume on image click
  weatherImg.addEventListener("click", () => {
    if (!toneReady || !activeSeasonBtn) return;

    const currentSeason = activeSeasonBtn.dataset.season;
    const gain = gainNodes.get(currentSeason);

    if (!gain) return;

    if (audioPaused) {
      console.log(`Resuming ${currentSeason} sample...`);
      gain.gain.rampTo(1, 0.5);
      audioPaused = false;
    } else {
      console.log(`Pausing ${currentSeason} sample...`);
      gain.gain.rampTo(0, 0.5);
      audioPaused = true;
    }
  });
});
