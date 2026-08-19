import json
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename):
    path = DATA_DIR / filename

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize(value):
    if value is None:
        return ""

    return str(value).strip().lower()


def find_skill_id(session, skill_name):
    result = session.execute(
        text("""
            SELECT id
            FROM public.skills
            WHERE lower(trim(skill_name)) = :name
            LIMIT 1
        """),
        {"name": normalize(skill_name)}
    ).first()

    if result:
        return result[0]

    return None


def get_or_create_skill(session, skill_name, category=None):
    skill_id = find_skill_id(session, skill_name)

    if skill_id:
        return skill_id

    result = session.execute(
        text("""
            INSERT INTO public.skills (skill_name, category)
            VALUES (:name, :category)
            RETURNING id
        """),
        {
            "name": skill_name,
            "category": category
        }
    )

    return result.scalar_one()


def find_career_id(session, career_name):
    result = session.execute(
        text("""
            SELECT id
            FROM public.careers
            WHERE lower(trim(career_name)) = :name
            LIMIT 1
        """),
        {"name": normalize(career_name)}
    ).first()

    if result:
        return result[0]

    return None


def find_branch_id(session, branch_name):
    result = session.execute(
        text("""
            SELECT id
            FROM public.branches
            WHERE lower(trim(branch_name)) = :name
            LIMIT 1
        """),
        {"name": normalize(branch_name)}
    ).first()

    if result:
        return result[0]

    return None


def migrate_skills(session):
    data = load_json("skills.json")

    skills = data.get("skills", [])

    inserted = 0

    for skill in skills:
        name = skill.get("name")

        if not name:
            continue

        existing = find_skill_id(session, name)

        if existing:
            continue

        session.execute(
            text("""
                INSERT INTO public.skills
                    (skill_name, category)
                VALUES
                    (:name, :category)
            """),
            {
                "name": name,
                "category": skill.get("category")
            }
        )

        inserted += 1

    print(f"Skills inserted: {inserted}")


def migrate_career_skills_and_branches(session):
    careers = load_json("careers.json")

    skill_count = 0
    branch_count = 0

    for career in careers:
        career_name = career.get("career")

        career_id = find_career_id(session, career_name)

        if not career_id:
            print(f"WARNING: Career not found: {career_name}")
            continue

        # -------------------------------
        # Career branches
        # -------------------------------

        for branch_name in career.get("branches", []):
            branch_id = find_branch_id(session, branch_name)

            if not branch_id:
                print(
                    f"WARNING: Branch not found: "
                    f"{branch_name} for {career_name}"
                )
                continue

            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.career_branches
                    WHERE career_id = :career_id
                      AND branch_id = :branch_id
                    LIMIT 1
                """),
                {
                    "career_id": career_id,
                    "branch_id": branch_id
                }
            ).first()

            if not exists:
                session.execute(
                    text("""
                        INSERT INTO public.career_branches
                            (career_id, branch_id, relevance)
                        VALUES
                            (:career_id, :branch_id, :relevance)
                    """),
                    {
                        "career_id": career_id,
                        "branch_id": branch_id,
                        "relevance": "primary"
                    }
                )

                branch_count += 1

        # -------------------------------
        # Core skills
        # -------------------------------

        for skill_name in career.get("core_skills", []):
            skill_id = get_or_create_skill(session, skill_name)

            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.career_skills
                    WHERE career_id = :career_id
                      AND skill_id = :skill_id
                """),
                {
                    "career_id": career_id,
                    "skill_id": skill_id
                }
            ).first()

            if not exists:
                session.execute(
                    text("""
                        INSERT INTO public.career_skills
                            (career_id, skill_id, importance, skill_type)
                        VALUES
                            (:career_id, :skill_id, :importance, :skill_type)
                    """),
                    {
                        "career_id": career_id,
                        "skill_id": skill_id,
                        "importance": "high",
                        "skill_type": "core"
                    }
                )

                skill_count += 1

        # -------------------------------
        # Nice-to-have skills
        # -------------------------------

        for skill_name in career.get("nice_to_have_skills", []):
            skill_id = get_or_create_skill(session, skill_name)

            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.career_skills
                    WHERE career_id = :career_id
                      AND skill_id = :skill_id
                """),
                {
                    "career_id": career_id,
                    "skill_id": skill_id
                }
            ).first()

            if not exists:
                session.execute(
                    text("""
                        INSERT INTO public.career_skills
                            (career_id, skill_id, importance, skill_type)
                        VALUES
                            (:career_id, :skill_id, :importance, :skill_type)
                    """),
                    {
                        "career_id": career_id,
                        "skill_id": skill_id,
                        "importance": "medium",
                        "skill_type": "nice_to_have"
                    }
                )

                skill_count += 1

    print(f"Career-skill relationships inserted: {skill_count}")
    print(f"Career-branch relationships inserted: {branch_count}")


def migrate_courses(session):
    data = load_json("courses.json")

    courses = data.get("courses", [])

    inserted = 0

    for course in courses:
        skill_name = course.get("skill")
        skill_id = find_skill_id(session, skill_name)

        if not skill_id:
            skill_id = get_or_create_skill(session, skill_name)

        exists = session.execute(
            text("""
                SELECT 1
                FROM public.courses
                WHERE lower(trim(course_name)) = :course_name
            """),
            {
                "course_name": normalize(course.get("title"))
            }
        ).first()

        if exists:
            continue

        session.execute(
            text("""
                INSERT INTO public.courses
                    (
                        course_name,
                        skill_id,
                        provider,
                        level,
                        course_url
                    )
                VALUES
                    (
                        :course_name,
                        :skill_id,
                        :provider,
                        :level,
                        :url
                    )
            """),
            {
                "course_name": course.get("title"),
                "skill_id": skill_id,
                "provider": course.get("provider"),
                "level": course.get("level"),
                "url": course.get("url")
            }
        )

        inserted += 1

    print(f"Courses inserted: {inserted}")


def migrate_certifications(session):
    data = load_json("certifications.json")

    certifications = data.get("certifications", [])

    inserted = 0

    for cert in certifications:
        skill_name = cert.get("skill")
        skill_id = find_skill_id(session, skill_name)

        if not skill_id:
            skill_id = get_or_create_skill(session, skill_name)

        # Your current certifications table does not have skill_id.
        # Therefore certification is inserted without a career association.
        exists = session.execute(
            text("""
                SELECT 1
                FROM public.certifications
                WHERE lower(trim(certification_name)) = :name
            """),
            {
                "name": normalize(cert.get("title"))
            }
        ).first()

        if exists:
            continue

        session.execute(
            text("""
                INSERT INTO public.certifications
                    (
                        certification_name,
                        provider,
                        certification_url
                    )
                VALUES
                    (
                        :name,
                        :provider,
                        :url
                    )
            """),
            {
                "name": cert.get("title"),
                "provider": cert.get("provider"),
                "url": cert.get("url")
            }
        )

        inserted += 1

    print(f"Certifications inserted: {inserted}")


def migrate_projects(session):
    data = load_json("projects.json")

    projects_data = data.get("projects", [])

    inserted = 0
    relationships = 0

    for career_group in projects_data:
        career_name = career_group.get("career")

        career_id = find_career_id(session, career_name)

        if not career_id:
            print(f"WARNING: Career not found for projects: {career_name}")
            continue

        for project in career_group.get("projects", []):
            title = project.get("title")

            existing = session.execute(
                text("""
                    SELECT id
                    FROM public.projects
                    WHERE lower(trim(title)) = :title
                    LIMIT 1
                """),
                {
                    "title": normalize(title)
                }
            ).first()

            if existing:
                project_id = existing[0]
            else:
                result = session.execute(
                    text("""
                        INSERT INTO public.projects
                            (title, description, level)
                        VALUES
                            (:title, :description, :level)
                        RETURNING id
                    """),
                    {
                        "title": title,
                        "description": project.get("description"),
                        "level": project.get("level")
                    }
                )

                project_id = result.scalar_one()
                inserted += 1

            career_exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.career_projects
                    WHERE career_id = :career_id
                      AND project_id = :project_id
                """),
                {
                    "career_id": career_id,
                    "project_id": project_id
                }
            ).first()

            if not career_exists:
                session.execute(
                    text("""
                        INSERT INTO public.career_projects
                            (career_id, project_id)
                        VALUES
                            (:career_id, :project_id)
                    """),
                    {
                        "career_id": career_id,
                        "project_id": project_id
                    }
                )

                relationships += 1

            for skill_name in project.get("skills", []):
                skill_id = get_or_create_skill(session, skill_name)

                skill_exists = session.execute(
                    text("""
                        SELECT 1
                        FROM public.project_skills
                        WHERE project_id = :project_id
                          AND skill_id = :skill_id
                    """),
                    {
                        "project_id": project_id,
                        "skill_id": skill_id
                    }
                ).first()

                if not skill_exists:
                    session.execute(
                        text("""
                            INSERT INTO public.project_skills
                                (project_id, skill_id)
                            VALUES
                                (:project_id, :skill_id)
                        """),
                        {
                            "project_id": project_id,
                            "skill_id": skill_id
                        }
                    )

    print(f"Projects inserted: {inserted}")
    print(f"Career-project relationships: {relationships}")


def migrate_roadmaps(session):
    roadmaps = load_json("roadmaps.json")

    inserted = 0
    phases_inserted = 0
    skills_inserted = 0

    for roadmap_data in roadmaps:
        career_name = roadmap_data.get("career")

        career_id = find_career_id(session, career_name)

        if not career_id:
            print(f"WARNING: Career not found for roadmap: {career_name}")
            continue

        existing = session.execute(
            text("""
                SELECT id
                FROM public.roadmaps
                WHERE career_id = :career_id
                LIMIT 1
            """),
            {
                "career_id": career_id
            }
        ).first()

        if existing:
            roadmap_id = existing[0]
        else:
            result = session.execute(
                text("""
                    INSERT INTO public.roadmaps
                        (career_id, title)
                    VALUES
                        (:career_id, :title)
                    RETURNING id
                """),
                {
                    "career_id": career_id,
                    "title": f"{career_name} Roadmap"
                }
            )

            roadmap_id = result.scalar_one()
            inserted += 1

        for phase in roadmap_data.get("phases", []):
            phase_number = phase.get("phase")
            title = phase.get("title")

            existing_phase = session.execute(
                text("""
                    SELECT id
                    FROM public.roadmap_phases
                    WHERE roadmap_id = :roadmap_id
                      AND phase_number = :phase_number
                    LIMIT 1
                """),
                {
                    "roadmap_id": roadmap_id,
                    "phase_number": phase_number
                }
            ).first()

            if existing_phase:
                phase_id = existing_phase[0]
            else:
                result = session.execute(
                    text("""
                        INSERT INTO public.roadmap_phases
                            (
                                roadmap_id,
                                phase_number,
                                title
                            )
                        VALUES
                            (
                                :roadmap_id,
                                :phase_number,
                                :title
                            )
                        RETURNING id
                    """),
                    {
                        "roadmap_id": roadmap_id,
                        "phase_number": phase_number,
                        "title": title
                    }
                )

                phase_id = result.scalar_one()
                phases_inserted += 1

            for skill_name in phase.get("skills", []):
                skill_id = get_or_create_skill(session, skill_name)

                exists = session.execute(
                    text("""
                        SELECT 1
                        FROM public.roadmap_phase_skills
                        WHERE roadmap_phase_id = :phase_id
                          AND skill_id = :skill_id
                    """),
                    {
                        "phase_id": phase_id,
                        "skill_id": skill_id
                    }
                ).first()

                if not exists:
                    session.execute(
                        text("""
                            INSERT INTO public.roadmap_phase_skills
                                (
                                    roadmap_phase_id,
                                    skill_id
                                )
                            VALUES
                                (
                                    :phase_id,
                                    :skill_id
                                )
                        """),
                        {
                            "phase_id": phase_id,
                            "skill_id": skill_id
                        }
                    )

                    skills_inserted += 1

    print(f"Roadmaps inserted: {inserted}")
    print(f"Roadmap phases inserted: {phases_inserted}")
    print(f"Roadmap-phase skills inserted: {skills_inserted}")


def migrate_faqs(session):
    data = load_json("faq.json")

    faqs = data.get("faqs", [])

    inserted = 0

    for faq in faqs:
        exists = session.execute(
            text("""
                SELECT 1
                FROM public.faqs
                WHERE question = :question
                LIMIT 1
            """),
            {
                "question": faq.get("question")
            }
        ).first()

        if exists:
            continue

        session.execute(
            text("""
                INSERT INTO public.faqs
                    (
                        intent,
                        question,
                        keywords,
                        answer
                    )
                VALUES
                    (
                        :intent,
                        :question,
                        :keywords,
                        :answer
                    )
            """),
            {
                "intent": faq.get("intent"),
                "question": faq.get("question"),
                "keywords": faq.get("keywords", []),
                "answer": faq.get("answer")
            }
        )

        inserted += 1

    print(f"FAQs inserted: {inserted}")


def migrate_intents(session):
    data = load_json("intents.json")

    intents = data.get("intents", [])

    inserted = 0

    for item in intents:
        intent_name = item.get("intent")

        exists = session.execute(
            text("""
                SELECT 1
                FROM public.intents
                WHERE intent = :intent
                LIMIT 1
            """),
            {
                "intent": intent_name
            }
        ).first()

        if exists:
            continue

        session.execute(
            text("""
                INSERT INTO public.intents
                    (
                        intent,
                        description,
                        keywords
                    )
                VALUES
                    (
                        :intent,
                        :description,
                        :keywords
                    )
            """),
            {
                "intent": intent_name,
                "description": item.get("description"),
                "keywords": item.get("keywords", [])
            }
        )

        inserted += 1

    print(f"Intents inserted: {inserted}")


def migrate_followup_questions(session):
    data = load_json("followup_questions.json")

    questions = data.get("questions", {})

    inserted = 0

    for category, question_list in questions.items():
        for order, question in enumerate(question_list, start=1):

            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.followup_questions
                    WHERE category = :category
                      AND question = :question
                    LIMIT 1
                """),
                {
                    "category": category,
                    "question": question
                }
            ).first()

            if exists:
                continue

            session.execute(
                text("""
                    INSERT INTO public.followup_questions
                        (
                            category,
                            question,
                            display_order
                        )
                    VALUES
                        (
                            :category,
                            :question,
                            :display_order
                        )
                """),
                {
                    "category": category,
                    "question": question,
                    "display_order": order
                }
            )

            inserted += 1

    print(f"Follow-up questions inserted: {inserted}")


def migrate_evaluation_profiles(session):
    profiles = load_json("evaluation_profiles.json")

    inserted = 0
    profile_skills = 0
    profile_interests = 0

    for index, profile in enumerate(profiles, start=1):

        branch_id = find_branch_id(
            session,
            profile.get("branch")
        )

        career_id = find_career_id(
            session,
            profile.get("expected_career")
        )

        profile_name = (
            f"Evaluation Profile {index}: "
            f"{profile.get('expected_career')}"
        )

        result = session.execute(
            text("""
                INSERT INTO public.evaluation_profiles
                    (
                        branch_id,
                        expected_career_id,
                        profile_name
                    )
                VALUES
                    (
                        :branch_id,
                        :career_id,
                        :profile_name
                    )
                RETURNING id
            """),
            {
                "branch_id": branch_id,
                "career_id": career_id,
                "profile_name": profile_name
            }
        )

        profile_id = result.scalar_one()
        inserted += 1

        for skill_name in profile.get("skills", []):
            skill_id = get_or_create_skill(session, skill_name)

            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.evaluation_profile_skills
                    WHERE profile_id = :profile_id
                      AND skill_id = :skill_id
                """),
                {
                    "profile_id": profile_id,
                    "skill_id": skill_id
                }
            ).first()

            if not exists:
                session.execute(
                    text("""
                        INSERT INTO public.evaluation_profile_skills
                            (
                                profile_id,
                                skill_id
                            )
                        VALUES
                            (
                                :profile_id,
                                :skill_id
                            )
                    """),
                    {
                        "profile_id": profile_id,
                        "skill_id": skill_id
                    }
                )

                profile_skills += 1

        for interest in profile.get("interests", []):
            exists = session.execute(
                text("""
                    SELECT 1
                    FROM public.evaluation_profile_interests
                    WHERE profile_id = :profile_id
                      AND interest = :interest
                """),
                {
                    "profile_id": profile_id,
                    "interest": interest
                }
            ).first()

            if not exists:
                session.execute(
                    text("""
                        INSERT INTO public.evaluation_profile_interests
                            (
                                profile_id,
                                interest
                            )
                        VALUES
                            (
                                :profile_id,
                                :interest
                            )
                    """),
                    {
                        "profile_id": profile_id,
                        "interest": interest
                    }
                )

                profile_interests += 1

    print(f"Evaluation profiles inserted: {inserted}")
    print(f"Profile skills inserted: {profile_skills}")
    print(f"Profile interests inserted: {profile_interests}")


def main():
    if not settings.database_url:
        raise RuntimeError(
            "DATABASE_URL is not configured in backend/.env"
        )

    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True
    )

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False
    )

    session = SessionLocal()

    try:
        print("=" * 60)
        print("JSON → SUPABASE MIGRATION")
        print("=" * 60)

        migrate_skills(session)
        session.commit()

        migrate_career_skills_and_branches(session)
        session.commit()

        migrate_courses(session)
        session.commit()

        migrate_certifications(session)
        session.commit()

        migrate_projects(session)
        session.commit()

        migrate_roadmaps(session)
        session.commit()

        migrate_faqs(session)
        session.commit()

        migrate_intents(session)
        session.commit()

        migrate_followup_questions(session)
        session.commit()

        migrate_evaluation_profiles(session)
        session.commit()

        print("=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)

    except Exception:
        session.rollback()
        raise

    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    main()