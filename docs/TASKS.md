# Tâches — Maki Story

Format : `- [ ]` à faire, `- [x]` fait. Une tâche = une branche. Prendre la première non bloquée.

## Phase 0 — Audit et cadrage

- [x] Audit du dépôt (OSDD et atomic)
- [x] Architecture cible et modèle de données
- [x] Décisions du 2026-10-03 (code enfant, coffre, messages adultes, pages sans maquette, adaptatif)
- [ ] Points ouverts restants de `docs/MEMORY.md`
- [ ] Réécrire `CLAUDE.md` et `docs/` dans le dépôt

## Phase 1 — Spécifications

- [x] Une spécification par domaine (14) : règles, états, cas limites, tests attendus

## Phase 2 — Fondations

- [x] Installer `nuxt-osdd`, créer les couches `technical/` et `functional/`, déclarer la config
- [x] Ranger le code existant par domaine, un domaine à la fois, sans changer le comportement
- [x] Renommer au singulier, étendre le lint à `any`
- [x] Migrations : plan des numéros en double, puis `0019` et suivantes
- [x] Tokens et thème (Theme), clair et sombre, avec passage RGAA des contrastes
- [x] Contrôle automatique des contrastes dans `scripts/design-audit.ts`
- [x] 9 atomes
- [x] 8 molécules
- [x] Sons soundcn et mouvement (existants conservés et vérifiés)
- [x] Aligner `scripts/design-audit.ts` sur `docs/DESIGN.md`

## Phase 3 — Accès

- [ ] Account : onboarding, légal, connexion, lien magique, code oublié, permissions, compte
- [ ] Profile : codes chiffres (adulte) et formes (enfant, 4 à 6), menu et modification
- [ ] Family : création, choix, gestion (codé et relu mobile sombre ; clair et large à relire)
- [ ] Invitation : ajout de proche, rejoindre, profil proche (codé et relu mobile sombre ; clair et large à relire)
- [ ] Lock : contrôle parental, écran verrouillé (codé ; écran verrouillé à relire en vrai verrouillage)

## Phase 4 — Cœur enfant

- [ ] Message : envoi par adulte et par enfant, limite de 5, expiration 24 h, purge planifiée
- [ ] Vault : coffre enfant et adulte, limite de 10
- [ ] Reading : lecture multivoix, progression
- [ ] Accueil Enfant

## Phase 5 — Proche et parent

- [ ] Book : bibliothèque, détail, ajout, accès par enfant
- [ ] Tag : tags multilingues
- [ ] Recording : studio page par page, enregistrement
- [ ] Review : revue parent, validation
- [ ] Accueil Proche, Catégorie

## Phase 6 — Finitions

- [ ] Notification : in-app et e-mail quotidien, 9 e-mails
- [ ] Help : aide, états d'erreur, hors ligne
- [ ] Pages sans maquette, dans le même style : activité, appareils, corbeille, stockage, grimace, traduction
- [ ] Builds Capacitor : iOS, Android, PWA, Android TV (état et marche à suivre dans `docs/capacitor.md` ; aucun build natif possible dans l'environnement actuel)
- [ ] Poids pour Madagascar (Opus 24 kbit/s, WebP 1200 px et reprise d'envoi déjà en place ; mesures à faire, voir `docs/capacitor.md`)
- [ ] Vérification finale écran par écran
- [x] Création de livre par étapes : couverture, pages avec ou sans voix, voix et personnages créés ensemble, brouillon serveur, vérification et envoi (#169, #180) ; reste : langue par voix, traduction IA à la création
- [x] Mascotte : poses intégrées aux états vides, erreurs, lecteur enfant et envoi
- [x] Limites de l'offre gratuite (12 livres, 8 adultes) ; reste : Stripe, codes promo, parrainage


- [x] 2026-10-16 : maquette adulte navigable responsive, six écrans et profils parent/proche, disponible sous `/maquettes/adultes.html`.

- [x] 2026-10-16 : premier lot visuel adulte intégré ; lint, typage, audits, build, 36 tests unitaires, 8 E2E ciblés et migrations de test validés. Suivi et suite : #189, `docs/ADULT-HANDOFF.md`.
