
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


StatutVehicule = Literal[
    "DISPONIBLE",
    "RESERVE",
    "VENDU",
]


class PhotoVehiculeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    date_creation: datetime


class VehiculeCreate(BaseModel):
    marque: str = Field(min_length=2, max_length=100)
    modele: str = Field(min_length=1, max_length=100)
    annee: int = Field(ge=1900, le=2100)
    prix: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    kilometrage: int = Field(ge=0)
    carburant: str = Field(min_length=2, max_length=50)
    transmission: str = Field(min_length=2, max_length=50)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    statut: StatutVehicule = "DISPONIBLE"


class VehiculeUpdate(BaseModel):
    marque: str | None = Field(default=None, min_length=2, max_length=100)
    modele: str | None = Field(default=None, min_length=1, max_length=100)
    annee: int | None = Field(default=None, ge=1900, le=2100)
    prix: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    kilometrage: int | None = Field(default=None, ge=0)
    carburant: str | None = Field(default=None, min_length=2, max_length=50)
    transmission: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    statut: StatutVehicule | None = None


class VehiculeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    marque: str
    modele: str
    annee: int
    prix: Decimal
    kilometrage: int
    carburant: str
    transmission: str
    description: str | None
    image_url: str | None
    statut: StatutVehicule
    photos: list[PhotoVehiculeResponse] = Field(default_factory=list)
