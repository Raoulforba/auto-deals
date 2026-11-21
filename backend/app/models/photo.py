
from datetime import datetime
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PhotoVehicule(Base):
    __tablename__ = "photos_vehicules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    vehicule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("vehicules.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    image_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    date_creation: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    vehicule: Mapped["Vehicule"] = relationship(
        "Vehicule",
        back_populates="photos",
    )
