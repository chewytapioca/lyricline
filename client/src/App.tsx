import { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { Timeline } from './components/Timeline';
import { SongDetail } from './components/SongDetail';
import { useArtist } from './hooks/useArtist';
import { useSong } from './hooks/useSong';
import type { SearchResult } from '@shared/types';

export default function App() {
  const [selectedArtist, setSelectedArtist] = useState<SearchResult | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const { artist, loading: artistLoading, error: artistError } = useArtist(selectedArtist?.id ?? null);
  const { song, loading: songLoading, error: songError, fetch: fetchSong, clear: clearSong } = useSong();

  const handleArtistSelect = (result: SearchResult) => {
    setSelectedArtist(result);
    setSelectedSongId(null);
    clearSong();
  };

  const handleSongClick = (songMbid: string, title: string) => {
    if (!selectedArtist) return;
    setSelectedSongId(songMbid);
    void fetchSong(songMbid, title, selectedArtist.name);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font)' }}>

      {/* Nav */}
      <header style={{
        borderBottom: '1.5px solid var(--border)',
        padding: '0.9rem 2rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        position: 'sticky', top: 0,
        background: 'rgba(255,248,252,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 10,
      }}>
        <div
          onClick={() => { setSelectedArtist(null); clearSong(); }}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{
            fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}>
            lyricline
          </span>
        </div>
        <div style={{ flex: 1, maxWidth: 400 }}>
          <SearchBar onSelect={handleArtistSelect} />
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        {!selectedArtist && (
          <div style={{ textAlign: 'center', paddingTop: '6rem', color: 'var(--ink-muted)' }}>
            <div style={{
              display: 'inline-block',
              width: 64, height: 64,
              background: 'var(--pink-pale)',
              border: '2px solid var(--border)',
              borderRadius: '50%',
              lineHeight: '64px',
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: 'var(--pink)',
            }}>
              ♪
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              search an artist to explore their lyric timeline
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              works with K-pop, J-pop, English, and mixed-language artists
            </p>
          </div>
        )}

        {selectedArtist && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div>
              {artistLoading && <LoadingState label="loading discography…" />}
              {artistError  && <ErrorState message={artistError.message} />}
              {artist && (
                <Timeline
                  artist={artist}
                  selectedSongId={selectedSongId}
                  onSongClick={handleSongClick}
                />
              )}
            </div>
            <div>
              {songLoading && <LoadingState label="fetching lyrics & analysing mood…" />}
              {songError   && <ErrorState message={songError} />}
              {song && !songLoading && (
                <SongDetail
                  song={song}
                  artistName={selectedArtist.name}
                  onClose={clearSong}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div style={{
      padding: '2.5rem', textAlign: 'center',
      background: 'white', borderRadius: 16,
      border: '1.5px solid var(--border)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--pink)',
        margin: '0 auto 0.75rem',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: '#FEF2F2', borderRadius: 12,
      border: '1px solid #FECACA',
      color: '#991B1B', fontSize: '0.82rem',
    }}>
      {message}
    </div>
  );
}