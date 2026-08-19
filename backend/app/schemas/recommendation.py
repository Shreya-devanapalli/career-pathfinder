import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class JobRoleMatch(BaseModel):
    job_role: str
    match_percentage: int = Field(alias="matchPercentage")
    reason: str

    class Config:
        from_attributes = True
        populate_by_name = True


class CourseRecommendation(BaseModel):
    level: str
    skill: str
    provider: str
    course_url: str
    course_name: str

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: uuid.UUID
    branch: str
    skills: list[str]
    interests: list[str]
    recommended_career: str
    match_reason: str
    job_roles: list[JobRoleMatch]
    skills_to_learn: list[str]
    courses: list[CourseRecommendation]
    created_at: datetime

    class Config:
        from_attributes = True