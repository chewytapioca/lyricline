import { useState, useEffect, useRef } from 'react';
import type { SongDetail as SongDetailType, LyricChunk } from '@shared/types';

const LANG_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', ja: '日本語',
  zh: '中文',  es: 'Español', fr: 'Français',
};

const SENTIMENT_COLOR: Record<string, string> = {
  positive: '#7CB98F',
  neutral:  '#C4A882',
  negative: '#9B8EC4',
};

const SENTIMENT_BG: Record<string, string> = {
  positive: '#EDF7F0',
  neutral:  '#FBF5EC',
  negative: '#F0EDF9',
};

const SENTIMENT_TEXT: Record<string, string> = {
  positive: '#3A7A52',
  neutral:  '#8B6940',
  negative: '#5C4E8F',
};

const SENTIMENT_WORD: Record<string, string> = {
  positive: 'joyful',
  neutral:  'mellow',
  negative: 'dark',
};

const SENTIMENT_BAR: Record<string, string> = {
  positive: 'linear-gradient(90deg, #A8D5B5, #7CB98F)',
  neutral:  'linear-gradient(90deg, #E2C9A0, #C4A882)',
  negative: 'linear-gradient(90deg, #C4B8E8, #9B8EC4)',
};

interface Props {
  song:       SongDetailType;
  artistName: string;
  onClose:    () => void;
}

export function SongDetail({ song, artistName, onClose }: Props) {
  const [activeChunk, setActiveChunk] = useState<number | null>(null);
  const [playing,     setPlaying]     = useState(false);
  const [searchUrl,   setSearchUrl]   = useState<string | null>(null);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkRefs                     = useRef<(HTMLDivElement | null)[]>([]);

  const mood = song.sentiment?.label ?? 'neutral';

  const breakdown = {
    positive: song.chunks.filter(c => c.sentiment.label === 'positive').length,
    neutral:  song.chunks.filter(c => c.sentiment.label === 'neutral').length,
    negative: song.chunks.filter(c => c.sentiment.label === 'negative').length,
  };

  useEffect(() => {
    const q = encodeURIComponent(`${artistName} ${song.title} official`);
    setSearchUrl(`https://www.youtube.com/results?search_query=${q}`);
  }, [song.title, artistName]);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let idx = activeChunk ?? 0;
    setActiveChunk(idx);

    intervalRef.current = setInterval(() => {
      idx += 1;
      if (idx >= song.chunks.length) {
        setPlaying(false);
        setActiveChunk(null);
        clearInterval(intervalRef.current!);
        return;
      }
      setActiveChunk(idx);
      chunkRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 3500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      setActiveChunk(null);
    } else {
      setActiveChunk(0);
      setPlaying(true);
      chunkRefs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const allLanguages = [...new Set(song.chunks.map(c => c.language).filter(l => l && l !== 'und'))];

  return (
    <div style={{
      background: 'var(--card)',
      border: '1.5px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'sticky',
      top: 80,
      boxShadow: '0 4px 24px rgba(180,140,160,0.10)',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '1rem', fontWeight: 600, color: 'var(--ink)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {song.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {artistName}
              {allLanguages.map(l => (
                <span key={l} style={{
                  background: '#EEEDFE', color: '#534AB7',
                  borderRadius: 999, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 500,
                }}>
                  {LANG_NAMES[l] ?? l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 999, cursor: 'pointer', color: 'var(--ink-muted)',
            fontSize: '0.7rem', padding: '3px 10px', marginLeft: 8, flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--pink-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            close
          </button>
        </div>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: SENTIMENT_BG[mood], color: SENTIMENT_TEXT[mood],
            borderRadius: 999, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 500,
          }}>
            overall {SENTIMENT_WORD[mood]} · {Math.round((song.sentiment?.score ?? 0) * 100)}% confidence
          </div>
          {searchUrl && (
            <a
              href={searchUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 999, padding: '4px 12px',
                fontSize: '0.7rem', color: 'var(--ink-muted)',
                textDecoration: 'none', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-light)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              find on youtube
            </a>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'white' }}>
        {(['positive', 'neutral', 'negative'] as const).map(label => (
          <div key={label} style={{
            background: SENTIMENT_BG[label],
            borderRadius: 12, padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: SENTIMENT_COLOR[label] }}>
              {breakdown[label]}
            </div>
            <div style={{ fontSize: '0.65rem', color: SENTIMENT_TEXT[label], marginTop: 2 }}>
              {SENTIMENT_WORD[label]}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={togglePlay}
          style={{
            padding: '6px 18px',
            background: playing ? 'var(--border)' : 'var(--pink)',
            color: 'white', border: 'none', borderRadius: 999,
            fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.05em', transition: 'all 0.2s',
          }}
        >
          {playing ? 'stop' : 'read along'}
        </button>
        <span style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
          {playing
            ? `verse ${(activeChunk ?? 0) + 1} of ${song.chunks.length}`
            : 'highlights verses as you read'}
        </span>
      </div>

      {/* Lyrics */}
      <div style={{ padding: '12px 16px', maxHeight: '52vh', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          lyrics · verse by verse
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {song.chunks.map((chunk, i) => (
            <LyricChunkCard
              key={i}
              chunk={chunk}
              isActive={activeChunk === i}
              setRef={(el) => { chunkRefs.current[i] = el; }}
              onClick={() => setActiveChunk(activeChunk === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LyricChunkCard ────────────────────────────────────────────────────────────

interface ChunkProps {
  chunk:    LyricChunk;
  isActive: boolean;
  setRef:   (el: HTMLDivElement | null) => void;
  onClick:  () => void;
}

function LyricChunkCard({ chunk, isActive, setRef, onClick }: ChunkProps) {
  const { label, score } = chunk.sentiment;
  const lang = chunk.language && chunk.language !== 'und'
    ? (LANG_NAMES[chunk.language] ?? chunk.language.toUpperCase())
    : null;

  return (
    <div
      ref={setRef}
      onClick={onClick}
      style={{
        borderLeft: `3px solid ${isActive ? SENTIMENT_COLOR[label] : 'var(--border)'}`,
        paddingLeft: 12, paddingTop: 6, paddingBottom: 6,
        background: isActive ? SENTIMENT_BG[label] : 'transparent',
        borderRadius: '0 10px 10px 0',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
    >
      <pre style={{
        fontFamily: 'inherit', fontSize: '0.8rem',
        color: 'var(--ink)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
        margin: 0,
      }}>
        {chunk.text}
      </pre>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <div style={{ width: 40, height: 3, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(score * 100)}%`, background: SENTIMENT_BAR[label], borderRadius: 999 }} />
        </div>
        <span style={{
          fontSize: '0.62rem', color: SENTIMENT_TEXT[label],
          background: SENTIMENT_BG[label], borderRadius: 999, padding: '1px 7px',
        }}>
          {SENTIMENT_WORD[label]}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--ink-muted)' }}>
          {Math.round(score * 100)}%
        </span>
        {lang && (
          <span style={{ fontSize: '0.62rem', color: 'var(--ink-muted)', marginLeft: 'auto' }}>
            {lang}
          </span>
        )}
      </div>
    </div>
  );
}