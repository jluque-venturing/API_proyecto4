export const ACIERTOS_PARA_DOMINAR = 3;

export interface IntentoResumido {
  isCorrect: boolean;
  responseTimeMs: number;
  shortcutId: string;
}

export interface Resumen {
  totalAttempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgResponseTimeMs: number;
  bestStreak: number;
  currentStreak: number;
  mastered: number;
}

export function accuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function promedio(tiempos: number[]): number {
  if (tiempos.length === 0) return 0;
  const suma = tiempos.reduce((acc, ms) => acc + ms, 0);
  return Math.round(suma / tiempos.length);
}

// Los intentos deben venir del mas viejo al mas nuevo o las rachas salen al reves.
export function resumir(intentos: IntentoResumido[]): Resumen {
  const tiempos: number[] = [];
  const aciertosPorAtajo = new Map<string, number>();
  let correct = 0;
  let bestStreak = 0;
  let currentStreak = 0;

  for (const intento of intentos) {
    if (!intento.isCorrect) {
      currentStreak = 0;
      continue;
    }
    correct++;
    currentStreak++;
    if (currentStreak > bestStreak) bestStreak = currentStreak;
    tiempos.push(intento.responseTimeMs);
    aciertosPorAtajo.set(
      intento.shortcutId,
      (aciertosPorAtajo.get(intento.shortcutId) ?? 0) + 1,
    );
  }

  const mastered = [...aciertosPorAtajo.values()].filter(
    (aciertos) => aciertos >= ACIERTOS_PARA_DOMINAR,
  ).length;

  return {
    totalAttempts: intentos.length,
    correct,
    wrong: intentos.length - correct,
    accuracy: accuracy(correct, intentos.length),
    avgResponseTimeMs: promedio(tiempos),
    bestStreak,
    currentStreak,
    mastered,
  };
}
