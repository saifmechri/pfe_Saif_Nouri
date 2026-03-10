# Test Accès Pages Protégées

Guide complet pour tester la protection des routes par rôle (Frontend + Backend)

---

## 🚀 Prérequis

### 1. Démarrer les serveurs

**Terminal Backend** :
```bash
cd backend
npm start
```
Le backend devrait démarrer sur `http://localhost:3000`

**Terminal Frontend** :
```bash
cd frontend
npm run dev
```
Le frontend devrait démarrer sur `http://localhost:5173`

---

## 🧪 Tests Frontend

### Test 1 : Accès sans connexion (Non authentifié)

**Objectif** : Vérifier que les pages protégées sont inaccessibles sans connexion

#### Étapes :
1. Ouvrez votre navigateur en **mode navigation privée**
2. Accédez directement à : `http://localhost:5173/automobiliste`

#### Résultat attendu :
- ✅ Redirection automatique vers `/login`
- ✅ L'utilisateur ne peut pas accéder à la page

#### Autres URLs à tester :
- `http://localhost:5173/garage` → Redirige vers `/login`
- `http://localhost:5173/vendeur` → Redirige vers `/login`
- `http://localhost:5173/admin` → Redirige vers `/login`
- `http://localhost:5173/dashboard` → Redirige vers `/login`

---

### Test 2 : Connexion et redirection automatique

**Objectif** : Vérifier que l'utilisateur est redirigé vers son dashboard après connexion

#### Étapes :
1. Allez sur `http://localhost:5173/login`
2. Connectez-vous avec un compte **automobiliste**
   - Email : `automobiliste@test.com`
   - Password : `password123`

#### Résultat attendu :
- ✅ Connexion réussie
- ✅ Redirection automatique vers `/dashboard`
- ✅ Puis redirection vers `/automobiliste`
- ✅ Le header affiche : "Bonjour, [Nom]"
- ✅ Le lien "Tableau de bord" est visible

---

### Test 3 : Accès interdit (Mauvais rôle)

**Objectif** : Vérifier qu'un utilisateur ne peut pas accéder aux pages d'un autre rôle

#### Étapes :
1. Connectez-vous en tant qu'**automobiliste**
2. Dans la barre d'adresse, tapez : `http://localhost:5173/garage`

#### Résultat attendu :
- ✅ Redirection automatique vers `/unauthorized`
- ✅ Message affiché : "Accès interdit"
- ✅ Bouton "Retour à l'accueil" visible

#### Matrice de tests :

| Rôle connecté | Page testée | Résultat |
|---------------|-------------|----------|
| automobiliste | `/garage` | ❌ `/unauthorized` |
| automobiliste | `/vendeur` | ❌ `/unauthorized` |
| automobiliste | `/admin` | ❌ `/unauthorized` |
| garage | `/automobiliste` | ❌ `/unauthorized` |
| garage | `/vendeur` | ❌ `/unauthorized` |
| vendeur | `/automobiliste` | ❌ `/unauthorized` |
| vendeur | `/garage` | ❌ `/unauthorized` |

---

### Test 4 : Route /dashboard intelligente

**Objectif** : Vérifier que `/dashboard` redirige vers le bon dashboard selon le rôle

#### Étapes :
1. Connectez-vous avec différents rôles
2. Pour chaque rôle, accédez à `http://localhost:5173/dashboard`

#### Résultats attendus :

| Rôle | URL tapée | Redirection finale |
|------|-----------|-------------------|
| automobiliste | `/dashboard` | ✅ `/automobiliste` |
| garage | `/dashboard` | ✅ `/garage` |
| vendeur | `/dashboard` | ✅ `/vendeur` |
| admin | `/dashboard` | ✅ `/admin` |

---

### Test 5 : Lien "Tableau de bord" dans le header

**Objectif** : Vérifier que le lien dans la navbar fonctionne correctement

#### Étapes :
1. Connectez-vous avec n'importe quel rôle
2. Cliquez sur le lien **"Tableau de bord"** dans le header

#### Résultat attendu :
- ✅ Redirection vers votre dashboard spécifique
- ✅ Automobiliste → `/automobiliste`
- ✅ Garage → `/garage`
- ✅ Vendeur → `/vendeur`
- ✅ Admin → `/admin`

---

### Test 6 : Déconnexion

**Objectif** : Vérifier que la déconnexion fonctionne et supprime l'accès

#### Étapes :
1. Connectez-vous
2. Cliquez sur le bouton **"Déconnexion"** (rouge)
3. Essayez d'accéder à `/automobiliste` manuellement

#### Résultat attendu :
- ✅ Déconnexion réussie
- ✅ Redirection vers la page d'accueil `/`
- ✅ Le header affiche "Connexion" et "Inscription"
- ✅ Impossible d'accéder aux pages protégées → Redirige vers `/login`

---

## 🔧 Tests Backend (API)

### Test 7 : Route /auth/profile avec token valide

**Objectif** : Vérifier que l'API retourne le profil avec le rôle

#### Méthode 1 : Avec le navigateur
1. Connectez-vous sur le frontend
2. Ouvrez la console du navigateur (F12)
3. Allez dans l'onglet "Console"
4. Tapez :
```javascript
fetch('http://localhost:3000/auth/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

#### Résultat attendu :
```json
{
  "id": 1,
  "name": "Jean Dupont",
  "email": "automobiliste@test.com",
  "role": "automobiliste",
  "created_at": "2026-03-10T..."
}
```
✅ Le champ `role` doit être présent

---

### Test 8 : Route protégée admin (backend)

**Objectif** : Vérifier que seuls les admins peuvent accéder aux routes admin

#### Étapes :
1. Connectez-vous en tant qu'**automobiliste**
2. Dans la console du navigateur :
```javascript
fetch('http://localhost:3000/auth/admin/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

#### Résultat attendu :
```json
{
  "message": "Accès refusé : Rôle admin requis"
}
```
✅ Statut HTTP : `403 Forbidden`

#### Test avec un compte admin :
1. Connectez-vous en tant qu'**admin**
2. Relancez la requête ci-dessus

#### Résultat attendu :
```json
{
  "users": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "email": "automobiliste@test.com",
      "role": "automobiliste",
      "created_at": "..."
    },
    ...
  ]
}
```
✅ Statut HTTP : `200 OK`
✅ Liste des utilisateurs retournée

---

### Test 9 : API sans token

**Objectif** : Vérifier que les requêtes sans token sont refusées

#### Étapes :
1. Dans la console du navigateur :
```javascript
fetch('http://localhost:3000/auth/profile')
.then(r => r.json())
.then(data => console.log(data))
```

#### Résultat attendu :
```json
{
  "message": "Token non fourni"
}
```
✅ Statut HTTP : `401 Unauthorized`

---

### Test 10 : API avec token invalide

**Objectif** : Vérifier que les tokens invalides sont refusés

#### Étapes :
1. Dans la console du navigateur :
```javascript
fetch('http://localhost:3000/auth/profile', {
  headers: {
    'Authorization': 'Bearer tokenInvalide123'
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

#### Résultat attendu :
```json
{
  "message": "Token invalide"
}
```
✅ Statut HTTP : `401 Unauthorized`

---

## 📊 Checklist Complète

### Frontend
- [ ] Non connecté → `/automobiliste` → Redirige vers `/login`
- [ ] Connexion automobiliste → Redirige vers `/automobiliste`
- [ ] Automobiliste → `/garage` → Redirige vers `/unauthorized`
- [ ] `/dashboard` → Redirige vers le bon dashboard selon le rôle
- [ ] Lien "Tableau de bord" dans le header fonctionne
- [ ] Déconnexion supprime l'accès aux pages protégées
- [ ] Le nom s'affiche correctement : "Bonjour, [Nom]"

### Backend
- [ ] `/auth/profile` avec token valide → Retourne le profil + rôle
- [ ] `/auth/admin/users` en tant qu'automobiliste → `403 Forbidden`
- [ ] `/auth/admin/users` en tant qu'admin → `200 OK` + liste
- [ ] API sans token → `401 Unauthorized`
- [ ] API avec token invalide → `401 Unauthorized`

---

## 🐛 Problèmes Courants

### Problème 1 : "Page non trouvée" au lieu de redirection
**Cause** : Les serveurs ne sont pas démarrés
**Solution** : Redémarrer backend et frontend

### Problème 2 : Toujours redirigé vers /login même connecté
**Cause** : Le token n'est pas stocké ou est invalide
**Solution** : 
1. Ouvrir la console du navigateur (F12)
2. Console → Taper : `localStorage.getItem('token')`
3. Si `null` → Se reconnecter
4. Si présent → Vérifier que le backend est démarré

### Problème 3 : "Accès interdit" même avec le bon rôle
**Cause** : Le rôle n'est pas récupéré correctement
**Solution** :
1. Console → Taper : `localStorage.getItem('token')`
2. Copier le token
3. Aller sur [jwt.io](https://jwt.io) et coller le token
4. Vérifier que le payload contient l'ID utilisateur

### Problème 4 : CORS error lors des appels API
**Cause** : Le backend n'accepte pas les requêtes du frontend
**Solution** : Vérifier que le backend a configuré CORS correctement

---

## 📝 Notes

- Tous les mots de passe de test doivent respecter le format : au moins 6 caractères
- Les tokens JWT expirent après 24h
- En mode développement, utilisez toujours la navigation privée pour des tests propres
- Les rôles valides sont : `automobiliste`, `garage`, `vendeur`, `admin`

---

## ✅ Résumé

Le système de protection des routes fonctionne en **2 niveaux** :

1. **Frontend** : Vérifie le rôle avant d'afficher la page (UX)
2. **Backend** : Vérifie le token ET le rôle avant de retourner des données (Sécurité)

Les deux niveaux sont **indépendants** mais **complémentaires** pour une sécurité maximale.
