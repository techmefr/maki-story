# Reprise du chantier (2026-10-04)

Tout est sur `origin/dev`. Rien n'est sur `main`. Pas de déploiement fait.

## Lancer l'app en local

Postgres de test (à recréer à chaque session, binaires système) :

```bash
D=/tmp/tantara-pg
/usr/lib/postgresql/14/bin/initdb -D $D -U tantara --auth=trust
/usr/lib/postgresql/14/bin/pg_ctl -D $D -o "-p 5544 -k /tmp" -l $D.log start
/usr/lib/postgresql/14/bin/createdb -h localhost -p 5544 -U tantara tantara_local
```

App (pnpm 12.8.1 n'existe pas sur le registre : forcer le pnpm local) :

```bash
cd ~/code/tantara-dev
export npm_config_manage_package_manager_versions=false
DATABASE_URL=postgresql://tantara@localhost:5544/tantara_local SESSION_SECRET=local NUXT_IGNORE_LOCK=1 NOTIFY_PROVIDER=fake pnpm exec nuxt dev --port 3111
```

Les migrations s'appliquent au démarrage. Aucun e-mail réel ne part en local.

Données de démo (compte local) : créer par l'API `POST /api/auth/register`, puis `POST /api/family` (assistant), puis `POST /api/auth/profile` avec le code parent. Compte utilisé : `demo@tantara.local` / `Maki Story-demo-1`, parent code `1234`, enfant Lova en formes `0123`.

## Où en est le travail

Voir `docs/verification.md` (écran par écran), `docs/TASKS.md`, `docs/MEMORY.md` (journal), `docs/deploy.md` (mise en production), `docs/capacitor.md`, `docs/adaptatif.md`.

## Tests

- Unitaires, lint, audit du design, build, migrations, `i18n:check` : passent.
- e2e : la suite complète n'a pas été menée à son terme. Le projet `mobile` (381 tests) a été repris à la main : de 57 échecs à une poignée, surtout des specs devenues obsolètes. Commande : `E2E_DATABASE_URL=postgresql://tantara@localhost:5544/tantara_e2e pnpm exec playwright test --project=mobile`.
- Les projets `desktop` et les tailles d'écran (`@viewport`) n'ont pas été relus.

### Specs de sécurité à valider par Gaëtan

L'environnement a empêché de modifier ces specs. Elles échouent parce que les règles ont changé volontairement :

| Spec | Ancienne attente | Règle actuelle |
|---|---|---|
| `13-permissions.spec.ts:224` | un enfant écrivant à un proche bloqué reçoit 403 | 400 (destinataire invalide) |
| `18-status-messages.spec.ts:177` | un proche ne peut pas supprimer un message | l'expéditeur peut retirer son message (200) ; l'enfant reste refusé (403) |
| `23-role-security.spec.ts:87` | un enfant ne peut écrire à personne d'adulte (403) | un enfant écrit à tous les adultes de sa famille (200) |
| `06-messages.spec.ts:94` | un enfant ne peut pas envoyer (403) | idem |
| `00-migrations.spec.ts:208` | deuxième message actif pour la même paire refusé | plusieurs messages actifs (5 au plus) |
| `24-player.spec.ts:120` | une autre famille reçoit une boîte vide | une autre famille reçoit une erreur (pas de `items`) |

## Reste à faire

- Studio : éditeur d'une seule page de la maquette, cartes de réplique d'Enregistrer (le fonctionnement existant est conservé).
- Relecture visuelle en clair et en large, tableau final.
- Relancer les e2e complets après validation des specs ci-dessus.
- Réécriture de l'historique git (retirer les mentions d'IA, auteur `techmefr`, push forcé) : à lancer par Gaëtan.
- Mise en production : voir `docs/deploy.md`, sur ordre de Gaëtan uniquement.
