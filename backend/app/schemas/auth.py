
from pydantic import BaseModel, Field


class ConnexionAdmin(BaseModel):
    email: str
    mot_de_passe: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: int
    nom: str
    email: str
    role: str
