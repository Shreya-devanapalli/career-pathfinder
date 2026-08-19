import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChatIn(BaseModel):
    recommendation_id: uuid.UUID
    message: str = Field(min_length=1)


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
