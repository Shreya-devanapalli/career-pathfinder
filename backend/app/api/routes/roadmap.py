from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.roadmap_service import get_career_roadmap


router = APIRouter(
    prefix="/api/roadmap",
    tags=["roadmap"],
)


@router.get("")
def roadmap(
    career: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_career_roadmap(career, db)

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Roadmap generation failed: {exc}",
        ) from exc