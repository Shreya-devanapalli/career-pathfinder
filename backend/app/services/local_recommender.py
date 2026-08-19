"""
Database-driven career recommendation engine.

Uses PostgreSQL / Supabase as the source of truth:

    careers
        ↓
    career_skills
        ↓
    skills

    careers
        ↓
    career_branches
        ↓
    branches

    courses
        ↓
    skills

    certifications
        ↓
    careers
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.career import Career
from app.models.skill import Skill
from app.models.career_skill import CareerSkill

# These imports are optional depending on your project models.
# If your project already has these models, keep them.
try:
    from app.models.career_branch import CareerBranch
except ImportError:
    CareerBranch = None

try:
    from app.models.branch import Branch
except ImportError:
    Branch = None

try:
    from app.models.course import Course
except ImportError:
    Course = None

try:
    from app.models.certification import Certification
except ImportError:
    Certification = None


# ============================================================================
# NORMALIZATION
# ============================================================================

def _normalize(value: str) -> str:
    """
    Normalize text for reliable comparisons.
    """
    if value is None:
        return ""

    return " ".join(
        str(value)
        .lower()
        .strip()
        .split()
    )


def _skill_alias(value: str) -> str:
    """
    Handle common skill aliases.
    """

    aliases = {
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "powerbi": "power bi",
        "power-bi": "power bi",
        "js": "javascript",
        "ts": "typescript",
        "postgres": "postgresql",
        "postgres db": "postgresql",
        "postgres database": "postgresql",
        "node": "node.js",
        "nodejs": "node.js",
        "reactjs": "react",
        "c plus plus": "c++",
        "cpp": "c++",
        "c plus": "c++",
        "embeddedc": "embedded c",
        "micro controller": "microcontrollers",
        "micro controller": "microcontrollers",
    }

    value = _normalize(value)

    return aliases.get(value, value)


def _skills_match(
    user_skill: str,
    career_skill: str,
) -> bool:
    """
    Compare two skill names safely.
    """

    user = _skill_alias(user_skill)
    career = _skill_alias(career_skill)

    if not user or not career:
        return False

    return user == career


# ============================================================================
# CAREER SKILLS
# ============================================================================

def _get_career_skills(
    db: Session,
    career_id: int,
) -> list[dict]:
    """
    Read required skills directly from:

        career_skills
            ↓
        skills
    """

    rows = (
        db.query(Skill, CareerSkill)
        .join(
            CareerSkill,
            CareerSkill.skill_id == Skill.id,
        )
        .filter(
            CareerSkill.career_id == career_id
        )
        .all()
    )

    result = []

    for skill, career_skill in rows:

        result.append(
            {
                "id": skill.id,
                "name": skill.skill_name,
                "importance": career_skill.importance,
                "skill_type": career_skill.skill_type,
            }
        )

    return result


# ============================================================================
# BRANCH MATCHING
# ============================================================================

def _branch_matches(
    db: Session,
    career_id: int,
    user_branch: str,
) -> float:
    """
    Determine whether the career is relevant to the user's branch.

    Uses:

        career_branches
            ↓
        branches

    Returns a bonus between 0 and 20.
    """

    if not user_branch:
        return 0.0

    if CareerBranch is None or Branch is None:
        return 0.0

    normalized_branch = _normalize(user_branch)

    rows = (
        db.query(Branch, CareerBranch)
        .join(
            CareerBranch,
            CareerBranch.branch_id == Branch.id,
        )
        .filter(
            CareerBranch.career_id == career_id
        )
        .all()
    )

    if not rows:
        return 0.0

    for branch, career_branch in rows:

        branch_name = _normalize(
            branch.branch_name
        )

        branch_code = _normalize(
            branch.branch_code or ""
        )

        if (
            normalized_branch == branch_name
            or normalized_branch == branch_code
            or normalized_branch in branch_name
            or branch_name in normalized_branch
            or (
                branch_code
                and branch_code in normalized_branch
            )
        ):

            relevance = _normalize(
                career_branch.relevance or ""
            )

            if relevance in {
                "high",
                "critical",
                "very high",
            }:
                return 20.0

            if relevance in {
                "medium",
                "moderate",
            }:
                return 12.0

            return 7.0

    return 0.0


# ============================================================================
# INTEREST MATCHING
# ============================================================================

def _interest_match(
    career: Career,
    interests: list[str],
) -> float:
    """
    Give a small bonus when the career industry/description
    aligns with the user's selected interests.
    """

    if not interests:
        return 0.0

    career_text = _normalize(
        f"{career.career_name} "
        f"{career.description or ''} "
        f"{career.industry or ''}"
    )

    matched = 0

    for interest in interests:

        interest_normalized = _normalize(
            interest
        )

        if not interest_normalized:
            continue

        # Direct match
        if interest_normalized in career_text:
            matched += 1
            continue

        # Useful mappings
        interest_keywords = {
            "ai / machine learning": [
                "machine learning",
                "artificial intelligence",
                "ai",
            ],
            "data analytics": [
                "data",
                "analytics",
                "analyst",
            ],
            "web development": [
                "web",
                "frontend",
                "full stack",
                "software",
            ],
            "software development": [
                "software",
                "developer",
            ],
            "cloud / devops": [
                "cloud",
                "devops",
            ],
            "cybersecurity": [
                "security",
                "cybersecurity",
            ],
            "databases": [
                "database",
                "data engineering",
            ],
            "business analytics": [
                "business",
                "analytics",
            ],
            "embedded systems": [
                "embedded",
                "electronics",
            ],
            "electronics": [
                "electronics",
                "embedded",
                "vlsi",
            ],
            "communication systems": [
                "communication",
                "telecommunications",
            ],
            "signal processing": [
                "signal",
                "communication",
            ],
            "vlsi": [
                "vlsi",
                "semiconductor",
            ],
            "robotics": [
                "robotics",
            ],
            "mechanical design": [
                "mechanical",
                "design",
            ],
            "manufacturing": [
                "manufacturing",
            ],
            "automotive": [
                "automotive",
            ],
        }

        keywords = interest_keywords.get(
            interest_normalized,
            [],
        )

        if any(
            keyword in career_text
            for keyword in keywords
        ):
            matched += 1

    if not interests:
        return 0.0

    ratio = matched / len(interests)

    return min(10.0, ratio * 10.0)


# ============================================================================
# SKILL SCORE
# ============================================================================

def _score_skills(
    career_skills: list[dict],
    user_skills: set[str],
    proficiency_map: dict[str, str] | None = None,
) -> tuple[float, list[str], list[str]]:
    """
    Calculate skill match.

    Returns:

        score
        matched skills
        missing skills
    """

    if not career_skills:
        return 0.0, [], []

    proficiency_weights = {
        "beginner": 0.55,
        "basic": 0.55,
        "intermediate": 0.75,
        "advanced": 1.0,
        "expert": 1.0,
    }
    normalized_proficiency = {
        _skill_alias(skill): proficiency_weights.get(
            _normalize(level),
            0.75,
        )
        for skill, level in (proficiency_map or {}).items()
        if skill
    }

    matched = 0.0
    total = 0.0

    matched_skills = []
    missing_skills = []

    for skill in career_skills:

        skill_name = skill["name"]

        importance = _normalize(
            skill.get("importance") or ""
        )

        skill_type = _normalize(
            skill.get("skill_type") or ""
        )

        # ---------------------------------------------------------
        # Weight
        # ---------------------------------------------------------

        if importance in {
            "critical",
            "high",
            "essential",
            "required",
        }:
            weight = 2.0

        elif importance in {
            "medium",
            "moderate",
        }:
            weight = 1.5

        else:
            weight = 1.0

        # Core skills get a little more importance.
        if skill_type == "core":
            weight *= 1.15

        total += weight

        # ---------------------------------------------------------
        # Match
        # ---------------------------------------------------------

        matching_skills = [
            user_skill
            for user_skill in user_skills
            if _skills_match(user_skill, skill_name)
        ]

        if matching_skills:
            proficiency = max(
                normalized_proficiency.get(
                    _skill_alias(user_skill),
                    1.0,
                )
                for user_skill in matching_skills
            )

            matched += weight * proficiency

            matched_skills.append(
                skill_name
            )

        else:

            missing_skills.append(
                skill_name
            )

    score = (
        matched / total * 100
        if total
        else 0.0
    )

    return (
        score,
        matched_skills,
        missing_skills,
    )


# ============================================================================
# EXPLANATION
# ============================================================================

def _build_reason(
    matched_skills: list[str],
    missing_skills: list[str],
    career: Career,
    branch_bonus: float,
    interest_bonus: float,
) -> str:

    parts = []

    if matched_skills:

        if len(matched_skills) > 4:

            matched_text = (
                ", ".join(
                    matched_skills[:4]
                )
                + " and more"
            )

        else:

            matched_text = ", ".join(
                matched_skills
            )

        parts.append(
            f"you already have {matched_text}"
        )

    if branch_bonus > 0:

        parts.append(
            "the career aligns with your academic branch"
        )

    if interest_bonus > 0:

        parts.append(
            "your interests also support this career"
        )

    if missing_skills:

        if len(missing_skills) > 3:

            missing_text = (
                ", ".join(
                    missing_skills[:3]
                )
                + " and more"
            )

        else:

            missing_text = ", ".join(
                missing_skills
            )

        parts.append(
            f"you still need to develop {missing_text}"
        )

    if not parts:

        return (
            f"{career.career_name} is a potential "
            "career option based on the available profile."
        )

    return (
        f"{career.career_name} is a good match because "
        + "; ".join(parts)
        + "."
    )


# ============================================================================
# COURSES
# ============================================================================

def _get_courses_for_skills(
    db: Session,
    missing_skill_names: list[str],
) -> list[dict]:

    if Course is None:
        return []

    if not missing_skill_names:
        return []

    normalized_missing = {
        _skill_alias(skill)
        for skill in missing_skill_names
    }

    rows = (
        db.query(Course, Skill)
        .join(
            Skill,
            Course.skill_id == Skill.id,
        )
        .all()
    )

    courses = []

    for course, skill in rows:

        if (
            _skill_alias(skill.skill_name)
            not in normalized_missing
        ):
            continue

        courses.append(
            {
                "course_name": course.course_name,
                "provider": course.provider,
                "level": course.level,
                "course_url": course.course_url,
                "skill": skill.skill_name,
            }
        )

    return courses


# ============================================================================
# CERTIFICATIONS
# ============================================================================

def _get_certifications(
    db: Session,
    career_id: int,
) -> list[dict]:

    if Certification is None:
        return []

    rows = (
        db.query(Certification)
        .filter(
            Certification.career_id == career_id
        )
        .all()
    )

    return [
        {
            "certification_name": item.certification_name,
            "provider": item.provider,
            "certification_url": item.certification_url,
        }
        for item in rows
    ]


# ============================================================================
# MAIN RECOMMENDER
# ============================================================================

def get_local_recommendation(
    db: Session,
    branch: str,
    skills: list[str],
    interests: list[str],
    proficiency_map: dict[str, str] | None = None,
) -> dict:

    # ------------------------------------------------------------------------
    # Normalize input. Proficiency is used to distinguish a skill the student
    # is just learning from one they can already use confidently.
    # ------------------------------------------------------------------------

    user_skills = {
        _normalize(skill)
        for skill in skills
        if skill and str(skill).strip()
    }

    interests = [
        str(item).strip()
        for item in (interests or [])
        if item and str(item).strip()
    ]

    branch = (
        str(branch).strip()
        if branch
        else ""
    )

    # ------------------------------------------------------------------------
    # Load careers from Supabase
    # ------------------------------------------------------------------------

    careers = (
        db.query(Career)
        .order_by(Career.id)
        .all()
    )

    if not careers:

        raise RuntimeError(
            "No careers found in the PostgreSQL careers table."
        )

    # ------------------------------------------------------------------------
    # Score every career
    # ------------------------------------------------------------------------

    scored = []

    for career in careers:

        # Required skills from Supabase
        career_skills = _get_career_skills(
            db,
            career.id,
        )

        skill_score, matched_skills, missing_skills = (
            _score_skills(
                career_skills,
                user_skills,
                proficiency_map,
            )
        )

        # Branch bonus
        branch_bonus = _branch_matches(
            db,
            career.id,
            branch,
        )

        # Interest bonus
        interest_bonus = _interest_match(
            career,
            interests,
        )

        # ----------------------------------------------------------------
        # Final score
        #
        # Skill score is the main factor.
        # Branch and interests are supporting factors.
        # ----------------------------------------------------------------

        final_score = (
            skill_score * 0.75
            + branch_bonus
            + interest_bonus
        )

        final_score = max(
            0.0,
            min(
                100.0,
                final_score,
            ),
        )

        scored.append(
            {
                "career": career,
                "skills": career_skills,
                "score": final_score,
                "skill_score": skill_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "branch_bonus": branch_bonus,
                "interest_bonus": interest_bonus,
            }
        )

    # ------------------------------------------------------------------------
    # Sort
    # ------------------------------------------------------------------------

    scored.sort(
        key=lambda item: (
            -item["score"],
            item["career"].career_name,
        )
    )

    # ------------------------------------------------------------------------
    # Top careers
    # ------------------------------------------------------------------------

    top5 = scored[:5]

    if not top5:

        raise RuntimeError(
            "Could not calculate career recommendations."
        )

    # ------------------------------------------------------------------------
    # Build job roles
    # ------------------------------------------------------------------------

    job_roles = []

    for item in top5:

        career = item["career"]

        percentage = max(
            0,
            min(
                100,
                round(item["score"]),
            ),
        )

        reason = _build_reason(
            item["matched_skills"],
            item["missing_skills"],
            career,
            item["branch_bonus"],
            item["interest_bonus"],
        )

        job_roles.append(
            {
                "job_role": career.career_name,
                "matchPercentage": percentage,
                "reason": reason,
            }
        )

    # ------------------------------------------------------------------------
    # Best career
    # ------------------------------------------------------------------------

    best = top5[0]

    top_career = best["career"]

    recommended_career = (
        top_career.career_name
    )

    # ------------------------------------------------------------------------
    # Skills to learn
    # ------------------------------------------------------------------------

    skills_to_learn = list(
        best["missing_skills"]
    )

    # Keep database order and remove duplicates
    skills_to_learn = list(
        dict.fromkeys(
            skills_to_learn
        )
    )

    # ------------------------------------------------------------------------
    # Courses from Supabase
    # ------------------------------------------------------------------------

    courses = _get_courses_for_skills(
        db,
        skills_to_learn,
    )

    # ------------------------------------------------------------------------
    # Certifications from Supabase
    # ------------------------------------------------------------------------

    certifications = _get_certifications(
        db,
        top_career.id,
    )

    # ------------------------------------------------------------------------
    # Match reason
    # ------------------------------------------------------------------------

    reason = _build_reason(
        best["matched_skills"],
        best["missing_skills"],
        top_career,
        best["branch_bonus"],
        best["interest_bonus"],
    )

    match_reason = (
        f"{recommended_career} is your strongest match — "
        f"{reason}"
    )

    # ------------------------------------------------------------------------
    # Return
    # ------------------------------------------------------------------------

    return {
        "recommendedCareer": recommended_career,

        "matchReason": match_reason,

        "jobRoles": job_roles,

        "skillsToLearn": skills_to_learn,

        "courses": courses,

        "certifications": certifications,
    }
