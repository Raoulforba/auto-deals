
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Vente(Base):
    __tablename__ = "ventes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicule_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        unique=True,
    )

    administrateur_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("administrateurs.id", ondelete="SET NULL"),
        nullable=True,
    )

    vehicule_marque: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vehicule_modele: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vehicule_annee: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    prix_initial: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    client_nom: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    client_telephone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    prix_vente: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    mode_paiement: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PAIEMENT_INTEGRAL",
    )

    date_vente: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
