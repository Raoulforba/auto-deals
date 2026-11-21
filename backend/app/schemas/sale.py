
from datetime import datetime
from decimal import Decimal
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class VenteCreate(BaseModel):
    vehicule_id: int = Field(gt=0)

    paiement_integral_confirme: bool

    client_nom: str = Field(
        min_length=2,
        max_length=150,
    )

    client_telephone: str = Field(
        min_length=9,
        max_length=13,
    )

    prix_vente: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    @field_validator("client_nom", mode="before")
    @classmethod
    def valider_nom_client(cls, valeur):
        if not isinstance(valeur, str):
            raise ValueError("Le nom du client doit être un texte.")

        nom = " ".join(valeur.split())

        if len(nom) < 2:
            raise ValueError(
                "Le nom du client doit contenir au moins 2 caractères."
            )

        if len(nom) > 150:
            raise ValueError(
                "Le nom du client ne doit pas dépasser 150 caractères."
            )

        return nom

    @field_validator("client_telephone", mode="before")
    @classmethod
    def valider_telephone(cls, valeur):
        if not isinstance(valeur, str):
            raise ValueError(
                "Le numéro WhatsApp doit être un texte."
            )

        telephone = valeur.strip()

        if not re.fullmatch(r"(?:\+237)?6[0-9]{8}", telephone):
            raise ValueError(
                "Numéro WhatsApp camerounais invalide. "
                "Utilisez 691234567 ou +237691234567."
            )

        return telephone


class VenteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicule_id: int
    administrateur_id: int | None

    vehicule_marque: str
    vehicule_modele: str
    vehicule_annee: int

    prix_initial: Decimal

    client_nom: str
    client_telephone: str

    prix_vente: Decimal
    mode_paiement: str
    date_vente: datetime

    @property
    def reduction(self) -> Decimal:
        return self.prix_initial - self.prix_vente
