var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HealthMdPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/data-loader.ts
var import_obsidian = require("obsidian");

// src/parsers/json-parser.ts
function parseJSON(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "health-data" && parsed.date) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}

// src/parsers/csv-parser.ts
function parseRows(content) {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 5) {
      rows.push({
        date: parts[0].trim(),
        category: parts[1].trim(),
        metric: parts[2].trim(),
        value: parts[3].trim(),
        unit: parts[4].trim()
      });
    }
  }
  return rows;
}
function getNum(rows, category, metric) {
  const row = rows.find(
    (r) => r.category.toLowerCase() === category.toLowerCase() && r.metric.toLowerCase() === metric.toLowerCase()
  );
  if (!row) return void 0;
  const num = parseFloat(row.value);
  return isNaN(num) ? void 0 : num;
}
function getString(rows, category, metric) {
  const row = rows.find(
    (r) => r.category.toLowerCase() === category.toLowerCase() && r.metric.toLowerCase() === metric.toLowerCase()
  );
  return row == null ? void 0 : row.value;
}
function buildDayFromRows(date, rows) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const day = {
    type: "health-data",
    date
  };
  const steps = getNum(rows, "Activity", "Steps");
  if (steps !== void 0) {
    day.activity = {
      steps,
      walkingRunningDistanceKm: (_a = getNum(rows, "Activity", "Walking Running Distance")) != null ? _a : 0,
      activeCalories: (_b = getNum(rows, "Activity", "Active Calories")) != null ? _b : 0,
      exerciseMinutes: (_c = getNum(rows, "Activity", "Exercise Minutes")) != null ? _c : 0,
      vo2Max: getNum(rows, "Activity", "VO2 Max"),
      basalEnergyBurned: getNum(rows, "Activity", "Basal Energy Burned"),
      standHours: getNum(rows, "Activity", "Stand Hours"),
      flightsClimbed: getNum(rows, "Activity", "Flights Climbed")
    };
    const distM = getNum(rows, "Activity", "Walking Running Distance");
    if (distM !== void 0 && distM > 100) {
      day.activity.walkingRunningDistanceKm = distM / 1e3;
    }
  }
  const restingHR = getNum(rows, "Heart", "Resting Heart Rate");
  const avgHR = getNum(rows, "Heart", "Average Heart Rate");
  if (restingHR !== void 0 || avgHR !== void 0) {
    day.heart = {
      averageHeartRate: (_d = avgHR != null ? avgHR : restingHR) != null ? _d : 0,
      heartRateMin: (_e = getNum(rows, "Heart", "Heart Rate Min")) != null ? _e : 0,
      heartRateMax: (_f = getNum(rows, "Heart", "Heart Rate Max")) != null ? _f : 0,
      heartRateSamples: [],
      restingHeartRate: restingHR,
      walkingHeartRateAverage: getNum(rows, "Heart", "Walking Heart Rate Average"),
      hrv: getNum(rows, "Heart", "HRV")
    };
  }
  const sleepTotal = getNum(rows, "Sleep", "Total Duration");
  if (sleepTotal !== void 0) {
    day.sleep = {
      sleepStages: [],
      totalDuration: sleepTotal,
      deepSleep: (_g = getNum(rows, "Sleep", "Deep Sleep")) != null ? _g : 0,
      remSleep: (_h = getNum(rows, "Sleep", "REM Sleep")) != null ? _h : 0,
      coreSleep: (_i = getNum(rows, "Sleep", "Core Sleep")) != null ? _i : 0,
      awakeTime: getNum(rows, "Sleep", "Awake Time"),
      bedtime: (_j = getString(rows, "Sleep", "Bedtime")) != null ? _j : "",
      wakeTime: (_k = getString(rows, "Sleep", "Wake Time")) != null ? _k : ""
    };
  }
  const respRate = getNum(rows, "Vitals", "Respiratory Rate");
  const bloodOx = getNum(rows, "Vitals", "Blood Oxygen");
  if (respRate !== void 0 || bloodOx !== void 0) {
    day.vitals = {
      respiratoryRate: respRate,
      bloodOxygenPercent: bloodOx,
      bloodOxygenAvg: bloodOx
    };
  }
  const walkSpeed = getNum(rows, "Mobility", "Walking Speed");
  if (walkSpeed !== void 0) {
    day.mobility = {
      walkingSpeed: walkSpeed,
      walkingAsymmetryPercentage: (_l = getNum(rows, "Mobility", "Walking Asymmetry Percentage")) != null ? _l : 0,
      walkingStepLength: getNum(rows, "Mobility", "Walking Step Length"),
      walkingDoubleSupportPercentage: getNum(rows, "Mobility", "Walking Double Support Percentage")
    };
  }
  const headphone = getNum(rows, "Hearing", "Headphone Audio Level");
  if (headphone !== void 0) {
    day.hearing = { headphoneAudioLevel: headphone };
  }
  return day;
}
function parseCSV(content) {
  const rows = parseRows(content);
  if (!rows.length) return [];
  const byDate = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const existing = byDate.get(row.date);
    if (existing) {
      existing.push(row);
    } else {
      byDate.set(row.date, [row]);
    }
  }
  const days = [];
  for (const [date, dateRows] of byDate) {
    days.push(buildDayFromRows(date, dateRows));
  }
  return days;
}

// src/parsers/markdown-parser.ts
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();
    if (!val) continue;
    if (val.startsWith("[") && val.endsWith("]")) {
      const inner = val.slice(1, -1);
      result[key] = inner.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      result[key] = val.slice(1, -1);
      continue;
    }
    if (val === "true") {
      result[key] = true;
      continue;
    }
    if (val === "false") {
      result[key] = false;
      continue;
    }
    const num = Number(val);
    if (!isNaN(num) && val !== "") {
      result[key] = num;
      continue;
    }
    result[key] = val;
  }
  return result;
}
function getNum2(fm, key) {
  const v = fm[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? void 0 : n;
  }
  return void 0;
}
function getStr(fm, key) {
  const v = fm[key];
  return typeof v === "string" ? v : v !== void 0 ? String(v) : void 0;
}
function parseMarkdown(content) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F;
  const fm = parseFrontmatter(content);
  if (!fm) return null;
  const date = getStr(fm, "date");
  if (!date) return null;
  const day = {
    type: "health-data",
    date
  };
  const steps = (_a = getNum2(fm, "steps")) != null ? _a : getNum2(fm, "activity_steps");
  if (steps !== void 0) {
    day.activity = {
      steps,
      walkingRunningDistanceKm: (_c = (_b = getNum2(fm, "walking_running_km")) != null ? _b : getNum2(fm, "walking_running_distance_km")) != null ? _c : 0,
      activeCalories: (_e = (_d = getNum2(fm, "active_calories")) != null ? _d : getNum2(fm, "activity_active_calories")) != null ? _e : 0,
      exerciseMinutes: (_g = (_f = getNum2(fm, "exercise_minutes")) != null ? _f : getNum2(fm, "activity_exercise_minutes")) != null ? _g : 0,
      vo2Max: (_h = getNum2(fm, "vo2_max")) != null ? _h : getNum2(fm, "vo2max"),
      basalEnergyBurned: getNum2(fm, "basal_energy_burned"),
      standHours: getNum2(fm, "stand_hours"),
      flightsClimbed: getNum2(fm, "flights_climbed")
    };
  }
  const restingHR = (_i = getNum2(fm, "resting_heart_rate")) != null ? _i : getNum2(fm, "heart_resting_heart_rate");
  const avgHR = (_j = getNum2(fm, "average_heart_rate")) != null ? _j : getNum2(fm, "heart_average_heart_rate");
  const hrvVal = (_l = (_k = getNum2(fm, "hrv_ms")) != null ? _k : getNum2(fm, "hrv")) != null ? _l : getNum2(fm, "heart_hrv");
  if (restingHR !== void 0 || avgHR !== void 0) {
    day.heart = {
      averageHeartRate: (_m = avgHR != null ? avgHR : restingHR) != null ? _m : 0,
      heartRateMin: (_o = (_n = getNum2(fm, "heart_rate_min")) != null ? _n : getNum2(fm, "heart_min")) != null ? _o : 0,
      heartRateMax: (_q = (_p = getNum2(fm, "heart_rate_max")) != null ? _p : getNum2(fm, "heart_max")) != null ? _q : 0,
      heartRateSamples: [],
      restingHeartRate: restingHR,
      walkingHeartRateAverage: (_r = getNum2(fm, "walking_heart_rate")) != null ? _r : getNum2(fm, "walking_heart_rate_average"),
      hrv: hrvVal
    };
  }
  const sleepHours = getNum2(fm, "sleep_total_hours");
  const sleepSeconds = getNum2(fm, "sleep_total_duration");
  const sleepTotal = sleepHours !== void 0 ? sleepHours * 3600 : sleepSeconds;
  if (sleepTotal !== void 0) {
    const deepH = getNum2(fm, "sleep_deep_hours");
    const remH = getNum2(fm, "sleep_rem_hours");
    const coreH = getNum2(fm, "sleep_core_hours");
    const awakeH = getNum2(fm, "sleep_awake_hours");
    day.sleep = {
      sleepStages: [],
      totalDuration: sleepTotal,
      deepSleep: deepH !== void 0 ? deepH * 3600 : (_s = getNum2(fm, "sleep_deep")) != null ? _s : 0,
      remSleep: remH !== void 0 ? remH * 3600 : (_t = getNum2(fm, "sleep_rem")) != null ? _t : 0,
      coreSleep: coreH !== void 0 ? coreH * 3600 : (_u = getNum2(fm, "sleep_core")) != null ? _u : 0,
      awakeTime: awakeH !== void 0 ? awakeH * 3600 : getNum2(fm, "sleep_awake"),
      bedtime: (_w = (_v = getStr(fm, "sleep_bedtime")) != null ? _v : getStr(fm, "bedtime")) != null ? _w : "",
      wakeTime: (_y = (_x = getStr(fm, "sleep_wake")) != null ? _x : getStr(fm, "wake_time")) != null ? _y : ""
    };
  }
  const respRate = (_z = getNum2(fm, "respiratory_rate")) != null ? _z : getNum2(fm, "vitals_respiratory_rate");
  const bloodOx = (_B = (_A = getNum2(fm, "blood_oxygen")) != null ? _A : getNum2(fm, "blood_oxygen_avg")) != null ? _B : getNum2(fm, "vitals_blood_oxygen");
  if (respRate !== void 0 || bloodOx !== void 0) {
    day.vitals = {
      respiratoryRate: respRate,
      bloodOxygenPercent: bloodOx,
      bloodOxygenAvg: bloodOx
    };
  }
  const walkSpeed = (_C = getNum2(fm, "walking_speed")) != null ? _C : getNum2(fm, "mobility_walking_speed");
  if (walkSpeed !== void 0) {
    day.mobility = {
      walkingSpeed: walkSpeed,
      walkingAsymmetryPercentage: (_E = (_D = getNum2(fm, "walking_asymmetry_percentage")) != null ? _D : getNum2(fm, "walking_asymmetry")) != null ? _E : 0,
      walkingStepLength: getNum2(fm, "walking_step_length"),
      walkingDoubleSupportPercentage: getNum2(fm, "walking_double_support_percentage")
    };
  }
  const headphone = (_F = getNum2(fm, "headphone_audio_level")) != null ? _F : getNum2(fm, "hearing_headphone_audio_level");
  if (headphone !== void 0) {
    day.hearing = { headphoneAudioLevel: headphone };
  }
  const hasData = day.activity || day.heart || day.sleep || day.vitals || day.mobility;
  return hasData ? day : null;
}

// src/data-loader.ts
var SUPPORTED_EXTENSIONS = ["json", "csv", "md"];
function matchesGlob(filename, pattern) {
  if (!pattern || pattern === "*" || pattern === "*.*") return true;
  const regex = new RegExp(
    "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    "i"
  );
  return regex.test(filename);
}
function detectFormat(extension, configFormat) {
  if (configFormat !== "auto") return configFormat;
  switch (extension) {
    case "json":
      return "json";
    case "csv":
      return "csv";
    case "md":
      return "markdown";
    // works for both markdown and bases (same parser)
    default:
      return "json";
  }
}
var DataLoader = class {
  constructor(vault, settings) {
    this.vault = vault;
    this.settings = settings;
    this.cache = null;
    this.lastLoad = 0;
    this.TTL = 3e4;
  }
  async load() {
    if (this.cache && Date.now() - this.lastLoad < this.TTL) {
      return this.cache;
    }
    const folder = this.vault.getAbstractFileByPath(this.settings.dataFolder);
    if (!(folder instanceof import_obsidian.TFolder)) return [];
    const pattern = this.settings.filePattern || "*";
    const files = folder.children.filter((f) => {
      if (!(f instanceof import_obsidian.TFile)) return false;
      if (!SUPPORTED_EXTENSIONS.includes(f.extension)) return false;
      return matchesGlob(f.name, pattern);
    });
    const days = [];
    for (const file of files) {
      const content = await this.vault.cachedRead(file);
      const format = detectFormat(file.extension, this.settings.dataFormat);
      try {
        switch (format) {
          case "json": {
            const day = parseJSON(content);
            if (day) days.push(day);
            break;
          }
          case "csv": {
            const csvDays = parseCSV(content);
            days.push(...csvDays);
            break;
          }
          case "markdown":
          case "bases": {
            const day = parseMarkdown(content);
            if (day) days.push(day);
            break;
          }
        }
      } catch (e) {
      }
    }
    const byDate = /* @__PURE__ */ new Map();
    for (const day of days) {
      const existing = byDate.get(day.date);
      if (!existing) {
        byDate.set(day.date, day);
      } else {
        byDate.set(day.date, mergeDays(existing, day));
      }
    }
    this.cache = Array.from(byDate.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    this.lastLoad = Date.now();
    return this.cache;
  }
  invalidate() {
    this.cache = null;
  }
};
function mergeDays(a, b) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  return {
    type: "health-data",
    date: a.date,
    units: (_a = a.units) != null ? _a : b.units,
    activity: (_b = a.activity) != null ? _b : b.activity,
    heart: (_c = a.heart) != null ? _c : b.heart,
    vitals: (_d = a.vitals) != null ? _d : b.vitals,
    sleep: (_e = a.sleep) != null ? _e : b.sleep,
    mobility: (_f = a.mobility) != null ? _f : b.mobility,
    workouts: (_g = a.workouts) != null ? _g : b.workouts,
    hearing: (_h = a.hearing) != null ? _h : b.hearing
  };
}

// src/renderer.ts
var import_obsidian2 = require("obsidian");

// src/canvas-utils.ts
function setupCanvas(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function hsl(h, s, l) {
  return `hsl(${h},${s}%,${l}%)`;
}
var SLEEP_COLORS = {
  deep: "#312e81",
  rem: "#7c3aed",
  core: "#2dd4bf",
  awake: "#f59e0b"
};
var SLEEP_GLOW = {
  deep: "#4338ca",
  rem: "#a78bfa",
  core: "#5eead4",
  awake: "#fbbf24"
};
function resolveTheme(setting) {
  let isDark;
  if (setting === "auto") {
    isDark = document.body.classList.contains("theme-dark");
  } else {
    isDark = setting === "dark";
  }
  return isDark ? { bg: "#0a0a0f", fg: "#e0e0e0", muted: "#555", isDark: true } : { bg: "#ffffff", fg: "#1a1a1a", muted: "#999", isDark: false };
}

// src/visualizations/heart-terrain.ts
var renderHeartTerrain = (ctx, data, W, H, _config, theme, statsEl) => {
  const BUCKETS = 96;
  const days = data.filter((d) => {
    var _a;
    return (_a = d.heart) == null ? void 0 : _a.heartRateSamples;
  });
  const grid = [];
  let minBPM = 999, maxBPM = 0;
  days.forEach((day) => {
    const col = new Array(BUCKETS).fill(null);
    day.heart.heartRateSamples.forEach((s) => {
      const dt = new Date(s.timestamp);
      const mins = dt.getHours() * 60 + dt.getMinutes();
      const bucket = Math.floor(mins / 15);
      if (bucket >= 0 && bucket < BUCKETS) {
        if (!col[bucket]) col[bucket] = [];
        col[bucket].push(s.value);
      }
    });
    const averaged = col.map(
      (b) => b ? b.reduce((a, c) => a + c, 0) / b.length : null
    );
    averaged.forEach((v) => {
      if (v) {
        minBPM = Math.min(minBPM, v);
        maxBPM = Math.max(maxBPM, v);
      }
    });
    grid.push({ date: day.date, col: averaged });
  });
  const colW = W / grid.length;
  const rowH = H / BUCKETS;
  grid.forEach((day, x) => {
    day.col.forEach((bpm, y) => {
      if (bpm === null) return;
      const t = (bpm - minBPM) / (maxBPM - minBPM);
      const h = lerp(220, 0, t);
      const s = lerp(60, 100, t);
      const l = lerp(theme.isDark ? 12 : 30, theme.isDark ? 55 : 65, t);
      ctx.fillStyle = hsl(h, s, l);
      ctx.fillRect(x * colW, y * rowH, colW + 1, rowH + 1);
    });
  });
  const minHR = Math.min(...days.map((d) => d.heart.heartRateMin || 999));
  const maxHR = Math.max(...days.map((d) => d.heart.heartRateMax || 0));
  const avgHR = Math.round(
    days.reduce((s, d) => s + (d.heart.averageHeartRate || 0), 0) / days.length
  );
  statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#4488ff">${minHR}</div><div class="health-md-stat-label">Lowest</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#cc6666">${avgHR}</div><div class="health-md-stat-label">Average</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#ff4444">${maxHR}</div><div class="health-md-stat-label">Highest</div></div>
	`;
};

// src/visualizations/sleep-polar.ts
var renderSleepPolar = (ctx, data, W, H, _config, theme, statsEl) => {
  const canvas = ctx.canvas;
  const nights = data.filter(
    (d) => {
      var _a;
      return ((_a = d.sleep) == null ? void 0 : _a.sleepStages) && d.sleep.sleepStages.length > 0;
    }
  );
  if (!nights.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No sleep data", W / 2, H / 2);
    return;
  }
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const cols = 3;
  const rows = Math.ceil(nights.length / cols);
  const cellW = Math.floor((W - (cols - 1) * 6) / cols);
  const cellH = Math.floor((H - (rows - 1) * 6) / rows);
  const cellSize = Math.min(cellW, cellH);
  nights.forEach((night, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const offsetX = col * (cellSize + 6);
    const offsetY = row * (cellSize + 6);
    const cx = offsetX + cellSize / 2;
    const cy = offsetY + cellSize / 2;
    const r = cellSize / 2 - 10;
    ctx.fillStyle = theme.isDark ? "#0d0d18" : "#f0f0f5";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fill();
    const stages = night.sleep.sleepStages;
    const firstStart = new Date(stages[0].startDate).getTime();
    const lastEnd = new Date(
      stages[stages.length - 1].endDate
    ).getTime();
    const totalSpan = lastEnd - firstStart;
    stages.forEach((stage) => {
      const start = new Date(stage.startDate).getTime();
      const end = new Date(stage.endDate).getTime();
      const a1 = (start - firstStart) / totalSpan * Math.PI * 2 - Math.PI / 2;
      const a2 = (end - firstStart) / totalSpan * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 1, a1, a2);
      ctx.closePath();
      ctx.fillStyle = SLEEP_COLORS[stage.stage] || "#333";
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    const d = /* @__PURE__ */ new Date(night.date + "T00:00:00");
    ctx.fillStyle = theme.muted;
    ctx.font = `${Math.max(7, cellSize * 0.09)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cx,
      offsetY + cellSize - 1
    );
  });
  const actualRows = Math.ceil(nights.length / cols);
  const actualH = actualRows * (cellSize + 6) - 6;
  if (actualH < H) {
    const dpr = window.devicePixelRatio || 1;
    canvas.height = actualH * dpr;
    canvas.style.height = actualH + "px";
  }
};

// src/visualizations/step-spiral.ts
var renderStepSpiral = (ctx, data, W, H, _config, theme, statsEl) => {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const rx = W / 2 - 24;
  const ry = H / 2 - 24;
  const days = data.filter((d) => {
    var _a;
    return (_a = d.activity) == null ? void 0 : _a.steps;
  });
  if (!days.length) return;
  const maxSteps = Math.max(...days.map((d) => d.activity.steps));
  const maxDist = Math.max(
    ...days.map((d) => d.activity.walkingRunningDistanceKm || 0)
  );
  let totalSteps = 0;
  let bestDay = days[0];
  days.forEach((day, i) => {
    totalSteps += day.activity.steps;
    if (day.activity.steps > bestDay.activity.steps) bestDay = day;
    const t = i / days.length;
    const angle = t * Math.PI * 3.5 - Math.PI / 2;
    const spiralT = 0.15 + t * 0.85;
    const x = cx + Math.cos(angle) * rx * spiralT;
    const y = cy + Math.sin(angle) * ry * spiralT;
    const steps = day.activity.steps;
    const dist = day.activity.walkingRunningDistanceKm || 0;
    const dotSize = 10 + steps / maxSteps * 30;
    const distT = maxDist > 0 ? dist / maxDist : 0;
    const h = lerp(140, 185, distT);
    const s = lerp(40, 95, distT);
    const l = lerp(theme.isDark ? 18 : 30, theme.isDark ? 55 : 60, distT);
    ctx.shadowColor = hsl(h, s, l + 20);
    ctx.shadowBlur = dotSize;
    ctx.fillStyle = hsl(h, s, l);
    ctx.beginPath();
    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (i > 0) {
      const pt = (i - 1) / days.length;
      const pa = pt * Math.PI * 3.5 - Math.PI / 2;
      const pst = 0.15 + pt * 0.85;
      const px = cx + Math.cos(pa) * rx * pst;
      const py = cy + Math.sin(pa) * ry * pst;
      ctx.strokeStyle = hsl(h, s, l * 0.3);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.fillStyle = theme.muted;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      String((/* @__PURE__ */ new Date(day.date + "T00:00:00")).getDate()),
      x,
      y + dotSize / 2 + 11
    );
  });
  const avgSteps = Math.round(totalSteps / days.length);
  statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#2dd4bf">${avgSteps.toLocaleString()}</div><div class="health-md-stat-label">Avg/Day</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#5eead4">${bestDay.activity.steps.toLocaleString()}</div><div class="health-md-stat-label">Best Day</div></div>
	`;
};

// src/visualizations/oxygen-river.ts
var renderOxygenRiver = (ctx, data, W, H, _config, theme, statsEl) => {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const days = data.filter(
    (d) => {
      var _a;
      return ((_a = d.vitals) == null ? void 0 : _a.bloodOxygenSamples) && d.vitals.bloodOxygenSamples.length > 0;
    }
  );
  if (!days.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No SpO2 data", W / 2, H / 2);
    return;
  }
  const allSamples = [];
  days.forEach((day, di) => {
    day.vitals.bloodOxygenSamples.forEach((s) => {
      allSamples.push({
        x: di + Math.random() * 0.8,
        value: s.value || s.percent || 0
      });
    });
  });
  const minO2 = Math.min(...allSamples.map((s) => s.value));
  const maxO2 = Math.max(...allSamples.map((s) => s.value));
  allSamples.forEach((s) => {
    const x = s.x / days.length * W;
    const t = (s.value - minO2) / (maxO2 - minO2 || 1);
    const y = H * 0.5 + (1 - t) * H * 0.35 - t * H * 0.35;
    const rSize = lerp(7, 3, t);
    const h = lerp(0, 210, t);
    ctx.fillStyle = hsl(h, lerp(80, 70, t), lerp(40, 50, t));
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x, y, rSize, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  const avgO2 = allSamples.reduce((s, v) => s + v.value, 0) / allSamples.length;
  statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#4488ff">${avgO2.toFixed(1)}%</div><div class="health-md-stat-label">Avg SpO2</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#6688cc">${minO2.toFixed(1)}%</div><div class="health-md-stat-label">Min</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#88aaee">${maxO2.toFixed(1)}%</div><div class="health-md-stat-label">Max</div></div>
	`;
};

// src/visualizations/breathing-wave.ts
var renderBreathingWave = (ctx, data, W, H, _config, theme, statsEl) => {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const days = data.filter(
    (d) => {
      var _a;
      return ((_a = d.vitals) == null ? void 0 : _a.respiratoryRateSamples) && d.vitals.respiratoryRateSamples.length > 0;
    }
  );
  if (!days.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No respiratory data", W / 2, H / 2);
    return;
  }
  const allVals = [];
  days.forEach(
    (day) => day.vitals.respiratoryRateSamples.forEach(
      (s) => allVals.push(s.value)
    )
  );
  const minR = Math.min(...allVals);
  const maxR = Math.max(...allVals);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(45, 212, 191, 0.35)");
  grad.addColorStop(1, "rgba(45, 212, 191, 0.0)");
  ctx.beginPath();
  ctx.moveTo(0, H);
  allVals.forEach((v, i) => {
    const x = i / allVals.length * W;
    const t = (v - minR) / (maxR - minR || 1);
    ctx.lineTo(x, H - 16 - t * (H - 32));
  });
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  allVals.forEach((v, i) => {
    const x = i / allVals.length * W;
    const t = (v - minR) / (maxR - minR || 1);
    const y = H - 16 - t * (H - 32);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const avg = (allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(
    1
  );
  statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#2dd4bf">${avg}</div><div class="health-md-stat-label">Avg br/min</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#1a9a8a">${minR.toFixed(1)}</div><div class="health-md-stat-label">Min</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#5eead4">${maxR.toFixed(1)}</div><div class="health-md-stat-label">Max</div></div>
	`;
};

// src/visualizations/vitals-rings.ts
var renderVitalsRings = (ctx, data, W, H, _config, theme, _statsEl) => {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const days = data.filter((d) => d.activity && d.heart);
  if (!days.length) return;
  const maxSteps = Math.max(...days.map((d) => d.activity.steps || 0));
  const maxCal = Math.max(
    ...days.map((d) => d.activity.activeCalories || 0)
  );
  const maxHR = Math.max(
    ...days.map(
      (d) => d.heart.restingHeartRate || d.heart.averageHeartRate || 80
    )
  );
  const minHR = Math.min(
    ...days.map(
      (d) => d.heart.restingHeartRate || d.heart.averageHeartRate || 60
    )
  );
  const maxRx = W / 2 - 16;
  const maxRy = H / 2 - 16;
  const ringGap = Math.min(maxRx, maxRy) / days.length;
  const sx = maxRx / Math.max(maxRx, maxRy);
  const sy = maxRy / Math.max(maxRx, maxRy);
  days.forEach((day, i) => {
    const baseR = 16 + i * ringGap;
    const steps = day.activity.steps || 0;
    const cal = day.activity.activeCalories || 0;
    const hr = day.heart.restingHeartRate || day.heart.averageHeartRate || 70;
    const stepsAngle = steps / maxSteps * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(
      sx > sy ? 1 : maxRx / maxRy,
      sy > sx ? 1 : maxRy / maxRx
    );
    ctx.strokeStyle = `rgba(45, 212, 191, ${0.25 + steps / maxSteps * 0.55})`;
    ctx.lineWidth = ringGap * 0.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, baseR, -Math.PI / 2, -Math.PI / 2 + stepsAngle);
    ctx.stroke();
    const calAngle = cal / maxCal * Math.PI * 2;
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.25 + cal / maxCal * 0.55})`;
    ctx.lineWidth = ringGap * 0.22;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      baseR + ringGap * 0.15,
      -Math.PI / 2,
      -Math.PI / 2 + calAngle
    );
    ctx.stroke();
    ctx.restore();
    const hrT = (hr - minHR) / (maxHR - minHR || 1);
    const dotAngle = -Math.PI / 2 + stepsAngle;
    const scaleX = sx > sy ? 1 : maxRx / maxRy;
    const scaleY = sy > sx ? 1 : maxRy / maxRx;
    const dx = cx + Math.cos(dotAngle) * baseR * scaleX;
    const dy = cy + Math.sin(dotAngle) * baseR * scaleY;
    ctx.fillStyle = hsl(lerp(200, 0, hrT), 80, 50);
    ctx.beginPath();
    ctx.arc(dx, dy, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = theme.muted;
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("inner \u2192 outer", cx, cy - 3);
  ctx.fillText("oldest \u2192 newest", cx, cy + 9);
};

// src/visualizations/walking-symmetry.ts
var renderWalkingSymmetry = (ctx, data, W, H, _config, theme, _statsEl) => {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  const days = data.filter((d) => d.mobility);
  if (!days.length) return;
  const maxSpeed = Math.max(
    ...days.map((d) => d.mobility.walkingSpeed || 0)
  );
  const maxAsym = Math.max(
    ...days.map((d) => d.mobility.walkingAsymmetryPercentage || 0)
  );
  const barW = (W - 20) / days.length;
  const leftPad = 10;
  const midY = H / 2;
  days.forEach((day, i) => {
    const speed = day.mobility.walkingSpeed || 0;
    const asym = day.mobility.walkingAsymmetryPercentage || 0;
    const x = leftPad + i * barW;
    const speedH = maxSpeed > 0 ? speed / maxSpeed * (midY - 16) : 0;
    const sg = ctx.createLinearGradient(x, midY, x, midY - speedH);
    sg.addColorStop(0, "rgba(45, 212, 191, 0.08)");
    sg.addColorStop(1, "rgba(45, 212, 191, 0.75)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.roundRect(x + 1, midY - speedH, barW - 2, speedH, [3, 3, 0, 0]);
    ctx.fill();
    const asymH = maxAsym > 0 ? asym / maxAsym * (midY - 16) : 0;
    const asymT = maxAsym > 0 ? asym / maxAsym : 0;
    const ag = ctx.createLinearGradient(x, midY, x, midY + asymH);
    ag.addColorStop(0, "rgba(245, 158, 11, 0.08)");
    ag.addColorStop(
      1,
      `rgba(${Math.round(lerp(245, 239, asymT))},${Math.round(lerp(158, 68, asymT))},${Math.round(lerp(11, 68, asymT))},0.75)`
    );
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.roundRect(x + 1, midY, barW - 2, asymH, [0, 0, 3, 3]);
    ctx.fill();
  });
  ctx.strokeStyle = theme.isDark ? "#222" : "#ddd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftPad, midY);
  ctx.lineTo(W, midY);
  ctx.stroke();
  ctx.fillStyle = theme.muted;
  ctx.font = "8px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("\u2191 speed", W / 2, 12);
  ctx.fillText("\u2193 wobble", W / 2, H - 4);
};

// src/visualizations/sleep-architecture.ts
var renderSleepArchitecture = (ctx, data, W, H, _config, theme, _statsEl) => {
  const canvas = ctx.canvas;
  const nights = data.filter(
    (d) => {
      var _a;
      return ((_a = d.sleep) == null ? void 0 : _a.sleepStages) && d.sleep.sleepStages.length > 0;
    }
  );
  if (!nights.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No sleep data", W / 2, H / 2);
    return;
  }
  const stripeHeight = 48;
  const gap = 6;
  const labelWidth = 80;
  const rightPad = 20;
  const topPad = 10;
  const totalHeight = topPad + nights.length * (stripeHeight + gap);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = totalHeight * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = totalHeight + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  const barWidth = W - labelWidth - rightPad;
  const nightMeta = nights.map((n) => {
    const stages = n.sleep.sleepStages;
    const start = new Date(stages[0].startDate).getTime();
    const end = new Date(stages[stages.length - 1].endDate).getTime();
    return { start, end, span: end - start };
  });
  const maxSpan = Math.max(...nightMeta.map((m) => m.span));
  nights.forEach((night, i) => {
    const y = topPad + i * (stripeHeight + gap);
    const meta = nightMeta[i];
    const d = /* @__PURE__ */ new Date(night.date + "T00:00:00");
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short"
    });
    ctx.fillStyle = theme.muted;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelWidth - 12, y + stripeHeight / 2);
    ctx.fillStyle = theme.isDark ? "#111118" : "#eeeef2";
    ctx.beginPath();
    ctx.roundRect(labelWidth, y, barWidth, stripeHeight, 4);
    ctx.fill();
    night.sleep.sleepStages.forEach((stage) => {
      const stageStart = new Date(stage.startDate).getTime();
      const stageEnd = new Date(stage.endDate).getTime();
      const x = labelWidth + (stageStart - meta.start) / maxSpan * barWidth;
      const w = Math.max(
        1,
        (stageEnd - stageStart) / maxSpan * barWidth
      );
      ctx.shadowColor = SLEEP_GLOW[stage.stage] || "#000";
      ctx.shadowBlur = 8;
      ctx.fillStyle = SLEEP_COLORS[stage.stage] || "#333";
      ctx.fillRect(x, y + 2, w, stripeHeight - 4);
      ctx.shadowBlur = 0;
    });
  });
};

// src/visualizations/index.ts
var VISUALIZATIONS = {
  "heart-terrain": renderHeartTerrain,
  "sleep-polar": renderSleepPolar,
  "step-spiral": renderStepSpiral,
  "oxygen-river": renderOxygenRiver,
  "breathing-wave": renderBreathingWave,
  "vitals-rings": renderVitalsRings,
  "walking-symmetry": renderWalkingSymmetry,
  "sleep-architecture": renderSleepArchitecture
};

// src/visualizations/intro-stats.ts
var renderIntroStats = (data, el, _config, theme) => {
  const totalSteps = data.reduce((s, d) => {
    var _a;
    return s + (((_a = d.activity) == null ? void 0 : _a.steps) || 0);
  }, 0);
  const totalDist = data.reduce(
    (s, d) => {
      var _a;
      return s + (((_a = d.activity) == null ? void 0 : _a.walkingRunningDistanceKm) || 0);
    },
    0
  );
  const heartDays = data.filter((d) => d.heart);
  const avgHR = heartDays.length ? heartDays.reduce((s, d) => s + (d.heart.averageHeartRate || 0), 0) / heartDays.length : 0;
  const sleepNights = data.filter(
    (d) => {
      var _a;
      return ((_a = d.sleep) == null ? void 0 : _a.sleepStages) && d.sleep.sleepStages.length > 0;
    }
  ).length;
  el.addClass("health-md-intro-grid");
  const stats = [
    { value: `${Math.round(avgHR)}`, label: "Avg BPM", color: "#ef4444" },
    {
      value: `${(totalSteps / 1e3).toFixed(0)}k`,
      label: "Total Steps",
      color: "#2dd4bf"
    },
    {
      value: `${sleepNights}`,
      label: "Nights Tracked",
      color: "#7c3aed"
    },
    {
      value: `${totalDist.toFixed(0)}km`,
      label: "Distance",
      color: "#f59e0b"
    }
  ];
  stats.forEach((stat) => {
    const box = el.createDiv({ cls: "health-md-intro-stat" });
    const valEl = box.createDiv({ cls: "health-md-intro-value" });
    valEl.style.color = stat.color;
    valEl.textContent = stat.value;
    const labelEl = box.createDiv({ cls: "health-md-intro-label" });
    labelEl.style.color = theme.muted;
    labelEl.textContent = stat.label;
  });
};

// src/renderer.ts
function parseConfig(source) {
  const config = { type: "" };
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim();
    const num = Number(val);
    config[key] = isNaN(num) ? val : num;
  }
  return config;
}
var VizRenderChild = class extends import_obsidian2.MarkdownRenderChild {
  constructor() {
    super(...arguments);
    this.observer = null;
  }
  setObserver(obs) {
    this.observer = obs;
  }
  onunload() {
    var _a;
    (_a = this.observer) == null ? void 0 : _a.disconnect();
  }
};
async function renderCodeBlock(plugin, source, el, ctx) {
  var _a, _b;
  const config = parseConfig(source);
  if (!config.type) {
    el.createEl("p", {
      text: "Missing type. Example: type: heart-terrain",
      cls: "health-md-error"
    });
    return;
  }
  if (config.type === "intro-stats") {
    const data2 = await plugin.dataLoader.load();
    if (!data2.length) {
      el.createEl("p", {
        text: `No health data found in ${plugin.settings.dataFolder}/`
      });
      return;
    }
    const theme2 = resolveTheme(plugin.settings.theme);
    const container2 = el.createDiv({ cls: "health-md-container" });
    renderIntroStats(data2, container2, config, theme2);
    return;
  }
  const renderFn = VISUALIZATIONS[config.type];
  if (!renderFn) {
    el.createEl("p", {
      text: `Unknown chart type: ${config.type}`,
      cls: "health-md-error"
    });
    return;
  }
  const data = await plugin.dataLoader.load();
  if (!data.length) {
    el.createEl("p", {
      text: `No health data found in ${plugin.settings.dataFolder}/`
    });
    return;
  }
  const defaultWidth = (_a = config.width) != null ? _a : plugin.settings.defaultWidth;
  const height = (_b = config.height) != null ? _b : plugin.settings.defaultHeight;
  const theme = resolveTheme(plugin.settings.theme);
  const container = el.createDiv({ cls: "health-md-container" });
  const canvas = container.createEl("canvas");
  const statsEl = container.createDiv({ cls: "health-md-stats" });
  const renderChild = new VizRenderChild(container);
  ctx.addChild(renderChild);
  function draw() {
    const width = Math.min(container.clientWidth || defaultWidth, defaultWidth);
    statsEl.empty();
    const canvasCtx = setupCanvas(canvas, width, height);
    renderFn(canvasCtx, data, width, height, config, theme, statsEl);
  }
  draw();
  const observer = new ResizeObserver(() => draw());
  observer.observe(container);
  renderChild.setObserver(observer);
}

// src/main.ts
var DEFAULT_SETTINGS = {
  dataFolder: "Health",
  filePattern: "*",
  dataFormat: "auto",
  theme: "auto",
  defaultWidth: 800,
  defaultHeight: 400
};
var HealthMdPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.dataLoader = new DataLoader(this.app.vault, this.settings);
    this.registerMarkdownCodeBlockProcessor(
      "health-viz",
      (source, el, ctx) => renderCodeBlock(this, source, el, ctx)
    );
    this.addSettingTab(new HealthMdSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file.path.startsWith(this.settings.dataFolder + "/")) {
          this.dataLoader.invalidate();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file.path.startsWith(this.settings.dataFolder + "/")) {
          this.dataLoader.invalidate();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file.path.startsWith(this.settings.dataFolder + "/")) {
          this.dataLoader.invalidate();
        }
      })
    );
    this.addCommand({
      id: "insert-health-chart",
      name: "Insert health visualization",
      editorCallback: (editor) => {
        editor.replaceSelection(
          "```health-viz\ntype: heart-terrain\n```\n"
        );
      }
    });
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var HealthMdSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian3.Setting(containerEl).setName("Data folder").setDesc("Path to the folder containing health data files").addText(
      (text) => text.setPlaceholder("Health").setValue(this.plugin.settings.dataFolder).onChange(async (value) => {
        this.plugin.settings.dataFolder = value;
        this.plugin.dataLoader.invalidate();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("File pattern").setDesc(
      "Glob pattern to match files (e.g. *.json, 2026-*.md, health-*.csv). Use * for all supported files."
    ).addText(
      (text) => text.setPlaceholder("*").setValue(this.plugin.settings.filePattern).onChange(async (value) => {
        this.plugin.settings.filePattern = value;
        this.plugin.dataLoader.invalidate();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Data format").setDesc(
      "Auto-detect reads JSON, CSV, and Markdown/Bases by file extension. Or force a specific format."
    ).addDropdown(
      (dropdown) => dropdown.addOption("auto", "Auto-detect by extension").addOption("json", "JSON").addOption("csv", "CSV").addOption("markdown", "Markdown (frontmatter)").addOption("bases", "Obsidian Bases (YAML frontmatter)").setValue(this.plugin.settings.dataFormat).onChange(async (value) => {
        this.plugin.settings.dataFormat = value;
        this.plugin.dataLoader.invalidate();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Theme").setDesc("Color theme for visualizations").addDropdown(
      (dropdown) => dropdown.addOption("auto", "Auto (match Obsidian)").addOption("dark", "Dark").addOption("light", "Light").setValue(this.plugin.settings.theme).onChange(async (value) => {
        this.plugin.settings.theme = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Default width").setDesc("Default canvas width in pixels").addText(
      (text) => text.setValue(String(this.plugin.settings.defaultWidth)).onChange(async (value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          this.plugin.settings.defaultWidth = num;
          await this.plugin.saveSettings();
        }
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Default height").setDesc("Default canvas height in pixels").addText(
      (text) => text.setValue(String(this.plugin.settings.defaultHeight)).onChange(async (value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          this.plugin.settings.defaultHeight = num;
          await this.plugin.saveSettings();
        }
      })
    );
  }
};
