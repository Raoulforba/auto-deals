
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.core.security import hacher_mot_de_passe
from app.models.admin import Administrateur
from app.models.activity import Activite
from app.schemas.admin import (
    AdministrateurCreate,
    AdministrateurUpdate,
    AdministrateurResponse,
)
from app.routers.auth import exiger_role


router = APIRouter(
    prefix="/administrateurs",
    tags=["Gestion des administrateurs"],
)


# --------------------------------------------------
# FONCTIONS UTILITAIRES
# --------------------------------------------------

def enregistrer_activite(db, admin, action, description):
    activite = Activite(
        administrateur_id=admin.id,
        action=action,
        description=description,
    )
    db.add(activite)


def obtenir_administrateur(db, admin_id):
    admin = (
        db.query(Administrateur)
        .filter(Administrateur.id == admin_id)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrateur introuvable.",
        )

    return admin


# --------------------------------------------------
# LISTER LES ADMINISTRATEURS
# SUPER_ADMIN UNIQUEMENT
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[AdministrateurResponse],
)
def lister_administrateurs(
    db: Session = Depends(get_db),
    super_admin=Depends(exiger_role("SUPER_ADMIN")),
):
    return (
        db.query(Administrateur)
        .order_by(Administrateur.date_creation.desc())
        .all()
    )


# --------------------------------------------------
# CREER UN ADMINISTRATEUR
# SUPER_ADMIN UNIQUEMENT
# --------------------------------------------------

@router.post(
    "/",
    response_model=AdministrateurResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_administrateur(
    donnees: AdministrateurCreate,
    db: Session = Depends(get_db),
    super_admin=Depends(exiger_role("SUPER_ADMIN")),
):
    email = str(donnees.email).strip().lower()

    existe = (
        db.query(Administrateur)
        .filter(Administrateur.email == email)
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette adresse e-mail est déjà utilisée.",
        )

    admin = Administrateur(
        nom=donnees.nom.strip(),
        email=email,
        mot_de_passe_hash=hacher_mot_de_passe(
            donnees.mot_de_passe
        ),
        role=donnees.role,
        actif=True,
    )

    db.add(admin)

    try:
        db.flush()

        enregistrer_activite(
            db,
            super_admin,
            "CREATION_ADMIN",
            (
                f"Création du compte {admin.nom} "
                f"({admin.email}), rôle {admin.role}."
            ),
        )

        db.commit()
        db.refresh(admin)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette adresse e-mail est déjà utilisée.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du compte.",
        )

    return admin


# --------------------------------------------------
# MODIFIER UN ADMINISTRATEUR
# SUPER_ADMIN UNIQUEMENT
# --------------------------------------------------

@router.put(
    "/{admin_id}",
    response_model=AdministrateurResponse,
)
def modifier_administrateur(
    admin_id: int,
    donnees: AdministrateurUpdate,
    db: Session = Depends(get_db),
    super_admin=Depends(exiger_role("SUPER_ADMIN")),
):
    admin = obtenir_administrateur(db, admin_id)

    if admin.role == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Le compte SUPER_ADMIN principal ne peut pas "
                "être modifié depuis ce module."
            ),
        )

    changements = donnees.model_dump(exclude_unset=True)

    if not changements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune modification fournie.",
        )

    for champ, valeur in changements.items():
        if valeur is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le champ {champ} ne peut pas être vide.",
            )

    if "email" in changements:
        email = str(changements["email"]).strip().lower()

        doublon = (
            db.query(Administrateur)
            .filter(
                Administrateur.email == email,
                Administrateur.id != admin.id,
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cette adresse e-mail est déjà utilisée.",
            )

        changements["email"] = email

    if "mot_de_passe" in changements:
        changements["mot_de_passe_hash"] = hacher_mot_de_passe(
            changements.pop("mot_de_passe")
        )

    for champ, valeur in changements.items():
        setattr(admin, champ, valeur)

    enregistrer_activite(
        db,
        super_admin,
        "MODIFICATION_ADMIN",
        f"Modification du compte {admin.nom} (ID {admin.id}).",
    )

    try:
        db.commit()
        db.refresh(admin)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible d'enregistrer les modifications.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la modification du compte.",
        )

    return admin


# --------------------------------------------------
# ACTIVER / DESACTIVER UN ADMINISTRATEUR
# SUPER_ADMIN UNIQUEMENT
# --------------------------------------------------

@router.patch(
    "/{admin_id}/statut",
    response_model=AdministrateurResponse,
)
def changer_statut_administrateur(
    admin_id: int,
    actif: bool,
    db: Session = Depends(get_db),
    super_admin=Depends(exiger_role("SUPER_ADMIN")),
):
    admin = obtenir_administrateur(db, admin_id)

    if admin.role == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Le compte SUPER_ADMIN principal ne peut pas "
                "être désactivé."
            ),
        )

    admin.actif = actif

    enregistrer_activite(
        db,
        super_admin,
        "ACTIVATION_ADMIN" if actif else "DESACTIVATION_ADMIN",
        (
            f"Compte {admin.nom} (ID {admin.id}) : "
            f"{'activé' if actif else 'désactivé'}."
        ),
    )

    try:
        db.commit()
        db.refresh(admin)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du changement de statut.",
        )

    return admin


# --------------------------------------------------
# SUPPRIMER UN ADMINISTRATEUR
# SUPER_ADMIN UNIQUEMENT
# --------------------------------------------------

@router.delete("/{admin_id}")
def supprimer_administrateur(
    admin_id: int,
    db: Session = Depends(get_db),
    super_admin=Depends(exiger_role("SUPER_ADMIN")),
):
    admin = obtenir_administrateur(db, admin_id)

    if admin.id == super_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez pas supprimer votre propre compte.",
        )

    if admin.role == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Le compte SUPER_ADMIN principal ne peut pas "
                "être supprimé."
            ),
        )

    nom = admin.nom
    email = admin.email

    enregistrer_activite(
        db,
        super_admin,
        "SUPPRESSION_ADMIN",
        f"Suppression du compte {nom} ({email}).",
    )

    db.delete(admin)

    try:
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression du compte.",
        )

    return {
        "message": "Administrateur supprimé avec succès."
    }
