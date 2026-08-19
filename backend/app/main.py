from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    chat,
    profile,
    recommend,
    skill_gap,
    roadmap,
)
import app.models

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine

# Import models so SQLAlchemy registers them
from app.models import chat as _chat_model  # noqa: F401
from app.models import profile as _profile_model  # noqa: F401
from app.models import recommendation as _recommendation_model  # noqa: F401
from app.models import user as _user_model  # noqa: F401
from app.models import skill as _skill_model
from app.models import course as _course_model
from app.models import certification as _certification_model
from app.models import career_skill as _career_skill_model
from app.models import career as _career_model

settings = get_settings()

app = FastAPI(
    title="Career Pathfinder API"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

# API ROUTES

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recommend.router)
app.include_router(chat.router)

# NEW
app.include_router(skill_gap.router)
app.include_router(roadmap.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}