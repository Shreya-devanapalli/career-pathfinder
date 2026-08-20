# Career Pathfinder

Career Pathfinder is an AI-powered career guidance platform that helps students discover suitable career paths based on their academic background, interests, skills, experience, work preferences, and career goals.

## Features

- Personalized career recommendations with match scores
- Skill-gap analysis for recommended careers
- Career-specific learning roadmap
- Course and certification recommendations
- AI-powered career chatbot
- User authentication with persistent profiles
- Recommendation and chat history
- Responsive web interface

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router

### Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication

### Database & Services
- PostgreSQL / Supabase
- Groq API
- REST APIs

### Deployment
- Vercel — Frontend
- Render — Backend
- Supabase — Database

## How It Works

1. Create an account or sign in.
2. Complete the career assessment.
3. Enter your branch, interests, skills, proficiency, experience, work preferences, and career goals.
4. Receive personalized career recommendations.
5. Explore your career matches, skill gaps, and roadmap.
6. Ask Career AI questions about your career path and preparation.

## Project Structure

```text
career-pathfinder/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── api/
│   └── package.json
│
└── README.md
## 1. Backend setup

### Prerequisites
- Python 3.11+
- PostgreSQL running locally (or reachable) — e.g. `sudo apt install postgresql` on Ubuntu/Debian,
  or use a hosted instance (Supabase, Neon, Railway, RDS, etc.)
- A Groq API key from https://console.groq.com/keys — **optional now.** Recommendations and the
  predefined tag questions work with no key at all. You only need one if you want the open-ended
  follow-up chat to work for questions outside the predefined patterns; without a key, those questions
  will return a "Chat engine failed" error while everything else keeps working.

### Steps

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create the database (skip if using a hosted Postgres — just use its connection string instead):

```bash
sudo -u postgres createdb career_pathfinder
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"   # or your own user/password
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/career_pathfinder
GROQ_API_KEY=your_real_groq_api_key       # optional — only used as a fallback for open-ended chat
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=some-long-random-string   # generate with: openssl rand -hex 32
CORS_ORIGINS=["http://localhost:5173"]
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8001
```

Tables are created automatically on startup (`Base.metadata.create_all`), and the `careers` table is
auto-seeded from `DEFAULT_CAREERS` the first time it's empty — so a brand-new database works with zero
manual steps. If you want to (re)load the seed data manually at any point (e.g. after adding entries to
`DEFAULT_CAREERS`), run:

```bash
python -m app.seed_careers
```

This is fine for a hackathon/final-year project; for anything longer-lived, switch to Alembic migrations
instead of `create_all`.

Visit `http://localhost:8000/docs` for interactive API docs. Note: the Swagger "Authorize" button won't
work out of the box since `/api/auth/login` takes JSON rather than an OAuth2 form — test login/signup
via the `/docs` "Try it out" panel on each endpoint directly, or from the frontend.

---

## 2. Frontend setup

### Prerequisites
- Node.js 18+

### Steps

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should point at your running backend:

```env
VITE_API_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173`. Sign up, complete the guided branch/skills/interests flow, and you should
get an instant, locally-computed recommendation, five tappable "quick question" chips that answer
themselves, and a follow-up chat box for anything else.

---
##Deployed URL:
- https://career-pathfinder-mocha.vercel.app/

## Known limitations / next steps

- Table creation uses `Base.metadata.create_all` rather than Alembic migrations — fine for a hackathon,
  worth switching before this goes anywhere persistent.
- No password-reset flow.
- `local_recommender`'s career database (the `careers` table) is curated for the fixed branch/skill/
  interest chip options in the onboarding UI — if you add new branches, skills, or interests there, add
  matching career rows too (see "Adding more careers" above), or those new profiles will fall back to
  the generic career entries.
- No rate limiting on the Groq-calling fallback path — worth adding before exposing this publicly, since
  each unmatched chat message still costs a real API request.
- The Swagger docs' built-in "Authorize" flow doesn't match the JSON login endpoint; this only affects
  testing via `/docs`, not the actual app.
