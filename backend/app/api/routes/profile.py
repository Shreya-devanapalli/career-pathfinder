from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("", response_model=ProfileOut)
def upsert_profile(
    payload: ProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        profile.branch = payload.branch
        profile.skills = payload.skills
        profile.interests = payload.interests
    else:
        profile = Profile(
            user_id=current_user.id,
            branch=payload.branch,
            skills=payload.skills,
            interests=payload.interests,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=ProfileOut | None)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Profile).filter(Profile.user_id == current_user.id).first()
