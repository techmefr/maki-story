# Lock

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Controle Parental, Ecran Verrouille (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Une règle de verrouillage par profil : jours, début et fin par pas de 30 minutes ; si la fin est avant le début elle tombe le lendemain.
- Fuseau horaire par règle (déjà géré par le dépôt) ; l'heure du serveur fait foi.
- Le verrou coupe une écoute en cours, après la fin de la page si prévu.
- Déverrouillage parent de 30 minutes (`unlockedUntil`) avec code.
- Les autres profils ne sont pas touchés.

## Réglages horaires et validation parentale (issue #181)

Tout se règle dans l'écran de contrôle parental de chaque enfant (`/family/parental`, composant `AccessControls`), sous le suivi des devoirs. Tout est désactivé par défaut : sans réglage, rien ne change pour l'enfant. Table `access_controls` (un enregistrement par enfant, migration 0066), fuseau de l'appareil du parent à l'enregistrement.

- Mode nuit : début et fin (la fin peut tomber le lendemain). Le serveur verrouille (raison `night`) ; l'écran de lecture affiche « N min avant le mode nuit » pendant les 30 dernières minutes (`nightStartsAt`, `NightCountdown`), et l'histoire se termine en douceur : le verrou attend la fin de la page en cours (`useLockAfterPage`) puis fondu.
- Plage d'écoute : hors de la plage, l'enfant est verrouillé (raison `listening`).
- Plage des devoirs : le suivi des devoirs (#176) ne s'applique que dans cette plage quand elle est activée ; sans plage, il s'applique toute la journée comme avant.
- Validation de chaque connexion : à chaque ouverture du profil enfant (`POST /api/auth/profile`), une demande `signin` part aux parents ; l'enfant reste verrouillé (raison `approval`) jusqu'à l'accord. L'accord dure une session : il est lié à la date d'ouverture du profil (`memberSince` dans le cookie de session) et vaut au plus 12 heures.
- Exception : hors plage d'écoute ou en mode nuit, l'enfant peut envoyer une demande `exception` ; un accord ouvre l'accès 60 minutes (surcharge de portée `all`).

Les trois demandes (`homework`, `signin`, `exception`) réutilisent la table `homework_requests` (colonne `kind`), la décision `POST /api/homework/requests/:id` et le domaine Notification (`homework_request`, `signin_request`, `exception_request`, push, e-mail, cloche). La première réponse d'un parent gagne (409 pour les suivantes).

Une demande en attente reste enregistrée côté serveur et s'affiche aux parents à leur retour dans l'app ; elle expire au bout de 10 minutes (`expired`, l'enfant peut redemander). Après un refus ou une expiration, l'enfant peut redemander une seule fois par créneau (au plus 2 demandes par créneau : début de la période bloquée pour une exception, ouverture du profil pour une connexion, début de la plage ou minuit pour les devoirs).

Ordre d'évaluation côté serveur (`accessForMember`) : surcharge `all` (déverrouillage parent ou exception accordée), validation de connexion, mode nuit, plage d'écoute, devoirs (sauf surcharge `homework` jusqu'à minuit), puis horaires hebdomadaires et blocage manuel.

Limite connue : l'acheminement vers une application fermée dépend de FCM (priorité haute Android) et d'APNs (`time-sensitive` iOS), non testés ici ; la persistance de la demande et le canal Web Push existant sont couverts côté serveur.

## États

- Libre, verrouillé (horaires, nuit, plage d'écoute, devoirs, connexion à valider), déverrouillé temporairement.
- Demande : aucune, en attente, refusée, expirée.

## Cas limites

- Famille entre France et Madagascar.
- Application hors ligne : règle appliquée localement.

## Données

LockRule (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`useParental`, `useLockAfterPage`, `server/api/access`

## Tests attendus

- Fin avant début passe minuit.
- Le verrou coupe une écoute.
- Déverrouillage expiré après 30 minutes.
- Nuit qui passe minuit, plages d'écoute et des devoirs, fuseau.
- Demande unique en attente, une seule relance par créneau, première réponse gagnante, expiration, accord d'une session.

## Validation

- [ ] Relue par Gaëtan
