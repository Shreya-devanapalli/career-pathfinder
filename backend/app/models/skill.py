from sqlalchemy import Column, BigInteger, String

from app.db.base import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(BigInteger, primary_key=True)
    skill_name = Column(String, nullable=False)
    category = Column(String, nullable=True)