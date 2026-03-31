let slides = [];
let index = 0;
let currentTemp = "--";

/* HJELPER */
function el(id) {
  return document.getElementById(id);
}

/* LOAD DATA */
async function loadData() {
  try {
    const res = await fetch("data.json?nocache=" + new Date().getTime());
    const data = await res.json();

    slides = data.slides;

    if (el("ticker-text")) {
      el("ticker-text").innerText = data.ticker;
    }

    showSlide();
  } catch (err) {
    console.error("Data error:", err);
  }
}

/* FADE */
function fadeTo(content) {
  const slide = el("slide");
  if (!slide) return;

  slide.style.opacity = 0;

  setTimeout(() => {
    slide.innerHTML = `<div class="slide-inner">${content}</div>`;

    // force repaint
    void slide.offsetWidth;

    slide.style.opacity = 1;
  }, 400);
}

/* SHOW SLIDE */
function showSlide() {
  if (!slides.length) return;

  const s = slides[index];

  if (s.type === "weather") {
    loadWeatherSlide();
  } else {
    fadeTo(s.content);
  }

  index = (index + 1) % slides.length;
}

/* WEATHER SLIDE */
async function loadWeatherSlide() {
  try {
    const res = await fetch(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=69.23&lon=17.98",
      { headers: { "User-Agent": "infoscreen/1.0" } }
    );

    const data = await res.json();
    const temp = data.properties.timeseries[0].data.instant.details.air_temperature;

    currentTemp = temp;

    fadeTo(`
      <h1>Finnsnes</h1>
      <p>${temp}°C</p>
    `);

    updateTopbar();
  } catch (err) {
    console.error("Weather slide error:", err);
  }
}

/* 🔥 WEATHER FOR TOPBAR (ALLTID + RETRY) */
async function fetchWeatherForTopbar() {
  try {
    const res = await fetch(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=69.23&lon=17.98",
      { headers: { "User-Agent": "infoscreen/1.0" } }
    );

    if (!res.ok) throw new Error("Bad response");

    const data = await res.json();
    const temp = data.properties.timeseries[0].data.instant.details.air_temperature;

    currentTemp = temp;
    updateTopbar();

    console.log("Temp updated:", temp);

  } catch (err) {
    console.error("Weather fail:", err);

    // fallback
    if (currentTemp === "--") {
      currentTemp = "?";
      updateTopbar();
    }

    // retry etter 5 sek
    setTimeout(fetchWeatherForTopbar, 5000);
  }
}

/* TOPBAR */
function updateTopbar() {
  if (!el("top-left")) {
    console.warn("top-left finnes ikke");
    return;
  }

  el("top-left").innerText = `Finnsnes ${currentTemp}°C`;
}

/* CLOCK */
function updateClock() {
  const now = new Date();

  if (el("top-center")) {
    el("top-center").innerText =
      now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  if (el("top-right")) {
    el("top-right").innerText =
      now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }
}

/* START */
document.addEventListener("DOMContentLoaded", () => {
  console.log("App started");

  updateClock();
  fetchWeatherForTopbar();   // 🔥 viktig
  loadData();

  setInterval(showSlide, 10000);
  setInterval(loadData, 60000);
  setInterval(updateClock, 1000);
  setInterval(fetchWeatherForTopbar, 600000);
  setInterval(() => location.reload(), 300000);
});
