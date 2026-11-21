
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Callable
from app.core.database import get_db
from app.core.security import (
    verifier_mot_de_passe,
    creer_token_access,
    decoder_token,
)
from app.models.admin import Administrateur
from app.schemas.auth import ConnexionAdmin, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentification"])

bearer_scheme = HTTPBearer()


@router.post("/login", response_model=TokenResponse)
def login(
    donnees: ConnexionAdmin,
    db: Session = Depends(get_db),
):
    admin = (
        db.query(Administrateur)
        .filter(Administrateur.email == donnees.email.strip().lower())
        .first()
    )

    if not admin or not verifier_mot_de_passe(
        donnees.mot_de_passe,
        admin.mot_de_passe_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect",
        )

    if not admin.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte administrateur est désactivé",
        )

    token = creer_token_access(admin.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin_id": admin.id,
        "nom": admin.nom,
        "email": admin.email,
        "role": admin.role,
    }


def obtenir_admin_connecte(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    payload = decoder_token(credentials.credentials)

    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide ou expirée",
        )

    try:
        admin_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant invalide",
        )

    admin = db.query(Administrateur).filter(
        Administrateur.id == admin_id
    ).first()

    if not admin or not admin.actif:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrateur introuvable ou désactivé",
        )

    return admin

def exiger_role(*roles_autorises: str) -> Callable:
    def verifier_role(
        admin: Administrateur = Depends(obtenir_admin_connecte),
    ):
        if admin.role not in roles_autorises:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas les permissions nécessaires.",
            )
        return admin

    return verifier_role

@router.get("/me")
def profil_admin(
    admin: Administrateur = Depends(obtenir_admin_connecte),
):
    return {
        "id": admin.id,
        "nom": admin.nom,
        "email": admin.email,
        "role": admin.role,
        "actif": admin.actif,
    }
