// === seasons-temperature.js ===
// Handles seasons, 4-phase day/night, temperature knob controlling sample gain/reverb
import { subscribeSeason, getLatestWeatherData, listenForWeatherUpdates } from "./weatherFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const seasonButtons = document.querySelectorAll(".seasonnav");
  const weatherImg = document.getElementById("weatherimg");
  const dayNightButton = document.getElementById("daynightnav");
  const knobCanvas = document.getElementById("temp-knob");
  const tempDisplay = document.getElementById("temp-display");

  if (!seasonButtons.length || !weatherImg || !dayNightButton || !knobCanvas || !tempDisplay) {
    console.error("⚠️ DOM elements not found");
    return;
  }

  // --- Core state ---
  let activeSeasonBtn = null;
  let currentPhase = "day"; // dawn, day, dusk, night
  let manualOverride = false;
  let toneReady = false;
  let knobValue = 20; // default temperature
  const minTemp = -30, maxTemp = 50;

  // --- Data ---
  const phaseReverbMap = { dawn: 0.6, day: 0.2, dusk: 0.5, night: 0.8 };
  const seasonData = {
    spring: { dawn:"assets/springdawn.jpeg", day:"assets/springday.jpeg", dusk:"assets/springdusk.jpeg", night:"assets/springnight.jpeg", sample:"assets/spring.wav" },
    summer: { dawn:"assets/summerdawn.jpeg", day:"assets/summerday.jpeg", dusk:"assets/summerdusk.jpeg", night:"assets/summernight.jpeg", sample:"assets/summer.wav" },
    winter: { dawn:"assets/winterdawn.jpeg", day:"assets/winterday.jpeg", dusk:"assets/winterdusk.jpeg", night:"assets/winternight.jpeg", sample:"assets/winter.wav" },
    autumn: { dawn:"assets/autumndawn.jpeg", day:"assets/autumnday.jpeg", dusk:"assets/autumndusk.jpeg", night:"assets/autumnnight.jpeg", sample:"assets/autumn.wav" },
    dry: { dawn:"assets/drydawn.jpeg", day:"assets/dryday.jpeg", dusk:"assets/drydusk.jpeg", night:"assets/drynight.jpeg", sample:"assets/dry.wav" },
    wet: { dawn:"assets/wetdawn.jpeg", day:"assets/wetday.jpeg", dusk:"assets/wetdusk.jpeg", night:"assets/wetnight.jpeg", sample:"assets/wet.wav" }
  };

  // --- Tone.js setup ---
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

  async function startTone() {
    if (Tone.context.state !== "running") await Tone.start();
    toneReady = true;
    preloadAllSamples();
  }

  startTone();

  // --- Season / Phase handling ---
  function stopCurrentPlayerSmooth(season) {
    const gain = gainNodes.get(season);
    if (gain) gain.gain.rampTo(0, 1);
  }

  function playSeasonSmooth(season) {
    if (!toneReady) return;
    const player = playersMap.get(season);
    const gain = gainNodes.get(season);
    if (!player || !gain) return;
    if (player.state !== "started") player.start();

    // Map phase + temp to reverb and gain
    reverb.wet.rampTo(phaseReverbMap[currentPhase] || 0.2, 1);
    const mappedGain = Tone.Math.mapLinear(knobValue, minTemp, maxTemp, 0.5, 1.5);
    gain.gain.rampTo(mappedGain, 0.5);
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
    if (activeSeasonBtn && activeSeasonBtn !== btn) stopCurrentPlayerSmooth(activeSeasonBtn.dataset.season);
    activeSeasonBtn = btn;
    btn.classList.add("active");
    updateWeatherImg();
    playSeasonSmooth(btn.dataset.season);
  }

  seasonButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      manualOverride = true;
      applySeason(btn);
    });
  });

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
      currentPhase === "day" ? "☀️ Day" :
      currentPhase === "night" ? "🌙 Night" :
      currentPhase === "dawn" ? "🌅 Dawn" : "🌇 Dusk";
  }

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
    currentPhase = hr >= 5 && hr < 8 ? "dawn" :
                   hr >= 8 && hr < 18 ? "day" :
                   hr >= 18 && hr < 20 ? "dusk" : "night";
    updateDayNightBtn();
  }

  // --- Temperature knob ---
  const knobCtx = knobCanvas.getContext("2d");
  let dragging = false;

  function drawKnob(value) {
    const angle = ((value - minTemp) / (maxTemp - minTemp)) * 270 - 135;
    const rad = angle * Math.PI / 180;

    knobCtx.clearRect(0, 0, knobCanvas.width, knobCanvas.height);

    // background
    knobCtx.beginPath();
    knobCtx.arc(75, 75, 70, 0, Math.PI * 2);
    knobCtx.fillStyle = "#333";
    knobCtx.fill();

    // arc indicator
    knobCtx.beginPath();
    knobCtx.arc(75, 75, 65, -Math.PI*3/4, rad, false);
    knobCtx.lineWidth = 10;
    knobCtx.strokeStyle = "#FF7F50";
    knobCtx.stroke();

    // knob center
    knobCtx.beginPath();
    knobCtx.arc(75, 75, 50, 0, Math.PI*2);
    knobCtx.fillStyle = "#222";
    knobCtx.fill();

    // indicator line
    knobCtx.beginPath();
    knobCtx.moveTo(75,75);
    knobCtx.lineTo(75 + 40 * Math.cos(rad), 75 + 40 * Math.sin(rad));
    knobCtx.lineWidth = 4;
    knobCtx.strokeStyle = "#FFD700";
    knobCtx.stroke();

    tempDisplay.textContent = `${Math.round(value)}°C`;
    if (activeSeasonBtn) playSeasonSmooth(activeSeasonBtn.dataset.season);
  }

  function getMouseTemp(evt) {
    const rect = knobCanvas.getBoundingClientRect();
    const x = evt.clientX - rect.left - 75;
    const y = evt.clientY - rect.top - 75;
    let angle = Math.atan2(y, x) * (180/Math.PI);
    angle = Math.min(Math.max(angle, -135), 135);
    return ((angle + 135)/270) * (maxTemp-minTemp) + minTemp;
  }

  knobCanvas.addEventListener("mousedown", ()=>dragging=true);
  window.addEventListener("mouseup", ()=>dragging=false);
  window.addEventListener("mousemove", e=>{
    if(!dragging) return;
    knobValue = getMouseTemp(e);
    drawKnob(knobValue);
  });

  drawKnob(knobValue);
});
