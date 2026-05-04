# Cahier des Charges Final - Projet PFE AutoBot

## 1. Informations generales

- Intitule: Developpement d une plateforme web intelligente de gestion automobile et pieces auto
- Nom du projet: AutoBot (nom provisoire)
- Type: Stage obligatoire de fin de parcours (PFE)
- Periode: 02/02/2026 au 23/05/2026
- Duree: 12 semaines (3 mois)
- Methodologie: Scrum / Agile
- Equipe: Binome
  - Etudiant 1: NOUREDDINE ARBI
  - Etudiant 2: SEIF EDDINE MECHRI

## 2. Contexte et problematique

Le projet vise a centraliser des besoins automobiles frequents dans une meme plateforme:

- gestion des vehicules
- suivi des interventions et de l entretien
- recherche de pieces et comparaison vendeurs
- recherche de garages et prise de rendez-vous
- messagerie entre acteurs
- notifications metier

Problemes cibles:

- oublis d entretien et absence de suivi historique
- difficulte de trouver rapidement un garage ou une piece adaptee
- manque de transparence des prix entre vendeurs
- communication client/garage/vendeur peu structuree

## 3. Objectifs du systeme

### 3.1 Objectif general

Fournir une application web modulaire permettant de gerer le cycle automobile (vehicule, entretien, pieces, garage, rendez-vous, communication) avec authentification securisee et API REST.

### 3.2 Objectifs specifiques

- Authentifier les utilisateurs avec JWT et gestion des roles.
- Permettre CRUD vehicules, interventions et pieces.
- Offrir comparaison multi-vendeurs des pieces avec options geographiques.
- Proposer recherche garages avec filtres (distance, rating, services).
- Gerer rendez-vous (creation, consultation, mise a jour, suppression).
- Generer notifications metier (chat, entretien, rendez-vous).

## 4. Perimetre final (etat reel implemente)

## 4.1 Fonctionnalites implementees

### A. Authentification et profils

- Inscription et connexion securisees.
- Hash mot de passe (bcrypt) + JWT.
- Roles supportes: automobiliste, garage, vendeur, admin.
- Routes protegees et controle d acces par role.
- Profil utilisateur: consultation, mise a jour, suppression compte, changement mot de passe.

### B. Gestion vehicules et interventions

- CRUD vehicules (avec upload photo).
- CRUD interventions par vehicule.
- Liaison intervention <-> pieces (ajout/suppression de pieces d intervention).
- Recalcul du cout total des interventions.
- Historique d entretien par vehicule.

### C. Marketplace pieces

- CRUD pieces (vendeur/admin).
- Gestion stock (ajustement, mise a jour, historique des mouvements).
- Comparaison multi-vendeurs pour une piece.
- Filtres geographiques vendeurs (distance/rayon) avec calcul Haversine.
- Upload photo piece.

### D. Module garages

- CRUD garages.
- CRUD services garage.
- Avis garages (creation, publication, consultation, moderation selon role).
- Recherche garages avec filtres avances:
  - distance/rayon
  - rating
  - services (any/all)
  - open/closed

### E. Chat applicatif

- Gestion contacts chat.
- Gestion conversations (creation/liste/detail).
- Gestion messages (liste/envoi) persistes en base.

Note: le chat est implemente en mode API REST (polling), sans websocket natif dans le backend actuel.

### F. Rendez-vous et planning

- CRUD rendez-vous:
  - creation par automobiliste
  - listing par automobiliste/garage
  - update (status, date, heure, notes)
  - suppression
- Etats RDV: pending, confirmed, cancelled, done.
- Disponibilite garage:
  - endpoint de disponibilite par date
  - generation de creneaux selon work_hours
  - exclusion des creneaux deja occupes.

### G. Notifications

- CRUD notifications utilisateur.
- Notification a la creation d un rendez-vous (vers garage).
- Notification sur changement de statut RDV (confirmation/annulation).
- Notification sur suppression RDV (annulation).
- Notifications d alertes d entretien via maintenance alerts.

### H. Recommandations entretien

- Endpoint recommandations classees.
- Prise en compte vehicules + historique interventions + regles de scoring.
- Classement des garages recommandes avec distance et score global.

### I. Alertes maintenance

- CRUD alertes maintenance.
- Verification des alertes echeantes et creation de notifications.

## 4.2 Fonctionnalites partiellement implementees

- Dashboard admin complet: role admin existe et certaines routes admin sont presentes, mais le module supervision complet (KPI, signalements, audit centralise) n est pas finalise comme lot unique.
- Planning garage avance: disponibilite RDV existante, mais pas de moteur de capacite multi-bayes/ressources ni calendrier metier complexe.

## 4.3 Fonctionnalites non implementees ou non confirmees dans le code actuel

- Chat temps reel via websocket/socket.io (non detecte).
- Audit logs administrateur formalises (module dedie non detecte).
- Module signalements/moderation complet (workflow complet non detecte).
- Module depenses autonome (au sens budget/depenses separe) non expose comme domaine API distinct.
- Deploiement Docker formalise dans ce depot backend/frontend (non confirme par scripts/fichiers de deploiement automatiques dans le perimetre audite).

## 5. Acteurs et droits (Tableau 1 - Besoins fonctionnels corriges)

### 5.1 Visiteur (non authentifie)

Fonctionnalites implementees:

- Consulter la page d accueil API (`/`).
- Rechercher des garages (liste + filtres publics).
- Rechercher des pieces et comparer les offres vendeurs.
- Consulter les avis garages publics.
- S inscrire.
- Se connecter.

Fonctionnalites non implementees:

- Aucune gestion personnalisee (profil, RDV, chat) sans authentification.

### 5.2 Automobiliste

Fonctionnalites implementees:

- S authentifier (register/login JWT).
- Gerer son profil (consulter/modifier/supprimer compte, changer mot de passe).
- Ajouter / modifier / supprimer un vehicule.
- Enregistrer interventions et reparations.
- Consulter historique d entretien.
- Recevoir recommandations d entretien (scoring metier).
- Rechercher des pieces detachees.
- Comparer les prix entre vendeurs.
- Contacter vendeur et garage via chat (API REST).
- Rechercher des garages proches via geolocalisation (distance Haversine).
- Consulter services et avis garages.
- Reserver un rendez-vous.
- Consulter et gerer ses rendez-vous.
- Recevoir des notifications (chat, alertes maintenance, RDV).

Fonctionnalites non implementees:

- Reinitialisation mot de passe par workflow oublie mot de passe (email/token) non detectee comme module dedie.

### 5.3 Garage

Fonctionnalites implementees:

- S authentifier.
- Gerer son profil garage.
- Gerer ses services.
- Consulter ses rendez-vous recus.
- Confirmer / annuler un rendez-vous (via mise a jour du statut RDV).
- Repondre aux messages des automobilistes.
- Consulter les avis recus.

Fonctionnalites partiellement implementees:

- Gestion du planning: disponibilites par endpoint et creneaux, sans moteur avance de capacite/calendrier metier complet.
- Tableau de bord garage: endpoints metier presents, dashboard analytique complet non formalise comme module dedie unique.

Fonctionnalites non implementees:

- Workflow explicite "refus" distinct de "annulation" (statuts disponibles: pending/confirmed/cancelled/done).
- Reinitialisation mot de passe par workflow oublie mot de passe dedie non confirmee.

### 5.4 Vendeur de pieces

Fonctionnalites implementees:

- S authentifier.
- Gerer son profil utilisateur.
- Ajouter / modifier / supprimer des pieces.
- Gerer le stock (set/adjust + historique mouvements).
- Repondre aux utilisateurs via chat.

Fonctionnalites partiellement implementees:

- Consultation des demandes: via conversations/messages (pas de module "tickets demandes" separe).
- Tableau de bord vendeur: routes metier disponibles, dashboard KPI complet non confirme.

Fonctionnalites non implementees:

- Reinitialisation mot de passe par workflow oublie mot de passe dedie non confirmee.

### 5.5 Administrateur

Fonctionnalites implementees:

- S authentifier.
- Acceder a des routes admin existantes (ex: consultation utilisateurs).
- Intervenir sur certains modules via permissions etendues (ex: pieces/garages selon routes).

Fonctionnalites partiellement implementees:

- Tableau de bord administrateur global (supervision partielle seulement).

Fonctionnalites non implementees ou non confirmees:

- Validation/rejet formels des comptes garages et vendeurs via workflow dedie.
- Gestion complete des signalements.
- Statistiques globales admin consolidees en module dedie.
- Logs d activite/audit centralises.
- Supervision complete des transactions en tant que module admin autonome.

### 5.6 Tableau 1 - Synthese des besoins fonctionnels

| Acteur | Besoins valides (implementes) | Partiel | Non implemente/non confirme |
|---|---|---|---|
| Visiteur | Accueil, recherche garages/pieces, avis, inscription, connexion | - | Espace personnel |
| Automobiliste | Profil, vehicules, interventions, recommandations, recherche, chat, RDV, notifications | - | Workflow oublie mot de passe dedie |
| Garage | Profil garage, services, messages, avis, gestion RDV (confirm/cancel) | Planning avance, dashboard complet | Workflow refus distinct, oublie mot de passe dedie |
| Vendeur | CRUD pieces, stock, chat, profil | Dashboard complet, demandes structurees | Oublie mot de passe dedie |
| Admin | Auth + routes admin existantes | Supervision partielle | Signalements, audit logs, stats globales completes, workflow validation comptes dedie |

## 6. Architecture technique finale

### 6.1 Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Base de donnees: PostgreSQL (compatible Supabase)
- Auth: JWT + bcrypt
- Validation: express-validator
- Upload: multer

### 6.2 Style architectural

- Architecture MVC orientee API REST.
- Separation en couches:
  - routes
  - controllers
  - services
  - models
  - middlewares
  - utils

### 6.3 Donnees principales

Entites majeures:

- users, roles
- vehicules
- interventions, intervention_pieces
- pieces, piece_stock_movements
- garages, garage_services, garage_reviews
- chat_conversations, chat_messages
- appointments
- notifications
- maintenance_alerts

## 7. Exigences non fonctionnelles

- Securite:
  - authentification JWT
  - hash bcrypt
  - controle d acces par role
- Qualite API:
  - validation des entrees
  - reponses JSON structurees
  - gestion centralisee des erreurs
- Performance:
  - index SQL sur tables metier critiques
  - pagination sur plusieurs endpoints
- Maintenabilite:
  - separation des responsabilites
  - code modulaire par domaine metier

## 8. Roadmap sprint (version corrigee selon implementation)

### Sprint 1 - Foundation

- Setup backend/frontend
- Connexion PostgreSQL
- Architecture API de base

Statut: Realise

### Sprint 2 - Authentification et securite

- Register/login JWT
- Gestion des roles
- Routes protegees

Statut: Realise

### Sprint 3 - Vehicules et interventions

- CRUD vehicules
- CRUD interventions
- Historique entretien

Statut: Realise

### Sprint 4 - Pieces marketplace

- CRUD pieces
- Stock et mouvements
- Comparaison multi-vendeurs

Statut: Realise

### Sprint 5 - Garages et geolocalisation

- CRUD garages/services/avis
- Filtres distance/rating/services

Statut: Realise

### Sprint 6 - Chat et notifications

- Chat via API REST
- Notifications metier

Statut: Realise 

### Sprint 7 - Rendez-vous et planning

- CRUD RDV
- Disponibilite garage
- Notifications confirmation/annulation

Statut: Realise

### Sprint 8 - Recommandations et maintenance

- Recommandations classees
- Alertes maintenance + notifications

Statut: Realise (niveau avancé IA limite a regles/scoring metier)

### Sprint 9 - Admin supervision

- Fonctions admin partielles

Statut: Partiel

### Sprint 10 - Tests et deploiement

- Tests API manuels documentes
- Deploiement industrialise complet non finalise dans perimetre code audite

Statut: Partiel

## 9. Livrables finaux

- Application web frontend + backend
- Base de donnees PostgreSQL structuree
- API REST metier multi-domaines
- Documentation technique et tests API
- Cahier des charges final aligne implementation

## 10. Limites et recommandations post-PFE

- Ajouter websocket (socket.io) pour chat temps reel natif.
- Completer module admin (audit, signalements, tableaux KPI).
- Renforcer tests automatises (integration/e2e) et CI.
- Ajouter containerisation et scripts de deploiement reproductibles.
- Etendre planning garage (capacite, indisponibilites, regles metier avancees).

## 11. Conclusion

Le projet AutoBot, dans son etat implemente, depasse un simple CRUD et couvre un noyau fonctionnel riche: gestion automobile, maintenance, marketplace pieces, recherche garages, rendez-vous, chat applicatif et notifications. Le cahier des charges ci-dessus corrige la vision initiale et formalise le perimetre reel pour un rapport PFE fiable, coherent et exploitable.
