import data from './experience.json' with { type: 'json' };

export function experienceThresholds(dex, level) {
  if (!Number.isInteger(dex) || !Number.isInteger(level) || level < 1 || level >= 100) return null;
  const rate = data.rates[data.species[dex]];
  return rate ? { current: rate[level], next: rate[level + 1] } : null;
}

export function experienceProgress(dex, level, total) {
  const thresholds = experienceThresholds(dex, level);
  // During a level transition, mapper fields may briefly describe different levels.
  if (!thresholds || !Number.isInteger(total) || total < thresholds.current || total >= thresholds.next) return null;
  return { value: total - thresholds.current, max: thresholds.next - thresholds.current };
}
