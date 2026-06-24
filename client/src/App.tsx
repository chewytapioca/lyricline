import { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { Timeline } from './components/Timeline';
import { SongDetail } from './components/SongDetail';
import { useArtist } from './hooks/useArtist';
import { useSong } from './hooks/useSong';
import LandingPage from './LandingPage';
import type { SearchResult } from '@shared/types';

const C = {
  bg:'#f5f0e8', card:'#faf8f3', bg2:'#ede6d8',
  border:'#d8cfc0', ink:'#3a2e22', ink2:'#7a6a58',
  ink3:'#b0a090', brown:'#8b6a50', brownd:'#5c3d28', brownl:'#c4a882',
};

export default function App() {
  const [selectedArtist, setSelectedArtist] = useState<SearchResult | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const { artist, loading: artistLoading, error: artistError } =
    useArtist(selectedArtist?.id ?? null, selectedArtist?.name ?? null);
  const { song, loading: songLoading, error: songError, fetch: fetchSong, clear: clearSong } = useSong();

  const handleArtistSelect = (r: SearchResult) => { setSelectedArtist(r); setSelectedSongId(null); clearSong(); };
  const handleSongClick = (mbid: string, title: string) => {
    if (!selectedArtist) return;
    setSelectedSongId(mbid);
    void fetchSong(mbid, title, selectedArtist.name);
  };
  const handleLogoClick = () => { setSelectedArtist(null); clearSong(); };

  return (
    <div style={{minHeight:'100vh', background:C.bg, color:C.ink}}>

      {selectedArtist && (
        <header style={{
          height:48, padding:'0 20px',
          display:'flex', alignItems:'center', gap:14,
          borderBottom:`1px solid ${C.border}`,
          background:`${C.bg}ee`, backdropFilter:'blur(10px)',
          position:'sticky', top:0, zIndex:10,
        }}>
          <button onClick={handleLogoClick} style={{background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0}}>
            <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:C.brownd,letterSpacing:'-0.02em'}}>
              lyric<span style={{color:C.brown}}>line</span>
            </span>
          </button>
          <div style={{flex:1, maxWidth:360}}>
            <SearchBar onSelect={handleArtistSelect}/>
          </div>
          <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:99,border:`1px solid ${C.border}`,color:C.ink2,background:C.card,whiteSpace:'nowrap'}}>
            {selectedArtist.name}
          </span>
        </header>
      )}

      {!selectedArtist && <LandingPage onArtistSelect={handleArtistSelect}/>}

      {selectedArtist && (
        <main style={{padding:'1.5rem', maxWidth:1100, margin:'0 auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', alignItems:'start'}}>
            <div>
              {artistLoading && <Skeleton/>}
              {artistError   && <Err msg={artistError.message}/>}
              {artist && <Timeline artist={artist} selectedSongId={selectedSongId} onSongClick={handleSongClick}/>}
            </div>
            <div>
              {songLoading && <Spinner label="fetching lyrics and analysing mood ♪"/>}
              {songError   && <Err msg={songError}/>}
              {song && !songLoading && <SongDetail song={song} artistName={selectedArtist.name} onClose={clearSong}/>}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function Skeleton() {
  const rows = [140, 90, 110, 80, 100];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {rows.map((h,i) => (
        <div key={i} style={{
          height:h, borderRadius:10, background:C.card,
          border:`1px solid ${C.border}`,
          animation:'pulse 1.5s ease-in-out infinite',
          animationDelay:`${i*0.1}s`,
        }}/>
      ))}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{padding:'2rem',textAlign:'center',background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>
      <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${C.border}`,borderTopColor:C.brown,margin:'0 auto 0.6rem',animation:'spin 0.9s linear infinite'}}/>
      <p style={{fontFamily:"'Happy Monkey',cursive",fontSize:11,color:C.ink2,margin:0}}>{label}</p>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div style={{padding:'0.75rem 1rem',borderRadius:8,border:`1px solid #e8d0c0`,background:'#fdf0e8',fontFamily:"'Happy Monkey',cursive",fontSize:11.5,color:'#7a3a20'}}>
      {msg}
    </div>
  );
}