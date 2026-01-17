const locationTime = document.getElementById("locationTime");
const weatherCard = document.getElementById("weatherCard");
const weatherCity = document.getElementById("weatherCity");
const weatherTemp = document.getElementById("weatherTemp");
const weatherDetail = document.getElementById("weatherDetail");
const weatherIcon = document.getElementById("weatherIcon");
const probFill = document.getElementById("probFill");
const intensityLabel = document.getElementById("intensityLabel");
const statusPill = document.getElementById("statusPill");
const trendCanvas = document.getElementById("trendChart");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalPrimary = document.getElementById("modalPrimary");
const analyticsBtn = document.getElementById("analyticsBtn");
const reportBtn = document.getElementById("reportBtn");
const settingsBtn = document.getElementById("settingsBtn");

if (!localStorage.getItem("rnm_authed")) {
  window.location.href = "/login.html";
}

const storedCity = localStorage.getItem("rnm_city") || "Fukuoka";

const sensorValues = {
  Ta: document.getElementById("TaValue"),
  Humidity: document.getElementById("HumidityValue"),
  Tg: document.getElementById("TgValue"),
  Pressure: document.getElementById("PressureValue"),
  Windspeed: document.getElementById("WindspeedValue"),
  CO2: document.getElementById("CO2Value"),
  "PM2.5": document.getElementById("PM2.5Value"),
  PM10: document.getElementById("PM10Value"),
};

let trendHistory = [];
const maxPoints = 30;

const weatherCodeMap = [
  { range: [0, 0], label: "Clear Sky" },
  { range: [1, 3], label: "Partly Cloudy" },
  { range: [45, 48], label: "Foggy" },
  { range: [51, 67], label: "Drizzle" },
  { range: [71, 77], label: "Snow" },
  { range: [80, 99], label: "Rain or Showers" },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function updateClock() {
  const now = new Date();
  locationTime.textContent = `${storedCity} - ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function formatValue(key, value) {
  if (value === undefined || value === null || value === "") {
    return "--";
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  if (key === "Ta" || key === "Tg") {
    return num.toFixed(1);
  }
  if (key === "Humidity" || key === "Pressure") {
    return num.toFixed(1);
  }
  if (key === "Windspeed") {
    return num.toFixed(2);
  }
  if (key === "CO2" || key === "PM2.5" || key === "PM10") {
    return String(Math.round(num));
  }
  return String(num);
}

function weatherLabelFromCode(code) {
  if (code === undefined || code === null) {
    return "Unknown";
  }
  for (const entry of weatherCodeMap) {
    if (code >= entry.range[0] && code <= entry.range[1]) {
      return entry.label;
    }
  }
  return "Unknown";
}

function applyState(state) {
  const latest = state.latest || {};
  Object.keys(sensorValues).forEach((key) => {
    sensorValues[key].textContent = formatValue(key, latest[key]);
  });

  const weather = state.weather || {};
  if (weather.city || storedCity) {
    weatherCity.textContent = weather.city || storedCity;
    if (weather.temperature !== undefined) {
      weatherTemp.textContent = `${Number(weather.temperature).toFixed(1)} C`;
    }
    const label = weatherLabelFromCode(weather.weathercode);
    const wind = weather.windspeed !== undefined ? Number(weather.windspeed).toFixed(1) : "--";
    weatherDetail.textContent = `Wind ${wind} m/s - ${label}`;
    weatherIcon.textContent = label.toUpperCase();
  }

  const prediction = state.prediction || {};
  if (prediction.probability !== undefined) {
    const probability = Math.round(Number(prediction.probability));
    probFill.style.width = `${probability}%`;
    intensityLabel.textContent = prediction.intensity_label || "No Rain";
    let color = "var(--accent-green)";
    if (probability >= 70) {
      color = "#ff3b30";
    } else if (probability >= 40) {
      color = "#ff9500";
    }
    intensityLabel.style.color = color;
    probFill.style.background = color;
  } else {
    intensityLabel.textContent = "Waiting for sensor data...";
    intensityLabel.style.color = "var(--ink-500)";
  }

  if (Array.isArray(state.history)) {
    trendHistory = state.history.map((item) => Number(item.probability || 0)).slice(-maxPoints);
    drawTrend();
  }

  if (!state.mqtt_connected) {
    statusPill.textContent = "Offline";
    statusPill.style.background = "rgba(46, 46, 58, 0.12)";
    statusPill.style.color = "var(--ink-500)";
  } else {
    statusPill.textContent = "Monitoring";
    statusPill.style.background = "rgba(38, 179, 107, 0.14)";
    statusPill.style.color = "var(--accent-green)";
  }
}

function drawTrend() {
  const ctx = trendCanvas.getContext("2d");
  const width = trendCanvas.clientWidth;
  const height = trendCanvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(88, 88, 104, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (trendHistory.length === 0) {
    ctx.fillStyle = "#7a7a8a";
    ctx.font = "14px sans-serif";
    ctx.fillText("Waiting for data...", width / 2 - 60, height / 2);
    return;
  }

  ctx.strokeStyle = "#1b6ef3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  trendHistory.forEach((value, index) => {
    const x = (width / (maxPoints - 1)) * index;
    const y = height - (value / 100) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "rgba(27, 110, 243, 0.15)";
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

function openModal(title, bodyHtml) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

analyticsBtn.addEventListener("click", () => {
  openModal(
    "Analytics",
    "<p>Hook this panel to your MQTT stream or REST API and render deeper analytics here.</p>"
  );
});

reportBtn.addEventListener("click", () => {
  openModal(
    "Activity Report",
    "<p>Export summarized sensor data and predictions for the last 24 hours.</p>"
  );
});

settingsBtn.addEventListener("click", () => {
  const body = `
    <p>Select which sensors are visible on the dashboard.</p>
    <div class="settings-grid">
      <label><input type="checkbox" data-toggle="Ta" checked /> Temperature</label>
      <label><input type="checkbox" data-toggle="Humidity" checked /> Humidity</label>
      <label><input type="checkbox" data-toggle="Tg" checked /> Globe Temp</label>
      <label><input type="checkbox" data-toggle="Pressure" checked /> Pressure</label>
      <label><input type="checkbox" data-toggle="Windspeed" checked /> Wind Speed</label>
      <label><input type="checkbox" data-toggle="CO2" checked /> CO2</label>
      <label><input type="checkbox" data-toggle="PM2.5" checked /> PM2.5</label>
      <label><input type="checkbox" data-toggle="PM10" checked /> PM10</label>
    </div>
  `;
  openModal("Settings", body);
});

weatherCard.addEventListener("click", () => {
  openModal(
    "Weather Details",
    "<p>Show hourly forecast, alerts, and wind direction here.</p>"
  );
});

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
modalPrimary.addEventListener("click", closeModal);

modal.addEventListener("change", (event) => {
  const toggle = event.target;
  if (toggle instanceof HTMLInputElement && toggle.dataset.toggle) {
    const key = toggle.dataset.toggle;
    const card = document.querySelector(`.sensor-card[data-key="${key}"]`);
    if (card) {
      card.style.display = toggle.checked ? "" : "none";
    }
  }
});

function resizeCanvasForDevicePixelRatio() {
  const ratio = window.devicePixelRatio || 1;
  const ctx = trendCanvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  trendCanvas.width = trendCanvas.clientWidth * ratio;
  trendCanvas.height = trendCanvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
  drawTrend();
}

window.addEventListener("resize", resizeCanvasForDevicePixelRatio);

async function fetchState() {
  try {
    const response = await fetch(`/api/state?city=${encodeURIComponent(storedCity)}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    applyState(data);
  } catch (error) {
    statusPill.textContent = "Offline";
    statusPill.style.background = "rgba(46, 46, 58, 0.12)";
    statusPill.style.color = "var(--ink-500)";
  }
}

updateClock();
resizeCanvasForDevicePixelRatio();
fetchState();

setInterval(updateClock, 1000);
setInterval(fetchState, 2500);
