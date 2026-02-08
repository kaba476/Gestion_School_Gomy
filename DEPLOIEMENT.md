# Guide d'hébergement — Gestion des présences scolaires

Ce document décrit comment héberger le projet (backend Node, frontend React, base MongoDB) en ligne.

---

## Vue d'ensemble

| Composant   | Techno           | Où héberger (exemples)     |
|------------|------------------|----------------------------|
| Base de données | MongoDB       | **MongoDB Atlas** (gratuit) |
| Backend API     | Node / Express | **Render** ou **Railway**   |
| Frontend        | React / Vite  | **Vercel** ou **Netlify**   |

L’ordre conseillé : **1) Base → 2) Backend → 3) Frontend**.

---

## 1. Base de données (MongoDB Atlas)

1. Aller sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) et créer un compte.
2. Créer un **cluster** (gratuit M0).
3. Dans **Database Access** → **Add New Database User** : créer un utilisateur (login/mot de passe), noter-les.
4. Dans **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) pour que Render/Railway puissent se connecter.
5. Dans **Database** → **Connect** → **Connect your application** : copier l’URI (ex. `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`).
6. Remplacer `<password>` par le mot de passe de l’utilisateur, et optionnellement ajouter le nom de la base :  
   `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/gestion_school?retryWrites=true&w=majority`  
   → Ce sera ta variable **MONGO_URI** pour le backend.

---

## 2. Backend (Render ou Railway)

### Option A : Render

1. Aller sur [render.com](https://render.com), créer un compte, lier GitHub si le projet est sur un dépôt.
2. **New** → **Web Service**.
3. Connecter le dépôt et choisir le **dossier racine du backend** (celui qui contient `src/server.js`, `package.json`).
4. Configurer :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start` (ou `node src/server.js`)
   - **Environment** : ajouter les variables :
     - `MONGO_URI` = l’URI Atlas (étape 1)
     - `JWT_SECRET` = une chaîne longue et aléatoire (générateur de mot de passe)
     - `PORT` = laisser vide (Render l’assigne)
5. Créer le service. Une URL du type `https://gestion-school-api.onrender.com` sera générée.
6. Noter cette URL : ce sera **l’URL de l’API** pour le frontend (avec `/api` à la fin si tes routes sont sous `/api`).

### Option B : Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub (dossier backend).
2. Dans **Variables** : ajouter `MONGO_URI`, `JWT_SECRET`.
3. Déployer, noter l’URL publique du service (ex. `https://gestion-school-production.up.railway.app`).

---

## 3. Frontend (Vercel ou Netlify)

Le frontend doit appeler l’API hébergée, pas `localhost`.

### Variable d’environnement frontend

Dans le dossier **gestion-school-front** :

1. Créer un fichier `.env.production` (ou utiliser les variables du tableau de bord Vercel/Netlify) :
   ```
   VITE_API_URL=https://ton-api.onrender.com/api
   ```
   Remplacer par l’URL réelle de ton backend (avec `/api` si tes routes sont préfixées par `/api`).

### Option A : Vercel

1. [vercel.com](https://vercel.com) → Import Project → sélectionner le dépôt.
2. **Root Directory** : choisir **gestion-school-front** (ou le dossier qui contient le front React).
3. **Build Command** : `npm run build`
4. **Output Directory** : `dist` (valeur par défaut pour Vite).
5. **Environment Variables** : ajouter `VITE_API_URL` = URL de ton backend (ex. `https://gestion-school-api.onrender.com/api`).
6. Deploy. Tu obtiendras une URL du type `https://gestion-school.vercel.app`.

### Option B : Netlify

1. [netlify.com](https://netlify.com) → Add new site → Import from Git.
2. Dossier de base : **gestion-school-front**.
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Variables d’environnement : `VITE_API_URL` = URL de l’API.
6. Déployer.

---

## 4. CORS (backend)

Le backend utilise la variable **FRONTEND_URL** pour autoriser l’origine du frontend en production.

- **En production** : dans les variables d’environnement du backend (Render/Railway), ajouter :
  - `FRONTEND_URL` = URL de ton frontend, ex. `https://gestion-school.vercel.app`
  - Pour plusieurs origines, séparer par des virgules : `https://site1.vercel.app,https://site2.netlify.app`
- **En dev** : si `FRONTEND_URL` n’est pas définie, toutes les origines sont acceptées (y compris `http://localhost:5173`).

---

## 5. Récapitulatif des variables

### Backend (Render / Railway)

| Variable     | Exemple / description                    |
|-------------|------------------------------------------|
| MONGO_URI   | URI MongoDB Atlas                        |
| JWT_SECRET  | Chaîne secrète longue et aléatoire       |
| FRONTEND_URL| URL du front (ex. https://gestion-school.vercel.app) pour CORS |
| PORT        | Laissé vide (fourni par l’hébergeur)     |

### Frontend (Vercel / Netlify)

| Variable      | Exemple                                      |
|---------------|----------------------------------------------|
| VITE_API_URL  | https://gestion-school-api.onrender.com/api  |

---

## 6. Après déploiement

- Tester la connexion depuis la page login du site hébergé.
- Vérifier que les appels API partent bien vers l’URL de production (onglet Réseau du navigateur).
- En cas d’erreur CORS, ajouter l’URL du frontend : vérifier que **FRONTEND_URL** (backend) contient bien l’URL exacte du frontend (ex. `https://gestion-school.vercel.app`).

---

## Fichiers utiles déjà en place

- **Backend** : `.env.example` à la racine (MONGO_URI, JWT_SECRET, FRONTEND_URL, PORT). CORS lit `FRONTEND_URL` en production.
- **Frontend** : `.env.example` dans **gestion-school-front** (VITE_API_URL). `api.js` utilise `import.meta.env.VITE_API_URL` ; en production, définir `VITE_API_URL` sur l’hébergeur du front.

Une fois ces étapes faites, ton projet est hébergé et utilisable en ligne.
