# lyricline

Explore an artist's full discography as a visual timeline with multilingual sentiment analysis. Works with K-pop, J-pop, English, and mixed-language artists.

---

## what it does

Search any artist → browse their albums on a timeline → click a song to fetch lyrics and run sentiment analysis verse by verse. Hit "read along" to scroll through the lyrics automatically with each verse highlighted as you go.

- Timeline view with per-album mood bars (joyful / mellow / dark)
- Per-verse sentiment with confidence scores
- Multilingual support — Korean, Japanese, English, mixed lyrics all work natively
- Language detection via Unicode range analysis (accurate for K-pop mixed text)
- "Find on YouTube" link per song
- Read-along mode that steps through verses automatically
- In-memory caching so repeat visits are instant

---

## stack

| layer | tech |
|---|---|
| server | Node.js · Express · TypeScript |
| sentiment | `@huggingface/transformers` — runs fully locally, no API |
| lyrics | Genius API (search) + Cheerio (scrape) |
| discography | MusicBrainz API (free, no key needed) |
| cache | in-memory Map (swap for Redis/Upstash in prod) |
| client | React · Vite · TypeScript · SWR |

---

## setup

### prerequisites
- Node.js 20+
- Free [Genius API token](https://genius.com/api-clients) — Client Access Token only, no OAuth needed

### model setup (one time)

The sentiment model runs locally. Download the files into `server/model-cache/lxyuan/distilbert-base-multilingual-cased-sentiments-student/`:

```powershell
# PowerShell — replace with your HuggingFace token
$token = "hf_your_token_here"
$headers = @{ Authorization = "Bearer $token" }
$base = "https://huggingface.co/lxyuan/distilbert-base-multilingual-cased-sentiments-student/resolve/main"
$out = "server\model-cache\lxyuan\distilbert-base-multilingual-cased-sentiments-student"

New-Item -ItemType Directory -Force -Path "$out\onnx"

Invoke-WebRequest -Uri "$base/config.json"           -OutFile "$out\config.json"           -Headers $headers
Invoke-WebRequest -Uri "$base/tokenizer.json"        -OutFile "$out\tokenizer.json"        -Headers $headers
Invoke-WebRequest -Uri "$base/tokenizer_config.json" -OutFile "$out\tokenizer_config.json" -Headers $headers
Invoke-WebRequest -Uri "$base/vocab.txt"             -OutFile "$out\vocab.txt"             -Headers $headers
Invoke-WebRequest -Uri "$base/special_tokens_map.json" -OutFile "$out\special_tokens_map.json" -Headers $headers
Invoke-WebRequest -Uri "$base/onnx/config.json"     -OutFile "$out\onnx\config.json"      -Headers $headers
Invoke-WebRequest -Uri "$base/onnx/model.onnx"      -OutFile "$out\onnx\model.onnx"       -Headers $headers
```

The last file is ~541MB — takes a few minutes.

### install & run

```bash
git clone https://github.com/you/lyricline
cd lyricline

cp .env.example .env
# add your GENIUS_TOKEN to .env

cd server && npm install
cd ../client && npm install

# terminal 1 — server
cd server && npm run dev

# terminal 2 — client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

First sentiment analysis per song takes ~5–10 seconds (model loads once, then stays warm). Results are cached in memory for the session.

---

## project structure

```
lyricline/
  shared/
    types.ts                      ← shared TypeScript types
  server/
    src/
      index.ts                    ← Express app entry
      lib/env.ts                  ← Zod env validation
      routes/
        search.ts                 ← GET /api/search?q=
        artist.ts                 ← GET /api/artist/:mbid
        album.ts                  ← GET /api/album/:mbid
        song.ts                   ← GET /api/song/:mbid?title=&artist=
      services/
        musicbrainz.ts            ← discography data
        genius.ts                 ← lyric scraping
        sentiment.ts              ← local ML sentiment pipeline
      cache/
        redis.ts                  ← in-memory Map cache
      middleware/
        errorHandler.ts
        requestLogger.ts
    model-cache/                  ← local ONNX model files (gitignored)
  client/
    src/
      App.tsx                     ← root layout
      components/
        SearchBar.tsx             ← debounced artist search
        Timeline.tsx              ← album timeline
        SongDetail.tsx            ← lyric viewer + read-along
      hooks/
        useArtist.ts              ← SWR artist data
        useSong.ts                ← lazy sentiment loader
      lib/
        api.ts                    ← typed fetch wrapper
        sentiment.ts              ← colour/label utilities
```

---

## multilingual support

Sentiment uses `lxyuan/distilbert-base-multilingual-cased-sentiments-student` — a multilingual DistilBERT model trained across 12 languages. Language detection uses Unicode range analysis rather than a language detection library, which is far more accurate for short mixed-language K-pop text.

A calibration layer adjusts the model's scores for lyric context — the model was trained on social media text and tends to over-predict negative sentiment for emotionally intense but positive lyrics.

---

## design

Soft pink palette with a dot-pattern background, glassmorphism album cards, and a gradient timeline line. Sentiment colours: green (joyful) · amber (mellow) · purple (dark).

---

## next steps

- [ ] Sentiment arc chart — mood shift across a full tracklist
- [ ] Album comparison — side by side sentiment timelines
- [ ] Upstash Redis for persistent cross-session caching
- [ ] Deploy to Vercel (server) + GitHub Pages (client)