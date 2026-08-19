# Career Pathfinder

An NLP career guidance chatbot for engineering/college students. Students pick their branch, skills,
and interests; the backend runs those through a **local, rule-based recommendation engine** (no AI call)
to generate a recommended career, job roles, skills to learn, and courses. The result screen also shows a
handful of **predefined "tag questions"** that are answered instantly from the recommendation, again with
no AI call. Groq is only used as a fallback, for open-ended follow-up questions that don't match one of
those predefined patterns. Everything is persisted per logged-in user in PostgreSQL.

**Stack:** React (Vite) · FastAPI · PostgreSQL (SQLAlchemy) · Groq (follow-up chat fallback only)

### Why the recommendation step does not call an AI model

Career recommendation is the first, highest-traffic step of the app — every single onboarding run used
to make an AI request, which burned through the free-tier quota fast. That step is now handled by
`backend/app/services/local_recommender.py`: it scores every row of a `careers` table (Postgres, same
database as everything else) against the student's branch/skills/interests with plain weighted rules.
It's instant, free, deterministic, and needs no API key at all.

The career data itself lives in the **`careers` table**, not hardcoded in Python — see "Adding more
careers" below. Groq now only gets called from the follow-up chat (`/api/chat`), and even then only
when the student's question doesn't match one of the predefined FAQ patterns handled locally by
`backend/app/services/local_qa_service.py`. The five "tag question" chips shown under the result
(*"Why is this my best match?"*, *"What skills should I learn first?"*, etc.) always hit the local
answerer, so a full run of onboarding + tapping every tag question costs **zero** Groq requests.

### Adding more careers

The `careers` table is the live source of truth — the app reads from it on every recommendation, so
adding a role doesn't require a code change or redeploy. Two ways to add data:

1. **Edit `DEFAULT_CAREERS` in `local_recommender.py`, then re-run the seed script** (`python -m
   app.seed_careers`). This upserts by `title`, so it's safe to re-run any time you add entries — it
   updates existing rows and inserts new ones, and never duplicates.
2. **Insert/edit rows directly in Postgres** (psql, a GUI like TablePlus/DBeaver, or your own admin
   script) — no code change or redeploy needed at all, since the app queries the table live on every
   request.

Each career row needs: `title`, `branches` (which academic branches it fits), `core_skills` /
`nice_skills` (weighted differently in scoring), `interests`, `skills_to_learn`, and `courses` — all the
list fields are plain JSON arrays of strings. If the table is ever empty (e.g. a brand-new database that
hasn't been seeded yet), the app automatically seeds itself from `DEFAULT_CAREERS` on startup, and
`local_recommender.py` also falls back to that in-memory list as a last resort so recommendations never
hard-fail even if the DB is temporarily unreachable for that query.

---

## Project structure

```
career-pathfinder/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, router registration, startup table creation
│   │   ├── core/
│   │   │   ├── config.py           # env-based settings (pydantic-settings)
│   │   │   └── security.py         # password hashing + JWT
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy declarative base
│   │   │   └── session.py          # engine / session factory
│   │   ├── models/                 # SQLAlchemy models: User, Profile, Recommendation, ChatMessage, Career
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── deps.py             # get_db, get_current_user (JWT)
│   │   │   └── routes/             # auth, profile, recommend, chat
│   │   ├── seed_careers.py         # (re-)populate the `careers` table from DEFAULT_CAREERS
│   │   └── services/
│   │       ├── local_recommender.py  # rule-based career scoring against the `careers` table — no AI
│   │       ├── local_qa_service.py   # predefined FAQ / tag-question answers — no AI, used by /api/chat
│   │       └── groq_service.py       # Groq prompt building + calls, fallback-only for /api/chat
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.js           # axios instance, attaches JWT from localStorage
    │   ├── context/AuthContext.jsx # signup/login/logout/me, token persistence
    │   ├── components/             # ProtectedRoute, Chip/Bubble/TypingDots/Tag chat UI
    │   ├── pages/                  # Login, Signup, Onboarding (guided flow + result + tag questions + chat)
    │   └── styles/theme.js         # shared color/font tokens
    ├── package.json
    └── .env.example
```

---

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
uvicorn app.main:app --reload --port 8000
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

## How it fits together

1. **Signup/Login** (`/api/auth/signup`, `/api/auth/login`) issue a JWT, stored in `localStorage` on the
   frontend and attached to every subsequent request via an axios interceptor.
2. **Onboarding** posts the selected branch/skills/interests to `/api/profile` (saved per user) and then
   to `/api/recommend`, which runs `local_recommender.get_local_recommendation` (pure Python, no AI),
   and stores a `Recommendation` row.
3. **Tag questions** — the result screen shows five predefined chips (`TAG_QUESTIONS` in
   `Onboarding.jsx`, mirrored as `TAG_QUESTIONS` in `local_qa_service.py`). Tapping one, or typing a
   question that matches the same intent, is answered by `local_qa_service.try_answer_locally` straight
   from the stored recommendation — no Groq call.
4. **Follow-up chat** posts to `/api/chat` with the `recommendation_id`. The backend first tries
   `try_answer_locally`; only if that returns nothing does it fall back to
   `groq_service.get_followup_reply`, loading the profile + recommendation + prior chat history as
   context. Either way, both the user message and the bot reply are stored.
5. **History** (`GET /api/recommend/history`, `GET /api/chat/{recommendation_id}`) is there if you want to
   build a "past recommendations" view later — not wired into the UI yet, but the data is already being
   saved.

## Deploying (so you can demo it live instead of locally)

The one thing that actually needs to persist across deploys/restarts is your Postgres data (users,
recommendations, chat history, and now the `careers` table). Where you host the backend/frontend matters
less than **where Postgres lives**:

- **Vercel** doesn't provide a persistent Postgres instance itself — it's built for serverless functions
  and static hosting with no durable local disk. If you deploy the FastAPI backend there, you still need
  an external managed Postgres (see below); Vercel is really a better fit for the frontend than the
  backend here.
- **Railway / Render** both give you a managed, always-on Postgres database (a connection string you drop
  into `DATABASE_URL`) alongside a place to run the FastAPI backend. This is the simplest path for this
  project — one platform, backend + DB together, free tier available on both. Recommended for a panel
  demo.
- **Plain Docker** (e.g. `docker run postgres` on a VM) only persists data if you mount a **volume** for
  Postgres's data directory. Without a volume, a container restart or redeploy wipes the database —
  including your `careers` table — back to empty (though it'll auto-reseed from `DEFAULT_CAREERS` on next
  startup; your users/recommendations/chat history won't come back, though).

Practical steps for a Railway/Render-style deploy:
1. Provision their managed Postgres, copy the connection string into `DATABASE_URL` on the backend
   service's environment variables (along with `JWT_SECRET`, `CORS_ORIGINS` pointing at your deployed
   frontend URL, and `GROQ_API_KEY` if you want the chat fallback to work).
2. Deploy the backend — on first boot it creates all tables and auto-seeds `careers` since the table
   starts empty.
3. Deploy the frontend (Vercel is genuinely a good fit for this half) with `VITE_API_URL` pointing at the
   deployed backend URL.
4. From then on the database is persistent — redeploying the backend doesn't touch the data, since the
   app code and the database are separate services.

---

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
