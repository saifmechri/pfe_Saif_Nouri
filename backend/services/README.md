# Services

Les services contiennent la logique metier et l acces SQL:

- validations metier approfondies
- execution des requetes PostgreSQL
- transactions (`BEGIN/COMMIT/ROLLBACK`) quand necessaire
- transformation de donnees pour les controleurs

Bonnes pratiques:

- une responsabilite claire par fonction
- eviter la duplication SQL
- renvoyer des objets metier, pas des reponses HTTP
