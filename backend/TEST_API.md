# Guide de Test de l'API JWT

## 🚀 Démarrer le serveur

```bash
cd backend
node server.js
# ou avec nodemon pour le rechargement automatique
npx nodemon server.js
```

Le serveur démarre sur `http://localhost:3000`

---

## 📝 Tests avec curl ou Postman

### 1. **Créer un compte (Register)**

**Endpoint:** `POST /api/auth/register`

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Commande curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

**Réponse attendue:**
```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-03-07T..."
  }
}
```

---

### 2. **Se connecter (Login)**

**Endpoint:** `POST /api/auth/login`

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Commande curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

**Réponse attendue:**
```json
{
  "message": "Login success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

⚠️ **Copiez le token** pour l'utiliser dans la prochaine requête !

---

### 3. **Accéder au profil (Route protégée)**

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer VOTRE_TOKEN_ICI
```

**Commande curl:**
```bash
curl -X GET http://localhost:3000/api/auth/profile ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse attendue:**
```json
{
  "message": "Profil utilisateur",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-03-07T..."
  }
}
```

---

## 🧪 Tests d'erreurs

### Test sans token:
```bash
curl -X GET http://localhost:3000/api/auth/profile
```
**Réponse:** `{"message":"Token non fourni"}`

### Test avec token invalide:
```bash
curl -X GET http://localhost:3000/api/auth/profile ^
  -H "Authorization: Bearer token_invalide"
```
**Réponse:** `{"message":"Token invalide"}`

### Test login avec mauvais mot de passe:
```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"mauvais\"}"
```
**Réponse:** `{"message":"Wrong password"}`

---

## 📊 Structure de la base de données

Assurez-vous que votre table `users` existe avec cette structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Fonctionnalités implémentées

- ✅ Inscription avec hachage bcrypt du mot de passe
- ✅ Connexion avec vérification bcrypt
- ✅ Génération de token JWT (validité: 24h)
- ✅ Middleware de protection JWT
- ✅ Route protégée `/profile`
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Connexion PostgreSQL fonctionnelle

---

## 🚗 Tests CRUD Véhicules (Sprint 2)

Assurez-vous d'abord d'exécuter le script SQL:

```sql
\i backend/sql/vehicules.sql
```

Tous les endpoints véhicules nécessitent un token JWT.

### 1. Ajouter un véhicule

**Endpoint:** `POST /api/vehicules`

```bash
curl -X POST http://localhost:3000/api/vehicules ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -d "{\"marque\":\"Toyota\",\"modele\":\"Corolla\",\"annee\":2020,\"immatriculation\":\"AB-123-CD\",\"couleur\":\"Bleu\",\"kilometrage\":45000,\"photo_url\":\"https://example.com/toyota.jpg\"}"
```

### 2. Lister les véhicules de l'utilisateur connecté

**Endpoint:** `GET /api/vehicules`

```bash
curl -X GET http://localhost:3000/api/vehicules ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 3. Modifier un véhicule

**Endpoint:** `PUT /api/vehicules/:id`

```bash
curl -X PUT http://localhost:3000/api/vehicules/1 ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer VOTRE_TOKEN" ^
  -d "{\"marque\":\"Toyota\",\"modele\":\"Corolla\",\"annee\":2021,\"immatriculation\":\"AB-123-CD\",\"couleur\":\"Noir\",\"kilometrage\":50000,\"photo_url\":\"https://example.com/toyota-new.jpg\"}"
```

### 4. Supprimer un véhicule

**Endpoint:** `DELETE /api/vehicules/:id`

```bash
curl -X DELETE http://localhost:3000/api/vehicules/1 ^
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 5. Vérifier les cas d'erreur

- Sans token: retourne `401 Token non fourni`
- ID invalide: retourne `400 ID vehicule invalide`
- Véhicule inexistant: retourne `404 Vehicule non trouve`
- Immatriculation déjà utilisée: retourne `400 Cette immatriculation existe deja`
