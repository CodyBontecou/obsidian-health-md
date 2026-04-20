import { HealthDay, HitRegistry, VizConfig, ResolvedTheme, RenderFn } from "../types";
import { hexToRgba, formatDate } from "../canvas-utils";

type OxMetric = "blood-oxygen" | "respiratory-rate";

interface MetricSpec {
	label: string;
	unit: string;
	color: string;
	yMin: number;
	yMax: number;
	gridStep: number;
	warn: { lo?: number; hi?: number; color: string; note: string } | null;
	extract(day: HealthDay): { min: number; max: number; avg: number } | null;
}

function specFor(metric: OxMetric): MetricSpec {
	if (metric === "respiratory-rate") {
		return {
			label: "Respiratory Rate",
			unit: "brpm",
			color: "#3bb2c1",
			yMin: 10,
			yMax: 25,
			gridStep: 5,
			// Medical ref ranges vary; flag sustained >20 brpm at rest.
			warn: { hi: 20, color: "#ff3b30", note: "Elevated >20 brpm" },
			extract: (d) => {
				const v = d.vitals;
				if (!v) return null;
				const avg = v.respiratoryRateAvg ?? v.respiratoryRate;
				if (avg == null || avg <= 0) return null;
				const min = v.respiratoryRateMin ?? avg;
				const max = v.respiratoryRateMax ?? avg;
				return { min, max, avg };
			},
		};
	}
	return {
		label: "Blood Oxygen",
		unit: "%",
		color: "#1eeaef",
		yMin: 90,
		yMax: 100,
		gridStep: 2,
		warn: { lo: 95, color: "#ff3b30", note: "Low SpO₂ <95%" },
		extract: (d) => {
			const v = d.vitals;
			if (!v) return null;
			const avg = v.bloodOxygenAvg ?? v.bloodOxygenPercent;
			if (avg == null || avg <= 0) return null;
			const min = v.bloodOxygenMin ?? avg;
			const max = v.bloodOxygenMax ?? avg;
			return { min, max, avg };
		},
	};
}

export const renderOxygenRange: RenderFn = (
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

	const metric = (config.metric as OxMetric) || "blood-oxygen";
	const spec = specFor(metric);

	const points = data.map((d) => ({ day: d, v: spec.extract(d) }));
	const present = points.filter((p): p is { day: HealthDay; v: { min: number; max: number; avg: number } } => p.v !== null);
	if (!present.length) {
		ctx.fillStyle = theme.muted;
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(`No ${spec.label.toLowerCase()} data`, W / 2, H / 2);
		return;
	}

	const padL = 40, padR = 16, padT = 14, padB = 24;
	const plotW = W - padL - padR;
	const plotH = H - padT - padB;

	// Auto-widen bounds if observed values exceed the default range
	const observedMin = Math.min(...present.map((p) => p.v.min));
	const observedMax = Math.max(...present.map((p) => p.v.max));
	const yMin = Math.min(spec.yMin, Math.floor(observedMin - 1));
	const yMax = Math.max(spec.yMax, Math.ceil(observedMax + 1));
	const yRange = yMax - yMin || 1;

	const n = points.length;
	const xFor = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
	const yFor = (v: number) => padT + plotH - ((v - yMin) / yRange) * plotH;

	// Warning zone shading
	if (spec.warn) {
		ctx.fillStyle = hexToRgba(spec.warn.color, theme.isDark ? 0.12 : 0.08);
		if (spec.warn.lo != null) {
			const yThreshold = yFor(spec.warn.lo);
			ctx.fillRect(padL, yThreshold, plotW, padT + plotH - yThreshold);
		}
		if (spec.warn.hi != null) {
			const yThreshold = yFor(spec.warn.hi);
			ctx.fillRect(padL, padT, plotW, yThreshold - padT);
		}
	}

	// Gridlines
	ctx.strokeStyle = hexToRgba(theme.fg, 0.07);
	ctx.lineWidth = 1;
	ctx.fillStyle = theme.muted;
	ctx.font = "9px sans-serif";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	const startGrid = Math.ceil(yMin / spec.gridStep) * spec.gridStep;
	for (let v = startGrid; v <= yMax; v += spec.gridStep) {
		const y = yFor(v);
		ctx.beginPath();
		ctx.moveTo(padL, y);
		ctx.lineTo(W - padR, y);
		ctx.stroke();
		const label = `${v}${spec.unit === "%" ? "" : ""}`;
		ctx.fillText(label, padL - 4, y);
	}

	// Warn threshold line label
	if (spec.warn) {
		const thresholdV = spec.warn.lo ?? spec.warn.hi!;
		const y = yFor(thresholdV);
		ctx.save();
		ctx.strokeStyle = hexToRgba(spec.warn.color, 0.55);
		ctx.lineWidth = 1;
		ctx.setLineDash([4, 3]);
		ctx.beginPath();
		ctx.moveTo(padL, y);
		ctx.lineTo(W - padR, y);
		ctx.stroke();
		ctx.restore();
		ctx.fillStyle = spec.warn.color;
		ctx.font = "9px sans-serif";
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";
		ctx.fillText(spec.warn.note, padL + 4, y - 2);
	}

	const capW = Math.max(4, Math.min(10, (plotW / Math.max(1, n)) * 0.45));
	const capRadius = capW / 2;

	points.forEach((p, i) => {
		if (!p.v) return;
		const x = xFor(i);
		const yTop = yFor(p.v.max);
		const yBot = yFor(p.v.min);
		const h = Math.max(capW, yBot - yTop);

		const grad = ctx.createLinearGradient(0, yTop, 0, yTop + h);
		grad.addColorStop(0, hexToRgba(spec.color, 1));
		grad.addColorStop(1, hexToRgba(spec.color, 0.55));
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.roundRect(x - capW / 2, yTop, capW, h, capRadius);
		ctx.fill();

		// Avg dot
		const yAvg = yFor(p.v.avg);
		ctx.fillStyle = theme.isDark ? "#fff" : "#0a1a22";
		ctx.beginPath();
		ctx.arc(x, yAvg, Math.max(2, capW * 0.38), 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = spec.color;
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
			title: formatDate(p.day.date),
			details: [
				{ label: "Avg", value: `${p.v.avg.toFixed(1)} ${spec.unit}` },
				{ label: "Min", value: `${p.v.min.toFixed(1)} ${spec.unit}` },
				{ label: "Max", value: `${p.v.max.toFixed(1)} ${spec.unit}` },
			],
			payload: p.day,
		});
	});

	// X-axis labels
	const labelStep = Math.max(1, Math.floor(n / 6));
	ctx.fillStyle = theme.muted;
	ctx.font = "9px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	for (let i = 0; i < n; i++) {
		if (i % labelStep !== 0 && i !== n - 1) continue;
		const d = new Date(points[i].day.date + "T00:00:00");
		const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		ctx.fillText(label, xFor(i), H - padB + 6);
	}

	// Stats
	const mins = present.map((p) => p.v.min);
	const maxs = present.map((p) => p.v.max);
	const avgs = present.map((p) => p.v.avg);
	const overallMin = Math.min(...mins);
	const overallMax = Math.max(...maxs);
	const overallAvg = avgs.reduce((s, v) => s + v, 0) / avgs.length;
	statsEl.innerHTML = `
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:${spec.color}">${overallMin.toFixed(1)}</div><div class="health-md-stat-label">Lowest</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:${spec.color}">${overallAvg.toFixed(1)}</div><div class="health-md-stat-label">${spec.label} Avg</div></div>
		<div class="health-md-stat-box"><div class="health-md-stat-value" style="color:${spec.color}">${overallMax.toFixed(1)}</div><div class="health-md-stat-label">Highest</div></div>
	`;
};
