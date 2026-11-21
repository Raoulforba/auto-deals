
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.admin import Administrateur
from app.models.vehicle import Vehicule
from app.models.photo import PhotoVehicule
from app.models.activity import Activite
from app.routers.auth import exiger_role


router = APIRouter(prefix="/uploads", tags=["Images"])


DOSSIER_UPLOADS = (
    Path(__file__).resolve().parents[2]
    / "uploads"
    / "vehicules"
).resolve()

DOSSIER_UPLOADS.mkdir(parents=True, exist_ok=True)


TYPES_AUTORISES = {
    "image/jpeg": (".jpg", "JPEG"),
    "image/png": (".png", "PNG"),
    "image/webp": (".webp", "WEBP"),
}

TAILLE_MAX = 5 * 1024 * 1024
NOMBRE_MAX_PHOTOS = 10
DIMENSION_MAX = 8000

ROLES_MODIFICATION = (
    "SUPER_ADMIN",
    "ADMINISTRATEUR",
)


# --------------------------------------------------
# VALIDATION DES IMAGES
# --------------------------------------------------

def valider_image(contenu: bytes, content_type: str):
    type_image = TYPES_AUTORISES.get(content_type)

    if not type_image:
        raise HTTPException(
            status_code=400,
            detail="Format non autorisé. Utilisez JPG, PNG ou WEBP.",
        )

    if not contenu:
        raise HTTPException(
            status_code=400,
            detail="Le fichier est vide.",
        )

    if len(contenu) > TAILLE_MAX:
        raise HTTPException(
            status_code=413,
            detail="L'image ne doit pas dépasser 5 Mo.",
        )

    extension, format_attendu = type_image

    try:
        with Image.open(BytesIO(contenu)) as image:
            if image.format != format_attendu:
                raise HTTPException(
                    status_code=400,
                    detail="Le contenu réel ne correspond pas au format déclaré.",
                )

            largeur, hauteur = image.size

            if largeur > DIMENSION_MAX or hauteur > DIMENSION_MAX:
                raise HTTPException(
                    status_code=400,
                    detail="Les dimensions de l'image ne doivent pas dépasser 8000 x 8000 pixels.",
                )

            image.verify()

    except HTTPException:
        raise

    except (
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
    ):
        raise HTTPException(
            status_code=400,
            detail="Le fichier fourni n'est pas une image valide.",
        )

    return extension


# --------------------------------------------------
# CHEMINS DE FICHIERS SÉCURISÉS
# --------------------------------------------------

def obtenir_chemin_securise(image_url: str):
    nom_fichier = Path(image_url).name

    chemin = (DOSSIER_UPLOADS / nom_fichier).resolve()

    if chemin.parent != DOSSIER_UPLOADS:
        raise HTTPException(
            status_code=400,
            detail="Chemin de fichier invalide.",
        )

    return chemin


# --------------------------------------------------
# IMPORTER L'IMAGE PRINCIPALE
# --------------------------------------------------

@router.post("/vehicule")
async def importer_image_vehicule(
    fichier: UploadFile = File(...),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    contenu = await fichier.read(TAILLE_MAX + 1)

    try:
        extension = valider_image(
            contenu,
            fichier.content_type or "",
        )

        nom_fichier = f"{uuid4().hex}{extension}"
        chemin = DOSSIER_UPLOADS / nom_fichier

        chemin.write_bytes(contenu)

    except HTTPException:
        raise

    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Impossible d'enregistrer l'image.",
        )

    finally:
        await fichier.close()

    return {
        "message": "Image importée avec succès.",
        "image_url": f"/media/vehicules/{nom_fichier}",
    }


# --------------------------------------------------
# IMPORTER PLUSIEURS PHOTOS
# --------------------------------------------------

@router.post("/vehicule/{vehicule_id}/photos")
async def importer_photos_vehicule(
    vehicule_id: int,
    fichiers: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    fichiers_crees = []

    try:
        vehicule = db.query(Vehicule).filter(
            Vehicule.id == vehicule_id
        ).first()

        if not vehicule:
            raise HTTPException(
                status_code=404,
                detail="Véhicule introuvable.",
            )

        if not fichiers:
            raise HTTPException(
                status_code=400,
                detail="Sélectionnez au moins une photo.",
            )

        nombre_existant = db.query(PhotoVehicule).filter(
            PhotoVehicule.vehicule_id == vehicule_id
        ).count()

        if nombre_existant + len(fichiers) > NOMBRE_MAX_PHOTOS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ce véhicule peut avoir {NOMBRE_MAX_PHOTOS} photos maximum. "
                    f"Il en possède déjà {nombre_existant}."
                ),
            )

        photos_preparees = []

        for fichier in fichiers:
            contenu = await fichier.read(TAILLE_MAX + 1)

            extension = valider_image(
                contenu,
                fichier.content_type or "",
            )

            photos_preparees.append((contenu, extension))

        photos_enregistrees = []

        for contenu, extension in photos_preparees:
            nom_fichier = f"{uuid4().hex}{extension}"
            chemin = DOSSIER_UPLOADS / nom_fichier

            chemin.write_bytes(contenu)
            fichiers_crees.append(chemin)

            photo = PhotoVehicule(
                vehicule_id=vehicule_id,
                image_url=f"/media/vehicules/{nom_fichier}",
            )

            db.add(photo)
            photos_enregistrees.append(photo)

        db.add(
            Activite(
                administrateur_id=admin.id,
                action="AJOUT_PHOTOS",
                description=(
                    f"Ajout de {len(photos_enregistrees)} photo(s) "
                    f"pour le véhicule {vehicule.marque} {vehicule.modele}."
                ),
                vehicule_id=vehicule.id,
            )
        )

        db.commit()

        for photo in photos_enregistrees:
            db.refresh(photo)

        return {
            "message": "Photos importées avec succès.",
            "vehicule_id": vehicule_id,
            "nombre_photos": len(photos_enregistrees),
            "photos": [
                {
                    "id": photo.id,
                    "image_url": photo.image_url,
                }
                for photo in photos_enregistrees
            ],
        }

    except HTTPException:
        db.rollback()

        for chemin in fichiers_crees:
            chemin.unlink(missing_ok=True)

        raise

    except (SQLAlchemyError, OSError):
        db.rollback()

        for chemin in fichiers_crees:
            try:
                chemin.unlink(missing_ok=True)
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'enregistrement des photos.",
        )

    finally:
        for fichier in fichiers:
            await fichier.close()


# --------------------------------------------------
# SUPPRIMER UNE PHOTO
# --------------------------------------------------

@router.delete("/vehicule/{vehicule_id}/photos/{photo_id}")
def supprimer_photo_vehicule(
    vehicule_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    admin: Administrateur = Depends(
        exiger_role(*ROLES_MODIFICATION)
    ),
):
    photo = db.query(PhotoVehicule).filter(
        PhotoVehicule.id == photo_id,
        PhotoVehicule.vehicule_id == vehicule_id,
    ).first()

    if not photo:
        raise HTTPException(
            status_code=404,
            detail="Photo introuvable pour ce véhicule.",
        )

    chemin = obtenir_chemin_securise(photo.image_url)

    db.add(
        Activite(
            administrateur_id=admin.id,
            action="SUPPRESSION_PHOTO",
            description=(
                f"Suppression d'une photo du véhicule "
                f"{photo.vehicule.marque} {photo.vehicule.modele}."
            ),
            vehicule_id=vehicule_id,
        )
    )

    db.delete(photo)

    try:
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la suppression de la photo.",
        )

    try:
        chemin.unlink(missing_ok=True)
    except OSError:
        pass

    return {
        "message": "Photo supprimée avec succès.",
        "photo_id": photo_id,
    }
