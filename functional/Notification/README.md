# Notification

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Notifications, 9 e-mails (mail-*.html) (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Préférences par type : dans l’app, push et e-mail ; les types supplémentaires déjà présents sont conservés.
- Un seul e-mail récapitulatif par jour, selon les préférences.
- Neuf e-mails transactionnels : bienvenue, lien magique, invitation, nouvelle voix, relecture, corrections, code réinitialisé, export, compte supprimé.
- Notifications push et Web Push avec repli e-mail.
- État vide animé (Maki).

## États

- Non lue, lue.

## Cas limites

- Plusieurs événements groupés dans une notification.
- Désinscription.

## Données

Notification, NotificationPreference (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/notifications`, `server/api/push`, `useNotifications`, `usePush`

## Tests attendus

- Un seul e-mail récapitulatif par jour.
- Les préférences désactivées sont respectées.

## Validation

- [ ] Relue par Gaëtan

## Récapitulatif quotidien

Envoi à 07:00 UTC par `notifications:digest` ou cron Vercel authentifié. Réservation unique `(account_id, digest_date)` avant l’appel fournisseur : une seule tentative par compte et journée UTC, même en cas d’exécutions simultanées ou de résultat réseau ambigu. Après un échec, les événements restent en attente pour le lendemain. Préférences e-mail et liens familiaux actifs relus à chaque traitement. Voir `docs/pages/notifications.md` pour l’activation et la rétention.
