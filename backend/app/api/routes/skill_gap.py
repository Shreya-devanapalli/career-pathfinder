from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.services.skill_gap_service import analyze_skill_gap


router = APIRouter(
    prefix="/api/skill-gap",
    tags=["skill-gap"],
)


@router.post("")
def skill_gap(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    career_name = payload.get("career")
    user_skills = payload.get("skills", [])

    if not career_name:
        raise HTTPException(
            status_code=400,
            detail="Career is required",
        )

    try:
        return analyze_skill_gap(
            db=db,
            career_name=career_name,
            user_skills=user_skills,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {exc}",
        )