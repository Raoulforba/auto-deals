
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sale import Vente
from app.models.vehicle import Vehicule
from app.models.activity import Activite
from app.models.admin import Administrateur
from app.routers.auth import exiger_role
from app.schemas.sale import VenteCreate, VenteResponse


router = APIRouter(
    prefix="/ventes",
    tags=["Ventes"],
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


# --------------------------------------------------
# ENREGISTRER UNE VENTE
# --------------------------------------------------

@router.post(
    "/",
    response_model=VenteResponse,
    status_code=status.HTTP_201_CREATED,
)
def enregistrer_vente(
    donnees: VenteCreate,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    # Vérifier la confirmation du paiement intégral
    if not donnees.paiement_integral_confirme:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le paiement intégral doit être confirmé avant la vente.",
        )

    # Rechercher et verrouiller le véhicule
    vehicule = (
        db.query(Vehicule)
        .filter(Vehicule.id == donnees.vehicule_id)
        .with_for_update()
        .first()
    )

    if not vehicule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule introuvable.",
        )

    # Vérifier le statut du véhicule
    if vehicule.statut not in ("DISPONIBLE", "RESERVE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce véhicule ne peut pas être vendu.",
        )

    # Empêcher une deuxième vente du même véhicule
    vente_existante = (
        db.query(Vente)
        .filter(Vente.vehicule_id == vehicule.id)
        .first()
    )

    if vente_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce véhicule possède déjà une vente enregistrée.",
        )

    # Vérifier les prix
    prix_initial = Decimal(str(vehicule.prix))
    prix_vente = donnees.prix_vente

    if prix_vente > prix_initial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le prix final ne peut pas dépasser le prix initial affiché.",
        )

    if prix_vente <= Decimal("0"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le prix de vente doit être positif.",
        )

    # Vérifier les informations du client
    client_nom = donnees.client_nom.strip()
    client_telephone = donnees.client_telephone.strip()

    if len(client_nom) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom du client doit contenir au moins 2 caractères.",
        )

    if len(client_telephone) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le numéro WhatsApp est invalide.",
        )

    # Créer la vente
    vente = Vente(
        vehicule_id=vehicule.id,
        administrateur_id=admin.id,
        vehicule_marque=vehicule.marque,
        vehicule_modele=vehicule.modele,
        vehicule_annee=vehicule.annee,
        prix_initial=prix_initial,
        client_nom=client_nom,
        client_telephone=client_telephone,
        prix_vente=prix_vente,
        mode_paiement="PAIEMENT_INTEGRAL",
    )

    try:
        db.add(vente)

        # Changer automatiquement le statut du véhicule
        vehicule.statut = "VENDU"

        # Enregistrer l'activité
        db.add(
            Activite(
                administrateur_id=admin.id,
                action="VENTE",
                description=(
                    f"Vente du véhicule {vehicule.marque} "
                    f"{vehicule.modele} à {client_nom}. "
                    f"Prix initial : {prix_initial} FCFA. "
                    f"Prix final : {prix_vente} FCFA. "
                    f"Réduction : {prix_initial - prix_vente} FCFA."
                ),
                vehicule_id=vehicule.id,
            )
        )

        # Valider les opérations ensemble
        db.commit()
        db.refresh(vente)

        return vente

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Une vente existe déjà pour ce véhicule.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'enregistrement de la vente.",
        )


# --------------------------------------------------
# LISTER LES VENTES
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[VenteResponse],
)
def lister_ventes(
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_LECTURE)
    ),
):
    return (
        db.query(Vente)
        .order_by(
            Vente.date_vente.desc(),
            Vente.id.desc()
        )
        .all()
    )


# --------------------------------------------------
# STATISTIQUES DES VENTES
# --------------------------------------------------

@router.get("/statistiques")
def statistiques_ventes(
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_LECTURE)
    ),
):
    total_ventes = db.query(Vente).count()

    chiffre_affaires = (
        db.query(
            func.coalesce(
                func.sum(Vente.prix_vente),
                0
            )
        )
        .scalar()
    )

    total_reductions = (
        db.query(
            func.coalesce(
                func.sum(
                    Vente.prix_initial - Vente.prix_vente
                ),
                0,
            )
        )
        .scalar()
    )

    prix_moyen = (
        Decimal(str(chiffre_affaires)) / total_ventes
        if total_ventes
        else Decimal("0")
    )

    return {
        "total_ventes": total_ventes,
        "chiffre_affaires": float(chiffre_affaires),
        "prix_moyen": float(prix_moyen),
        "total_reductions": float(total_reductions),
    }


# --------------------------------------------------
# CONSULTER UNE VENTE
# --------------------------------------------------

@router.get(
    "/{vente_id}",
    response_model=VenteResponse,
)
def consulter_vente(
    vente_id: int,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_LECTURE)
    ),
):
    vente = (
        db.query(Vente)
        .filter(Vente.id == vente_id)
        .first()
    )

    if not vente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vente introuvable.",
        )

    return vente
