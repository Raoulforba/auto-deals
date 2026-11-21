
from math import ceil
from datetime import date, datetime, time, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.activity import Activite
from app.routers.auth import exiger_role
from app.schemas.activity import ActiviteResponse


router = APIRouter(
    prefix="/activites",
    tags=["Activités"],
)

ROLES_LECTURE = (
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
    "CONSULTATION",
)


# --------------------------------------------------
# CONSTRUCTION DE LA REQUÊTE
# --------------------------------------------------

def construire_requete(
    db: Session,
    action: str | None = None,
    recherche: str | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
):
    requete = db.query(Activite)

    if action:
        requete = requete.filter(
            Activite.action == action
        )

    if recherche and recherche.strip():
        terme = f"%{recherche.strip()}%"

        filtres = [
            Activite.description.ilike(terme),
            Activite.action.ilike(terme),
            Activite.administrateur_id.cast(str).ilike(terme),
            Activite.vehicule_id.cast(str).ilike(terme),
        ]

        requete = requete.filter(or_(*filtres))

    if date_debut:
        debut = datetime.combine(date_debut, time.min)

        requete = requete.filter(
            Activite.date_creation >= debut
        )

    if date_fin:
        lendemain = datetime.combine(
            date_fin + timedelta(days=1),
            time.min,
        )

        requete = requete.filter(
            Activite.date_creation < lendemain
        )

    return requete


# --------------------------------------------------
# STATISTIQUES GLOBALES
# --------------------------------------------------

@router.get("/statistiques")
def statistiques_activites(
    db: Session = Depends(get_db),
    admin=Depends(exiger_role(*ROLES_LECTURE)),
):
    total = db.query(Activite).count()

    ajouts = (
        db.query(Activite)
        .filter(Activite.action.like("AJOUT%"))
        .count()
    )

    modifications = (
        db.query(Activite)
        .filter(
            Activite.action.in_([
                "MODIFICATION",
                "CHANGEMENT_STATUT",
            ])
        )
        .count()
    )

    suppressions = (
        db.query(Activite)
        .filter(Activite.action.like("SUPPRESSION%"))
        .count()
    )

    return {
        "total": total,
        "ajouts": ajouts,
        "modifications": modifications,
        "suppressions": suppressions,
    }


# --------------------------------------------------
# HISTORIQUE AVEC FILTRES ET PAGINATION
# --------------------------------------------------

@router.get("/")
def lister_activites(
    page: int = Query(1, ge=1),
    par_page: int = Query(10, ge=1, le=100),
    action: str | None = Query(None, max_length=50),
    recherche: str | None = Query(None, max_length=150),
    date_debut: date | None = Query(None),
    date_fin: date | None = Query(None),
    db: Session = Depends(get_db),
    admin=Depends(exiger_role(*ROLES_LECTURE)),
):
    if date_debut and date_fin and date_debut > date_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de début doit précéder la date de fin.",
        )

    requete = construire_requete(
        db=db,
        action=action,
        recherche=recherche,
        date_debut=date_debut,
        date_fin=date_fin,
    )

    total = requete.count()

    activites = (
        requete
        .order_by(
            Activite.date_creation.desc(),
            Activite.id.desc(),
        )
        .offset((page - 1) * par_page)
        .limit(par_page)
        .all()
    )

    return {
        "items": [
            ActiviteResponse.model_validate(activite).model_dump()
            for activite in activites
        ],
        "total": total,
        "page": page,
        "par_page": par_page,
        "total_pages": ceil(total / par_page) if total else 0,
    }
