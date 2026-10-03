# Notification

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Notifications, 9 e-mails (mail-*.html) (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Six types de notification ; préférences par type : dans l'app et par e-mail.
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
