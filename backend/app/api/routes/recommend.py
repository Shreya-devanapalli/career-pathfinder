import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.profile import ProfileIn
from app.schemas.recommendation import RecommendationOut
from app.services.local_recommender import get_local_recommendation


router = APIRouter(
    prefix="/api/recommend",
    tags=["recommend"],
)


@router.post(
    "",
    response_model=RecommendationOut,
)
async def create_recommendation(
    payload: ProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and store a career recommendation.

    Supported skill formats:

    New frontend:
        {
            "name": "Python",
            "proficiency": "Advanced"
        }

    Older frontend:
        "Python"
    """

    try:
        # ================================================================
        # NORMALIZE SKILLS
        # ================================================================

        normalized_skills: list[dict] = []

        for skill in payload.skills or []:

            # ------------------------------------------------------------
            # Old format:
            # "Python"
            # ------------------------------------------------------------
            if isinstance(skill, str):

                skill_name = skill.strip()

                if not skill_name:
                    continue

                normalized_skills.append(
                    {
                        "name": skill_name,
                        "proficiency": "Intermediate",
                    }
                )

            # ------------------------------------------------------------
            # New format:
            # {
            #     "name": "Python",
            #     "proficiency": "Advanced"
            # }
            # ------------------------------------------------------------
            elif isinstance(skill, dict):

                skill_name = (
                    skill.get("name")
                    or skill.get("skill")
                    or skill.get("skill_name")
                )

                if not skill_name:
                    continue

                proficiency = (
                    skill.get("proficiency")
                    or skill.get("level")
                    or "Intermediate"
                )

                normalized_skills.append(
                    {
                        "name": str(skill_name).strip(),
                        "proficiency": str(proficiency).strip(),
                    }
                )

        # ================================================================
        # REMOVE DUPLICATE SKILLS
        # ================================================================

        unique_skills: list[dict] = []
        seen_skills: set[str] = set()

        for skill in normalized_skills:

            key = skill["name"].lower().strip()

            if key in seen_skills:
                continue

            seen_skills.add(key)
            unique_skills.append(skill)

        # ================================================================
        # SEPARATE NAMES AND PROFICIENCY
        # ================================================================

        skill_names = [
            skill["name"]
            for skill in unique_skills
        ]

        proficiency_map = {
            skill["name"]: skill["proficiency"]
            for skill in unique_skills
        }

        # ================================================================
        # VALIDATE BASIC PROFILE
        # ================================================================

        if not payload.branch:
            raise HTTPException(
                status_code=400,
                detail="Academic branch is required.",
            )

        if not skill_names:
            raise HTTPException(
                status_code=400,
                detail="At least one skill is required.",
            )

        # ================================================================
        # GENERATE RECOMMENDATION
        # ================================================================

        result = get_local_recommendation(
            db=db,
            branch=payload.branch,
            skills=skill_names,
            interests=payload.interests or [],
            proficiency_map=proficiency_map,
        )

        # ================================================================
        # STORE RECOMMENDATION
        # ================================================================

        recommendation = Recommendation(
            user_id=current_user.id,

            branch=payload.branch,

            # Store the simple list expected by the API response. The richer
            # proficiency information is used while the assessment is being
            # evaluated and does not belong to the Recommendation model.
            skills=skill_names,

            interests=payload.interests or [],

            recommended_career=result["recommendedCareer"],

            match_reason=result["matchReason"],

            job_roles=result["jobRoles"],

            skills_to_learn=result["skillsToLearn"],

            courses=result["courses"],
        )

        db.add(recommendation)
        db.commit()
        db.refresh(recommendation)

        return recommendation

    except HTTPException:
        raise

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=502,
            detail=f"Recommendation engine failed: {str(exc)}",
        ) from exc


# ============================================================================
# HISTORY
# ============================================================================

@router.get(
    "/history",
    response_model=list[RecommendationOut],
)
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the current user's previous recommendations.
    """

    return (
        db.query(Recommendation)
        .filter(
            Recommendation.user_id == current_user.id
        )
        .order_by(
            Recommendation.created_at.desc()
        )
        .all()
    )


# ============================================================================
# SINGLE RECOMMENDATION
# ============================================================================

@router.get(
    "/{recommendation_id}",
    response_model=RecommendationOut,
)
def get_one(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return one recommendation belonging to the current user.
    """

    recommendation = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id,
        )
        .first()
    )

    if recommendation is None:

        raise HTTPException(
            status_code=404,
            detail="Recommendation not found",
        )

    return recommendation
