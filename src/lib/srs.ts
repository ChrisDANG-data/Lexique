/**
 * Simplified SM-2 (Anki-style) scheduling.
 * quality: 0 = fail, 5 = pass (exact match).
 */
export type SrsState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type SrsUpdate = SrsState & {
  dueAt: Date;
  isFailed: boolean;
  failCountDelta: number;
  lastResult: "PASS" | "FAIL";
};

export function applySrs(state: SrsState, passed: boolean, now = new Date()): SrsUpdate {
  if (!passed) {
    return {
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      dueAt: now,
      isFailed: true,
      failCountDelta: 1,
      lastResult: "FAIL",
    };
  }

  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 3;
  else intervalDays = Math.max(1, Math.round(state.intervalDays * state.easeFactor));

  const easeFactor = Math.min(3.0, state.easeFactor + 0.1);
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt,
    isFailed: false,
    failCountDelta: 0,
    lastResult: "PASS",
  };
}
