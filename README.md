# TAKA Store POS — Full Stack

POS (Point of Sale) system: **Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + MySQL**. Frontend + backend API disatukan dalam satu project, satu perintah `npm run dev`.

## Fitur

- **Kasir** dengan scan barcode (USB/on-screen), cart, diskon item & global, kembalian tunai, print struk
- **Produk**: CRUD + upload gambar (base64 disimpan di DB) + cetak label barcode
- **Inventory**: pergerakan stok in/out/adjust, audit trail, alert low-stock
- **Transaksi**: list + filter + void (auto-restore stok)
- **Pelanggan**: CRUD + member level
- **User & Role**: ADMIN / MANAGER / CASHIER (via endpoint `/api/users`)
- **Laporan**: revenue harian, breakdown per kategori & per kasir, top produk
- **Auth**: JWT + bcrypt
- **Settings**: profil toko, pajak %, metode pembayaran aktif

## Setup

```bash
unzip pos-frontend.zip && cd pos-frontend
npm install
cp .env.example .env.local
# edit .env.local sesuai MySQL Anda (default sudah pre-filled dengan creds user)
npx prisma generate
npx prisma migrate deploy       # buat schema di DB
npm run seed                    # seed user, produk, kategori, settings, customer
npm run dev                     # http://localhost:3000
```

## Environment

`.env.local`:

```
DATABASE_URL="mysql://umarvps:umarvps@20.205.41.160:3306/pos"
JWT_SECRET="change-this-to-a-long-random-string-before-deploying"
JWT_EXPIRES_IN="7d"
```

## Login demo

| Email              | Password    | Role     |
| ------------------ | ----------- | -------- |
| `admin@taka.id`    | `password123` | ADMIN    |
| `manager@taka.id`  | `password123` | MANAGER  |
| `kasir1@taka.id`   | `password123` | CASHIER  |
| `kasir2@taka.id`   | `password123` | CASHIER  |

## API Endpoints

Semua endpoint di bawah `/api/*`. Semua (kecuali `/api/auth/login` dan `/api/health`) butuh header `Authorization: Bearer <token>`.

| Method | Path                             | Role         | Keterangan                                      |
| ------ | -------------------------------- | ------------ | ----------------------------------------------- |
| POST   | /api/auth/login                  | public       | Login, balikin token + user                     |
| GET    | /api/auth/me                     | any          | User aktif (dari JWT)                           |
| GET    | /api/health                      | public       | Health check                                    |
| GET    | /api/products                    | any          | List (page, pageSize, search, categoryId)       |
| POST   | /api/products                    | MANAGER+     | Create                                          |
| GET    | /api/products/:id                | any          | Detail                                          |
| PUT    | /api/products/:id                | MANAGER+     | Update                                          |
| DELETE | /api/products/:id                | ADMIN        | Delete                                          |
| GET    | /api/products/search?barcode=…   | any          | Cari barcode (POS scan)                         |
| GET    | /api/categories                  | any          | List                                            |
| POST   | /api/categories                  | MANAGER+     | Create                                          |
| PUT    | /api/categories/:id              | MANAGER+     | Update                                          |
| DELETE | /api/categories/:id              | ADMIN        | Delete                                          |
| GET    | /api/customers                   | any          | List (page, search)                             |
| POST   | /api/customers                   | any          | Create                                          |
| PUT    | /api/customers/:id               | MANAGER+     | Update                                          |
| DELETE | /api/customers/:id               | MANAGER+     | Delete                                          |
| GET    | /api/users                       | MANAGER+     | List                                            |
| POST   | /api/users                       | ADMIN        | Create                                          |
| PUT    | /api/users/:id                   | ADMIN        | Update                                          |
| DELETE | /api/users/:id                   | ADMIN        | Delete                                          |
| GET    | /api/inventory/movements         | any          | List                                            |
| POST   | /api/inventory/movements         | any          | Create (IN / OUT / ADJUST) + auto update stok   |
| GET    | /api/transactions                | any          | List (page, search, paymentMethod, status)      |
| POST   | /api/transactions                | any          | Create sale — auto decrement stok + create items|
| GET    | /api/transactions/:id            | any          | Detail                                          |
| POST   | /api/transactions/:id/void       | MANAGER+     | Void + auto restore stok                        |
| GET    | /api/reports/daily-summary       | any          | Revenue/hari (from, to)                         |
| GET    | /api/reports/by-category         | any          | Per kategori                                    |
| GET    | /api/reports/by-cashier          | any          | Per user                                        |
| GET    | /api/reports/top-products        | any          | Top terjual                                     |
| GET    | /api/settings                    | any          | Settings toko                                   |
| PUT    | /api/settings                    | MANAGER+     | Update settings                                 |

## Script

- `npm run dev` — Next.js dev server (UI + API, port 3000)
- `npm run build` — Production build
- `npm start` — Run production build
- `npm run lint` — ESLint
- `npm run prisma:generate` — Generate Prisma Client
- `npm run prisma:deploy` — Apply migrations ke DB
- `npm run seed` — Seed data
- `npm run db:reset` — Reset + migrate + seed (DESTRUCTIVE)

## Catatan keamanan

1. Default password demo `password123` **wajib diganti** sebelum production.
2. `JWT_SECRET` di `.env.example` adalah placeholder — generate random:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. Jangan commit `.env.local`.
# taka-pos
