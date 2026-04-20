# Middlwares (legacy)

Ce dossier est conserve pour compatibilite historique.

Pourquoi il existe:

- certains modules legacy importent encore depuis `middlwares/`.
- une migration totale vers `middlewares/` doit etre faite en une passe controlee avec tests.

Recommendation:

- pour les nouveaux developpements, preferer `middlewares/`.
- ne pas supprimer ce dossier tant que des imports legacy existent.
