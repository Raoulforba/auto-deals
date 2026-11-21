
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from pwdlib import PasswordHash

from app.core.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

password_hash = PasswordHash.recommended()


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    return password_hash.hash(mot_de_passe)


def verifier_mot_de_passe(
    mot_de_passe: str,
    mot_de_passe_hash: str
) -> bool:
    return password_hash.verify(mot_de_passe, mot_de_passe_hash)


def creer_token_access(admin_id: int) -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY non configurée")

    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(admin_id),
        "exp": expiration,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def decoder_token(token: str):
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY non configurée")

    try:
        return jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
    except JWTError:
        return None
