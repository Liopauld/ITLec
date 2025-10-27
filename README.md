# ITPathfinder - AI Career Guidance Platform

An intelligent career assessment and learning platform built with Next.js, Express, and PostgreSQL. Features personalized IT career recommendations, gamified learning tracks, and AI-powered feedback.

## 🏗️ Architecture

**Yarn Workspaces Monorepo:**
- **apps/web**: Next.js 13 frontend (TypeScript, Tailwind CSS, Pages Router)
- **apps/api**: Express REST API (TypeScript, JWT authentication)
- **packages/db**: Prisma ORM + PostgreSQL schema & migrations

## 🚀 Complete Setup Guide (For Cloned Projects)

### Prerequisites
- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **Yarn** 1.22.x or higher (`npm install -g yarn`)
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))

### Step 1: Clone & Install Dependencies

```powershell
# Clone the repository
git clone https://github.com/Liopauld/ITLec.git
cd ITLec

# Install all dependencies (root + all workspaces)
yarn install
```

### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL** (make sure it's running)
2. **Create a new database:**
   ```sql
   -- Connect to PostgreSQL (psql or pgAdmin)
   CREATE DATABASE itpathfinder;
   ```

3. **Note your connection details:**
   - Host: `localhost` (default)
   - Port: `5432` (default)
   - Username: your PostgreSQL username
   - Password: your PostgreSQL password
   - Database: `itpathfinder`

### Step 3: Configure Environment Variables

Create `.env` files in the following locations:

#### **Root `.env`** (project root):
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/itpathfinder"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=4000

# Optional (for AI features)
HUGGINGFACE_API_KEY="hf_..."
NEWSAPI_KEY="..."
```

#### **`packages/db/.env`**:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/itpathfinder"
```

#### **`apps/api/.env`**:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/itpathfinder"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=4000
```

#### **`apps/web/.env.local`**:
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

**⚠️ Replace `USERNAME` and `PASSWORD` with your actual PostgreSQL credentials!**

### Step 4: Run Database Migrations

```powershell
# Navigate to the database package
cd packages/db

# Run Prisma migrations to create tables
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

### Step 5: Seed the Database

```powershell
# Still in packages/db directory

# 1. Seed users + 50 assessment questions
npx ts-node prisma/seed.ts

# 2. Seed 10 career tracks with games
node prisma/seed_tracks.js

# 3. (Optional) Seed additional modules/lessons
node prisma/seed_modules.js
node prisma/seed_lessons.js

# 4. (Optional) Seed complete track data
node prisma/seed_complete_tracks.js

# 5. (Optional) Seed events
node prisma/seed_events.js
```

**✅ Test Credentials (all passwords: `password123`):**
- `itprof@example.com` - IT Professional (can create/edit tracks)
- `student@example.com` - Student
- `switcher@example.com` - Career Switcher

### Step 6: Start Development Servers

Open **two separate terminal windows:**

#### **Terminal 1 - Frontend (port 3000):**
```powershell
# From project root
cd apps/web
yarn dev

# Or from root:
yarn dev:web
```

#### **Terminal 2 - Backend (port 4000):**
```powershell
# From project root
cd apps/api
yarn dev

# Or from root:
yarn dev:api
```

### Step 7: Access the Application

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

**Try logging in with:**
- Email: `student@example.com`
- Password: `password123`

## 📊 Database Management

### View Database in Prisma Studio
```powershell
cd packages/db
npx prisma studio
# Opens at http://localhost:5555
```

### Reset Database (WARNING: Deletes all data!)
```powershell
cd packages/db
npx prisma migrate reset
# Then re-run seed scripts
```

### Create New Migration
```powershell
cd packages/db
# Edit prisma/schema.prisma first, then:
npx prisma migrate dev --name your_migration_name
```

## 🎯 Key Features

- **Career Assessment**: 50 MCQ questions across 5 skill areas
- **AI Recommendations**: Personalized track suggestions based on strengths
- **Gamified Learning**: Interactive coding challenges, network builders, security scenarios
- **Progress Tracking**: Module completion, games, and achievement system
- **Community Features**: Discussion posts, comments, social feed
- **Role-Based Access**: Students, Career Switchers, IT Professionals

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, JWT authentication, bcrypt
- **Database**: PostgreSQL 14+, Prisma ORM
- **AI**: Hugging Face BART-MNLI (optional)

## 📁 Project Structure

```
ITPathfinder/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── pages/        # Pages Router
│   │   ├── components/   # React components
│   │   └── styles/       # Global CSS
│   └── api/              # Express backend
│       └── src/
│           └── index.ts  # Main API routes
├── packages/
│   └── db/               # Database layer
│       └── prisma/
│           ├── schema.prisma    # Database schema
│           ├── seed.ts          # User/Question seeds
│           └── seed_tracks.js   # Track/Game seeds
└── .env                  # Environment variables
```

## 🔧 Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check `DATABASE_URL` in all `.env` files
- Ensure database `itpathfinder` exists

### "Prisma Client not generated"
```powershell
cd packages/db
npx prisma generate
```

### "Port already in use"
- Frontend (3000): Change in `apps/web/package.json`
- Backend (4000): Change `PORT` in `.env` files

### "Module not found"
```powershell
# Re-install dependencies
yarn install
```

## 📝 Development Workflow

1. **Make database changes**: Edit `packages/db/prisma/schema.prisma`
2. **Create migration**: `npx prisma migrate dev`
3. **Add API endpoint**: Edit `apps/api/src/index.ts`
4. **Create frontend page**: Add to `apps/web/pages/`
5. **Test locally**: Start both dev servers
6. **Commit changes**: `git add .` → `git commit` → `git push`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for aspiring IT professionals**
