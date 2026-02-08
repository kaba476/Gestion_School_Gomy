# Gestion des présences scolaires

Application full-stack de gestion des présences, justifications et alertes pour un établissement scolaire. Trois rôles : **Admin**, **Professeur**, **Élève**.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Lancement](#lancement)
- [Rôles et accès](#rôles-et-accès)
- [Déploiement](#déploiement)
- [Fichiers utiles](#fichiers-utiles)

---

## Fonctionnalités

| Rôle | Principales actions |
|------|----------------------|
| **Admin** | Vue d’ensemble, classes, cours, présences, validation des journées, justifications, alertes (3 absences non justifiées), convocations, statistiques |
| **Professeur** | Appels (marquer présences/absences), liste des élèves par cours, alertes de convocation |
| **Élève** | Consulter ses présences, déposer des justifications, voir les alertes (ex. 3 absences non justifiées) |

- Authentification JWT
- Gestion des présences par cours et par date (une présence par élève/cours/date)
- Justifications et validation par l’admin
- Alertes automatiques et convocations
- Interface harmonisée (slate / emerald), navigation par onglets dans les dashboards
- Gestion d’erreurs globale (messages succès/erreur) et page 404

---

## Technologies

| Composant | Stack |
|-----------|--------|
| **Backend** | Node.js, Express, MongoDB (Mongoose), JWT, Helmet, rate-limit, CORS |
| **Frontend** | React 19, Vite, React Router, Tailwind CSS |
| **Base de données** | MongoDB (local ou MongoDB Atlas) |

---

## Structure du projet

```
Gestion_school/
├── README.md                 ← ce fichier
├── DEPLOIEMENT.md             (guide d’hébergement en ligne)
├── structure_projet.txt       (arborescence détaillée)
├── .env.example               (modèle variables backend)
├── package.json               (backend)
├── src/                       (backend Express)
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
└── gestion-school-front/      (frontend React/Vite)
    ├── .env.example           (modèle VITE_API_URL)
    ├── package.json
    └── src/
        ├── context/           (Auth, erreurs)
        ├── pages/             (Login, dashboards Admin/Prof/Élève, 404)
        ├── components/
        ├── services/          (api, auth)
        └── utils/
```

Voir **structure_projet.txt** pour l’arborescence complète.

---

## Prérequis

- **Node.js** (v18 ou supérieur recommandé)
- **MongoDB** (local ou compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** (ou yarn / pnpm)

---

## Installation

### 1. Cloner / ouvrir le projet

```bash
cd Gestion_school
```

### 2. Backend

```bash
npm install
```

### 3. Frontend

```bash
cd gestion-school-front
npm install
cd ..
```

---

## Variables d'environnement

### Backend (racine du projet)

Copier `.env.example` en `.env` et renseigner :

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | URI de connexion MongoDB (ex. `mongodb://localhost:27017/gestion_school` ou URI Atlas) |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT (chaîne longue et aléatoire) |
| `PORT` | Port du serveur (optionnel, défaut `5000`) |
| `FRONTEND_URL` | En production : URL du frontend pour CORS (ex. `https://mon-app.vercel.app`) |

### Frontend (dossier `gestion-school-front`)

Copier `.env.example` en `.env` (ou `.env.production` pour la prod). En dev, la valeur par défaut pointe vers le backend local :

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l’API (ex. `http://localhost:5000/api` en dev) |

---

## Lancement

### En développement

**Terminal 1 — Backend :**

```bash
npm run dev
```

Le serveur écoute par défaut sur `http://localhost:5000`.

**Terminal 2 — Frontend :**

```bash
cd gestion-school-front
npm run dev
```

L’application est disponible sur `http://localhost:5173`.

### En production

- **Backend :** `npm start` (ou `node src/server.js`)
- **Frontend :** `npm run build` puis servir le dossier `dist` (voir [Déploiement](#déploiement)).

---

## Rôles et accès

- **Admin** : tableau de bord complet (vue d’ensemble, classes, cours, présences, justifications, alertes, convocations, statistiques).
- **Professeur** : appels pour ses cours, liste des élèves, alertes de convocation.
- **Élève** : ses présences, dépôt de justifications, consultation des alertes (ex. 3 absences non justifiées).

Les identifiants de test (si présents) sont à configurer en base ou via un script d’initialisation.

---

## Déploiement

Le guide détaillé (MongoDB Atlas, Render/Railway pour l’API, Vercel/Netlify pour le front) est dans **[DEPLOIEMENT.md](./DEPLOIEMENT.md)**.

En bref :

1. **Base** : MongoDB Atlas → récupérer l’URI.
2. **Backend** : Render ou Railway → `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`.
3. **Frontend** : Vercel ou Netlify → dossier `gestion-school-front`, variable `VITE_API_URL` = URL de l’API.

---

## Fichiers utiles

| Fichier | Rôle |
|---------|------|
| **README.md** | Présentation et démarrage (ce fichier) |
| **DEPLOIEMENT.md** | Hébergement (Atlas, Render/Railway, Vercel/Netlify) |
| **structure_projet.txt** | Arborescence détaillée backend + frontend |
| **.env.example** (racine) | Modèle des variables backend |
| **gestion-school-front/.env.example** | Modèle `VITE_API_URL` pour le frontend |
| **hashPassword.js** | Utilitaire pour hasher les mots de passe (création d’utilisateurs) |

---

## Licence

ISC (voir `package.json`).
