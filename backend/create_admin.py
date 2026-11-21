
from getpass import getpass

from sqlalchemy import select

from app.core.database import Base, engine, SessionLocal
from app.core.security import hacher_mot_de_passe
from app.models.admin import Administrateur


def main():
    Base.metadata.create_all(bind=engine)

    nom = input("Nom de l'administrateur : ").strip()
    email = input("Adresse e-mail : ").strip().lower()
    mot_de_passe = getpass("Mot de passe : ")
    confirmation = getpass("Confirmer le mot de passe : ")

    if not nom or not email:
        print("Le nom et l'e-mail sont obligatoires.")
        return

    if len(mot_de_passe) < 12:
        print("Le mot de passe doit contenir au moins 12 caractères.")
        return

    if mot_de_passe != confirmation:
        print("Les mots de passe ne correspondent pas.")
        return

    db = SessionLocal()

    try:
        admin_existant = db.scalar(
            select(Administrateur).where(
                Administrateur.email == email
            )
        )

        if admin_existant:
            print("Un administrateur utilise déjà cet e-mail.")
            return

        admin = Administrateur(
            nom=nom,
            email=email,
            mot_de_passe_hash=hacher_mot_de_passe(mot_de_passe),
            role="ADMINISTRATEUR",
            actif=True,
        )

        db.add(admin)
        db.commit()

        print("Administrateur créé avec succès.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
