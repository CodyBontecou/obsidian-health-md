import { HealthDay, HitRegistry, VizConfig, ResolvedTheme, RenderFn } from "../types";
import { hexToRgba, formatDate } from "../canvas-utils";

type HeartMetric = "heart-rate" | "resting" | "walking";

interface DayPoint {
	date: string;
	min: number;
	max: number;
	avg: number;
	day: HealthDay;
}

function extractForMetric(day: HealthDay, metric: HeartMetric): DayPoint | null {
	if (!day.heart) return null;
	if (metric === "resting") {
		const v = day.heart.restingHeartRate;
		if (v == null || v <= 0) return null;
		return { date: day.date, min: v, max: v, avg: v, day };
	}
	if (metric === "walking") {
		const v = day.heart.walkingHeartRateAverage;
		if (v == null || v <= 0) return null;
		return { date: day.date, min: v, max: v, avg: v, day };
	}
	const min = day.heart.heartRateMin;
	const max = day.heart.heartRateMax;
	const avg = day.heart.averageHeartRate;
	if (avg == null || avg <= 0) return null;
	return {
		date: day.date,
		min: min > 0 ? min : avg,
		max: max > 0 ? max : avg,
		avg,
		day,
	};
}

function metricLabel(m: HeartMetric): string {
	if (m === "resting") return "Resting HR";
	if (m === "walking") return "Walking HR";
	return "Heart Rate";
}

export const renderHeartRange: RenderFn = (
	ctx: CanvasRenderingContext2D,
	data: HealthDay[],
	W: number,
	H: number,
	config: VizConfig,
	theme: ResolvedTheme,
	statsEl: HTMLElement,
	hits: HitRegistry
): void => {
	ctx.fillStyle = theme.bg;
	ctx.fillRect(0, 0, W, H);

	const metric = (config.metric as HeartMetric) || "heart-rate";

	// Build ordered point list; keep nulls so gaps stay visible on x-axis
	const points: Array<DayPoint | null> = data.map((d) => extractForMetric(d, metric));
	const presentPoints = points.filter((p): p is DayPoint => p !== null);
	if (!presentPoints.length) {
		ctx.fillStyle = theme.muted;
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(`No ${metricLabel(metric).toLowerCase()} data`, W / 2, H / 2);
		return;
	}

	const padL = 36, padR = 16, padT = 14, padB = 24;
	const plotW = W - padL - padR;
	const plotH = H - padT - padB;

	const allMin = Math.min(...presentPoints.map((p) => p.min));
	const allMax = Math.max(...presentPoints.map((p) => p.max));
	const pad = 20;
	const yMin = Math.max(0, Math.floor((allMin - pad) / 10) * 10);
	const yMax = Math.ceil((allMax + pad) / 10) * 10;
	const yRange = yMax - yMin || 1;

	const n = points.length;
	const xFor = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
	const yFor = (v: number) => padT + plotH - ((v - yMin) / yRange) * plotH;

	// Gridlines every ~20 BPM
	const step = yRange > 120 ? 40 : 20;
	ctx.strokeStyle = hexToRgba(theme.fg, 0.07);
	ctx.lineWidth = 1;
	ctx.fillStyle = theme.muted;
	ctx.font = "9px sans-serif";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	const startGrid = Math.ceil(yMin / step) * step;
	for (let v = startGrid; v <= yMax; v += step) {
		const y = yFor(v);
		ctx.beginPath();
		ctx.moveTo(padL, y);
		ctx.lineTo(W - padR, y);
		ctx.stroke();
		ctx.fillText(String(v), padL - 4, y);
	}

	// Optional resting-HR horizontal dashed line (when viewing heart-rate with resting data present)
	if (metric === "heart-rate") {
		const restingVals = data
			.map((d) => d.heart?.restingHeartRate)
			.filter((v): v is number => v != null && v > 0);
		if (restingVals.length) {
			const rest = restingVals.reduce((s, x) => s + x, 0) / restingVals.length;
			if (rest >= yMin && rest <= yMax) {
				const y = yFor(rest);
				ctx.save();
				ctx.strokeStyle = hexToRgba("#4488ff", 0.55);
				ctx.lineWidth = 1;
				ctx.setLineDash([4, 4]);
				ctx.beginPath();
				ctx.moveTo(padL, y);
				ctx.lineTo(W - padR, y);
				ctx.stroke();
				ctx.restore();
				ctx.fillStyle = "#4488ff";
				ctx.font = "9px sans-serif";
				ctx.textAlign = "left";
				ctx.textBaseline = "bottom";
				ctx.fillText(`resting ~${Math.round(rest)}`, padL + 4, y - 2);
			}
		}
	}

	// Capsule color (Apple's red)
	const capColor = "#ff3b30";
	const capW = Math.max(4, Math.min(10, (plotW / Math.max(1, n)) * 0.45));
	const capRadius = capW / 2;

	points.forEach((p, i) => {
		if (!p) return;
		const x = xFor(i);
		const yTop = yFor(p.max);
		const yBot = yFor(p.min);
		const h = Math.max(capW, yBot - yTop);

		// Gradient: brighter at top (peak), muted near bottom (min)
		const grad = ctx.createLinearGradient(0, yTop, 0, yTop + h);
		grad.addColorStop(0, hexToRgba(capColor, 1));
		grad.addColorStop(1, hexToRgba(capColor, 0.55));
		ctx.fillStyle = grad;

		ctx.beginPath();
		ctx.roundRect(x - capW / 2, yTop, capW, h, capRadius);
		ctx.fill();

		// Avg dot
		const yAvg = yFor(p.avg);
		ctx.fillStyle = theme.isDark ? "#fff" : "#1a0000";
		ctx.beginPath();
		ctx.arc(x, yAvg, Math.max(2, capW * 0.38), 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = capColor;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.arc(x, yAvg, Math.max(2, capW * 0.38), 0, Math.PI * 2);
		ctx.stroke();

		hits.add({
			shape: "rect",
			x: x - capW,
			y: yTop - 4,
			w: capW * 2,
			h: h + 8,
			title: formatDate(p.date),
			details: [
				{ label: "Avg", value: `${Math.round(p.avg)} bpm` },
				{ label: "Min", value: `${Math.round(p.min)} bpm` },
				{ label: "Max", value: `${Math.round(p.max)} bpm` },
			],
			payload: p.day,
		});
	});

	// X-axis date labels (sparse)
	const labelStep = Math.max(1, Math.floor(n / 6));
	ctx.fillStyle = theme.muted;
	ctx.font = "9px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	points.forEach((_p, i) => {
		if (i % labelStep !== 0 && i !== n - 1) return;
		const point = points[i];
		const iso = point ? point.date : data[i]?.date;
		if (!iso) return;
		const d = new Date(iso + "T00:00:00");
		const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		ctx.fillText(label, xFor(i), H - padB + 6);
	});

	// Stats strip
	const overallMin = Math.min(...presentPoints.map((p) => p.min));
	const overallMax = Math.max(...presentPoints.map((p) => p.max));
	const overallAvg = Math.round(
		presentPoints.reduce((s, p) => s + p.avg, 0) / presentPoints.length
	);
	statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#4488ff">${Math.round(overallMin)}</div><div class="health-md-stat-label">Lowest</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:${capColor}">${overallAvg}</div><div class="health-md-stat-label">${metricLabel(metric)} Avg</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:#ff3b30">${Math.round(overallMax)}</div><div class="health-md-stat-label">Highest</div></div>
	`;
};
