import type { SongDetail } from '@shared/types';

const C = {
  card:   '#faf8f3',
  bg2:    '#ede6d8',
  border: '#d8cfc0',
  brownl: '#c4a882',
  brownd: '#5c3d28',
  brown:  '#8b6a50',
  ink2:   '#7a6a58',
  ink3:   '#b0a090',
  cream:  '#fdf9f2',
};

const MOOD_COLOR: Record<string, string> = {
  positive: '#a8c8a0',
  neutral:  '#c8b890',
  negative: '#b0a0c8',
};
const MOOD_BG: Record<string, string> = {
  positive: '#f0f7ee',
  neutral:  '#faf6ee',
  negative: '#f2f0f8',
};
const MOOD_WORD: Record<string, string> = {
  positive: 'joyful',
  neutral:  'mellow',
  negative: 'dark',
};
const LANG_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
};

// server returns either chunk.lines[] or chunk.text string — handle both
function getLines(chunk: any): string[] {
  if (Array.isArray(chunk?.lines)) return chunk.lines;
  if (typeof chunk?.text === 'string') return chunk.text.split('\n');
  return [];
}

// server returns either sentiment.confidence or sentiment.score
function getConfidence(sentiment: any): number {
  if (typeof sentiment?.confidence === 'number') return sentiment.confidence;
  if (typeof sentiment?.score === 'number') return sentiment.score;
  return 0;
}

interface Props {
  song: SongDetail;
  artistName: string;
  onClose: () => void;
}

export function SongDetail({ song, artistName, onClose }: Props) {
  const overall   = song.sentiment;
  const chunks    = (song.chunks ?? []) as any[];
  const languages = song.languages ?? [];

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
      fontFamily: "'Happy Monkey', cursive",
    }}>

      {/* header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: C.brownd, marginBottom: 4 }}>
              {song.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <span style={{ fontSize: 11, color: C.ink2 }}>{artistName}</span>
              {languages.map((l: string) => (
                <span key={l} style={{
                  fontSize: 9.5, padding: '1px 7px', borderRadius: 99,
                  background: C.bg2, border: `1px solid ${C.border}`, color: C.ink3,
                }}>
                  {LANG_NAMES[l] ?? l}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: C.bg2, border: `1px solid ${C.border}`,
            borderRadius: 99, padding: '3px 10px',
            fontSize: 10.5, color: C.ink2, cursor: 'pointer',
            fontFamily: "'Happy Monkey', cursive", flexShrink: 0,
          }}>close</button>
        </div>

        {/* overall mood */}
        {overall && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, padding: '3px 12px', borderRadius: 99,
              background: `${MOOD_COLOR[overall.label]}22`,
              border: `1px solid ${MOOD_COLOR[overall.label]}55`,
              color: MOOD_COLOR[overall.label],
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            }}>
              overall {MOOD_WORD[overall.label]} · {Math.round(getConfidence(overall) * 100)}% confidence
            </span>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${artistName}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 10.5, padding: '3px 12px', borderRadius: 99,
                background: C.bg2, border: `1px solid ${C.border}`, color: C.ink2,
                textDecoration: 'none',
              }}
            >find on youtube ↗</a>
          </div>
        )}

        {/* mood counts */}
        {chunks.length > 0 && (() => {
          const counts: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
          chunks.forEach((c: any) => {
            const label = c?.sentiment?.label;
            if (label && label in counts) counts[label]++;
          });
          return (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {(['positive', 'neutral', 'negative'] as const).map(k => (
                <div key={k} style={{
                  flex: 1, textAlign: 'center', padding: '8px 6px',
                  background: MOOD_BG[k], border: `1px solid ${MOOD_COLOR[k]}44`,
                  borderRadius: 8,
                }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: MOOD_COLOR[k] }}>
                    {counts[k]}
                  </div>
                  <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>{MOOD_WORD[k]}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* lyrics */}
      <div style={{ padding: '12px 16px', maxHeight: 480, overflowY: 'auto' }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: C.ink3, marginBottom: 10,
        }}>
          lyrics · verse by verse
        </div>

        {chunks.length === 0 && (
          <div style={{ fontSize: 12, color: C.ink3 }}>no lyrics found</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chunks.map((chunk: any, i: number) => {
            const lines = getLines(chunk);
            const label = chunk?.sentiment?.label ?? 'neutral';
            const conf  = getConfidence(chunk?.sentiment);
            return (
              <div key={i} style={{
                borderLeft: `3px solid ${MOOD_COLOR[label] ?? '#c8b890'}66`,
                paddingLeft: 12,
              }}>
                <div style={{ marginBottom: 6 }}>
                  {lines.map((line: string, li: number) => (
                    <div key={li} style={{
                      fontSize: 12.5, lineHeight: 1.7,
                      color: line.trim() === '' ? 'transparent' : C.brownd,
                      minHeight: line.trim() === '' ? '0.5em' : undefined,
                      fontFamily: "'Happy Monkey', cursive",
                    }}>
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: `${MOOD_COLOR[label] ?? '#c8b890'}44` }} />
                  <span style={{ fontSize: 9.5, color: C.ink3, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {MOOD_WORD[label] ?? label} {Math.round(conf * 100)}%
                  </span>
                  <span style={{ fontSize: 9.5, color: C.ink3, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {LANG_NAMES[chunk?.language] ?? chunk?.language ?? ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}