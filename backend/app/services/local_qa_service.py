"""
Local career Q&A engine.

The chatbot tries to answer common career questions locally using:
    - the current recommendation
    - intents.json
    - faq.json
    - simple NLP-style keyword/phrase matching

Groq is used only when this module cannot confidently understand
the user's question.

This keeps most chatbot requests free from Groq API usage.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

from app.services.json_data_service import load_faq, load_intents


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def _normalize(text: str) -> str:
    """Normalize text for safer matching."""
    if not text:
        return ""

    text = text.lower().strip()

    # Normalize common punctuation.
    text = re.sub(r"[^a-z0-9%+\-./\s]", " ", text)

    # Collapse repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text


def _tokens(text: str) -> set[str]:
    """Return normalized word tokens."""
    return set(_normalize(text).split())


# ============================================================
# DATA LOADING
# ============================================================

def _get_intents() -> list[dict[str, Any]]:
    data = load_intents()

    if isinstance(data, dict):
        return data.get("intents", [])

    return data if isinstance(data, list) else []


def _get_faqs() -> list[dict[str, Any]]:
    data = load_faq()

    if isinstance(data, dict):
        return data.get("faqs", [])

    return data if isinstance(data, list) else []


# ============================================================
# INTENT DETECTION
# ============================================================

# More specific intents should be checked before broad intents.
#
# Example:
# "what skills am I missing?"
#
# should become skill_gap, not skills.
#
# "what should I do next?"
#
# should become next_steps, not get_started.
INTENT_PRIORITY = [
    "skill_gap",
    "comparison",
    "best_match",
    "all_roles",
    "salary",
    "certifications",
    "projects",
    "job_readiness",
    "roadmap",
    "get_started",
    "next_steps",
    "courses",
    "skills",
]


# Generic phrases are deliberately excluded from automatic matching
# unless there is additional supporting evidence.
GENERIC_PHRASES = {
    "what should i do",
    "what should i learn",
    "what about",
    "what next",
    "next",
    "help me",
    "tell me",
    "which one",
}


def _phrase_score(message: str, phrase: str) -> float:
    """
    Calculate how strongly a phrase occurs in the message.

    Exact phrase matches receive the highest score.
    """
    message = _normalize(message)
    phrase = _normalize(phrase)

    if not message or not phrase:
        return 0.0

    if phrase in message:
        # Longer phrases are more meaningful.
        words = phrase.split()

        if len(words) >= 4:
            return 1.0

        if len(words) == 3:
            return 0.95

        if len(words) == 2:
            return 0.85

        return 0.65

    # Fuzzy matching only for sufficiently long phrases.
    if len(phrase.split()) >= 3:
        similarity = SequenceMatcher(None, message, phrase).ratio()

        if similarity >= 0.90:
            return 0.85

    return 0.0


def _detect_intent(message: str) -> str | None:
    """
    Detect the most likely intent.

    The detector is deliberately conservative.

    A weak keyword match should NOT automatically trigger a local
    answer because that can result in irrelevant chatbot responses.
    """
    normalized = _normalize(message)

    if not normalized:
        return None

    intents = _get_intents()

    candidates: list[tuple[float, int, str]] = []

    for intent_data in intents:
        intent_name = intent_data.get("intent")

        if not intent_name:
            continue

        keywords = intent_data.get("keywords", [])

        best_phrase_score = 0.0
        matched_keyword = ""

        for keyword in keywords:
            score = _phrase_score(normalized, keyword)

            if score > best_phrase_score:
                best_phrase_score = score
                matched_keyword = keyword

        if best_phrase_score <= 0:
            continue

        # Generic one-word matches such as "skills", "course",
        # "salary", etc. need stronger evidence.
        keyword_words = len(_normalize(matched_keyword).split())

        if keyword_words == 1 and len(normalized.split()) <= 3:
            best_phrase_score *= 0.65

        # Generic phrases should not trigger local answers by themselves.
        if _normalize(matched_keyword) in GENERIC_PHRASES:
            continue

        try:
            priority = INTENT_PRIORITY.index(intent_name)
        except ValueError:
            priority = len(INTENT_PRIORITY)

        candidates.append(
            (
                best_phrase_score,
                -priority,
                intent_name,
            )
        )

    if not candidates:
        return None

    candidates.sort(reverse=True)

    best_score, _, best_intent = candidates[0]

    # Conservative threshold.
    #
    # Exact multi-word phrases usually score 0.85-1.0.
    # Weak one-word matches generally stay below this threshold.
    if best_score < 0.70:
        return None

    # If two intents are very close, prefer Groq rather than
    # confidently returning a potentially unrelated local answer.
    if len(candidates) > 1:
        second_score = candidates[1][0]

        if (
            best_score < 0.90
            and best_score - second_score < 0.10
        ):
            return None

    return best_intent


# ============================================================
# CAREER ROLE HELPERS
# ============================================================

def _extract_job_roles(recommendation) -> list[dict]:
    """Extract job role dictionaries safely from a recommendation."""
    roles = recommendation.job_roles or []

    result = []

    for role in roles:
        if isinstance(role, dict):
            role_name = (
                role.get("job_role")
                or role.get("role")
                or role.get("title")
            )

            if role_name:
                result.append(role)

        else:
            # SQLAlchemy JSON fields should normally return dictionaries,
            # but keep this safe for older records.
            result.append(
                {
                    "job_role": str(role),
                }
            )

    return result


def _role_name(role: dict) -> str:
    return (
        role.get("job_role")
        or role.get("role")
        or role.get("title")
        or ""
    )


def _role_percentage(role: dict) -> int | None:
    value = (
        role.get("matchPercentage")
        if role.get("matchPercentage") is not None
        else role.get("match_percentage")
    )

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _find_role_in_question(
    recommendation,
    message: str,
) -> dict | None:
    """Find a recommended career role explicitly mentioned by the user."""
    normalized_message = _normalize(message)

    roles = _extract_job_roles(recommendation)

    # Check longest role names first.
    roles = sorted(
        roles,
        key=lambda role: len(_normalize(_role_name(role))),
        reverse=True,
    )

    for role in roles:
        name = _normalize(_role_name(role))

        if name and name in normalized_message:
            return role

    # Also check the recommended career itself.
    recommended = _normalize(
        getattr(recommendation, "recommended_career", "")
    )

    if recommended and recommended in normalized_message:
        return {
            "job_role": getattr(
                recommendation,
                "recommended_career",
                "",
            ),
        }

    return None


# ============================================================
# ANSWERS: RECOMMENDATION
# ============================================================

def _answer_best_match(recommendation) -> str:
    roles = _extract_job_roles(recommendation)

    if roles:
        best = roles[0]

        name = _role_name(best)
        percentage = _role_percentage(best)

        if percentage is not None:
            return (
                f"Your strongest career match is {name} "
                f"with a {percentage}% suitability score. "
                f"This is based on how your branch, current skills "
                f"and interests align with the role."
            )

        return (
            f"Your strongest career match is {name}. "
            f"It has the strongest alignment with your current "
            f"branch, skills and interests."
        )

    return (
        f"Your recommended career is "
        f"{recommendation.recommended_career}. "
        f"{recommendation.match_reason}"
    )


def _answer_all_roles(recommendation) -> str:
    roles = _extract_job_roles(recommendation)

    if not roles:
        return (
            f"Your current recommendation is "
            f"{recommendation.recommended_career}."
        )

    lines = ["Here are your top career matches:"]

    for index, role in enumerate(roles, start=1):
        name = _role_name(role)
        percentage = _role_percentage(role)

        if percentage is not None:
            lines.append(
                f"{index}. {name} — {percentage}%"
            )
        else:
            lines.append(
                f"{index}. {name}"
            )

    return "\n".join(lines)


# ============================================================
# ANSWERS: SKILLS
# ============================================================

def _answer_skills(recommendation) -> str:
    skills = recommendation.skills_to_learn or []

    if not skills:
        return (
            "Your current recommendation does not have additional "
            "skills listed. Focus on strengthening the skills you "
            "already have and building practical projects."
        )

    return (
        "Based on your recommendation, the main skills you should "
        "focus on are: "
        + ", ".join(skills)
        + "."
    )


def _answer_courses(recommendation) -> str:
    courses = recommendation.courses or []

    if not courses:
        return (
            "No specific courses are stored for this recommendation yet."
        )

    return (
        "Some useful learning options for your recommended career are: "
        + ", ".join(courses)
        + "."
    )


# ============================================================
# ANSWERS: GET STARTED
# ============================================================

def _answer_get_started(recommendation) -> str:
    skills = recommendation.skills_to_learn or []

    if skills:
        first_skills = skills[:3]

        return (
            f"Start with the fundamentals of "
            f"{recommendation.recommended_career}. "
            f"A good first focus would be "
            f"{', '.join(first_skills)}. "
            f"Then build a small project to apply what you learn."
        )

    return (
        f"Start by strengthening the core skills required for "
        f"{recommendation.recommended_career}, then build practical "
        f"projects and gradually prepare for interviews."
    )


# ============================================================
# ANSWERS: COMPARISON
# ============================================================

def _answer_comparison(
    recommendation,
    message: str,
) -> str | None:

    roles = _extract_job_roles(recommendation)

    if len(roles) < 2:
        return (
            "There are not enough career recommendations available "
            "to make a comparison."
        )

    normalized = _normalize(message)

    mentioned = []

    for role in roles:
        name = _role_name(role)

        if name and _normalize(name) in normalized:
            mentioned.append(role)

    # If two specific roles were mentioned, compare those.
    if len(mentioned) >= 2:
        first = mentioned[0]
        second = mentioned[1]
    else:
        # Otherwise compare the top two.
        first = roles[0]
        second = roles[1]

    first_name = _role_name(first)
    second_name = _role_name(second)

    first_pct = _role_percentage(first)
    second_pct = _role_percentage(second)

    if first_pct is not None and second_pct is not None:
        higher = (
            first_name
            if first_pct >= second_pct
            else second_name
        )

        return (
            f"Comparing {first_name} and {second_name}: "
            f"{first_name} has a {first_pct}% suitability score, "
            f"while {second_name} has {second_pct}%. "
            f"Based on your current profile, {higher} is the stronger "
            f"match. This does not mean it is permanently the better "
            f"career choice; your interests and future skills can change "
            f"the comparison."
        )

    return (
        f"Your top two recommended roles are {first_name} and "
        f"{second_name}. Based on your current recommendation, "
        f"{first_name} is ranked higher."
    )


# ============================================================
# ANSWERS: ROADMAP
# ============================================================

def _answer_roadmap(recommendation) -> str:
    skills = recommendation.skills_to_learn or []
    courses = recommendation.courses or []

    parts = [
        f"A practical roadmap for {recommendation.recommended_career} "
        f"would be:",
        "1. Strengthen the fundamentals.",
    ]

    if skills:
        parts.append(
            "2. Learn: " + ", ".join(skills[:3]) + "."
        )
    else:
        parts.append(
            "2. Build the core technical skills required for the role."
        )

    parts.append(
        "3. Build 2–3 practical projects related to the career."
    )

    if courses:
        parts.append(
            "4. Use courses or certifications such as "
            + ", ".join(courses[:3])
            + "."
        )

    parts.append(
        "5. Prepare your resume and practice role-specific interviews."
    )

    return "\n".join(parts)


# ============================================================
# ANSWERS: JOB READINESS
# ============================================================

def _answer_job_readiness(recommendation) -> str:
    skills = recommendation.skills_to_learn or []

    if skills:
        return (
            f"You have a starting direction for "
            f"{recommendation.recommended_career}. "
            f"To become more job-ready, focus on "
            f"{', '.join(skills[:3])}, build practical projects, "
            f"and prepare for technical interviews."
        )

    return (
        f"To become job-ready for {recommendation.recommended_career}, "
        f"focus on the role's core skills, build practical projects, "
        f"strengthen your resume and practice interviews."
    )


# ============================================================
# ANSWERS: NEXT STEPS
# ============================================================

def _answer_next_steps(recommendation) -> str:
    skills = recommendation.skills_to_learn or []

    if skills:
        return (
            f"Your next step should be to focus on "
            f"{skills[0]}. After that, work through the remaining "
            f"recommended skills and build a project for "
            f"{recommendation.recommended_career}."
        )

    return (
        f"Your next step is to strengthen the core skills for "
        f"{recommendation.recommended_career} and start building "
        f"a practical project."
    )


# ============================================================
# ANSWERS: SALARY
# ============================================================

def _answer_salary(
    recommendation,
    message: str,
) -> str | None:

    # We intentionally do NOT invent salary figures.
    #
    # There is currently no salary dataset in the recommendation
    # structure shown by the project.
    #
    # Therefore this returns None and allows Groq to answer a
    # salary question if the user asks one.
    return None


# ============================================================
# ANSWERS: ROLE SUITABILITY
# ============================================================

def _answer_suitability_for_role(
    recommendation,
    message: str,
) -> str | None:

    role = _find_role_in_question(
        recommendation,
        message,
    )

    if not role:
        return None

    name = _role_name(role)
    percentage = _role_percentage(role)

    if percentage is not None:
        if percentage >= 75:
            level = "strong"
        elif percentage >= 55:
            level = "moderate"
        else:
            level = "developing"

        return (
            f"{name} is a {level} match for your current profile, "
            f"with a {percentage}% suitability score. "
            f"The score reflects the alignment between your branch, "
            f"skills and interests and the requirements of this role."
        )

    return (
        f"{name} is included among your recommended career options. "
        f"Its suitability depends on how closely your current skills "
        f"and interests match the role requirements."
    )


# ============================================================
# FAQ MATCHING
# ============================================================

def _find_faq_answer(message: str) -> str | None:
    """
    Find a FAQ only when there is a strong phrase match.

    This is intentionally stricter than simple keyword matching.
    """
    normalized = _normalize(message)

    if not normalized:
        return None

    faqs = _get_faqs()

    best_answer = None
    best_score = 0.0

    for faq in faqs:
        keywords = faq.get("keywords", [])

        faq_score = 0.0

        for keyword in keywords:
            score = _phrase_score(normalized, keyword)

            if score > faq_score:
                faq_score = score

        if faq_score > best_score:
            best_score = faq_score
            best_answer = faq.get("answer")

    # FAQ requires a strong match.
    if best_score >= 0.80 and best_answer:
        return best_answer

    return None


# ============================================================
# MAIN LOCAL ANSWER FUNCTION
# ============================================================

def try_answer_locally(
    recommendation,
    message: str,
) -> str | None:
    """
    Attempt to answer the user's question without Groq.

    Returns:
        str  -> confident local answer
        None -> question should be passed to Groq
    """

    if not message or not message.strip():
        return None

    normalized_message = _normalize(message)

    # ---------------------------------------------------------
    # 1. Explicit role question detection
    # ---------------------------------------------------------
    #
    # Handle questions such as:
    #
    # "Is Data Scientist suitable for me?"
    # "Is ML Engineer a good fit?"
    # "What about Data Analyst?"
    #
    # Only do this when the user actually mentions a known role.
    # ---------------------------------------------------------

    role_question_words = [
        "suitable",
        "suitability",
        "match",
        "fit",
        "good for me",
        "good career",
        "should i choose",
        "what about",
        "is this good",
        "is it good",
    ]

    role = _find_role_in_question(
        recommendation,
        message,
    )

    if role and any(
        phrase in normalized_message
        for phrase in role_question_words
    ):
        return _answer_suitability_for_role(
            recommendation,
            message,
        )

    # ---------------------------------------------------------
    # 2. Detect intent
    # ---------------------------------------------------------

    intent = _detect_intent(message)

    # ---------------------------------------------------------
    # 3. Recommendation-specific answers
    # ---------------------------------------------------------

    if intent == "best_match":
        return _answer_best_match(recommendation)

    if intent == "all_roles":
        return _answer_all_roles(recommendation)

    if intent == "skill_gap":
        return _answer_skills(recommendation)

    if intent == "skills":
        return _answer_skills(recommendation)

    if intent == "courses":
        return _answer_courses(recommendation)

    if intent == "certifications":
        return _answer_courses(recommendation)

    if intent == "get_started":
        return _answer_get_started(recommendation)

    if intent == "comparison":
        return _answer_comparison(
            recommendation,
            message,
        )

    if intent == "roadmap":
        return _answer_roadmap(recommendation)

    if intent == "job_readiness":
        return _answer_job_readiness(recommendation)

    if intent == "next_steps":
        return _answer_next_steps(recommendation)

    if intent == "salary":
        salary_answer = _answer_salary(
            recommendation,
            message,
        )

        if salary_answer:
            return salary_answer

    # ---------------------------------------------------------
    # 4. General FAQ
    # ---------------------------------------------------------

    faq_answer = _find_faq_answer(message)

    if faq_answer:
        return faq_answer

    # ---------------------------------------------------------
    # 5. Unknown question
    # ---------------------------------------------------------
    #
    # Returning None is IMPORTANT.
    #
    # chat.py will then send the question to Groq.
    # ---------------------------------------------------------

    return None
