import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import GUID

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    recommendation_id = Column(GUID, ForeignKey("recommendations.id"), nullable=True)

    role = Column(String, nullable=False)  # "user" | "bot"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
    recommendation = relationship("Recommendation", back_populates="chat_messages")
