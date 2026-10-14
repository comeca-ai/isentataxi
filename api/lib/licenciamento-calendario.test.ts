import { describe, it, expect } from "vitest";
import { LICENCIAMENTO_2026, MONTH_LABEL, MONTH_NUM } from "@contracts/constants";

describe("calendário de licenciamento", () => {
  it("todo mês usado em LICENCIAMENTO_2026.calendario tem número e rótulo", () => {
    for (const [digit, mes] of Object.entries(LICENCIAMENTO_2026.calendario)) {
      expect(MONTH_NUM[mes], `número do mês "${mes}" (final ${digit})`).toBeGreaterThanOrEqual(1);
      expect(MONTH_NUM[mes]).toBeLessThanOrEqual(12);
      expect(MONTH_LABEL[mes], `rótulo do mês "${mes}" (final ${digit})`).toBeTruthy();
    }
  });

  it("cobre os 12 meses com números únicos de 1 a 12", () => {
    expect(Object.keys(MONTH_NUM)).toHaveLength(12);
    expect(Object.keys(MONTH_LABEL)).toHaveLength(12);
    expect(Object.values(MONTH_NUM).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("placas finais 1 a 6 (jan–jun) resolvem para mês válido", () => {
    for (const d of [1, 2, 3, 4, 5, 6]) {
      const mes = LICENCIAMENTO_2026.calendario[d];
      expect(MONTH_NUM[mes]).toBe(d);
    }
  });
});
