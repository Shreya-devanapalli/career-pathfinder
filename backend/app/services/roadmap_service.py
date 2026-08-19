from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


def _normalize(value: str) -> str:
    return " ".join(
        (value or "").lower().strip().split()
    )


def _unique_skills(skills: list[str]) -> list[str]:
    """Return skill names once, keeping the original database order."""
    seen = set()
    result = []

    for skill in skills:
        key = _normalize(skill)
        if key and key not in seen:
            seen.add(key)
            result.append(skill)

    return result


def _split_repeated_phase_skills(phases: list[dict]) -> list[dict]:
    """Repair older roadmaps whose every phase contains the same skills.

    Earlier seed data copied each career's full skill list into every phase.
    Rather than displaying that duplication, turn it into a practical learning
    sequence: fundamentals first, then tooling, integration, and job prep.
    """
    if len(phases) < 2:
        return phases

    skill_lists = [_unique_skills(phase["skills"]) for phase in phases]
    first_list = skill_lists[0]

    if not first_list or not all(skills == first_list for skills in skill_lists[1:]):
        for phase, skills in zip(phases, skill_lists):
            phase["skills"] = skills
        return phases

    # Reserve the final two stages for applying and presenting the career's
    # own skills. This works for every domain (software, design, analytics,
    # engineering, and business) without making assumptions about the role.
    learning_stage_count = max(1, len(phases) - 2)
    groups = [[] for _ in range(learning_stage_count)]

    # Split the list into contiguous, balanced groups. Keeping the source
    # order makes early stages feel like foundations and later stages build on
    # them, regardless of how many skills a role contains.
    for index, skill in enumerate(first_list):
        stage_index = min(
            index * learning_stage_count // len(first_list),
            learning_stage_count - 1,
        )
        groups[stage_index].append(skill)

    if len(phases) >= 2:
        groups.append([
            "Applied practice using the skills above",
            "Testing, review, and improvement",
        ])
        groups.append([
            "Portfolio project or case study",
            "Resume, interview, and job preparation",
        ])

    for index, phase in enumerate(phases):
        phase["skills"] = groups[index] if index < len(groups) else []

    return phases


def get_career_roadmap(
    career_name: str,
    db: Session
) -> dict:

    target = _normalize(career_name)

    # Find career
    career = db.execute(
        text("""
            SELECT id, career_name, description, industry
            FROM public.careers
            WHERE lower(trim(career_name)) = :career_name
            LIMIT 1
        """),
        {
            "career_name": target
        }
    ).mappings().first()

    # Partial match if exact match was not found
    if not career:
        career = db.execute(
            text("""
                SELECT id, career_name, description, industry
                FROM public.careers
                WHERE lower(trim(career_name)) LIKE :pattern
                   OR :career_name LIKE '%' || lower(trim(career_name)) || '%'
                LIMIT 1
            """),
            {
                "career_name": target,
                "pattern": f"%{target}%"
            }
        ).mappings().first()

    if not career:
        raise ValueError(
            f"Career '{career_name}' was not found."
        )

    career_id = career["id"]

    # Find roadmap
    roadmap = db.execute(
        text("""
            SELECT
                id,
                career_id,
                title,
                description
            FROM public.roadmaps
            WHERE career_id = :career_id
            ORDER BY id
            LIMIT 1
        """),
        {
            "career_id": career_id
        }
    ).mappings().first()

    if not roadmap:
        raise ValueError(
            f"Roadmap for '{career_name}' was not found."
        )

    roadmap_id = roadmap["id"]

    # Get phases + skills
    rows = db.execute(
        text("""
            SELECT
                rp.id AS phase_id,
                rp.phase_number,
                rp.title AS phase_title,
                rp.description AS phase_description,
                s.id AS skill_id,
                s.skill_name,
                s.category
            FROM public.roadmap_phases rp
            LEFT JOIN public.roadmap_phase_skills rps
                ON rps.roadmap_phase_id = rp.id
            LEFT JOIN public.skills s
                ON s.id = rps.skill_id
            WHERE rp.roadmap_id = :roadmap_id
            ORDER BY
                rp.phase_number,
                s.id
        """),
        {
            "roadmap_id": roadmap_id
        }
    ).mappings().all()

    phases = {}

    for row in rows:
        phase_number = row["phase_number"]

        if phase_number not in phases:
            phases[phase_number] = {
                "phase": phase_number,
                "title": row["phase_title"],
                "description": row["phase_description"],
                "skills": []
            }

        if row["skill_id"] is not None:
            phases[phase_number]["skills"].append(
                row["skill_name"]
            )

    ordered_phases = _split_repeated_phase_skills(list(phases.values()))

    return {
        "career": career["career_name"],
        "career_id": career_id,
        "roadmap_id": roadmap_id,
        "title": roadmap["title"],
        "description": roadmap["description"],
        "phases": ordered_phases,
    }
