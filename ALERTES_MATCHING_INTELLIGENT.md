# Alertes & Matching intelligent

## Objectif

Cette fonctionnalite a pour but d'aider l'utilisateur a anticiper l'entretien de son vehicule et a trouver plus rapidement les garages les plus adaptes.

Elle repose sur deux blocs complementaires :

1. Les alertes d'entretien, basees sur le kilometrage ou le temps ecoule.
2. Le matching intelligent de garages, qui classe les garages selon la compatibilite avec le vehicule et le besoin detecte.

## Fonctionnement general

Le systeme suit l'etat du vehicule et compare les donnees courantes avec les seuils definis pour chaque alerte.

Quand une alerte devient due, le backend peut generer automatiquement une notification pour prevenir l'utilisateur.

En parallele, le moteur de matching recherche les garages les plus pertinents pour ce vehicule, afin de proposer une prise en charge plus rapide et plus ciblee.

## Partie alertes d'entretien

Les alertes sont gerees cote backend par le flux suivant :

1. L'utilisateur cree une alerte pour un vehicule.
2. L'alerte contient un type d'entretien, un seuil kilometrique et/ou un seuil en jours.
3. Le systeme verifie si l'alerte est due en fonction du kilometrage actuel et de la date.
4. Si l'alerte est declenchee, une notification est creee automatiquement.

### Donnees prises en compte

- `vehicleId` : vehicule concerne.
- `alertType` : type d'entretien, par exemple vidange, freins, filtres, inspection.
- `kmTrigger` : seuil kilometrique.
- `daysTrigger` : seuil temporel.
- `lastKm` : kilometrage de reference.
- `lastDate` : date de reference.

### Logique de declenchement

Une alerte est consideree comme due si l'une des conditions suivantes est vraie :

- le kilometrage actuel a depasse le seuil defini depuis le dernier relevé,
- le nombre de jours ecoules depuis la derniere date depasse le seuil defini.

### Notifications automatiques

Quand une alerte est due, le backend cree une notification de type entretien pour informer l'utilisateur.

Le message indique en general :

- le nom du vehicule,
- le type d'entretien a effectuer,
- une invitation a prendre rendez-vous avec un garage.

## Partie matching intelligent

Le matching intelligent sert a proposer des garages pertinents pour un vehicule donne.

Le principe est de calculer une correspondance entre :

- le vehicule de l'utilisateur,
- la distance maximale recherchee,
- les specialites ou services proposes par les garages.

Le resultat est une liste de garages tries ou classes selon leur adequation.

### Interets du matching

- reduire le temps de recherche manuelle,
- proposer des garages plus proches ou plus specialises,
- faciliter la prise de rendez-vous apres une alerte d'entretien.

## Cote backend

Les elements principaux sont :

- le controleur des alertes d'entretien,
- le service des alertes,
- le modele SQL des alertes,
- le controleur du matching des garages,
- le service de notifications.

### Endpoints principaux

- `GET /maintenance-alerts` : lister les alertes.
- `POST /maintenance-alerts` : creer une alerte.
- `POST /maintenance-alerts/check-due` : verifier les alertes dues et creer les notifications.
- `PATCH /maintenance-alerts/:id` : modifier une alerte.
- `DELETE /maintenance-alerts/:id` : supprimer une alerte.
- `GET /garages/match/:vehicleId` : recuperer les garages compatibles pour un vehicule.

## Cote frontend

La page principale de consultation affiche :

- l'etat de revision du vehicule,
- le niveau d'urgence,
- les progres kilometrique et temporel,
- la liste des garages recommandes.

Cette page permet a l'utilisateur de comprendre rapidement si une intervention est necessaire et vers quels garages se tourner.

## Parcours utilisateur

1. L'utilisateur ouvre la page d'alertes de son vehicule.
2. Le systeme affiche la prochaine revision estimee.
3. Si une maintenance est proche, l'interface met en avant l'urgence.
4. Les garages les plus adaptes sont proposes en dessous.
5. Si une alerte devient due, une notification est generee pour rappeler l'action a faire.

## Valeur fonctionnelle

Cette fonctionnalite apporte trois avantages principaux :

- meilleure anticipation de l'entretien,
- reduction du risque d'oublier une revision importante,
- orientation rapide vers un garage pertinent au bon moment.

## Fichiers relies

- [backend/controllers/maintenanceAlert.controller.js](backend/controllers/maintenanceAlert.controller.js)
- [backend/services/maintenanceAlertService.js](backend/services/maintenanceAlertService.js)
- [backend/models/maintenanceAlert.model.js](backend/models/maintenanceAlert.model.js)
- [backend/routes/maintenanceAlerts.js](backend/routes/maintenanceAlerts.js)
- [backend/controllers/garageMatchingController.js](backend/controllers/garageMatchingController.js)
- [backend/services/garageMatchingService.js](backend/services/garageMatchingService.js)
- [backend/controllers/notification.controller.js](backend/controllers/notification.controller.js)
- [frontend/src/pages/automobiliste/AlertsPage.jsx](frontend/src/pages/automobiliste/AlertsPage.jsx)

## Remarque

Ce document sert de resume fonctionnel de la tache "Alertes & Matching intelligent". Il peut etre enrichi plus tard avec des exemples d'API, des captures d'ecran ou des scenarios de test.