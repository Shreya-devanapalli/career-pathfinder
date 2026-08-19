from __future__ import annotations

from urllib.parse import quote_plus

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.career import Career
from app.models.skill import Skill
from app.models.career_skill import CareerSkill
from app.models.course import Course
from app.models.certification import Certification


def _fallback_certifications(career_name: str) -> list[dict]:
    """Offer credible starting certifications when the catalog is incomplete."""
    name = _normalize(career_name)

    if "iot" in name or "internet of things" in name:
        return [
            {
                "certification_name": "Cisco Networking Academy: Introduction to IoT",
                "provider": "Cisco Networking Academy",
                "url": "https://www.netacad.com/courses/iot/introduction-iot",
            },
            {
                "certification_name": "AWS Certified Cloud Practitioner",
                "provider": "Amazon Web Services",
                "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
            },
        ]

    if any(term in name for term in ("data", "analytics", "machine learning", "ai")):
        return [
            {
                "certification_name": "Google Data Analytics Professional Certificate",
                "provider": "Google",
                "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
            },
            {
                "certification_name": "Microsoft Certified: Azure AI Fundamentals",
                "provider": "Microsoft",
                "url": "https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/",
            },
        ]

    if any(term in name for term in ("cyber", "security")):
        return [
            {
                "certification_name": "ISC2 Certified in Cybersecurity",
                "provider": "ISC2",
                "url": "https://www.isc2.org/certifications/cc",
            },
            {
                "certification_name": "Cisco Certified Support Technician Cybersecurity",
                "provider": "Cisco",
                "url": "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/cybersecurity-support-technician/index.html",
            },
        ]

    if any(term in name for term in ("cloud", "devops")):
        return [
            {
                "certification_name": "AWS Certified Cloud Practitioner",
                "provider": "Amazon Web Services",
                "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
            },
            {
                "certification_name": "Microsoft Certified: Azure Fundamentals",
                "provider": "Microsoft",
                "url": "https://learn.microsoft.com/credentials/certifications/azure-fundamentals/",
            },
        ]

    if any(term in name for term in ("software", "web", "developer", "programmer")):
        return [
            {
                "certification_name": "Meta Front-End Developer Professional Certificate",
                "provider": "Meta",
                "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
            },
            {
                "certification_name": "AWS Certified Cloud Practitioner",
                "provider": "Amazon Web Services",
                "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
            },
        ]

    if any(term in name for term in ("mechanical", "civil", "electrical", "electronics", "design", "engineer")):
        return [
            {
                "certification_name": "Autodesk Certified User",
                "provider": "Autodesk",
                "url": "https://www.autodesk.com/certification/overview",
            },
            {
                "certification_name": "Certified SOLIDWORKS Associate (CSWA)",
                "provider": "Dassault Systèmes",
                "url": "https://www.solidworks.com/certifications/certified-solidworks-associate-cswa",
            },
        ]

    return [
        {
            "certification_name": "Google Career Certificates",
            "provider": "Google",
            "url": "https://grow.google/certificates/",
        }
    ]


def _fallback_course(skill_name: str) -> dict:
    """Create a useful course-search recommendation for an unmapped skill."""
    query = quote_plus(f"{skill_name} beginner course")

    return {
        "course_name": f"{skill_name} fundamentals",
        "skill": skill_name,
        "provider": "Coursera",
        "level": "Beginner",
        "url": f"https://www.coursera.org/search?query={query}",
    }


def _normalize(value: str) -> str:
    return " ".join(value.lower().strip().split())


def _skill_matches(user_skill: str, database_skill: str) -> bool:
    user_skill = _normalize(user_skill)
    database_skill = _normalize(database_skill)

    aliases = {
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "powerbi": "power bi",
        "js": "javascript",
        "ts": "typescript",
    }

    user_skill = aliases.get(user_skill, user_skill)
    database_skill = aliases.get(database_skill, database_skill)

    return user_skill == database_skill


def analyze_skill_gap(
    db: Session,
    career_name: str,
    user_skills: list[str],
) -> dict:

    # ---------------------------------------------------------
    # 1. Find career
    # ---------------------------------------------------------

    career = (
    db.query(Career)
    .filter(
        func.lower(Career.career_name) == _normalize(career_name)
    )
    .first()
)

    if not career:
        # Fallback to partial match
        careers = db.query(Career).all()

        target = _normalize(career_name)

        for item in careers:
            name = _normalize(item.career_name)

            if target in name or name in target:
                career = item
                break

    if not career:
        raise ValueError(
            f"Career '{career_name}' was not found."
        )

    # ---------------------------------------------------------
    # 2. Get required skills for this career
    # ---------------------------------------------------------

    rows = (
        db.query(Skill, CareerSkill)
        .join(
            CareerSkill,
            CareerSkill.skill_id == Skill.id,
        )
        .filter(
            CareerSkill.career_id == career.id
        )
        .all()
    )

    required_skills = []

    for skill, career_skill in rows:
        required_skills.append(
            {
                "id": skill.id,
                "name": skill.skill_name,
                "importance": career_skill.importance,
                "skill_type": career_skill.skill_type,
            }
        )

    # ---------------------------------------------------------
    # 3. Normalize user's skills
    # ---------------------------------------------------------

    normalized_user_skills = {
        _normalize(skill)
        for skill in user_skills
        if skill and skill.strip()
    }

    # ---------------------------------------------------------
    # 4. Find possessed / missing skills
    # ---------------------------------------------------------

    possessed = []
    missing = []

    for skill in required_skills:

        if any(
            _skill_matches(
                user_skill,
                skill["name"],
            )
            for user_skill in normalized_user_skills
        ):
            possessed.append(skill)
        else:
            missing.append(skill)

    # ---------------------------------------------------------
    # 5. Calculate percentage
    # ---------------------------------------------------------

    total = len(required_skills)
    matched = len(possessed)

    percentage = (
        round((matched / total) * 100)
        if total
        else 0
    )

    # ---------------------------------------------------------
    # 6. Find courses for missing skills
    # ---------------------------------------------------------

    recommended_courses = []

    for skill in missing:

        courses = (
            db.query(Course)
            .filter(
                Course.skill_id == skill["id"]
            )
            .all()
        )

        for course in courses:

            recommended_courses.append(
                {
                    "id": course.id,
                    "course_name": course.course_name,
                    "skill": skill["name"],
                    "provider": course.provider,
                    "level": course.level,
                    "url": course.course_url,
                }
            )

        # The database catalog can be expanded over time. Until it contains a
        # direct mapping, still give the student an actionable learning link.
        if not courses:
            recommended_courses.append(
                _fallback_course(skill["name"])
            )

    # ---------------------------------------------------------
    # 7. Find certifications for this career
    # ---------------------------------------------------------

    certifications = (
        db.query(Certification)
        .filter(
            Certification.career_id == career.id
        )
        .all()
    )

    recommended_certifications = []

    for certification in certifications:

        recommended_certifications.append(
            {
                "id": certification.id,
                "certification_name": certification.certification_name,
                "provider": certification.provider,
                "url": certification.certification_url,
            }
        )

    # Keep catalog entries first, then complete the list with role-relevant
    # options. This gives every career at least two useful starting choices.
    fallback_certifications = _fallback_certifications(career.career_name)
    known_names = {
        _normalize(item["certification_name"])
        for item in recommended_certifications
    }

    for certification in fallback_certifications:
        if _normalize(certification["certification_name"]) in known_names:
            continue

        recommended_certifications.append(certification)
        known_names.add(_normalize(certification["certification_name"]))

        if len(recommended_certifications) == 2:
            break

    # ---------------------------------------------------------
    # 8. Return result
    # ---------------------------------------------------------

    return {
        "career": career.career_name,

        "skill_match_percentage": percentage,

        "required_skills": [
            skill["name"]
            for skill in required_skills
        ],

        "skills_you_have": [
            skill["name"]
            for skill in possessed
        ],

        "missing_skills": [
            skill["name"]
            for skill in missing
        ],

        "recommended_courses": recommended_courses,

        "recommended_certifications": (
            recommended_certifications
        ),
    }
