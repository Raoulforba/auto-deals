
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models import PhotoVehicule
from app.models.admin import Administrateur
from app.models.vehicle import Vehicule
from app.models.sale import Vente
from app.models.activity import Activite
from app.routers.auth import exiger_role
from app.schemas.vehicle import (
    VehiculeCreate,
    VehiculeUpdate,
    VehiculeResponse,
)


router = APIRouter(
    prefix="/vehicules",
    tags=["Véhicules"],
)


ROLES_LECTURE = (
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
    "CONSULTATION",
)

ROLES_MODIFICATION = (
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
)


DOSSIER_UPLOADS = (
    Path(__file__).resolve().parents[2]
    / "uploads"
    / "vehicules"
).resolve()


# --------------------------------------------------
# FONCTIONS UTILITAIRES
# --------------------------------------------------

def obtenir_vehicule(db: Session, vehicule_id: int):
    vehicule = (
        db.query(Vehicule)
        .filter(Vehicule.id == vehicule_id)
        .first()
    )

    if not vehicule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule introuvable.",
        )

    return vehicule


def enregistrer_activite(
    db: Session,
    admin: Administrateur,
    action: str,
    description: str,
    vehicule_id: int | None,
):
    db.add(
        Activite(
            administrateur_id=admin.id,
            action=action,
            description=description,
            vehicule_id=vehicule_id,
        )
    )


def obtenir_chemin_photo(image_url: str):
    """
    Accepte uniquement les URLs du dossier /media/vehicules/
    et retourne un chemin sécurisé dans uploads/vehicules.
    """

    if not image_url:
        return None

    prefixe = "/media/vehicules/"

    if not image_url.startswith(prefixe):
        return None

    nom_fichier = image_url[len(prefixe):]

    if (
        not nom_fichier
        or Path(nom_fichier).name != nom_fichier
    ):
        return None

    chemin = DOSSIER_UPLOADS / nom_fichier

    if chemin.is_symlink():
        return None

    chemin = chemin.resolve()

    if chemin.parent != DOSSIER_UPLOADS:
        return None

    return chemin


def supprimer_fichiers_physiques(chemins: list[Path]):
    """
    Supprime les fichiers physiques sans interrompre
    le fonctionnement de l'application en cas d'erreur.
    """

    for chemin in set(chemins):
        try:
            chemin.unlink(missing_ok=True)

        except OSError:
            # La suppression physique pourra être retentée
            # ultérieurement sans annuler la suppression en DB.
            pass


# --------------------------------------------------
# AJOUTER UN VÉHICULE
# SUPER_ADMIN / ADMINISTRATEUR
# --------------------------------------------------

@router.post(
    "/",
    response_model=VehiculeResponse,
    status_code=status.HTTP_201_CREATED,
)
def ajouter_vehicule(
    donnees: VehiculeCreate,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    vehicule = Vehicule(**donnees.model_dump())

    db.add(vehicule)

    try:
        db.flush()

        enregistrer_activite(
            db,
            admin,
            "AJOUT",
            (
                f"Ajout du véhicule "
                f"{vehicule.marque} {vehicule.modele}."
            ),
            vehicule.id,
        )

        db.commit()
        db.refresh(vehicule)

        return vehicule

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'ajout du véhicule.",
        )


# --------------------------------------------------
# LISTER LES VÉHICULES - ADMINISTRATION
# TOUS LES RÔLES
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[VehiculeResponse],
)
def lister_vehicules(
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_LECTURE)
    ),
):
    return (
        db.query(Vehicule)
        .order_by(Vehicule.date_creation.desc())
        .all()
    )


# --------------------------------------------------
# OBTENIR UN VÉHICULE PUBLIC
# --------------------------------------------------

@router.get(
    "/public/{vehicule_id}",
    response_model=VehiculeResponse,
)
def obtenir_vehicule_public(
    vehicule_id: int,
    db: Session = Depends(get_db),
):
    vehicule = (
        db.query(Vehicule)
        .filter(
            Vehicule.id == vehicule_id,
            Vehicule.statut == "DISPONIBLE",
        )
        .first()
    )

    if not vehicule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule introuvable ou indisponible.",
        )

    return vehicule


# --------------------------------------------------
# LISTER LES VÉHICULES DISPONIBLES - PUBLIC
# --------------------------------------------------

@router.get(
    "/public",
    response_model=list[VehiculeResponse],
)
def lister_vehicules_publics(
    db: Session = Depends(get_db),
):
    return (
        db.query(Vehicule)
        .filter(Vehicule.statut == "DISPONIBLE")
        .order_by(Vehicule.date_creation.desc())
        .all()
    )


# --------------------------------------------------
# OBTENIR UN VÉHICULE - ADMINISTRATION
# TOUS LES RÔLES
# --------------------------------------------------

@router.get(
    "/{vehicule_id}",
    response_model=VehiculeResponse,
)
def consulter_vehicule(
    vehicule_id: int,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_LECTURE)
    ),
):
    return obtenir_vehicule(db, vehicule_id)


# --------------------------------------------------
# MODIFIER UN VÉHICULE
# SUPER_ADMIN / ADMINISTRATEUR
# --------------------------------------------------

@router.put(
    "/{vehicule_id}",
    response_model=VehiculeResponse,
)
def modifier_vehicule(
    vehicule_id: int,
    donnees: VehiculeUpdate,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    vehicule = obtenir_vehicule(db, vehicule_id)

    # Empêcher la modification d'un véhicule déjà vendu.
    vente_existante = (
        db.query(Vente)
        .filter(Vente.vehicule_id == vehicule.id)
        .first()
    )

    if vente_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Impossible de modifier ce véhicule : "
                "une vente est déjà enregistrée dans son historique."
            ),
        )

    modifications = donnees.model_dump(exclude_unset=True)

    if not modifications:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune modification fournie.",
        )

    champs_obligatoires = {
        "marque",
        "modele",
        "annee",
        "prix",
        "kilometrage",
        "carburant",
        "transmission",
        "statut",
    }

    for champ, valeur in modifications.items():
        if valeur is None and champ in champs_obligatoires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le champ {champ} ne peut pas être vide.",
            )

    noms_champs = {
        "marque": "Marque",
        "modele": "Modèle",
        "annee": "Année",
        "prix": "Prix",
        "kilometrage": "Kilométrage",
        "carburant": "Carburant",
        "transmission": "Transmission",
        "description": "Description",
        "image_url": "Image principale",
        "statut": "Statut",
    }

    changements = []
    ancien_statut = vehicule.statut

    for champ, nouvelle_valeur in modifications.items():
        ancienne_valeur = getattr(vehicule, champ)

        if ancienne_valeur != nouvelle_valeur:
            setattr(vehicule, champ, nouvelle_valeur)

            changements.append(
                f"{noms_champs.get(champ, champ)} : "
                f"{ancienne_valeur} → {nouvelle_valeur}"
            )

    # Aucune modification réelle.
    if not changements:
        return vehicule

    # Déterminer le type d'activité.
    if vehicule.statut != ancien_statut:
        action = "CHANGEMENT_STATUT"
    else:
        action = "MODIFICATION"

    description = (
        f"Modification du véhicule "
        f"{vehicule.marque} {vehicule.modele} : "
        + ", ".join(changements)
    )

    enregistrer_activite(
        db,
        admin,
        action,
        description,
        vehicule.id,
    )

    try:
        db.commit()
        db.refresh(vehicule)

        return vehicule

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la modification du véhicule.",
        )


# --------------------------------------------------
# SUPPRIMER UN VÉHICULE
# SUPER_ADMIN / ADMINISTRATEUR
# --------------------------------------------------

@router.delete("/{vehicule_id}")
def supprimer_vehicule(
    vehicule_id: int,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    vehicule = obtenir_vehicule(db, vehicule_id)

    # Empêcher la suppression d'un véhicule déjà vendu.
    vente_existante = (
        db.query(Vente)
        .filter(Vente.vehicule_id == vehicule.id)
        .first()
    )

    if vente_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Impossible de supprimer ce véhicule : "
                "une vente est enregistrée dans son historique."
            ),
        )

    description = (
        f"Suppression du véhicule "
        f"{vehicule.marque} {vehicule.modele}."
    )

    # Récupérer toutes les URLs des photos du véhicule.
    urls_photos = []

    # Photo principale.
    if vehicule.image_url:
        urls_photos.append(vehicule.image_url)

    # Photos supplémentaires.
    urls_photos.extend(
        photo.image_url
        for photo in vehicule.photos
        if photo.image_url
    )

    # Enregistrer l'activité avant la suppression.
    enregistrer_activite(
        db,
        admin,
        "SUPPRESSION",
        description,
        vehicule.id,
    )

    db.delete(vehicule)

    try:
        # Appliquer les suppressions ORM en attente.
        db.flush()

        # Récupérer les images principales encore utilisées.
        urls_restantes = set(
            url
            for (url,) in db.query(Vehicule.image_url)
            .filter(Vehicule.image_url.isnot(None))
            .all()
        )

        # Récupérer les photos supplémentaires encore utilisées.
        urls_restantes.update(
            url
            for (url,) in db.query(PhotoVehicule.image_url)
            .filter(PhotoVehicule.image_url.isnot(None))
            .all()
        )

        # Garder uniquement les images qui ne sont plus référencées.
        chemins_a_supprimer = {
            chemin
            for url in urls_photos
            if url not in urls_restantes
            and (chemin := obtenir_chemin_photo(url)) is not None
        }

        # Valider la suppression en base de données.
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression du véhicule.",
        )

    # Supprimer les fichiers physiques après validation SQL.
    supprimer_fichiers_physiques(
        list(chemins_a_supprimer)
    )

    return {
        "message": "Véhicule supprimé avec succès."
    }
