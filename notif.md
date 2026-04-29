# Module Frontend Notifications Systeme

Ce document explique en detail comment la partie frontend du module notifications a ete implemente dans le projet, en se basant sur les routes backend existantes.

## 1) Objectif fonctionnel

Le module frontend permet de :

- Afficher une icone cloche dans la barre de navigation de la page d'accueil.
- Afficher un compteur des notifications non lues.
- Ouvrir un panneau de notifications (popover) au clic sur la cloche.
- Afficher dynamiquement les notifications recuperees depuis le backend.
- Afficher l'etat lue / non lue de chaque notification.
- Marquer une notification comme lue.
- Marquer toutes les notifications comme lues.
- Supprimer une notification.

## 2) Endpoints backend utilises

Le frontend consomme les endpoints suivants :

- GET /api/notifications
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all
- DELETE /api/notifications/:id

Ces endpoints sont deja proteges par le token (middleware verifyToken), et le frontend utilise deja Axios avec interceptor JWT via frontend/src/services/api.js.

## 3) Fichiers ajoutes / modifies

### A. Service API notifications

Fichier ajoute : frontend/src/services/notifications.js

Ce service centralise les appels HTTP du module :

- fetchNotifications(params)
- markNotificationAsRead(notificationId)
- markAllNotificationsAsRead()
- deleteNotification(notificationId)

Avantage :

- Separation claire entre UI et appels backend.
- Reutilisable dans d'autres pages/composants.

### B. Composant UI Notifications

Fichier ajoute : frontend/src/components/NotificationBell.jsx

Le composant gere :

- Le bouton cloche dans la navbar.
- Le badge rouge avec le nombre de non lues.
- L'ouverture / fermeture du panneau.
- Le chargement des notifications.
- Le rafraichissement periodique (polling toutes les 30 secondes).
- Les actions (lire, tout lire, supprimer).
- Les etats de chargement et les erreurs.

Details techniques importants :

1. Calcul du compteur non lu

- unreadCount est calcule avec useMemo a partir de notifications.filter(item => !item.is_read).

2. Robustesse de la reponse API

- Le backend renvoie typiquement data.items.
- Le frontend accepte aussi d'autres variantes de structure pour eviter les plantages si la forme evolue.

3. Polling automatique

- Un setInterval recharge les notifications toutes les 30 secondes.
- Cela garantit un affichage dynamique meme sans websocket.

4. Fermeture au clic externe

- Le panneau se ferme si l'utilisateur clique en dehors de la zone notifications.

5. Gestion de l'etat lue / non lue

- Les notifications non lues ont un style visuel distinct (fond amber leger + point indicateur).
- Les notifications lues ont un style plus neutre.

6. UX moderne Tailwind

- Composant compact, propre, ombre douce, coins arrondis.
- Boutons d'actions visibles mais non intrusifs.
- Etat loading avec icone spin.
- Messages d'erreur lisibles.

### C. Integration dans la page d'accueil

Fichier modifie : frontend/src/pages/Home.jsx

Changements :

- Import de NotificationBell.
- Ajout de NotificationBell a cote de l'icone de messagerie dans la navbar.
- L'icone n'apparait que si l'utilisateur est authentifie, comme la messagerie.

## 4) Logique de fonctionnement pas a pas

1. L'utilisateur authentifie arrive sur Home.
2. La navbar affiche la cloche + l'icone messagerie.
3. NotificationBell charge les notifications depuis GET /notifications.
4. Le badge affiche le nombre des non lues.
5. Au clic sur la cloche, le panneau s'ouvre et montre la liste.
6. Actions disponibles :
   - Marquer une notification lue -> PATCH /:id/read
   - Tout marquer lues -> PATCH /read-all
   - Supprimer notification -> DELETE /:id
7. Le state local est mis a jour apres chaque action pour retour visuel immediat.

## 5) Pourquoi cette architecture est bonne

- Respecte la separation des responsabilites (service API vs UI).
- Facilite les tests et la maintenance.
- Reutilisable si vous voulez afficher les notifications ailleurs (dashboard, profil, etc.).
- Evolutive vers realtime plus tard (socket/supabase) sans casser l'UI actuelle.

## 6) Verification manuelle recommandee

Lancer backend et frontend, puis verifier :

1. Connexion utilisateur valide.
2. Presence de la cloche dans la navbar Home.
3. Affichage correct du badge non lu.
4. Ouverture du panneau notifications.
5. Marquage individuel comme lue.
6. Marquage global "Tout lire".
7. Suppression d'une notification.
8. Rafraichissement automatique des donnees.

## 7) Pistes d'amelioration (optionnel)

- Ajouter un filtre "Toutes / Non lues".
- Ajouter une pagination "Charger plus".
- Ajouter des liens contextuels (ouvrir conversation, rendez-vous, etc.) selon type.
- Ajouter un websocket/realtime pour supprimer le polling.
- Ajouter des tests composants (React Testing Library).

## 8) Points d'attention

- Assurez-vous que VITE_API_URL pointe vers un backend accessible.
- Le token JWT doit etre present dans localStorage.
- Si le backend renvoie une forme de donnees differente, adaptez getNotificationItems.

---

Implementation terminee :

- Icone notifications avec compteur non lu dans navbar Home.
- Interface Tailwind moderne.
- Chargement dynamique depuis backend notifications.
- Gestion et affichage des etats lue / non lue.
