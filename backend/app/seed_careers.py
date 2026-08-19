"""
Seed the careers table from app/data/careers.json.

Run manually:

    cd backend
    python -m app.seed_careers

The application can also call seed_if_empty() during startup.
"""

from __future__ import annotations

from app.db.session import SessionLocal
from app.models.career import Career
from app.services.json_data_service import load_careers


def seed_careers(db) -> int:
    """
    Load careers.json and insert/update career records
    in PostgreSQL.

    Returns the number of newly created careers.
    """

    careers = load_careers()

    created = 0

    for entry in careers:

        # careers.json uses "career" as the role name
        title = entry.get("career")

        if not title:
            continue

        existing = (
            db.query(Career)
            .filter(Career.career_name == title)
            .first()
        )

        # Convert JSON structure into database structure
        career_data = {
            "title": title,

            "description": entry.get(
                "description",
                ""
            ),

            "branches": entry.get(
                "branches",
                []
            ),

            "core_skills": entry.get(
                "core_skills",
                []
            ),

            # JSON uses nice_to_have_skills
            # Database uses nice_skills
            "nice_skills": entry.get(
                "nice_to_have_skills",
                []
            ),

            "interests": entry.get(
                "interests",
                []
            ),

            "skills_to_learn": entry.get(
                "skills_to_learn",
                []
            ),

            "courses": entry.get(
                "courses",
                []
            ),

            "projects": entry.get(
                "projects",
                []
            ),

            "certifications": entry.get(
                "certifications",
                []
            ),

            "salary_range": entry.get(
                "salary_range",
                {}
            ),

            "growth": entry.get(
                "growth",
                ""
            ),
        }

        if existing:

            existing.description = career_data["description"]
            existing.branches = career_data["branches"]
            existing.core_skills = career_data["core_skills"]
            existing.nice_skills = career_data["nice_skills"]
            existing.interests = career_data["interests"]
            existing.skills_to_learn = career_data["skills_to_learn"]
            existing.courses = career_data["courses"]
            existing.projects = career_data["projects"]
            existing.certifications = career_data["certifications"]
            existing.salary_range = career_data["salary_range"]
            existing.growth = career_data["growth"]

        else:

            db.add(
                Career(**career_data)
            )

            created += 1

    db.commit()

    return created


def seed_if_empty(db) -> int:
    """
    Seed the database only when the careers table is empty.
    """

    if db.query(Career).first() is None:
        return seed_careers(db)

    return 0


if __name__ == "__main__":

    session = SessionLocal()

    try:

        created = seed_careers(session)

        total = (
            session.query(Career).count()
        )

        print(
            f"Seed complete: "
            f"{created} new careers created, "
            f"{total} total rows in careers."
        )

    finally:

        session.close()