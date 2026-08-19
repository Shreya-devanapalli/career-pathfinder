from pydantic import BaseModel


class SkillGapIn(BaseModel):
    skills: list[str]


class CourseOut(BaseModel):
    skill: str | None = None
    title: str
    provider: str
    level: str
    url: str


class CertificationOut(BaseModel):
    skill: str | None = None
    title: str
    provider: str
    level: str
    url: str


class SkillGapOut(BaseModel):
    career: str
    skill_match_percentage: int
    required_skills: list[str]
    skills_you_have: list[str]
    missing_skills: list[str]
    recommended_courses: list[dict]
    recommended_certifications: list[dict]