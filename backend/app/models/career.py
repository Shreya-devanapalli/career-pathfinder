from sqlalchemy import Column, BigInteger, String, Text

from app.db.base import Base


class Career(Base):
    """
    Career information stored in the existing Supabase careers table.
    """

    __tablename__ = "careers"

    id = Column(BigInteger, primary_key=True)
    career_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)

    def as_dict(self) -> dict:
        """
        Convert the database row into the structure
        expected by the recommendation engine.
        """

        return {
            "title": self.career_name,
            "description": self.description or "",
            "industry": self.industry or "",

            # These fields are currently stored in
            # separate Supabase tables, not in careers.
            "branches": [],
            "core_skills": [],
            "nice_skills": [],
            "interests": [],
            "skills_to_learn": [],
            "courses": [],
            "projects": [],
            "certifications": [],
            "salary_range": {},
            "growth": "",
        }