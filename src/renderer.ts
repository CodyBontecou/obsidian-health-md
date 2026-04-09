import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import type HealthMdPlugin from "./main";
import { HitRegion, HitRegistry, VizConfig } from "./types";
import { setupCanvas, resolveTheme } from "./canvas-utils";
import { VISUALIZATIONS } from "./visualizations";
import { renderIntroStats } from "./visualizations/intro-stats";

function parseConfig(source: string): VizConfig {
	const config: VizConfig = { type: "" };
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

function hitTest(r: HitRegion, x: number, y: number): boolean {
	if (r.shape === "rect") {
		return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
	}
	if (r.shape === "circle") {
		const dx = x - r.cx;
		const dy = y - r.cy;
		return dx * dx + dy * dy <= r.r * r.r;
	}
	// sector
	const dx = x - r.cx;
	const dy = y - r.cy;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < r.r0 || dist > r.r1) return false;
	if (r.a1 - r.a0 >= Math.PI * 2 - 0.001) return true;
	let angle = Math.atan2(dy, dx);
	let a0 = r.a0;
	let a1 = r.a1;
	while (a1 <= a0) a1 += Math.PI * 2;
	while (angle < a0) angle += Math.PI * 2;
	return angle <= a1;
}

function findRegion(
	regions: HitRegion[],
	x: number,
	y: number
): HitRegion | null {
	for (let i = regions.length - 1; i >= 0; i--) {
		if (hitTest(regions[i], x, y)) return regions[i];
	}
	return null;
}

function renderTooltipContent(
	tooltipEl: HTMLElement,
	region: HitRegion
): void {
	tooltipEl.empty();
	tooltipEl.createDiv({
		cls: "health-md-tooltip-title",
		text: region.title,
	});
	const body = tooltipEl.createDiv({ cls: "health-md-tooltip-details" });
	region.details.forEach(({ label, value }) => {
		const row = body.createDiv({ cls: "health-md-tooltip-row" });
		row.createSpan({ cls: "health-md-tooltip-label", text: label });
		row.createSpan({ cls: "health-md-tooltip-value", text: value });
	});
}

class VizRenderChild extends MarkdownRenderChild {
	private observer: ResizeObserver | null = null;

	setObserver(obs: ResizeObserver): void {
		this.observer = obs;
	}

	onunload(): void {
		this.observer?.disconnect();
	}
}

export async function renderCodeBlock(
	plugin: HealthMdPlugin,
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
): Promise<void> {
	const config = parseConfig(source);
	if (!config.type) {
		el.createEl("p", {
			text: 'Missing type. Example: type: heart-terrain',
			cls: "health-md-error",
		});
		return;
	}

	// Intro stats is HTML-only, no canvas
	if (config.type === "intro-stats") {
		const data = await plugin.dataLoader.load();
		if (!data.length) {
			el.createEl("p", {
				text: `No health data found in ${plugin.settings.dataFolder}/`,
			});
			return;
		}
		const theme = resolveTheme(plugin.settings.theme);
		const container = el.createDiv({ cls: "health-md-container" });
		renderIntroStats(data, container, config, theme);
		return;
	}

	const renderFn = VISUALIZATIONS[config.type];
	if (!renderFn) {
		el.createEl("p", {
			text: `Unknown chart type: ${config.type}`,
			cls: "health-md-error",
		});
		return;
	}

	const data = await plugin.dataLoader.load();
	if (!data.length) {
		el.createEl("p", {
			text: `No health data found in ${plugin.settings.dataFolder}/`,
		});
		return;
	}

	const defaultWidth = config.width ?? plugin.settings.defaultWidth;
	const height = (config.height ?? plugin.settings.defaultHeight) as number;
	const theme = resolveTheme(plugin.settings.theme);

	const container = el.createDiv({ cls: "health-md-container" });
	const canvas = container.createEl("canvas");
	const tooltipEl = container.createDiv({ cls: "health-md-tooltip" });
	tooltipEl.style.display = "none";
	const statsEl = container.createDiv({ cls: "health-md-stats" });

	const regions: HitRegion[] = [];
	const hits: HitRegistry = { add: (r) => regions.push(r) };
	let pinned: HitRegion | null = null;

	function placeTooltip(x: number, y: number): void {
		tooltipEl.style.display = "";
		const tw = tooltipEl.offsetWidth;
		const th = tooltipEl.offsetHeight;
		const cw = container.clientWidth;
		const ch = container.clientHeight;
		let tx = x + 14;
		let ty = y + 14;
		if (tx + tw > cw) tx = x - 14 - tw;
		if (ty + th > ch) ty = y - 14 - th;
		if (tx < 0) tx = 0;
		if (ty < 0) ty = 0;
		tooltipEl.style.left = `${tx}px`;
		tooltipEl.style.top = `${ty}px`;
	}

	canvas.addEventListener("mousemove", (e) => {
		if (pinned) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const region = findRegion(regions, x, y);
		if (region) {
			canvas.style.cursor = "pointer";
			renderTooltipContent(tooltipEl, region);
			placeTooltip(x, y);
		} else {
			canvas.style.cursor = "";
			tooltipEl.style.display = "none";
		}
	});

	canvas.addEventListener("mouseleave", () => {
		if (pinned) return;
		canvas.style.cursor = "";
		tooltipEl.style.display = "none";
	});

	canvas.addEventListener("click", (e) => {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const region = findRegion(regions, x, y);
		if (region) {
			pinned = region;
			renderTooltipContent(tooltipEl, region);
			placeTooltip(x, y);
		} else if (pinned) {
			pinned = null;
			tooltipEl.style.display = "none";
		}
	});

	const renderChild = new VizRenderChild(container);
	ctx.addChild(renderChild);

	function draw(): void {
		const width = Math.min(
			container.clientWidth || defaultWidth,
			defaultWidth
		) as number;
		statsEl.empty();
		regions.length = 0;
		pinned = null;
		tooltipEl.style.display = "none";
		const canvasCtx = setupCanvas(canvas, width, height);
		renderFn(canvasCtx, data, width, height, config, theme, statsEl, hits);
	}

	draw();

	const observer = new ResizeObserver(() => draw());
	observer.observe(container);
	renderChild.setObserver(observer);
}
