from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActiviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    administrateur_id: int | None
    action: str
    description: str
    vehicule_id: int | None
    date_creation: datetime
