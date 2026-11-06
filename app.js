const STORAGE_KEY = "blood-pressure-readings";
const form = document.querySelector("#reading-form");
const readingList = document.querySelector("#reading-list");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");
const countElement = document.querySelector("#reading-count");
const latestReading = document.querySelector("#latest-reading");
const latestTime = document.querySelector("#latest-time");
const todayLabel = document.querySelector("#today-label");

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function readReadings() {
  try {
    const savedReadings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(savedReadings) ? savedReadings : [];
  } catch {
    return [];
  }
}

let readings = readReadings();

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "日期不明" : dateFormatter.format(date);
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

function saveReadings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    formMessage.textContent = "";
    return true;
  } catch {
    formMessage.textContent = "無法儲存紀錄，請確認瀏覽器儲存空間設定。";
    return false;
  }
}

function makeReadingElement(reading) {
  const item = document.createElement("li");
  item.className = "reading-item";

  const main = document.createElement("div");
  main.className = "reading-main";

  const values = document.createElement("div");
  values.className = "reading-values";
  const pressure = document.createElement("strong");
  pressure.textContent = `${reading.systolic} / ${reading.diastolic}`;
  const pressureUnit = document.createElement("span");
  pressureUnit.textContent = "mmHg";
  values.append(pressure, pressureUnit);

  const meta = document.createElement("div");
  meta.className = "reading-meta";
  const pulse = document.createElement("span");
  pulse.textContent = `脈搏 ${reading.pulse} 次 / 分`;
  const medication = document.createElement("span");
  medication.className = "medication-tag";
  medication.textContent = reading.medication;
  meta.append(pulse, medication);

  main.append(values, meta);
  if (reading.notes) {
    const notes = document.createElement("p");
    notes.className = "reading-notes";
    notes.textContent = reading.notes;
    main.append(notes);
  }

  const time = document.createElement("div");
  time.className = "reading-time";
  const dateLabel = document.createElement("span");
  dateLabel.textContent = formatDate(reading.createdAt);
  const timeLabel = document.createElement("span");
  timeLabel.textContent = formatTime(reading.createdAt);
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", "刪除這筆紀錄");
  deleteButton.title = "刪除紀錄";
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => removeReading(reading.id));
  time.append(dateLabel, timeLabel, deleteButton);

  item.append(main, time);
  return item;
}

function renderReadings() {
  const sortedReadings = [...readings].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  );
  readingList.replaceChildren(...sortedReadings.map(makeReadingElement));
  emptyState.hidden = sortedReadings.length > 0;
  countElement.textContent = String(readings.length);

  if (sortedReadings.length === 0) {
    latestReading.textContent = "尚無紀錄";
    latestTime.textContent = "新增第一筆資料吧";
    return;
  }

  const latest = sortedReadings[0];
  latestReading.textContent = `${latest.systolic} / ${latest.diastolic} mmHg`;
  latestTime.textContent = `${formatDate(latest.createdAt)} ${formatTime(latest.createdAt)}`;
}

function removeReading(id) {
  readings = readings.filter((reading) => reading.id !== id);
  if (saveReadings()) renderReadings();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const reading = {
    id: crypto.randomUUID(),
    systolic: Number(formData.get("systolic")),
    diastolic: Number(formData.get("diastolic")),
    pulse: Number(formData.get("pulse")),
    medication: formData.get("medication"),
    notes: String(formData.get("notes")).trim(),
    createdAt: new Date().toISOString(),
  };

  readings.push(reading);
  if (!saveReadings()) {
    readings.pop();
    return;
  }

  form.reset();
  renderReadings();
  document.querySelector("[name='systolic']").focus();
});

todayLabel.textContent = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

renderReadings();