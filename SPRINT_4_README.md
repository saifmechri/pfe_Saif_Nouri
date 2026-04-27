# Sprint 4 - Profil Garage, Services et Avis Clients

## Objectif du sprint

Le Sprint 4 a pour objectif de mettre en place l espace garage de la plateforme AutoBot. Il permet au garage de gerer son profil, ses services et les avis clients. Cote frontend, la page de profil garage permet d afficher et de modifier les informations du garage. Cote backend, les donnees sont gerees via des routes securisees et des tables dediees en base de donnees.

## User Story principale

**En tant que garage, je peux gerer mon profil, mes services et consulter mes avis clients afin de presenter une offre professionnelle et suivre la satisfaction de mes clients.**

### Sous-taches du sprint

| Sous-tache | Description |
|---|---|
| [Back] CRUD garage | Creer, consulter, modifier et supprimer un profil garage |
| [Back] Gestion services | Creer, consulter, modifier et supprimer les services proposes par le garage |
| [Back] Gestion avis clients | Permettre la consultation, l ajout, la modification et la suppression des avis clients |
| [Front] Page profil garage | Interface permettant au garage de gerer son profil et ses donnees |
| [Front+Back] Test affichage services & avis | Verifier que les services et avis sont bien recuperes et affiches |

## Perimetre fonctionnel

### 1. Profil garage
- Creation d un profil garage.
- Consultation du profil garage connecte.
- Mise a jour des informations du garage.
- Suppression du profil garage.

### 2. Services garage
- Ajout d un service.
- Consultation des services d un garage.
- Modification d un service.
- Suppression d un service.

### 3. Avis clients
- Consultation des avis d un garage.
- Publication d un avis par un automobiliste.
- Modification ou suppression d un avis.
- Consultation du resume des avis.

## Interfaces concernes

- Route frontend garage: `/garage`
- Onglet Profil: gestion du profil garage
- Onglet Services: gestion des services
- Onglet Avis clients: consultation et moderation des avis

## Endpoints principaux

### Profil garage
- `GET /api/garages/me`
- `POST /api/garages`
- `PUT /api/garages/:id`
- `DELETE /api/garages/:id`

### Services garage
- `GET /api/garages/me/services`
- `GET /api/garages/:id/services`
- `POST /api/garages/:id/services`
- `PUT /api/garages/:id/services/:serviceId`
- `DELETE /api/garages/:id/services/:serviceId`

### Avis clients
- `GET /api/garages/me/reviews`
- `GET /api/garages/:id/reviews`
- `POST /api/garages/:id/reviews`
- `PUT /api/garages/:id/reviews/:reviewId`
- `DELETE /api/garages/:id/reviews/:reviewId`

## Comment tester la user story dans le site

### Preconditions
1. Le backend doit etre demarre.
2. Le frontend doit etre demarre.
3. Un compte avec le role `garage` doit exister.
4. Un compte avec le role `automobiliste` doit exister pour tester les avis.

### Test 1 - Connexion garage
1. Se connecter avec un compte garage.
2. Ouvrir la route `/garage`.
3. Verifier que le dashboard garage s affiche.

### Test 2 - Creation ou modification du profil garage
1. Aller dans l onglet **Profil**.
2. Renseigner le nom, l adresse, le telephone, l email et la position geographique si necessaire.
3. Cliquer sur **Creer mon profil garage** ou **Enregistrer les modifications**.
4. Verifier l affichage du message de succes.

### Test 3 - Gestion des services
1. Aller dans l onglet **Services**.
2. Ajouter un service avec nom, description, prix de base et duree.
3. Verifier que le service apparait dans la liste.
4. Modifier un service existant.
5. Supprimer un service.
6. Verifier la mise a jour immedate de la liste.

### Test 4 - Consultation des avis clients
1. Aller dans l onglet **Avis clients**.
2. Verifier que la note moyenne, le nombre d avis et la liste des avis s affichent.
3. Masquer ou republier un avis si le droit est disponible.
4. Verifier que l etat de publication change apres action.

### Test 5 - Test cote automobiliste
1. Se connecter avec un compte automobiliste.
2. Ouvrir la page `/automobiliste/garages`.
3. Selectionner un garage.
4. Verifier que les services du garage s affichent.
5. Publier un avis avec une note et un commentaire.
6. Revenir sur le compte garage.
7. Verifier que l avis apparait dans l onglet **Avis clients**.

## Comment tester avec Postman

### Cas profil garage
- `GET /api/garages/me`
- `POST /api/garages`
- `PUT /api/garages/:id`
- `DELETE /api/garages/:id`

### Cas services
- `GET /api/garages/me/services`
- `POST /api/garages/:id/services`
- `PUT /api/garages/:id/services/:serviceId`
- `DELETE /api/garages/:id/services/:serviceId`

### Cas avis
- `GET /api/garages/me/reviews`
- `POST /api/garages/:id/reviews`
- `PUT /api/garages/:id/reviews/:reviewId`
- `DELETE /api/garages/:id/reviews/:reviewId`

## Critères de validation

- Le garage peut gerer son profil sans erreur.
- Les services s ajoutent, se modifient et se suppriment correctement.
- Les avis clients s affichent correctement dans le frontend.
- Les actions effectuees dans le frontend sont coherentes avec les donnees backend.
- Aucun comportement incoherent entre le site et l API.

## Resultat attendu

A la fin du Sprint 4, le module garage doit etre operationnel de bout en bout: le garage peut gerer son profil, ses services et consulter les avis clients, tandis que l automobiliste peut consulter les services et deposer un avis.
