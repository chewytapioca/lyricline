import { useRef } from 'react';
import { SearchBar } from './components/SearchBar';
import type { SearchResult } from '@shared/types';

const C = {
  bg:      '#f5f0e8',
  bg2:     '#ede6d8',
  card:    '#faf8f3',
  border:  '#d8cfc0',
  ink:     '#3a2e22',
  ink2:    '#7a6a58',
  ink3:    '#b0a090',
  brown:   '#8b6a50',
  brownd:  '#5c3d28',
  brownl:  '#c4a882',
  cream:   '#fdf9f2',
};

interface Props { onArtistSelect: (r: SearchResult) => void; }

function Waveform() {
  const peaks = [4,7,11,5,13,9,4,11,6,14,4,9,12,4,8];
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:16}}>
      {peaks.map((p,i)=>(
        <div key={i} style={{
          width:2.5, height:3, borderRadius:2,
          background: C.brown, opacity:0.5,
          animation:`wv 1.3s ease-in-out ${(i*0.09).toFixed(2)}s infinite`,
          '--pk':`${p}px`,
        } as React.CSSProperties}/>
      ))}
    </div>
  );
}

const KAOMOJI = ['♪(๑ᴖ◡ᴖ)♪','ヾ(＾-＾)ノ♫','(ˊ꒳ˋ)♩','(◕‿◕)♬','♩˚₊·','·˚♫','(*˘︶˘*)♪'];
const FLOATERS = Array.from({length:8},(_,i)=>({
  s: KAOMOJI[i%KAOMOJI.length],
  l: 3+(i*13)%85, b: 5+(i*19)%55,
  d: 5+(i*0.7)%3, delay: i*1.2, sz: 9+(i*2)%5,
}));

const TAGS = ['ateez','bts','exo','iu','loona','stray kids','woodz'];

const FEATURES = [
  { icon:'(ᵔ◡ᵔ)', label:'timeline',     desc:'albums by mood, in order'     },
  { icon:'(´▽`)', label:'sentiment',    desc:'joyful · mellow · dark'        },
  { icon:'(｡◕‿◕)',label:'read-along',   desc:'lyrics scroll with you'        },
  { icon:'(◠‿◠)', label:'multilingual', desc:'k-pop, j-pop, english, mixed'  },
];

export default function LandingPage({ onArtistSelect }: Props) {
  // ref to the SearchBar's hidden input so we can set its value for quick tags
  const searchRef = useRef<{ setQuery: (q: string) => void } | null>(null);

  return (
    <div style={{
      minHeight:'100vh', background:'transparent',
      fontFamily:"'Happy Monkey', cursive",
      color: C.ink,
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'40px 20px',
    }}>

      {/* floating kaomoji notes */}
      <div aria-hidden="true" style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
        {FLOATERS.map((f,i)=>(
          <span key={i} style={{
            position:'absolute', left:`${f.l}%`, bottom:`${f.b}%`,
            fontSize:f.sz, color:C.brownl, opacity:0,
            userSelect:'none', whiteSpace:'nowrap',
            animation:`nr ${f.d}s linear ${f.delay}s infinite`,
          }}>{f.s}</span>
        ))}
      </div>

      {/* main card */}
      <div style={{
        position:'relative', zIndex:1,
        background: C.card,
        border:`1.5px solid ${C.border}`,
        borderRadius:18,
        width:'100%', maxWidth:520,
        boxShadow:'0 4px 24px rgba(90,60,30,0.10), 0 1px 4px rgba(90,60,30,0.07)',
      }}>

        {/* top bar */}
        <div style={{
          background: C.bg2, borderBottom:`1px solid ${C.border}`,
          padding:'10px 18px', borderRadius:'17px 17px 0 0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:700, color:C.brownd, letterSpacing:'-0.01em'}}>
            lyric<span style={{color:C.brown}}>line</span>
          </span>
          <span style={{fontSize:11, color:C.ink3}}>♪ ♩ ♫ ♬</span>
        </div>

        {/* iPod + cd */}
        <div style={{
          background:`linear-gradient(180deg, ${C.bg2} 0%, ${C.cream} 100%)`,
          borderBottom:`1px solid ${C.border}`,
          padding:'28px 20px 20px',
          display:'flex', flexDirection:'column', alignItems:'center',
          position:'relative', overflow:'hidden',
        }}>
          <div aria-hidden="true" style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:`radial-gradient(circle, ${C.brownl}22 1px, transparent 1px)`,
            backgroundSize:'16px 16px',
          }}/>

          <div style={{position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'center', marginBottom:10, zIndex:1}}>
            <div style={{animation:'bob 4s ease-in-out infinite', filter:'drop-shadow(0 8px 20px rgba(90,60,30,0.18))'}}>
              <img src="/music_player.png" alt="kawaii iPod"
                style={{width:160, height:'auto', display:'block'}}
                draggable={false} loading="eager" decoding="sync"
              />
            </div>
            <div style={{
              position:'absolute', bottom:'-8px', right:'-48px',
              animation:'bobcd 5.5s ease-in-out 0.7s infinite',
              filter:'drop-shadow(0 4px 10px rgba(90,60,30,0.2))',
            }}>
              <img src="/cd.png" alt="" aria-hidden="true"
                style={{width:64, height:'auto', opacity:0.92}}
                draggable={false} loading="eager"
              />
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:10.5, color:C.ink3, zIndex:1}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:C.brown,animation:'blink 2s ease-in-out infinite'}}/>
            now playing: your faves &nbsp;♪
          </div>
        </div>

        {/* tagline + feature tags */}
        <div style={{padding:'18px 22px 0', borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:6}}>
            <span style={{fontSize:13, color:C.ink2}}>₊˚ · ✦ &nbsp;</span>
            <p style={{fontSize:13, color:C.ink2, lineHeight:1.6}}>
              search any artist. explore their discography. feel the mood of every verse.
            </p>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:5, paddingBottom:16}}>
            {['♪ timeline','♩ sentiment','♫ read-along','♬ multilingual'].map(t=>(
              <span key={t} style={{
                fontSize:10, padding:'2px 10px', borderRadius:99,
                border:`1px solid ${C.border}`,
                color:C.ink3, background:C.bg2,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* search */}
        <div style={{padding:'18px 22px 16px', borderBottom:`1px solid ${C.border}`}}>
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            background:C.bg2, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'8px 12px', marginBottom:10,
            boxShadow:`inset 0 1px 3px rgba(90,60,30,0.06)`,
          }}>
            <Waveform/>
            <div style={{flex:1}}>
              <SearchBar onSelect={onArtistSelect}/>
            </div>
          </div>

          {/* quick tags — now use data-tag attr and dispatch an input event */}
          <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
            {TAGS.map(t=>(
              <button key={t}
                onClick={async () => {
                  // Search MB for the tag and select top result
                  try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`);
                    const results: SearchResult[] = await res.json();
                    if (results[0]) onArtistSelect(results[0]);
                  } catch {
                    // fallback: pass name only, artist route will handle gracefully
                    onArtistSelect({ id: '', name: t, country: null, genres: [], albumCount: 0, imageUrl: null } as SearchResult);
                  }
                }}
                style={{
                  fontFamily:"'Happy Monkey', cursive",
                  fontSize:10, padding:'3px 10px', borderRadius:99,
                  border:`1px solid ${C.border}`,
                  background:C.cream, color:C.ink2, cursor:'pointer',
                  transition:'all 0.12s',
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background=C.bg2;
                  e.currentTarget.style.borderColor=C.brownl;
                  e.currentTarget.style.color=C.brownd;
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background=C.cream;
                  e.currentTarget.style.borderColor=C.border;
                  e.currentTarget.style.color=C.ink2;
                }}
              >#{t}</button>
            ))}
          </div>
        </div>

        {/* feature rows */}
        <div style={{padding:'14px 22px 18px'}}>
          {FEATURES.map((f,i)=>(
            <div key={f.label} style={{
              display:'flex', alignItems:'center', gap:10,
              paddingTop: i===0?0:10,
              borderTop: i===0?'none':`1px solid ${C.border}`,
              paddingBottom: i===FEATURES.length-1?0:10,
            }}>
              <span style={{fontSize:14, flexShrink:0}}>{f.icon}</span>
              <span style={{fontFamily:"'Space Grotesk', sans-serif", fontSize:11, fontWeight:600, color:C.brownd, width:80, flexShrink:0}}>
                {f.label}
              </span>
              <span style={{fontSize:11, color:C.ink3}}>{f.desc}</span>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{
          background:C.bg2, borderTop:`1px solid ${C.border}`,
          padding:'9px 18px', borderRadius:'0 0 17px 17px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{fontSize:11, color:C.ink2, fontFamily:"'Space Grotesk', sans-serif", fontWeight:600}}>
            ∞ songs analysed
          </span>
          <a href="https://github.com/chewytapioca/lyricline"
            style={{color:C.ink3, textDecoration:'none', fontSize:11, fontFamily:"'Space Grotesk', sans-serif"}}
            onMouseEnter={e=>e.currentTarget.style.color=C.brown}
            onMouseLeave={e=>e.currentTarget.style.color=C.ink3}
          >github ↗</a>
        </div>
      </div>

      <div style={{marginTop:14, fontSize:10.5, color:C.ink3, zIndex:1, fontFamily:"'Happy Monkey', cursive", letterSpacing:'0.04em'}}>
        ( made with ♡ )
      </div>
    </div>
  );
}