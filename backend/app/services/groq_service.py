from groq import Groq

from app.core.config import get_settings


settings = get_settings()


def _get_client() -> Groq:
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env."
        )

    return Groq(api_key=settings.groq_api_key)


async def get_followup_reply(
    recommendation,
    history,
    message: str,
) -> str:
    """Generate a concise, personalized follow-up reply with Groq."""
    prior_messages = history[:-1] if history else []
    transcript = "\n".join(
        f"{item.role}: {item.content}"
        for item in prior_messages
    )

    role_text = []
    for role in recommendation.job_roles or []:
        if isinstance(role, dict):
            role_name = role.get("job_role") or role.get("role", "")
            percentage = role.get("match_percentage") or role.get("matchPercentage")
            if role_name:
                suffix = f" ({percentage}% suitability)" if percentage is not None else ""
                role_text.append(f"{role_name}{suffix}")
        else:
            role_text.append(str(role))

    prompt = f"""
You are a friendly and knowledgeable career guidance chatbot.

Student profile:
Branch: {recommendation.branch}
Skills: {', '.join(recommendation.skills or [])}
Interests: {', '.join(recommendation.interests or [])}
Career recommendation: {recommendation.recommended_career}
Career role matches: {', '.join(role_text)}
Earlier recommendation explanation: {recommendation.match_reason}
Skills to learn: {', '.join(recommendation.skills_to_learn or [])}

Conversation so far:
{transcript}

The student now says:
"{message}"

Answer naturally and personally in 2-5 sentences. Refer to suitability percentages when relevant,
do not promise employment, and return plain text only.
"""

    completion = _get_client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "You provide concise, practical career guidance."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_completion_tokens=400,
    )

    reply = completion.choices[0].message.content
    if not reply:
        raise RuntimeError("Groq returned an empty response.")
    return reply.strip()
