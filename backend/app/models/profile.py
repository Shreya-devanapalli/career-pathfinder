import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import GUID


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), unique=True, nullable=False)

    branch = Column(String, nullable=False)
    skills = Column(JSON, default=list)
    interests = Column(JSON, default=list)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
