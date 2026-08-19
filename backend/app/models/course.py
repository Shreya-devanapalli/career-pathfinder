from sqlalchemy import Column, BigInteger, String, ForeignKey

from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(BigInteger, primary_key=True)
    course_name = Column(String, nullable=False)
    skill_id = Column(BigInteger, ForeignKey("skills.id"), nullable=True)
    provider = Column(String, nullable=True)
    level = Column(String, nullable=True)
    course_url = Column(String, nullable=True)