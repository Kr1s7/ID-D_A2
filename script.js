// app.js
// Combined + fixed + UI-to-Tone bindings + skeuomorphic hooks + lens prep
// Author: ChatGPT (merged & fixed files from user's upload)
// References: time.js, seasonareatest.js, thermometer.js, cardslider.js, weather.js, weatherapi.js, toneSetup.js, index.html, style.css
// (See file citations in assistant message)

(() => {
  // --- Utility helpers (used across merged code) ---
  function formatDayMonth(day) {
    if (day > 3 && day < 21) return day + "th";
    switch (day % 10) {
      case 1: return day + "st";
      case 2: return day + "nd";
      case 3: return day + "rd";
      default: return day + "th";
    }
  }

  function safeQuery(sel) { return document.querySelector(sel); }
  function safeQueryAll(sel) { return Array.from(document.querySelectorAll(sel)); }

  // --- ToneJS setup (adapted from toneSetup.js) ---
  // Requires <script src="https://unpkg.com/tone"></script> in the page.
  let polySynth, filter, distortion, reverb, meter;
  function toneInit() {
    polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", count: 3, spread: 10 },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 }
    });

    filter = new Tone.Filter(20000, "lowpass");
    distortion = new Tone.Distortion(0);
    reverb = new Tone.Reverb(1.5);
    meter = new Tone.Meter();

    // conservative chain: synth -> filter -> distortion -> reverb -> meter -> destination
    polySynth.chain(filter, distortion, reverb, meter, Tone.Destination);

    // warm reverb default
    reverb.wet.value = 0.15;
    filter.frequency.value = 20000;
    distortion.distortion = 0.0;
  }

  // Small helper to ensure Tone starts only after a user gesture
  async function ensureToneStarted() {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
  }

  // --- Time & Date & Location (fixed from time.js) ---
  function initTimeLocation() {
    const dateEl = safeQuery("#date");
    const timeEl = safeQuery("#time");
    const locEl = safeQuery("#location");

    function updateDate() {
      const today = new Date();
      const dayweek = today.toLocaleString("default", { weekday: "long" });
      const daymonth = today.getDate();
      const month = today.toLocaleString("default", { month: "long" });
      const formatted = `${dayweek}, ${month} ${formatDayMonth(daymonth)}`;
      if (dateEl) {
        dateEl.textContent = formatted;
        dateEl.classList.add("lcd-display");
      }
    }

    function updateTime() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      if (timeEl) {
        timeEl.textContent = timeString;
        timeEl.classList.add("lcd-display");
      }
    }

    updateDate();
    updateTime();
    setInterval(updateTime, 1000 * 15); // update every 15s (no need to do heavy 1s updates)

    // geolocation — fixed: only write text after we have coords
    function showPosition(position) {
      if (!locEl) return;
      const lat = position.coords.latitude.toFixed(3);
      const lon = position.coords.longitude.toFixed(3);
      locEl.textContent = `Lat ${lat}, Lon ${lon}`;
      locEl.classList.add("lcd-display");
    }

    function showLocationError(err) {
      if (!locEl) return;
      locEl.textContent = "Location unavailable";
      locEl.classList.add("lcd-display");
      console.warn("Geolocation error:", err);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showLocationError, { timeout: 5000 });
    } else if (locEl) {
      locEl.textContent = "Geolocation not supported";
    }
  }

  // --- Thermometer UI & audio binding (merged + fixed) ---
  function initThermometerBindings() {
    const handle = safeQuery("#temp-handle");
    const mercury = safeQuery("#mercury");
    const tempDisplay = safeQuery("#temp-display");
    const thermometer = safeQuery("#thermometer");
    if (!handle || !mercury || !tempDisplay || !thermometer) return;

    thermometer.classList.add("metal-tube");
    handle.classList.add("lens-knob");
    tempDisplay.classList.add("lcd-display");

    const minTemp = -40, maxTemp = 70;
    let dragging = false;

    // helper: convert temp->visual
    function tempToPct(temp) {
      return ((temp - minTemp) / (maxTemp - minTemp)) * 100;
    }

    function setTempFromOffset(offsetY) {
      const rect = thermometer.getBoundingClientRect();
      let y = offsetY - rect.top;
      y = Math.max(0, Math.min(y, rect.height));
      const temp = Math.round(maxTemp - ((y / rect.height) * (maxTemp - minTemp)));
      const mercuryHeight = tempToPct(temp);
      mercury.style.height = mercuryHeight + "%";
      handle.style.top = y + "px";
      tempDisplay.textContent = temp + "°C";

      // MAP temperature to sound: higher temp => brighter (increase filter cutoff) + higher chords
      const cutoff = 200 + (temp - minTemp) / (maxTemp - minTemp) * 12000; // 200..12200
      if (filter) filter.frequency.rampTo(cutoff, 0.15);

      // also trigger a short arpeggio note for feedback
      if (polySynth && Tone.now) {
        const now = Tone.now();
        const note = tempToNote(temp);
        polySynth.triggerAttackRelease([note, transpose(note, 7)], 0.25, now);
      }
    }

    // convert temperature to a midi-ish note (C3..C6 mapping)
    function tempToNote(temp) {
      // map minTemp..maxTemp => MIDI 48..84 (C3..C6)
      const ratio = (temp - minTemp) / (maxTemp - minTemp);
      const midi = Math.round(48 + ratio * (84 - 48));
      return midiToNote(midi);
    }
    function midiToNote(m) {
      const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      const octave = Math.floor(m/12) - 1;
      const name = notes[m % 12];
      return name + octave;
    }
    function transpose(note, interval) {
      // naive transpose: parse midi then add interval
      // we'll convert note->midi quickly
      const base = noteToMidi(note);
      return midiToNote(base + interval);
    }
    function noteToMidi(note) {
      const match = note.match(/^([A-G]#?)(-?\d+)$/);
      if (!match) return 60;
      const names = { C:0, "C#":1, D:2, "D#":3, E:4, F:5, "F#":6, G:7, "G#":8, A:9, "A#":10, B:11 };
      const pitch = names[match[1]];
      const oct = parseInt(match[2], 10);
      return (oct + 1) * 12 + pitch;
    }

    // Mouse + touch controls
    handle.addEventListener("mousedown", e => { dragging = true; e.preventDefault(); });
    window.addEventListener("mouseup", () => dragging = false);
    window.addEventListener("mousemove", e => { if (!dragging) return; setTempFromOffset(e.clientY); });

    // touch
    handle.addEventListener("touchstart", e => { dragging = true; e.preventDefault(); });
    window.addEventListener("touchend", () => dragging = false);
    window.addEventListener("touchmove", e => {
      if (!dragging) return;
      setTempFromOffset(e.touches[0].clientY);
    });

    // initialize
    const initialTemp = 20;
    requestAnimationFrame(() => {
      const rect = thermometer.getBoundingClientRect();
      const initOffset = rect.top + rect.height * (1 - (initialTemp - minTemp) / (maxTemp - minTemp));
      setTempFromOffset(initOffset);
    });
  }

  // --- Season dragger (merged + fixed) (from seasonareatest.js) ---
  function initSeasonDragger() {
    const draggables = safeQueryAll(".draggable");
    const dropZones = safeQueryAll(".outer-zone, .inner-zone");
    const container = safeQuery(".circle-container");

    if (!container) return;

    // add skeuo classes
    dropZones.forEach(z => z.classList.add("lens-zone"));
    draggables.forEach(d => d.classList.add("lens-dial"));

    let draggedElement = null;
    let originalPosition = { x: 0, y: 0 };

    draggables.forEach(el => {
      el.addEventListener("dragstart", e => {
        draggedElement = el;
        originalPosition = { x: el.offsetLeft, y: el.offsetTop };
        e.dataTransfer.effectAllowed = "move";
      });
      el.addEventListener("dragend", () => {
        if (draggedElement) {
          draggedElement.style.left = `${originalPosition.x}px`;
          draggedElement.style.top = `${originalPosition.y}px`;
          draggedElement = null;
        }
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", e => {
        e.preventDefault(); zone.classList.remove("drag-over");
        if (!draggedElement) return;

        const containerRect = container.getBoundingClientRect();
        const zoneRect = zone.getBoundingClientRect();

        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        const minX = zoneRect.left - containerRect.left;
        const minY = zoneRect.top - containerRect.top;
        const maxX = minX + zoneRect.width - draggedElement.offsetWidth;
        const maxY = minY + zoneRect.height - draggedElement.offsetHeight;

        const finalX = Math.max(minX, Math.min(mouseX - draggedElement.offsetWidth / 2, maxX));
        const finalY = Math.max(minY, Math.min(mouseY - draggedElement.offsetHeight / 2, maxY));
        draggedElement.style.left = `${finalX}px`;
        draggedElement.style.top = `${finalY}px`;

        // Audio cue: play a short interval when a draggable is dropped
        if (polySynth) {
          const now = Tone.now();
          polySynth.triggerAttackRelease(["C4", "E4", "G4"], 0.3, now);
        }

        draggedElement = null;
      });
    });

    // circular handles (two knobs on opposite sides)
    const handle1 = safeQuery("#handle1");
    const handle2 = safeQuery("#handle2");
    if (!handle1 || !handle2) return;

    handle1.classList.add("lens-knob");
    handle2.classList.add("lens-knob");

    const radius = Math.min(container.offsetWidth, container.offsetHeight) / 2 - 20;
    const center = { x: container.offsetWidth / 2, y: container.offsetHeight / 2 };

    let angle1 = 0, angle2 = 180;

    function updateHandles() {
      handle1.style.left = `${center.x + radius * Math.cos(angle1 * Math.PI/180)}px`;
      handle1.style.top  = `${center.y + radius * Math.sin(angle1 * Math.PI/180)}px`;
      handle2.style.left = `${center.x + radius * Math.cos(angle2 * Math.PI/180)}px`;
      handle2.style.top  = `${center.y + radius * Math.sin(angle2 * Math.PI/180)}px`;
    }

    function makeDraggable(handle, setAngle) {
      let dragging = false;
      handle.addEventListener("mousedown", e => { dragging = true; e.preventDefault(); });
      window.addEventListener("mouseup", () => dragging = false);
      window.addEventListener("mousemove", e => {
        if (!dragging) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left - center.x;
        const y = e.clientY - rect.top - center.y;
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        setAngle(angle);
        updateHandles();

        // map handle angle to reverb/wet: opposing handles can control reverb + distortion
        if (filter && reverb && distortion) {
          // use angle1 to set reverb wet between 0.05..0.6
          const wet = 0.05 + (angle1 / 360) * 0.55;
          reverb.wet.rampTo(wet, 0.2);
          const dist = (angle2 / 360) * 0.8; // 0..0.8
          distortion.distortion = dist;
        }
      });
    }

    makeDraggable(handle1, val => { angle1 = val; angle2 = (angle1 + 180) % 360; });
    makeDraggable(handle2, val => { angle2 = val; angle1 = (angle2 + 180) % 360; });
    updateHandles();

    // radial ring handle (sun/moon)
    const ringHandle = safeQuery("#ring-handle");
    const outerRing = safeQuery(".outer-ring");
    if (ringHandle && outerRing) {
      ringHandle.classList.add("lens-knob");
      outerRing.classList.add("lens-ring");
      let draggingRing = false;
      ringHandle.addEventListener("mousedown", () => draggingRing = true);
      document.addEventListener("mouseup", () => draggingRing = false);
      document.addEventListener("mousemove", e => {
        if (!draggingRing) return;
        const rect = outerRing.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const ang = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = ang * (180/Math.PI) + 90;
        if (deg < 0) deg += 360;
        const snappedDeg = Math.round(deg / 15) * 15;
        ringHandle.style.transform = `translate(-50%, -50%) rotate(${snappedDeg}deg) translateY(-${rect.width/2 - 20}px)`;
        const hour = Math.round((snappedDeg / 360) * 24) % 24;

        // visual background mapping
        document.body.style.background = hour >= 6 && hour < 18 ? "#f4f4f4" : "#1a1a2e";

        // audio: map hour to synth octave / harmony
        if (polySynth) {
          const baseNote = hourToNote(hour);
          polySynth.triggerAttackRelease([baseNote, transpose(baseNote, 4)], 0.5);
        }
      });
    }

    function hourToNote(h) {
      // map 0..23 -> C2..C6 range quickly
      const midi = 36 + Math.round((h / 23) * 36); // 36..72
      return midiToNote(midi);
    }
  }

  // --- Card slider & weather fetching (cardslider.js merged + fixes) ---
  function initCardSlider() {
    const slider = safeQuery("#slider");
    const track = safeQuery("#track");
    const upBtn = safeQuery("#up-btn");
    const downBtn = safeQuery("#down-btn");
    const locationInput = safeQuery("#location-input");
    if (!slider || !track || !upBtn || !downBtn) return;

    slider.classList.add("film-strip");
    upBtn.classList.add("knob-btn");
    downBtn.classList.add("knob-btn");

    let cards = [];
    let currentIndex = 0;
    const apiKey = "e69dee4c8ee644c1a7314240251609"; // keep or replace with env

    async function fetchWeather(location = "Melbourne") {
      try {
        const today = new Date();
        const dates = [];
        for (let i = 3; i >= 1; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          dates.push(d.toISOString().split("T")[0]);
        }

        const forecastResponse = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=4&aqi=no&alerts=no`
        );
        const forecastData = await forecastResponse.json();

        if (!forecastData || !forecastData.forecast) {
          track.innerHTML = `<div style="padding:1rem;color:red;">No forecast data for "${location}".</div>`;
          return;
        }

        const weatherDays = [];
        // history might fail if the account doesn't allow it — wrap in try/catch
        for (let date of dates) {
          try {
            const historyResponse = await fetch(
              `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(location)}&dt=${date}`
            );
            const historyData = await historyResponse.json();
            if (historyData && historyData.forecast && historyData.forecast.forecastday) {
              weatherDays.push({
                date: historyData.forecast.forecastday[0].date,
                day: historyData.forecast.forecastday[0].day,
              });
            }
          } catch (err) {
            // ignore historic fetch failures
            console.warn("history fetch error", err);
          }
        }

        forecastData.forecast.forecastday.forEach(d => weatherDays.push({ date: d.date, day: d.day }));
        renderCards(weatherDays);
      } catch (error) {
        console.error(error);
        track.innerHTML = `<div style="padding:1rem;color:red;">Failed to fetch weather for "${location}".</div>`;
      }
    }

    function renderCards(weatherDays) {
      track.innerHTML = "";
      weatherDays.forEach((w) => {
        const card = document.createElement("div");
        card.classList.add("card", "film-card");
        // use your existing formatDate helper
        card.innerHTML = `
          <div class="lcd-display">${formatFriendlyDate(w.date)}</div>
          <img src="${w.day.condition.icon}" alt="${w.day.condition.text}">
          <div class="lcd-display">${Math.round(w.day.avgtemp_c)}°C</div>
          <small class="lcd-display">${w.day.condition.text}</small>
        `;
        track.appendChild(card);
      });

      cards = Array.from(track.querySelectorAll(".card"));
      currentIndex = Math.min(3, Math.max(0, Math.floor(cards.length / 2))); // aim near middle/today
      setPosition(currentIndex);
    }

    function formatFriendlyDate(dateString) {
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
      triggerCardSound();
    }

    function goDown() {
      currentIndex = clampIndex(currentIndex + 1);
      setPosition(currentIndex);
      triggerCardSound();
    }

    function triggerCardSound() {
      // play a note proportional to card index (pleasant feedback)
      if (!cards.length || !polySynth) return;
      const pitch = 60 + Math.round((currentIndex / Math.max(1, cards.length - 1)) * 24);
      polySynth.triggerAttackRelease(midiToNote(pitch), 0.35);
    }

    upBtn.addEventListener("click", goUp);
    downBtn.addEventListener("click", goDown);
    slider.addEventListener("wheel", (e) => { if (e.deltaY > 0) goDown(); else if (e.deltaY < 0) goUp(); });
    window.addEventListener("resize", () => setPosition(currentIndex));

    // Search input
    if (locationInput) {
      locationInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = locationInput.value.trim();
          if (q) fetchWeather(q);
        }
      });
    }

    // initial load
    fetchWeather();
  }

  // --- Weather button group (from weather.js, tiny) ---
  function initWeatherButtons() {
    const buttons = safeQueryAll(".weathernav");
    buttons.forEach(button => {
      button.addEventListener("click", async () => {
        buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        const kind = button.dataset.weather;

        // small audio ambience mapping
        await ensureToneStarted();
        if (polySynth) {
          if (kind === "sunny") {
            polySynth.triggerAttackRelease(["C5","E5","G5"], 0.6);
            reverb.wet.rampTo(0.12, 0.2);
          } else if (kind === "cloudy") {
            polySynth.triggerAttackRelease(["G3","B3","D4"], 0.8);
            reverb.wet.rampTo(0.25, 0.2);
          } else if (kind === "rainy") {
            polySynth.triggerAttackRelease(["D4","F4","A4"], 0.6);
            reverb.wet.rampTo(0.5, 0.2);
          } else if (kind === "windy") {
            polySynth.triggerAttackRelease(["A3","C4","E4"], 0.5);
            reverb.wet.rampTo(0.22, 0.2);
          } else if (kind === "snowy") {
            polySynth.triggerAttackRelease(["F4","A4","C5"], 0.65);
            reverb.wet.rampTo(0.45, 0.2);
          }
        }

        // small visual mapping: tint the lens / column2 background
        const lens = safeQuery(".column2 .backgrounddiv");
        if (lens) {
          if (kind === "sunny") lens.style.backgroundColor = "#b5e3ff";
          if (kind === "cloudy") lens.style.backgroundColor = "#cfcfcf";
          if (kind === "rainy") lens.style.backgroundColor = "#9fbbdc";
          if (kind === "windy") lens.style.backgroundColor = "#cfe8d6";
          if (kind === "snowy") lens.style.backgroundColor = "#eaf6ff";
        }
      });
    });
  }

  // --- Lens preparation for Three.js insertion ---
  function prepareLensHole() {
    // make sure the column2 area has an id we can mount a THREE.WebGLRenderer into later.
    const col2 = safeQuery(".column2");
    if (!col2) return;
    col2.style.position = "relative";

    let lensStage = safeQuery("#lens-stage");
    if (!lensStage) {
      lensStage = document.createElement("div");
      lensStage.id = "lens-stage";
      // size it to the center backgrounddiv area
      lensStage.style.position = "absolute";
      lensStage.style.left = "10%";
      lensStage.style.top = "5%";
      lensStage.style.width = "80%";
      lensStage.style.height = "90%";
      lensStage.style.pointerEvents = "none"; // pass through until a scene needs interactions
      lensStage.classList.add("lens-hole");
      // the CSS has mask/shapes on your backgrounddiv; keep lens-stage empty so future three.js can append
      col2.appendChild(lensStage);
    }
    // NOTE: when you add Three.js later, append renderer.domElement into #lens-stage and set pointerEvents to 'auto' if you need interactivity.
  }

  // --- Initialization orchestration ---
  async function initAll() {
    // initialize Tone first but wait for user gesture later when needed
    toneInit();

    // DOM-tied initialization
    initTimeLocation();
    initThermometerBindings();
    initSeasonDragger();
    initCardSlider();
    initWeatherButtons();
    prepareLensHole();

    // Simple autoplay guard: create a "Start Sound" overlay the first time user interacts
    // (This avoids autoplay-block issues and gives user control).
    const startOverlay = document.createElement("div");
    startOverlay.id = "audio-start-overlay";
    startOverlay.style.position = "fixed";
    startOverlay.style.left = "0";
    startOverlay.style.top = "0";
    startOverlay.style.width = "100%";
    startOverlay.style.height = "100%";
    startOverlay.style.display = "flex";
    startOverlay.style.alignItems = "center";
    startOverlay.style.justifyContent = "center";
    startOverlay.style.background = "rgba(0,0,0,0.4)";
    startOverlay.style.zIndex = "9999";
    startOverlay.innerHTML = `<button class="main-btn dial-btn" style="padding:1rem 2rem;font-size:1.2rem;">Start Audio</button>`;
    document.body.appendChild(startOverlay);

    startOverlay.querySelector("button").addEventListener("click", async () => {
      await ensureToneStarted();
      startOverlay.remove();
      // small welcome chord
      if (polySynth) polySynth.triggerAttackRelease(["C4", "E4", "G4"], 1.2);
    }, { once: true });
  }

  // When DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // ----- small exported helpers for console debugging -----
  window.AppAudio = {
    toneInit: toneInit,
    polySynthRef: () => polySynth,
    filterRef: () => filter,
    reverbRef: () => reverb
  };

  // local helper functions used above (midi/transpose)
  function midiToNote(m) {
    const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const octave = Math.floor(m/12) - 1;
    const name = notes[(m % 12 + 12) % 12];
    return name + octave;
  }
  function noteToMidi(note) {
    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 60;
    const names = { C:0, "C#":1, D:2, "D#":3, E:4, F:5, "F#":6, G:7, "G#":8, A:9, "A#":10, B:11 };
    const pitch = names[match[1]];
    const oct = parseInt(match[2], 10);
    return (oct + 1) * 12 + pitch;
  }
  function transpose(note, interval) {
    const base = noteToMidi(note);
    return midiToNote(base + interval);
  }
})();

