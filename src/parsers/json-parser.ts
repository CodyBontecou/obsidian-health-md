import { HealthDay } from "../types";

export function parseJSON(content: string): HealthDay | null {
	try {
		const parsed = JSON.parse(content);
		if (parsed.type === "health-data" && parsed.date) return parsed;
		return null;
	} catch {
		return null;
	}
}
