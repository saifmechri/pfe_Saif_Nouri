# Guide de Test - Connexion et Validation JWT

## 📋 Vue d'ensemble

Ce guide explique comment tester la connexion frontend-backend et la validation JWT dans votre application.

## 🚀 Démarrage des serveurs

### Backend (Port 3000)
```powershell
cd "c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri\backend"
node server.js
```

### Frontend (Port 5173)
```powershell
cd "c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri\frontend"
npm run dev
```

## 🧪 Tests Automatisés (Backend)

Pour exécuter les tests automatisés :

```powershell
cd backend
node test-auth.js
```

### Tests inclus :
1. ✅ Inscription d'un nouvel utilisateur
2. ✅ Validation email dupliqué (doit échouer)
3. ✅ Connexion avec credentials valides
4. ✅ Connexion avec mauvais mot de passe (doit échouer)
5. ✅ Accès route protégée AVEC token valide
6. ✅ Accès route protégée SANS token (doit échouer)
7. ✅ Accès route protégée avec token INVALIDE (doit échouer)

**Résultat attendu : 7/7 tests réussis (100%)**

## 🌐 Tests Manuels (Frontend)

### 1. Test d'inscription

1. Ouvrir http://localhost:5173/register
2. Remplir le formulaire :
   - **Nom** : TestUser
   - **Prénom** : Jean
   - **Email** : test@example.com
   - **Téléphone** : 21234567 (8 chiffres, commence par 2/5/9)
   - **Mot de passe** : Test@123 (min 8 car., 1 maj, 1 chiffre, 1 symbole)
   - **Rôle** : Automobiliste
3. Cliquer sur "S'inscrire"
4. ✅ **Résultat attendu** : Redirection vers /login

### 2. Test de connexion

1. Ouvrir http://localhost:5173/login
2. Entrer les credentials :
   - **Email** : test@example.com
   - **Password** : Test@123
3. Cliquer sur "Se connecter"
4. ✅ **Résultat attendu** : 
   - Token JWT stocké dans localStorage
   - Redirection vers la page d'accueil
   - Utilisateur connecté

### 3. Vérifier le token JWT dans le navigateur

Ouvrir la console du navigateur (F12) et exécuter :

```javascript
// Afficher le token stocké
console.log('Token:', localStorage.getItem('token'));

// Décoder le token (base64)
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload décodé:', payload);
```

✅ **Résultat attendu** : Voir le token JWT et son payload (id, email, exp)

### 4. Test de route protégée (via DevTools)

Dans la console du navigateur :

```javascript
// Test avec token valide
fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('✅ Profil:', data))
.catch(err => console.error('❌ Erreur:', err));

// Test sans token (doit échouer)
fetch('http://localhost:3000/api/auth/profile')
.then(res => res.json())
.then(data => console.log('❌ Ne devrait pas fonctionner:', data))
.catch(err => console.log('✅ Accès refusé (normal):', err));
```

### 5. Test de déconnexion

1. Appeler la fonction logout depuis le contexte
2. ✅ **Résultat attendu** : 
   - Token supprimé du localStorage
   - Utilisateur déconnecté
   - Redirection vers /login

## 🔍 Vérifications dans la base de données

```powershell
cd backend
node -e "const pool = require('./db'); pool.query('SELECT id, name, email, role_id, created_at FROM users ORDER BY created_at DESC LIMIT 5').then(res => { console.log('Derniers utilisateurs:'); console.table(res.rows); pool.end(); });"
```

## 📊 Points de terminaison API

### Routes publiques :
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Routes protégées (nécessitent JWT) :
- `GET /api/auth/profile` - Profil utilisateur

## 🛠️ Débogage

### Vérifier si le backend est accessible :
```powershell
curl http://localhost:3000
```

### Voir les logs du backend en temps réel :
Le serveur backend affiche les erreurs dans le terminal où il s'exécute.

### Vérifier les erreurs réseau (Frontend) :
1. F12 → Onglet Network
2. Filtrer par "Fetch/XHR"
3. Voir les requêtes API et leurs réponses

## ✅ Checklist de validation

- [ ] Backend démarre sur port 3000
- [ ] Frontend démarre sur port 5173
- [ ] Tests automatisés : 7/7 réussis
- [ ] Inscription fonctionne
- [ ] Connexion génère un token JWT
- [ ] Token stocké dans localStorage
- [ ] Route protégée accessible avec token
- [ ] Route protégée refusée sans token
- [ ] Déconnexion supprime le token

## 🔐 Structure du token JWT

```json
{
  "id": 1,
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

- **id** : ID de l'utilisateur
- **email** : Email de l'utilisateur
- **iat** : Issued At - Date de création
- **exp** : Expiration - Date d'expiration (24h après création)

## 📝 Notes importantes

1. **Secret JWT** : Actuellement "jwt_secret_key" (à changer en production)
2. **Durée du token** : 24 heures
3. **Stockage** : localStorage (considérer httpOnly cookie en production)
4. **Validation** : Le middleware vérifie le token à chaque requête protégée

## 🚨 Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| ERR_CONNECTION_REFUSED | Backend non démarré | Lancer `node server.js` |
| 400 Bad Request | Champs manquants | Vérifier le formulaire |
| 401 Unauthorized | Token manquant/invalide | Re-connexion |
| 404 Not Found | Route incorrecte | Vérifier l'URL API |

## 🎯 Prochaines étapes

- [ ] Ajouter refresh token
- [ ] Implémenter "Se souvenir de moi"
- [ ] Ajouter réinitialisation de mot de passe
- [ ] Ajouter validation email
- [ ] Implémenter roles/permissions
