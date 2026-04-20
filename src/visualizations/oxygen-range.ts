import { HealthDay, RenderFn } from "../types";
import { renderRangeChart, RangeChartSpec } from "./range-chart-core";

type OxMetric = "blood-oxygen" | "respiratory-rate";

function specFor(metric: OxMetric): RangeChartSpec {
	if (metric === "respiratory-rate") {
		return {
			label: "Respiratory Rate",
			unit: "brpm",
			capsuleColor: "#3bb2c1",
			padL: 40,
			avgDotInnerLightFill: "#0a1a22",
			extract: (d: HealthDay) => {
				const v = d.vitals;
				if (!v) return null;
				const avg = v.respiratoryRateAvg ?? v.respiratoryRate;
				if (avg == null || avg <= 0) return null;
				return { min: v.respiratoryRateMin ?? avg, max: v.respiratoryRateMax ?? avg, avg };
			},
			yAxis: ({ min, max }) => ({
				yMin: Math.min(10, Math.floor(min - 1)),
				yMax: Math.max(25, Math.ceil(max + 1)),
				gridStep: 5,
			}),
			formatAxisLabel: (v) => String(v),
			formatValue: (v) => v.toFixed(1),
			warn: { hi: 20, color: "#ff3b30", note: "Elevated >20 brpm" },
			stats: { lowColor: "#3bb2c1", avgColor: "#3bb2c1", highColor: "#3bb2c1" },
		};
	}
	return {
		label: "Blood Oxygen",
		unit: "%",
		capsuleColor: "#1eeaef",
		padL: 40,
		avgDotInnerLightFill: "#0a1a22",
		extract: (d: HealthDay) => {
			const v = d.vitals;
			if (!v) return null;
			const avg = v.bloodOxygenAvg ?? v.bloodOxygenPercent;
			if (avg == null || avg <= 0) return null;
			return { min: v.bloodOxygenMin ?? avg, max: v.bloodOxygenMax ?? avg, avg };
		},
		yAxis: ({ min, max }) => ({
			yMin: Math.min(90, Math.floor(min - 1)),
			yMax: Math.max(100, Math.ceil(max + 1)),
			gridStep: 2,
		}),
		formatAxisLabel: (v) => String(v),
		formatValue: (v) => v.toFixed(1),
		warn: { lo: 95, color: "#ff3b30", note: "Low SpO₂ <95%" },
		stats: { lowColor: "#1eeaef", avgColor: "#1eeaef", highColor: "#1eeaef" },
	};
}

export const renderOxygenRange: RenderFn = (ctx, data, W, H, config, theme, statsEl, hits): void => {
	const metric = (config.metric as OxMetric) || "blood-oxygen";
	renderRangeChart(ctx, data, W, H, theme, statsEl, hits, specFor(metric));
};
