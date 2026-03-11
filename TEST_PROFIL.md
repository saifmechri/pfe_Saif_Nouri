# 🧪 GUIDE DE TEST - Mise à jour du profil utilisateur (PPAS-13)

## ⚠️ PRÉREQUIS IMPORTANT - BASE DE DONNÉES

**AVANT DE COMMENCER LES TESTS**, vous devez ajouter la colonne `updated_at` dans la base de données :

### Étape 1 : Ouvrir pgAdmin
1. Lancez pgAdmin
2. Connectez-vous à votre serveur PostgreSQL (localhost)
3. Naviguez vers : Servers → PostgreSQL → Databases → autodb

### Étape 2 : Exécuter la requête SQL
1. Clic droit sur `autodb` → **Query Tool**
2. Copiez et collez cette commande :

```sql
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
```

3. Cliquez sur **Execute/Run** (F5)
4. Vérifiez le message : "ALTER TABLE" et "UPDATE X"

---

## 🚀 DÉMARRAGE DES SERVEURS

### Terminal 1 : Backend
```bash
cd "C:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri\backend"
npm start
```
**Vérifiez** : `Serveur démarré sur le port 3000`

### Terminal 2 : Frontend
```bash
cd "C:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri\frontend"
npm run dev
```
**Vérifiez** : `Local: http://localhost:5173/`

---

## 📍 ACCÈS À LA PAGE PROFIL

### Méthode 1 : Navigation directe
1. Ouvrez : http://localhost:5173
2. Cliquez sur **"Se connecter"** ou allez sur http://localhost:5173/login
3. Connectez-vous avec un compte existant :
   ```
   Email: test@example.com
   Mot de passe: votre_mot_de_passe
   ```
4. Une fois connecté, allez manuellement sur : **http://localhost:5173/profil**

### Méthode 2 : Ajouter un lien dans le Dashboard
Pour faciliter l'accès, vous pouvez ajouter un lien "Mon Profil" dans vos dashboards.

---

## 🧪 SCÉNARIOS DE TEST

### ✅ TEST 1 : Affichage du profil
**Objectif** : Vérifier que les données de l'utilisateur s'affichent correctement

**Étapes** :
1. Accédez à `/profil`
2. Vérifiez que le formulaire affiche :
   - ✓ Votre nom actuel
   - ✓ Votre email actuel
   - ✓ Votre téléphone actuel

**Résultat attendu** : Les champs sont pré-remplis avec vos informations

---

### ✅ TEST 2 : Modification du nom
**Objectif** : Mettre à jour le nom d'utilisateur

**Étapes** :
1. Section "Informations personnelles"
2. Modifiez le champ **"Nom"** → par exemple : "Jean Dupont"
3. Cliquez sur **"Mettre à jour le profil"**

**Résultat attendu** :
- ✓ Message de succès : "Profil mis à jour avec succès"
- ✓ Le nom est mis à jour dans l'interface
- ✓ Vérifier dans pgAdmin : `SELECT name FROM users WHERE email='votre_email';`

**Erreurs possibles** :
- ❌ "column 'updated_at' does not exist" → Retournez à l'étape prérequis

---

### ✅ TEST 3 : Modification de l'email
**Objectif** : Changer l'adresse email

**Étapes** :
1. Modifiez le champ **"Email"** → par exemple : "nouveau@example.com"
2. Cliquez sur **"Mettre à jour le profil"**

**Résultat attendu** :
- ✓ Message de succès
- ✓ L'email est mis à jour

**Tests supplémentaires** :
- ⚠️ Essayez avec un email déjà existant → "Cet email est déjà utilisé"
- ⚠️ Essayez avec un format invalide → "Format d'email invalide"

---

### ✅ TEST 4 : Modification du téléphone
**Objectif** : Changer le numéro de téléphone

**Étapes** :
1. Modifiez le champ **"Téléphone"** → exemple : "20123456" (8 chiffres)
2. Cliquez sur **"Mettre à jour le profil"**

**Résultat attendu** :
- ✓ Message de succès
- ✓ Le téléphone est mis à jour

**Tests de validation** :
- ⚠️ Téléphone trop court (< 8 chiffres) → "Le téléphone doit contenir entre 8 et 15 chiffres"
- ⚠️ Téléphone avec des lettres → "Le téléphone doit contenir entre 8 et 15 chiffres"

---

### ✅ TEST 5 : Changement de mot de passe
**Objectif** : Modifier le mot de passe utilisateur

**Étapes** :
1. Section "Changer le mot de passe"
2. Remplissez :
   - **Ancien mot de passe** : votre mot de passe actuel
   - **Nouveau mot de passe** : un nouveau mot de passe (min 8 caractères)
3. Cliquez sur **"Changer le mot de passe"**

**Résultat attendu** :
- ✓ Message de succès : "Mot de passe modifié avec succès"
- ✓ Déconnectez-vous et reconnectez-vous avec le nouveau mot de passe

**Tests d'erreur** :
- ⚠️ Mauvais ancien mot de passe → "Ancien mot de passe incorrect"
- ⚠️ Nouveau mot de passe trop court → "Le nouveau mot de passe doit contenir au moins 8 caractères"

---

### ✅ TEST 6 : Suppression du compte
**Objectif** : Tester la suppression d'un compte utilisateur

⚠️ **ATTENTION** : Ce test supprime définitivement le compte !

**Étapes** :
1. Section "Supprimer mon compte"
2. Entrez votre **mot de passe** pour confirmer
3. Cliquez sur **"Supprimer mon compte"**

**Résultat attendu** :
- ✓ Message de confirmation
- ✓ Le compte est supprimé de la base de données
- ✓ Vous êtes redirigé vers la page de connexion

**Test d'erreur** :
- ⚠️ Mauvais mot de passe → "Mot de passe incorrect"

---

## 🔍 VÉRIFICATION EN BASE DE DONNÉES

Pour vérifier que les modifications sont bien enregistrées :

1. Ouvrez pgAdmin → Query Tool sur `autodb`
2. Exécutez :

```sql
-- Voir tous les utilisateurs
SELECT id, name, email, phone, role_id, updated_at, created_at 
FROM users;

-- Voir un utilisateur spécifique
SELECT * FROM users WHERE email = 'votre_email@example.com';
```

---

## 📊 RÉSUMÉ DES ENDPOINTS TESTÉS

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| PUT | `/api/auth/profile` | Mettre à jour le profil | ✅ |
| PUT | `/api/auth/profile/password` | Changer le mot de passe | ✅ |
| DELETE | `/api/auth/profile` | Supprimer le compte | ✅ |

---

## 🐛 PROBLÈMES COURANTS

### Problème 1 : Erreur 500 "column 'updated_at' does not exist"
**Solution** : Exécutez la requête SQL du prérequis

### Problème 2 : "Unauthorized" ou redirection vers /login
**Solution** : 
- Vérifiez que vous êtes bien connecté
- Vérifiez que le token JWT existe dans localStorage (F12 → Application → Local Storage)

### Problème 3 : Le formulaire ne s'affiche pas
**Solution** :
- Vérifiez la console (F12) pour les erreurs JavaScript
- Vérifiez que le backend est bien démarré

### Problème 4 : Les modifications ne persistent pas
**Solution** :
- Vérifiez les logs backend dans le terminal
- Vérifiez la connexion à la base de données

---

## ✅ CHECKLIST DE TEST COMPLÈTE

- [ ] Base de données : colonne `updated_at` ajoutée
- [ ] Backend démarré (port 3000)
- [ ] Frontend démarré (port 5173)
- [ ] Connexion réussie
- [ ] Accès à `/profil` fonctionne
- [ ] Affichage des données utilisateur
- [ ] Modification du nom
- [ ] Modification de l'email
- [ ] Modification du téléphone
- [ ] Changement de mot de passe
- [ ] Validation des erreurs
- [ ] Suppression de compte (optionnel)
- [ ] Vérification en base de données

---

## 📝 NOTES IMPORTANTES

1. **Token JWT** : Expiré après 24h, il faudra se reconnecter
2. **Validation** : Tous les champs sont validés côté backend
3. **Sécurité** : Le mot de passe est toujours requis pour la suppression du compte
4. **updated_at** : Est automatiquement mis à jour à chaque modification

---

## 🎯 PROCHAINES ÉTAPES APRÈS LES TESTS

1. ✅ Tous les tests passent → Merger la branche PPAS-13 dans develop
2. ❌ Des bugs trouvés → Créer des tickets et corriger
3. 📄 Documentation → Mettre à jour le README avec les nouvelles fonctionnalités
4. 🚀 Déploiement → Préparer pour la production
