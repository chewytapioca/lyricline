import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import type { SearchResult } from '@shared/types';

interface Props {
  onSelect: (result: SearchResult) => void;
}

export function SearchBar({ onSelect }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setQuery(r.name);
    setOpen(false);
    onSelect(r);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1.5px solid var(--border)',
        borderRadius: 999, padding: '7px 16px',
        boxShadow: '0 2px 8px rgba(180,140,160,0.08)',
        transition: 'border-color 0.2s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--pink-light)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ fontSize: 13, color: loading ? 'var(--pink)' : 'var(--ink-muted)', transition: 'color 0.2s' }}>
          {loading ? '○' : '♪'}
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search an artist…"
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.82rem', color: 'var(--ink)', width: '100%',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', border: '1.5px solid var(--border)',
          borderRadius: 14, overflow: 'hidden', zIndex: 20,
          boxShadow: '0 8px 24px rgba(180,140,160,0.15)',
        }}>
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--pink-pale)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: 'var(--pink)', fontWeight: 600, flexShrink: 0,
              }}>
                {r.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink)' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', marginTop: 1 }}>
                  {[r.country, ...r.genres.slice(0, 2)].filter(Boolean).join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}