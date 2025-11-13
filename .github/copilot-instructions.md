# ITPathfinder - AI Coding Agent Instructions

## Architecture Overview

**Yarn Workspaces Monorepo** with three main packages:
- `apps/web` - Next.js frontend (TypeScript, Tailwind, Pages Router)
- `apps/api` - Express REST API (TypeScript, JWT auth)
- `packages/db` - Prisma schema + migrations (PostgreSQL)

**Data Flow**: Frontend → localStorage (auth tokens) → Express API → Prisma Client → PostgreSQL

## Critical Development Workflows

### Starting the Development Environment
```powershell
# Install dependencies (from root)
yarn install

# Start frontend (port 3000)
yarn dev:web

# Start backend (port 4000) in separate terminal
yarn dev:api
```

**Important**: Frontend expects API at `http://localhost:4000` (check `NEXT_PUBLIC_API_BASE` if different).

### Database Migrations & Seeding
```powershell
# Navigate to db package
cd packages/db

# Run migrations
npx prisma migrate dev

# Seed database with test users + 50 assessment questions
npx ts-node prisma/seed.ts

# Seed 10 career tracks with games
node prisma/seed_tracks.js

# Test credentials (all passwords: "password123")
# - itprof@example.com (IT Professional - can create tracks)
# - student@example.com (student)
# - switcher@example.com (career_switcher)
```

**Seed Script Locations**:
- `packages/db/prisma/seed.ts` - Users + Assessment questions
- `packages/db/prisma/seed_tracks.js` - Career tracks + Games
- Other seed files: `seed_modules.js`, `seed_lessons.js`, `seed_questions.js`

## Project-Specific Patterns

### Calendar Conflict Detection (NEW)
**Purpose**: Prevents double-booking and scheduling conflicts across all calendar features.

**How it works**:
- Helper function `checkCalendarConflicts(userId, startTime, endTime)` in `apps/api/src/index.ts`
- Checks both `PersonalCalendarEvent` and `Session` tables for overlapping times
- Uses comprehensive overlap detection (new starts during existing, ends during existing, or completely contains)
- Returns `{ hasConflict: boolean, conflictDetails?: string }`

**Protected Endpoints**:
1. `POST /sessions` - Checks both mentor and student calendars before creating session
2. `POST /events/:id/register` - Checks user calendar before event registration
3. `POST /calendar/events` - Checks user calendar before creating blocked time

**Error Response** (409 Conflict):
```json
{
  "error": "Schedule conflict",
  "details": "You have an existing session \"Python Basics\" from 1/15/2025, 2:00:00 PM to 1/15/2025, 3:00:00 PM"
}
```

**Frontend Integration**:
- `users.tsx`, `events.tsx`, `sessions.tsx` all show detailed conflict messages
- User-friendly alerts explain what conflicts and suggest choosing different time

**See**: `CALENDAR_CONFLICT_DETECTION.md` for detailed implementation documentation

### Authentication Flow (JWT + localStorage)
1. **Login/Signup**: API returns `{ token, user }` → stored in `localStorage`
2. **Auth Middleware** (`requireAuth` in `apps/api/src/index.ts`):
   - Expects header: `Authorization: Bearer <token>`
   - Sets `req.userId` for protected routes
3. **Frontend Auth Check**:
   ```typescript
   const token = localStorage.getItem('token');
   const user = JSON.parse(localStorage.getItem('user') || '{}');
   const userId = localStorage.getItem('userId');
   ```
4. **Protected Routes**: Frontend checks for `token`/`user`, redirects to `/login` if missing

**Role-Based Access**: 
- `IT Professional` → Can create/edit/delete tracks (`POST /tracks`, `PUT /tracks/:id`)
- `student` / `career_switcher` → Can take assessments, enroll in tracks

### Assessment & Recommendation Engine
1. **Assessment Questions** (`Question` model):
   - 50 MCQ questions across 5 skill areas (tags: `computer_fundamentals`, `programming_logic`, `math_logic`, `digital_literacy`, `career_softskills`)
   - Frontend: `pages/assessment.tsx` fetches from `GET /assessments/start`
2. **Scoring** (`POST /assessments/submit`):
   - Computes `scoreVector` (% correct per tag)
   - Identifies strengths (≥70%) and weaknesses (<50%)
   - Recommends tracks matching top skills
3. **AI Feedback** (`POST /results/ai-feedback`):
   - Uses Hugging Face BART-MNLI for career path classification
   - Requires `HUGGINGFACE_API_KEY` in `.env`

### Track Progress & Gamification
- **Progress Tracking** (`TrackProgress` model):
  - `completedModules` / `completedGames` arrays track user progress
  - API endpoints: `GET/PUT /users/:userId/track-progress/:trackId`
- **Progress Calculation**:
  ```typescript
  // In frontend (tracks.tsx, track/[id].tsx)
  const totalItems = modulesCount + gamesCount;
  const done = completedModules.length + completedGames.length;
  const percent = Math.round((done / totalItems) * 100);
  ```
- **Game Types** (stored as JSON in `Game.content`):
  - `coding` - Interactive code challenges
  - `network` - Network topology builders
  - `threat` - Cybersecurity scenarios
  - `sql-quiz` - SQL query challenges

### API Response Patterns
**Success**: `{ key: value }` or `{ items: [...] }`  
**Error**: `{ error: 'message' }` with 4xx/5xx status

**Common Endpoints**:
- Auth: `POST /auth/signup`, `POST /auth/login`
- Assessment: `GET /assessments/start`, `POST /assessments/submit`, `GET /assessments/latest/:userId`
- Tracks: `GET /tracks`, `GET /tracks/:id`, `POST /tracks` (auth), `PUT /tracks/:id` (auth)
- Progress: `POST /users/:userId/track-progress/:trackId/module/:moduleId/complete`
- Community: `GET /community/posts`, `POST /community/posts` (auth)

### Prisma Schema Key Relationships
```
User (1) ──< (N) TrackProgress ──> (1) Track
Track (1) ──< (N) Module ──> (N) Lesson / Quiz / Game
User (1) ──< (N) Assessment (stores scoreVector + recommendedTracks)
User (1) ──< (N) Post ──> (N) Comment
```

**Important**: `Track.creator` links to `User` (IT Professional who created track)

### Frontend State Management
- **No Redux/Zustand**: Uses React hooks + localStorage + Context API (`useUser` hook)
- **User Context** (`shared/hooks/useUser.tsx`):
  ```typescript
  const { user, setUser } = useUser(); // Auto-syncs with localStorage
  ```
- **Per-Page Data Fetching**: Each page uses `useEffect` + `fetch` (no global cache)

### Styling Conventions
- **Tailwind CSS** with custom gradient patterns
- **Animation Classes**: `animate-pulse`, `animate-bounce`, `animate-spin`, `hover:scale-105`
- **Color Scheme**: Blue-purple gradients (`from-blue-600 to-purple-600`)
- **Icons**: Lucide React (`lucide-react` package)

### TypeScript Gotchas
1. **Prisma Type Casting**: Some generated types require `as any` or `as unknown as Type` for JSON fields
   ```typescript
   // Example from index.ts
   const recommendedTracks = assessment.recommendedTracks as any[];
   ```
2. **Optional Chaining**: Always check for null/undefined on API responses
   ```typescript
   const modulesCount = track.modules?.length || 0;
   ```

## Environment Variables (.env at project root)
```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/itpathfinder"
JWT_SECRET="your-secret-key"
PORT=4000

# Optional (for AI features)
HUGGINGFACE_API_KEY="hf_..."
NEWSAPI_KEY="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## Key Files to Reference
- **API Routes**: `apps/api/src/index.ts` (single file, ~800 lines)
- **Prisma Schema**: `packages/db/prisma/schema.prisma`
- **Frontend Pages**: `apps/web/pages/*.tsx` (Pages Router structure)
- **Auth Middleware**: Line 29-42 in `apps/api/src/index.ts` (`requireAuth` function)
- **Assessment Logic**: Lines 92-147 in `apps/api/src/index.ts`

## Common Tasks

**Adding a new API endpoint**:
1. Add route to `apps/api/src/index.ts`
2. Use `requireAuth` middleware if auth needed
3. Access user via `req.userId`

**Adding a new page**:
1. Create `apps/web/pages/your-page.tsx`
2. Import `Header` via `_app.tsx` (already global)
3. Use Tailwind + Lucide icons

**Modifying database schema**:
1. Edit `packages/db/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Regenerate client: `npx prisma generate`

**Debugging auth issues**:
- Check browser localStorage for `token`, `user`, `userId`
- Verify JWT_SECRET matches between API and any external tools
- Test endpoint with: `curl -H "Authorization: Bearer <token>" http://localhost:4000/endpoint`
