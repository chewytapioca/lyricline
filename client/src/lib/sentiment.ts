import type { SentimentLabel, Album } from '@shared/types';

// ── Colours (CSS custom property values) ─────────────────────────────────────

export const SENTIMENT_COLOR: Record<SentimentLabel, string> = {
  positive: '#639922',
  neutral:  '#BA7517',
  negative: '#7F77DD',
};

export const SENTIMENT_BG: Record<SentimentLabel, string> = {
  positive: '#EAF3DE',
  neutral:  '#FAEEDA',
  negative: '#EEEDFE',
};

export const SENTIMENT_TEXT: Record<SentimentLabel, string> = {
  positive: '#3B6D11',
  neutral:  '#854F0B',
  negative: '#534AB7',
};

export const SENTIMENT_DOT: Record<SentimentLabel, string> = {
  positive: '#C0DD97',
  neutral:  '#FAC775',
  negative: '#AFA9EC',
};

// ── Labels ────────────────────────────────────────────────────────────────────

export const SENTIMENT_EMOJI: Record<SentimentLabel, string> = {
  positive: '✿',
  neutral:  '◇',
  negative: '◈',
};

export const SENTIMENT_WORD: Record<SentimentLabel, string> = {
  positive: 'joyful',
  neutral:  'mellow',
  negative: 'dark',
};

/** Human-readable mood summary for an album. */
export function albumMoodSummary(album: Album): string {
  if (!album.sentimentBreakdown) return 'not yet analysed';

  const { positive, neutral, negative } = album.sentimentBreakdown;
  const pct = (n: number) => Math.round(n * 100);

  if (positive > 0.6) return `${pct(positive)}% joyful`;
  if (negative > 0.5) return `${pct(negative)}% dark`;
  if (positive > negative) return `mostly uplifting with some melancholy`;
  if (negative > positive) return `mostly bittersweet`;
  return `balanced mood`;
}

/** Bar fill width (0–100) from a sentiment score fraction. */
export function sentimentBarWidth(score: number): number {
  return Math.round(Math.min(Math.max(score, 0), 1) * 100);
}
