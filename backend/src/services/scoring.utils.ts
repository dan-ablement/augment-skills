import { query } from '../config/database.config';

// ── Types ──────────────────────────────────────────────────────────────

export type ScoringMode = 'average' | 'team_readiness' | 'coverage';
export type NotAssessedHandling = 'exclude' | 'count_as_zero';

// ── Scoring Functions ──────────────────────────────────────────────────

/**
 * Compute the p-th percentile (0-100) using linear interpolation.
 */
export function percentile(values: number[], p: number): number {
  const vals = [...values].sort((a, b) => a - b);
  if (vals.length === 1) return vals[0];
  const rank = (p / 100) * (vals.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return vals[lower];
  return vals[lower] + (vals[upper] - vals[lower]) * (rank - lower);
}

/**
 * Compute a score from an array of numeric scores using the given scoring mode.
 * Returns null for empty arrays. Rounds to 1 decimal place.
 *
 * Algorithms:
 *   - average: arithmetic mean
 *   - team_readiness: 25th percentile (linear interpolation)
 *   - coverage: percentage of scores >= 70
 */
export function computeScore(scores: number[], scoringMode: ScoringMode): number | null {
  if (scores.length === 0) return null;

  let score: number;
  switch (scoringMode) {
    case 'team_readiness':
      score = percentile(scores, 25);
      break;
    case 'coverage':
      score = (scores.filter((s) => s >= 70).length / scores.length) * 100;
      break;
    case 'average':
    default:
      score = scores.reduce((a, b) => a + b, 0) / scores.length;
      break;
  }

  return Math.round(score * 10) / 10; // 1 decimal place
}

// ── Settings ───────────────────────────────────────────────────────────

/**
 * Read the default not_assessed handling from the app_settings table.
 * Falls back to 'exclude' if the setting is not found or the table doesn't exist.
 */
export async function getDefaultNotAssessed(): Promise<NotAssessedHandling> {
  try {
    const result = await query(
      `SELECT value FROM app_settings WHERE key = 'not_assessed_handling'`,
    );
    if (result.rows.length > 0) {
      const val = result.rows[0].value;
      if (val?.mode === 'count_as_zero') return 'count_as_zero';
    }
  } catch {
    // Table may not exist yet — fall back to default
  }
  return 'exclude';
}

