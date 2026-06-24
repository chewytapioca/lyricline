import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import type { SearchResult } from '@shared/types';

const C = {
  card:   '#faf8f3',
  bg2:    '#ede6d8',
  border: '#d8cfc0',
  brownl: '#c4a882',
  brownd: '#5c3d28',
  ink2:   '#7a6a58',
  ink3:   '#b0a090',
};

interface Props { onSelect: (result: SearchResult) => void; }

export function SearchBar({ onSelect }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query);
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r: SearchResult) => {
    setQuery(r.name);
    setOpen(false);
    onSelect(r);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>

      {/* input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: `1px solid ${C.border}`,
        borderRadius: 999, padding: '6px 14px',
        boxShadow: 'inset 0 1px 3px rgba(90,60,30,0.05)',
      }}>
        <span style={{ fontSize: 13, color: C.ink3, flexShrink: 0 }}>
          {loading ? '◌' : '♪'}
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="search an artist..."
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: 13, color: C.brownd, outline: 'none',
            fontFamily: "'Happy Monkey', cursive",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.ink3, fontSize: 14, padding: 0, lineHeight: 1,
            }}
          >×</button>
        )}
      </div>

      {/* dropdown — rendered in a portal-like fixed position to escape overflow:hidden */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(90,60,30,0.15)',
          zIndex: 9999,          /* above the card and everything else */
        }}>
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* artist thumbnail */}
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.name}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    objectFit: 'cover', border: `1px solid ${C.border}`,
                    flexShrink: 0,
                  }}
                  onError={e => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: C.bg2, border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: C.brownl,
                }}>♪</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 600, color: C.brownd,
                  fontFamily: "'Space Grotesk', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {r.name}
                </div>
                <div style={{
                  fontSize: 10.5, color: C.ink3,
                  fontFamily: "'Happy Monkey', cursive", marginTop: 1,
                }}>
                  {[r.country, ...r.genres.slice(0, 2)].filter(Boolean).join(' · ')}
                </div>
              </div>

              <span style={{
                fontSize: 10, color: C.ink3, flexShrink: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {r.genres[0] ?? 'artist'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}