# Activation Admin Panel

Admin dashboard untuk mengelola activation codes bot WhatsApp.

## Tech Stack
- **Next.js 14** - App Router
- **Supabase** - Database PostgreSQL
- **Vercel** - Deployment

## Setup

### 1. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan `supabase-schema.sql`
3. Copy URL dan Keys dari **Settings > API**

### 2. Environment Variables
```bash
# Copy .env.local.example ke .env.local
cp .env.local.example .env.local

# Edit file dan isi:
ADMIN_PASSWORD=password_admin_anda
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
JWT_SECRET=random_string_minimal_32_karakter
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Deploy ke Vercel
1. Push ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Add environment variables di Vercel dashboard
4. Deploy!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activation/validate` | POST | Bot validasi code |
| `/api/activation/check` | POST | Bot check status |
| `/api/activation/extend` | POST | Admin perpanjang durasi |
| `/api/activation/revoke` | POST | Admin revoke device |
| `/api/codes/create` | POST | Admin buat code baru |
| `/api/codes/toggle` | POST | Admin aktifkan/nonaktifkan code |

## Integrasi Bot

1. Set environment variable di bot:
   ```
   ACTIVATION_API_URL=https://your-admin.vercel.app
   ```

2. Bot akan otomatis:
   - Cache aktivasi ke SQLite lokal
   - Re-verify setiap 1 jam
   - Auto logout jika expired
