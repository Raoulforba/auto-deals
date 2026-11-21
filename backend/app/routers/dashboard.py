from datetime import datetime
from fastapi import Query
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vehicle import Vehicule
from app.models.activity import Activite
from app.models.admin import Administrateur
from app.routers.auth import exiger_role


router = APIRouter(
    prefix="/dashboard",
    tags=["Tableau de bord"],
)


ROLES_LECTURE = (
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
    "CONSULTATION",
)


# --------------------------------------------------
# STATISTIQUES GÉNÉRALES
# --------------------------------------------------

@router.get("/statistiques")
def obtenir_statistiques(
    db: Session = Depends(get_db),
    admin=Depends(exiger_role(*ROLES_LECTURE)),
):
    # Nombre total de véhicules.
    total_vehicules = db.query(Vehicule).count()

    # Répartition des véhicules par statut.
    disponibles = (
        db.query(Vehicule)
        .filter(Vehicule.statut == "DISPONIBLE")
        .count()
    )

    reserves = (
        db.query(Vehicule)
        .filter(Vehicule.statut == "RESERVE")
        .count()
    )

    vendus = (
        db.query(Vehicule)
        .filter(Vehicule.statut == "VENDU")
        .count()
    )

    # Valeur du stock disponible.
    valeur_stock = (
        db.query(
            func.coalesce(func.sum(Vehicule.prix), 0)
        )
        .filter(Vehicule.statut == "DISPONIBLE")
        .scalar()
    )

    # Valeur indicative des véhicules marqués comme vendus.
    valeur_vehicules_vendus = (
        db.query(
            func.coalesce(func.sum(Vehicule.prix), 0)
        )
        .filter(Vehicule.statut == "VENDU")
        .scalar()
    )

    # Valeur totale du parc automobile.
    valeur_totale = (
        db.query(
            func.coalesce(func.sum(Vehicule.prix), 0)
        )
        .scalar()
    )

    return {
        "total_vehicules": total_vehicules,
        "disponibles": disponibles,
        "reserves": reserves,
        "vendus": vendus,
        "valeur_stock_disponible": float(valeur_stock),
        "valeur_vehicules_vendus": float(
            valeur_vehicules_vendus
        ),
        "valeur_totale_parc": float(valeur_totale),
    }


# --------------------------------------------------
# MOUVEMENTS RÉCENTS
# --------------------------------------------------

@router.get("/mouvements-recents")
def obtenir_mouvements_recents(
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin=Depends(exiger_role(*ROLES_LECTURE)),
):
    mouvements = (
        db.query(
            Activite,
            Administrateur.nom.label("administrateur_nom"),
        )
        .outerjoin(
            Administrateur,
            Activite.administrateur_id == Administrateur.id,
        )
        .order_by(
            Activite.date_creation.desc(),
            Activite.id.desc(),
        )
        .limit(limite)
        .all()
    )

    return {
        "total_affiche": len(mouvements),
        "mouvements": [
            {
                "id": activite.id,
                "administrateur_id": activite.administrateur_id,
                "administrateur_nom": administrateur_nom,
                "action": activite.action,
                "description": activite.description,
                "vehicule_id": activite.vehicule_id,
                "date_creation": activite.date_creation,
            }
            for activite, administrateur_nom in mouvements
        ],
    }

# --------------------------------------------------
# ÉVOLUTION MENSUELLE DES ACTIVITÉS
# --------------------------------------------------

@router.get("/evolution-activites")
def obtenir_evolution_activites(
    annee: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    admin=Depends(exiger_role(*ROLES_LECTURE)),
):
    annee_cible = annee or datetime.now().year

    resultats = (
        db.query(
            func.month(Activite.date_creation).label("mois"),
            Activite.action,
            func.count(Activite.id).label("total"),
        )
        .filter(
            func.year(Activite.date_creation) == annee_cible
        )
        .group_by(
            func.month(Activite.date_creation),
            Activite.action,
        )
        .all()
    )

    mois_noms = [
        "Janvier", "Février", "Mars",
        "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre",
        "Octobre", "Novembre", "Décembre",
    ]

    evolution = [
        {
            "mois": index + 1,
            "nom": nom,
            "ajouts": 0,
            "modifications": 0,
            "changements_statut": 0,
            "suppressions": 0,
        }
        for index, nom in enumerate(mois_noms)
    ]

    for ligne in resultats:
        mois = int(ligne.mois)
        action = ligne.action
        total = int(ligne.total)

        if not 1 <= mois <= 12:
            continue

        element = evolution[mois - 1]

        if action == "AJOUT":
            element["ajouts"] += total

        elif action == "MODIFICATION":
            element["modifications"] += total

        elif action == "CHANGEMENT_STATUT":
            element["changements_statut"] += total

        elif action == "SUPPRESSION":
            element["suppressions"] += total

    return {
        "annee": annee_cible,
        "evolution": evolution,
    }
