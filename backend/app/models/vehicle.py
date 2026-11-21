
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vehicule(Base):
    __tablename__ = "vehicules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    marque: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    modele: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    annee: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    prix: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    kilometrage: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    carburant: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    transmission: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    statut: Mapped[str] = mapped_column(
        String(30),
        default="DISPONIBLE",
        nullable=False
    )

    date_creation: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    photos: Mapped[list["PhotoVehicule"]] = relationship(
        "PhotoVehicule",
        back_populates="vehicule",
        cascade="all, delete-orphan",
    )
