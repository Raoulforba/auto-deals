
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


RoleAdmin = Literal[
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
    "CONSULTATION",
]


class AdministrateurCreate(BaseModel):
    nom: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mot_de_passe: str = Field(min_length=8)
    role: Literal["ADMINISTRATEUR", "CONSULTATION"] = "ADMINISTRATEUR"


class AdministrateurUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    mot_de_passe: str | None = Field(default=None, min_length=8)
    role: Literal["ADMINISTRATEUR", "CONSULTATION"] | None = None


class AdministrateurResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    email: str
    role: RoleAdmin
    actif: bool
    date_creation: datetime
