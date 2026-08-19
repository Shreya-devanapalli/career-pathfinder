import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.chat import ChatMessage
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.chat import ChatIn, ChatMessageOut
from app.services.groq_service import get_followup_reply
from app.services.local_qa_service import try_answer_locally

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _offline_reply(recommendation: Recommendation) -> str:
    """Give the student useful guidance when the optional AI service is off."""
    next_skills = recommendation.skills_to_learn or []
    skills_text = ", ".join(next_skills[:3])

    if skills_text:
        return (
            f"For your {recommendation.recommended_career} path, focus next on "
            f"{skills_text}. Build one small project that uses those skills, then "
            "add it to your portfolio before moving on to the next roadmap stage."
        )

    return (
        f"Your {recommendation.recommended_career} recommendation is a strong "
        "starting point. Review the roadmap, choose one practical project, and "
        "use the Skill Gap page to plan your next learning steps."
    )


@router.post("", response_model=ChatMessageOut)
async def send_message(
    payload: ChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = (
        db.query(Recommendation)
        .filter(Recommendation.id == payload.recommendation_id, Recommendation.user_id == current_user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    user_msg = ChatMessage(
        user_id=current_user.id,
        recommendation_id=rec.id,
        role="user",
        content=payload.message,
    )
    db.add(user_msg)
    db.commit()

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.recommendation_id == rec.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # First trying to answer from our predefined faq model,entirely locally.
    # But Groq is only called for questions that don't match a known pattern for the local model.
    # This keeps the chat usage and quota burn much lower than before.
    local_reply = try_answer_locally(rec, payload.message)
    if local_reply is not None:
        reply_text = local_reply
    else:
        try:
            reply_text = await get_followup_reply(rec, history, payload.message)
        except Exception as e:
            print("GROQ ERROR:", repr(e))
            reply_text = (
                "I couldn't connect to the AI service right now. "
                f"Error: {str(e)}"
                )

    bot_msg = ChatMessage(
        user_id=current_user.id,
        recommendation_id=rec.id,
        role="bot",
        content=reply_text,
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    return bot_msg


@router.get("/{recommendation_id}", response_model=list[ChatMessageOut])
def get_history(
    recommendation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.recommendation_id == recommendation_id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
