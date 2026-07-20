// utils/fluidScale.ts
export function fluidScale(
  scale: number,
  options?: { baseMin?: number; baseMax?: number; vwFactor?: number },
): string {
  const baseMin = options?.baseMin ?? 1; // rem mínimo base
  const baseMax = options?.baseMax ?? 1.6; // rem máximo base
  const vwFactor = options?.vwFactor ?? 1; // fator de crescimento fluido (1vw padrão)

  // Segurança: evita valores absurdos ou negativos
  const safeScale = Math.max(0.5, Math.min(scale, 5));

  const min = (baseMin * safeScale).toFixed(3);
  const max = (baseMax * safeScale).toFixed(3);
  const vw = (vwFactor * safeScale).toFixed(3);

  return `clamp(${min}rem, ${vw}vw + ${min}rem, ${max}rem)`;
}
