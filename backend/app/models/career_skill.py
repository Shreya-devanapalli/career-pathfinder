from sqlalchemy import Column, BigInteger, String, ForeignKey

from app.db.base import Base


class CareerSkill(Base):
    __tablename__ = "career_skills"

    id = Column(BigInteger, primary_key=True)
    career_id = Column(BigInteger, ForeignKey("careers.id"), nullable=False)
    skill_id = Column(BigInteger, ForeignKey("skills.id"), nullable=False)
    importance = Column(String, nullable=True)
    skill_type = Column(String, nullable=True)