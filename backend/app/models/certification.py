from sqlalchemy import Column, BigInteger, String, ForeignKey

from app.db.base import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(BigInteger, primary_key=True)
    certification_name = Column(String, nullable=False)
    career_id = Column(BigInteger, ForeignKey("careers.id"), nullable=True)
    provider = Column(String, nullable=True)
    certification_url = Column(String, nullable=True)