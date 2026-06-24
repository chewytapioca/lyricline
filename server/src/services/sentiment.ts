import { env as xenovaEnv, pipeline } from '@huggingface/transformers';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';
import { env } from '../lib/env.js';
import type { LyricChunk, SentimentLabel, SentimentScore } from '../../../shared/types.js';

// ── Model setup ───────────────────────────────────────────────────────────────

xenovaEnv.cacheDir = 'C:/Users/Christina/Downloads/lyricline/lyricline/server/model-cache';
xenovaEnv.useBrowserCache = false;
xenovaEnv.allowRemoteModels = false;

type ScoreItem = { label: string; score: number };
type Pipeline = ReturnType<typeof pipeline> extends Promise<infer T> ? T : never;

let _pipeline: Pipeline | null = null;

async function getPipeline(): Promise<Pipeline> {
  if (_pipeline) return _pipeline;
  console.log('[sentiment] loading model…');
  _pipeline = await pipeline(
    'text-classification',
    'lxyuan/distilbert-base-multilingual-cased-sentiments-student',
    { device: 'cpu' }
  );
  console.log('[sentiment] model ready ✓');
  return _pipeline;
}

// ── Language detection — Unicode range based ──────────────────────────────────
// franc is unreliable for short mixed-language K-pop text.
// Unicode ranges are far more accurate for our use case.

function detectLanguage(text: string): string {
  const korean   = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) ?? []).length;
  const japanese = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) ?? []).length;
  const total    = text.replace(/\s/g, '').length;

  if (total === 0) return 'und';

  const koreanRatio   = korean   / total;
  const japaneseRatio = japanese / total;

  if (koreanRatio > 0.15)   return 'ko';
  if (japaneseRatio > 0.15) return 'ja';

  // Check for significant Korean/Japanese presence even if mixed
  if (korean > 5)   return 'ko';
  if (japanese > 5) return 'ja';

  return 'en'; // default for latin-script text
}

// ── Chunking ──────────────────────────────────────────────────────────────────

function chunkLyrics(raw: string): Array<{ text: string; startLine: number; endLine: number }> {
  const lines = raw.split('\n');
  const chunks: Array<{ text: string; startLine: number; endLine: number }> = [];
  let buffer: string[] = [];
  let startLine = 0;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (buffer.length >= 2) {
        chunks.push({ text: buffer.join('\n'), startLine, endLine: i - 1 });
      }
      buffer = [];
      startLine = i + 1;
    } else {
      buffer.push(trimmed);
      if (buffer.length === 6) {
        chunks.push({ text: buffer.join('\n'), startLine, endLine: i });
        buffer = [];
        startLine = i + 1;
      }
    }
  });

  if (buffer.length >= 1) {
    chunks.push({ text: buffer.join('\n'), startLine, endLine: lines.length - 1 });
  }

  return chunks.filter(c => c.text.length > 10);
}

// ── Calibration ───────────────────────────────────────────────────────────────
// Model over-predicts negative for emotional/poetic lyrics.
// Thresholds tuned for K-pop score distributions.

function calibrate(items: ScoreItem[]): { label: SentimentLabel; score: number } {
  const neg = items.find(i => i.label.toLowerCase() === 'negative')?.score ?? 0;
  const pos = items.find(i => i.label.toLowerCase() === 'positive')?.score ?? 0;

  if (pos >= 0.08)  return { label: 'positive', score: pos };
  if (neg > 0.97)   return { label: 'negative', score: neg };
  return { label: 'neutral', score: 0.5 };
}

function extractBest(raw: unknown): { label: SentimentLabel; score: number } {
  let items: ScoreItem[] = [];

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (Array.isArray(first)) {
      items = first as ScoreItem[];
    } else if (typeof first === 'object' && first !== null && 'label' in first) {
      items = raw as ScoreItem[];
    }
  }

  if (!items.length) return { label: 'neutral', score: 0.5 };
  return calibrate(items);
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export function aggregateSentiment(chunks: LyricChunk[]): SentimentScore {
  if (!chunks.length) return { label: 'neutral', score: 0.5 };

  let pos = 0, neu = 0, neg = 0;
  for (const c of chunks) {
    if (c.sentiment.label === 'positive') pos += c.sentiment.score;
    else if (c.sentiment.label === 'negative') neg += c.sentiment.score;
    else neu += c.sentiment.score;
  }

  const total = pos + neu + neg;
  const scores: [SentimentLabel, number][] = [
    ['positive', pos / total],
    ['neutral',  neu / total],
    ['negative', neg / total],
  ];

  const [label, score] = scores.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { label, score };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function analyseLyrics(
  songMbid: string,
  rawLyrics: string,
): Promise<LyricChunk[]> {
  const cacheKey = CacheKey.songSentiment(songMbid);
  const cached = await cacheGet<LyricChunk[]>(cacheKey);
  if (cached) return cached;

  const pipe = await getPipeline();
  const raw  = chunkLyrics(rawLyrics);

  const chunks: LyricChunk[] = await Promise.all(
    raw.map(async (c) => {
      const output = await (pipe as any)(c.text, { top_k: 3 });
      const sentiment = extractBest(output);
      const language  = detectLanguage(c.text);

      return {
        text: c.text,
        language,
        sentiment,
        startLine: c.startLine,
        endLine:   c.endLine,
      } satisfies LyricChunk;
    })
  );

  await cacheSet(cacheKey, chunks, env.SENT_CACHE_TTL_MS);
  return chunks;
}