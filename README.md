# 🚗 AUTO DEALS

**Application web de gestion et de commercialisation de véhicules automobiles.**

AUTO DEALS est une application développée pour faciliter la gestion d'un parc automobile, la présentation des véhicules disponibles et le suivi des ventes.

## 📌 Présentation du projet

AUTO DEALS propose une interface publique destinée aux visiteurs et un espace d'administration sécurisé pour gérer les activités commerciales.

## ✨ Fonctionnalités

### Espace public
- Consultation des véhicules disponibles.
- Recherche de véhicules.
- Consultation des caractéristiques et des photos.
- Affichage des détails d'un véhicule.

### Espace administration
- Authentification des administrateurs.
- Gestion des véhicules (ajout, consultation, modification et suppression selon les règles métier).
- Gestion des photos des véhicules.
- Suivi des activités.
- Gestion des administrateurs.
- Tableau de bord et statistiques.
- Enregistrement et consultation des ventes.
- Historique des ventes et informations des clients.

### Sécurité et gestion des ventes
- Authentification par JWT.
- Gestion des rôles et permissions.
- Confirmation du paiement intégral avant validation d'une vente.
- Protection contre les ventes en double.
- Conservation de l'historique des ventes.
- Protection des véhicules déjà vendus.

## 🛠️ Technologies utilisées

| Partie | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI |
| Base de données | MySQL |
| ORM | SQLAlchemy |
| Authentification | JWT |
| Interface API | Swagger / OpenAPI |
| Versionnement | Git et GitHub |

## 📁 Structure du projet

```text
auto-deals/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   └── schemas/
│   ├── uploads/
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── admin/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── package-lock.json
│
└── .gitignore
```

## ⚙️ Installation

### 1. Prérequis

Installer les outils suivants :
- Python 3.12 ou compatible avec les dépendances du projet.
- Node.js et npm.
- MySQL 8.
- Git.

### 2. Cloner le projet

```bash
git clone git@github.com:Raoulforba/auto-deals.git
cd auto-deals
```

### 3. Configurer le backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Créer le fichier de configuration :

```bash
cp .env.example .env
```

Renseigner les informations de connexion MySQL et une clé JWT secrète dans le fichier `.env`.

Créer la base de données MySQL :

```sql
CREATE DATABASE auto_deals
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Vérifier que les modèles et les mécanismes d'initialisation de la base sont configurés avant de lancer le serveur.

Démarrer le backend :

```bash
python -m uvicorn app.main:app --reload
```

API : http://127.0.0.1:8000

Documentation Swagger : http://127.0.0.1:8000/docs

### 4. Configurer le frontend

Ouvrir un deuxième terminal :

```bash
cd frontend

npm install
npm run dev
```

Le frontend est accessible à l'adresse indiquée par Vite, généralement :

http://localhost:5173

## 🔐 Sécurité

- Ne jamais publier le fichier `.env`.
- Ne jamais publier les clés privées ou les mots de passe.
- Utiliser des clés JWT fortes et confidentielles.
- Protéger les accès administrateurs.
- Ne pas versionner les environnements virtuels ou les dépendances installées.
- Effectuer régulièrement des sauvegardes de la base de données.

## 🚀 Évolutions

AUTO DEALS est un projet évolutif. De nouvelles fonctionnalités et améliorations pourront être intégrées progressivement.

## 👨‍💻 Auteur

**Raoul Forba**

Projet : AUTO DEALS

GitHub : https://github.com/Raoulforba

---

*AUTO DEALS — Simplifier la gestion et la commercialisation automobile.*
