from pydantic import BaseModel

SkillInput = str | dict[str, str]


class ProfileIn(BaseModel):
    branch: str
    skills: list[SkillInput] = []
    interests: list[str] = []


class ProfileOut(ProfileIn):
    class Config:
        from_attributes = True
