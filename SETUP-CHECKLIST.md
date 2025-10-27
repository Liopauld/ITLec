# 🚀 ITPathfinder Setup Checklist

Use this checklist when setting up the project for the first time.

## ☐ Prerequisites Installed

- [ ] **Node.js 16+** - Run `node --version` to check
- [ ] **Yarn** - Run `yarn --version` to check (install: `npm install -g yarn`)
- [ ] **PostgreSQL 14+** - Ensure it's running (check services or run `psql --version`)

## ☐ Project Setup

- [ ] Clone repository: `git clone https://github.com/Liopauld/ITLec.git`
- [ ] Navigate to directory: `cd ITLec`
- [ ] Install dependencies: `yarn install`

## ☐ Database Setup

- [ ] PostgreSQL is running
- [ ] Database created: `CREATE DATABASE itpathfinder;`
- [ ] Note your PostgreSQL username
- [ ] Note your PostgreSQL password

## ☐ Environment Variables Created

Create these `.env` files with your actual credentials:

### Root `.env`
- [ ] File created at project root
- [ ] `DATABASE_URL` set with your PostgreSQL credentials
- [ ] `JWT_SECRET` set to a random secure string
- [ ] `PORT=4000` set

### `packages/db/.env`
- [ ] File created
- [ ] `DATABASE_URL` copied from root

### `apps/api/.env`
- [ ] File created
- [ ] `DATABASE_URL` copied from root
- [ ] `JWT_SECRET` copied from root
- [ ] `PORT=4000` set

### `apps/web/.env.local`
- [ ] File created
- [ ] `NEXT_PUBLIC_API_BASE=http://localhost:4000` set

## ☐ Database Migrations

- [ ] Navigate to `cd packages/db`
- [ ] Run migrations: `npx prisma migrate dev`
- [ ] Generate Prisma Client: `npx prisma generate`

## ☐ Database Seeding

Still in `packages/db` directory:

- [ ] Seed users + questions: `npx ts-node prisma/seed.ts`
- [ ] Seed tracks + games: `node prisma/seed_tracks.js`
- [ ] (Optional) Seed modules: `node prisma/seed_modules.js`
- [ ] (Optional) Seed lessons: `node prisma/seed_lessons.js`
- [ ] (Optional) Seed complete tracks: `node prisma/seed_complete_tracks.js`

## ☐ Test Credentials Available

Write down these test accounts (password for all: `password123`):

- [ ] IT Professional: `itprof@example.com`
- [ ] Student: `student@example.com`
- [ ] Career Switcher: `switcher@example.com`

## ☐ Development Servers Running

### Terminal 1 - Backend
- [ ] Navigate: `cd apps/api` (from root)
- [ ] Start server: `yarn dev`
- [ ] Check: API running at http://localhost:4000

### Terminal 2 - Frontend
- [ ] Navigate: `cd apps/web` (from root)
- [ ] Start server: `yarn dev`
- [ ] Check: App running at http://localhost:3000

## ☐ Application Testing

- [ ] Open http://localhost:3000 in browser
- [ ] Click "Login" button
- [ ] Login with: `student@example.com` / `password123`
- [ ] Verify: Dashboard loads successfully
- [ ] Test: Navigate to "Career Assessment"
- [ ] Test: View available tracks
- [ ] (Optional) Open Prisma Studio: `npx prisma studio` (from packages/db)

## ☐ Optional: AI Features

If you want AI-powered career feedback:

- [ ] Get Hugging Face API key: https://huggingface.co/settings/tokens
- [ ] Add to root `.env`: `HUGGINGFACE_API_KEY="hf_..."`
- [ ] Add to `apps/api/.env`: `HUGGINGFACE_API_KEY="hf_..."`
- [ ] Restart backend server

## 📝 Quick Reference Commands

```powershell
# Install dependencies
yarn install

# Start frontend (port 3000)
yarn dev:web
# OR: cd apps/web && yarn dev

# Start backend (port 4000)
yarn dev:api
# OR: cd apps/api && yarn dev

# Database management
cd packages/db
npx prisma studio          # Visual database editor
npx prisma migrate dev     # Run migrations
npx prisma generate        # Generate Prisma Client
npx prisma migrate reset   # Reset database (⚠️ deletes data)

# Seed database
cd packages/db
npx ts-node prisma/seed.ts      # Users + questions
node prisma/seed_tracks.js       # Tracks + games
```

## ❗ Common Issues

### Can't connect to database
```powershell
# Check PostgreSQL is running
# Windows: Check Services app for "PostgreSQL"
# Verify DATABASE_URL has correct username/password
```

### Port already in use
```powershell
# Kill process on port 3000 (frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Kill process on port 4000 (backend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

### Prisma Client errors
```powershell
cd packages/db
npx prisma generate
```

### Module not found errors
```powershell
# Re-install from root
yarn install
```

---

✅ **Setup Complete!** You're ready to develop! 🎉
