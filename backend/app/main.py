from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from app.routers.uploads import router as uploads_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.administrateurs import router as administrateurs_router

from app.core.database import Base, engine

from app.models.admin import Administrateur
from app.models.vehicle import Vehicule
from app.models.photo import PhotoVehicule
from app.models.sale import Vente


from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.activities import router as activities_router
from app.routers.dashboard import router as dashboard_router
from app.routers.sales import router as sales_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AUTO DEALS API",
    description="API de gestion de la plateforme AUTO DEALS",
    version="1.0.0",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Compatibilité avec Swagger UI pour les fichiers
    schema["openapi"] = "3.0.3"

    composants = schema.get("components", {}).get("schemas", {})

    for modele in composants.values():
        proprietes = modele.get("properties", {})

        for propriete in proprietes.values():

            # Fichier unique
            if propriete.get("contentMediaType") == "application/octet-stream":
                propriete.pop("contentMediaType", None)
                propriete["format"] = "binary"

            # Liste de fichiers
            elements = propriete.get("items", {})

            if elements.get("contentMediaType") == "application/octet-stream":
                elements.pop("contentMediaType", None)
                elements["format"] = "binary"

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi

app.mount(
    "/media",
    StaticFiles(directory="uploads"),
    name="media",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://auto-deals-123j5ptfv-asma-414b.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes d'authentification
app.include_router(auth_router)

# Routes de gestion des véhicules
app.include_router(vehicles_router)
app.include_router(uploads_router)
app.include_router(activities_router)
app.include_router(administrateurs_router)
app.include_router(dashboard_router)
app.include_router(sales_router)
@app.get("/")
def accueil():
    return {
        "message": "Bienvenue sur l'API AUTO DEALS",
        "status": "operational",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": "connected",
    }
