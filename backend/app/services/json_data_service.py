import json
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_json(filename: str):
    """Load a JSON file from app/data/."""
    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise FileNotFoundError(
            f"JSON data file not found: {file_path}"
        )

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def _load_list(filename: str, key: str):
    data = load_json(filename)

    # Supports:
    # { "careers": [...] }
    if isinstance(data, dict):
        return data.get(key, [])

    # Also supports:
    # [...]
    if isinstance(data, list):
        return data

    return []


def load_careers():
    return _load_list("careers.json", "careers")


def load_intents():
    return _load_list("intents.json", "intents")


def load_faq():
    return _load_list("faq.json", "faqs")


def load_skills():
    return _load_list("skills.json", "skills")


def load_courses():
    return _load_list("courses.json", "courses")


def load_certifications():
    return _load_list("certifications.json", "certifications")


def load_roadmaps():
    return _load_list("roadmaps.json", "roadmaps")


def load_projects():
    return _load_list("projects.json", "projects")


def load_followup_questions():
    return _load_list("followup_questions.json", "questions")