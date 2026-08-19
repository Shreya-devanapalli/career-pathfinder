import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import GUID


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False)

    branch = Column(String, nullable=False)
    skills = Column(JSON, default=list)
    interests = Column(JSON, default=list)

    recommended_career = Column(String, nullable=False)
    match_reason = Column(Text, nullable=False)
    job_roles = Column(JSON, default=list)
    skills_to_learn = Column(JSON, default=list)
    courses = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    chat_messages = relationship("ChatMessage", back_populates="recommendation", cascade="all, delete-orphan")
