# H-Mate Backend

Backend API H-Mate yang dibangun dengan Express 5. Service ini menangani konsultasi karier, generate pertanyaan tes minat, analisis hasil, mini test roadmap, roadmap generation, next steps, dan konsultasi lanjutan berbasis Google GenAI.

## Fitur Utama

- Endpoint konsultasi karier AI (`/api/konsultasi`)
- Generator pertanyaan tes minat bakat
- Analisis hasil tes dan rekomendasi karier
- Mini test untuk memulai roadmap karier
- Generator roadmap, next steps, dan konsultasi roadmap
- Health check endpoint untuk monitoring
- Rate limiting untuk seluruh route di bawah `/api`

## Tech Stack

- Node.js + Express 5
- `@google/genai` untuk integrasi Gemini
- `cors` untuk origin frontend
- `express-rate-limit` untuk pembatasan request
- `dotenv` untuk konfigurasi environment
- `nodemon` untuk development

## Struktur Project

```text
.
├─ server.js        # seluruh route dan logic backend
├─ package.json     # scripts dan dependencies
├─ Dockerfile       # image production backend
└─ .env.example     # template environment variable
```

## Prasyarat

- Node.js 20+
- npm
- `GEMINI_API_KEY` yang valid
- URL frontend yang benar untuk konfigurasi CORS

## Environment Variables

Salin file contoh lalu isi nilainya:

```bash
cp .env.example .env
```

| Variable | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `PORT` | Tidak | `3000` | Port server Express |
| `FRONTEND_URL` | Tidak | `http://localhost:3001` | Origin frontend untuk CORS |
| `GEMINI_API_KEY` | Ya | - | API key Gemini; backend akan gagal start jika tidak diisi |

## Menjalankan Secara Lokal

1. Install dependency:

```bash
npm install
```

2. Siapkan file environment:

```bash
cp .env.example .env
```

3. Jalankan backend:

```bash
npm run dev
```

Untuk mode non-watch:

```bash
npm start
```

Secara default backend berjalan di `http://localhost:3000`.

## Scripts

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan backend dengan `nodemon` |
| `npm start` | Menjalankan backend dengan Node.js |
| `npm test` | Placeholder default dan saat ini belum dipakai |

## API Endpoints

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/konsultasi` | Chat konsultasi karier |
| `POST` | `/api/generate-questions` | Generate soal tes minat bakat |
| `POST` | `/api/analyze-results` | Analisis jawaban tes dan rekomendasi karier |
| `POST` | `/api/roadmap/mini-test` | Generate mini test roadmap |
| `POST` | `/api/roadmap/analyze-mini-test` | Analisis mini test |
| `POST` | `/api/roadmap/generate` | Generate roadmap karier |
| `POST` | `/api/roadmap/next-steps` | Langkah lanjutan berdasarkan roadmap |
| `POST` | `/api/roadmap/consultation` | Konsultasi lanjutan terkait roadmap |
| `GET` | `/health` | Health check service |

## Catatan Operasional

- Semua route di bawah `/api` dibatasi oleh rate limiter `100 request / 15 menit`
- CORS menerima origin dari `FRONTEND_URL` atau fallback `http://localhost:3001`
- Server bind ke `0.0.0.0`, sehingga cocok untuk container deployment
- Jika `GEMINI_API_KEY` tidak tersedia, proses akan berhenti saat startup
- Respons error dikembalikan dalam format JSON

## Docker

Backend dapat dijalankan langsung dari Dockerfile repo ini.

```bash
docker build -t h-mate-backend .

docker run --rm \
  --env-file .env \
  -p 3000:3000 \
  h-mate-backend
```

Jika Anda mengubah `PORT` di `.env`, sesuaikan mapping port host dan container.

## License

ISC
