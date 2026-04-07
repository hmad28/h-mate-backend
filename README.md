# H-Mate Backend

Backend H-Mate adalah service Express untuk fitur AI, konsultasi, generate question, analisis hasil, dan roadmap. Deployment yang didokumentasikan di sini menggunakan Docker dan `docker compose` dari root project.

## Requirements

- Git
- Docker
- Docker Compose
- `GEMINI_API_KEY` yang valid

## Environment Variables

Ada tiga file env yang perlu diisi:

- `./.env` untuk variable `docker-compose.yml`
- `frontend/.env` untuk frontend app
- `backend/.env` untuk backend app

Salin file example:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Variable penting:

### Root `.env`

- `NEXT_PUBLIC_API_URL`
- `FRONTEND_HOST_PORT`
- `BACKEND_HOST_PORT`

### `backend/.env`

- `PORT`
- `FRONTEND_URL`
- `GEMINI_API_KEY`

### `frontend/.env`

- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_API_URL`
- `ANTHROPIC_API_KEY`

`NEXT_PUBLIC_API_URL` di root `.env` dan `frontend/.env` harus sama agar build-time dan runtime frontend konsisten.

## Cara Menjalankan dengan Docker Compose

Jalankan semua perintah dari root project.

### 1. Clone repository

```bash
git clone <repo-url>
cd H-Mate
```

### 2. Isi file environment

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Lalu isi value backend dan frontend sesuai environment VPS.

### 3. Build dan jalankan

```bash
docker compose up --build
```

### 4. Stop semua service

```bash
docker compose down
```

## Catatan Operasional

- Backend dipublish ke host port `3000` secara default.
- Container backend memakai `restart: unless-stopped`.
- Backend memiliki healthcheck ke endpoint `/health`.
- `FRONTEND_URL` harus sesuai origin frontend yang diakses browser agar CORS tidak gagal.
- `docker-compose.yml` hanya menjalankan frontend dan backend; database tetap eksternal.
- Jangan hardcode domain atau secret ke Docker config; gunakan file `.env`.
