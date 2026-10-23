# Tasks: Ambiances adaptatives Maki Story

**Input**: spec.md, plan.md, research.md, data-model.md et contracts/appearance-ui.md.
**Status**: plan de travail, aucune tâche ci-dessous implémentée dans ce lot documentaire.
**Tests**: tests ciblés des règles demandés par les scénarios et la constitution ; pas d’E2E local.
**Paths**: relatifs à la racine du monorepo Nuxt ; aucun préfixe back/web/mobile.
**Format**: checkbox, ID séquentiel, [P] si fichiers indépendants, [USn] dans une phase utilisateur.

## Phase 1: Setup (Shared Infrastructure)

Préparer le travail sans changement de produit.

- [ ] T001 Relire et consigner la validation des hypothèses calendrier/fêtes/29 février dans specs/001-adaptive-appearance/spec.md avant de coder ; FR-008 à FR-016.
- [ ] T002 Inventorier les assets réutilisables et les planches dans specs/001-adaptive-appearance/research.md et docs/maquettes/planches/README.md ; ne pas utiliser les PNG de planches comme pages de production ; FR-018, FR-019.

## Phase 2: Foundational (Blocking Prerequisites)

Valider et restaurer des préférences inactives sans modifier les profils existants.

- [ ] T003 Écrire les tests de schéma, clés isolées pour trois profils, version future, absence/corruption et stockage bloqué dans tests/unit/ambience-storage.test.ts ; defaults enabled=false et enabledEvents=[] ; FR-005, FR-006.
- [ ] T004 Implémenter les types/normalisation dans shared/utils/ambience.ts et read/save explicites dans shared/utils/ambienceStorage.ts, version=1, sans changer shared/utils/appearance.ts ; FR-001, FR-005, FR-006.
- [ ] T005 Créer technical/Theme/app/composables/useAmbience.ts et son raccord dans app/plugins/theme.client.ts : restauration atomique du profil, nettoyage, repli, séparation de data-theme ; FR-002, FR-005, FR-011, FR-024.
- [ ] T006 Auditer la donnée anniversaire autorisée et les signaux d’activité actuels ; consigner les raccords réels dans specs/001-adaptive-appearance/contracts/appearance-ui.md sans ajouter de dépendance functional depuis technical ; FR-020, FR-028.

## Phase 3: User Story 1 — Repères communs (Priority: P1, MVP)

Les trois thèmes existants sont cohérents sans aucune variation nouvelle. Test indépendant : mêmes parcours dans les trois thèmes et retour à chaque profil.

- [ ] T007 [US1] Consolider les tokens, cadres et centres dégagés des trois thèmes dans app/assets/css/appearance.css, en suivant les trois planches validées ; FR-001, FR-002, FR-019.
- [ ] T008 [US1] Corriger la cohérence enfant accueil/coffre/bibliothèque/messages/lecture et noms longs dans app/assets/css/child-world.css en conservant les photos et les commandes existantes ; FR-002, FR-003, FR-023, FR-026.
- [ ] T009 [P] [US1] Consolider les cartes réelles et la hiérarchie adulte dans app/pages/home.vue et functional/Book/app/components/HomeFeaturedBook.vue sans réintroduire sections vides ou fausse progression ; FR-002, FR-003.
- [ ] T010 [US1] Étendre technical/Theme/app/components/AppearancePicker.vue et functional/Profile/app/components/ProfileMenu.vue avec activation/aperçu non persistant, appliquer/session seule et réinitialisation des variations ; FR-004, FR-005, FR-006.
- [ ] T011 [US1] Aligner app/components/SplashScreen.vue sur le thème effectif autorisé, sans recadrage de Maki/titre, sans relancer updater/auth en aperçu ; FR-002, FR-025.
- [ ] T012 [US1] Ajouter les libellés initiaux et l’état de sauvegarde honnête dans app/i18n/locales/{fr,en,mg,de,es,it,pt,ar,zh}/appearance.json ; FR-004, FR-005, FR-027.

## Phase 4: User Story 2 — Saisons (Priority: P1)

Automatique nord/sud ou saison manuelle ; test indépendant aux premiers jours de mars/juin/septembre/décembre, hors connexion.

- [ ] T013 [P] [US2] Écrire tests/unit/ambience-calendar.test.ts pour les quatre saisons, mois limites, février bissextile et inversion north/south ; FR-007, FR-008, FR-009, SC-003.
- [ ] T014 [US2] Implémenter la résolution de saison dans shared/utils/ambience.ts avec contexte civil injecté et priorité manuelle ; FR-007, FR-008, FR-009.
- [ ] T015 [P] [US2] Préparer/exporter les accents de saison légers dans public/art/ambience/season/ pour les trois univers, sans texte ni photos intégrées ; FR-018, FR-019.
- [ ] T016 [US2] Composer data-season et les variantes saisonnières dans app/assets/css/ambience.css et nuxt.config.ts, en conservant les trois couches de feuilles dans technical/Motion/app/components/ChildFoliage.vue ; FR-018, FR-019.
- [ ] T017 [US2] Ajouter les choix automatique/manuel et calendrier nord/sud dans technical/Theme/app/components/AppearancePicker.vue ; sauvegarde par profil, pas de demande GPS ; FR-004, FR-007, FR-008.
- [ ] T018 [US2] Consigner les comparaisons de saison et leurs écarts réels aux maquettes dans specs/001-adaptive-appearance/validation.md ; ne pas cocher une taille non observée ; FR-023, SC-002, SC-004.

## Phase 5: User Story 3 — Jour/nuit et continuité média (Priority: P1)

Phase locale et salutation justes, préférences de luminosité conservées. Test indépendant aux quatre heures limites et pendant une activité média.

- [ ] T019 [P] [US3] Écrire tests/unit/ambience-clock.test.ts pour 04:59/05:00/17:59/18:00, fuseaux et indépendance du mode clair/sombre ; FR-010, FR-011, FR-012, SC-003.
- [ ] T020 [US3] Partager le contexte civil et ses listeners dans technical/Theme/app/composables/useLocalCivilTime.ts, app/plugins/theme.client.ts et app/composables/useLocalGreeting.ts ; salutation actualisée même si décor différé ; FR-010, FR-012.
- [ ] T021 [US3] Implémenter la phase manuelle/automatique dans shared/utils/ambience.ts sans écrire data-theme, avec retour disabled→base ; FR-010, FR-011.
- [ ] T022 [P] [US3] Écrire tests/unit/ambience-presentation.test.ts pour jetons simultanés, libération idempotente, dernier desired appliqué, démontage et changement de profil ; FR-020, SC-007.
- [ ] T023 [US3] Créer technical/Theme/app/composables/useSceneryActivity.ts et raccorder useAmbience, functional/Reading/app/components/ChildReader.vue, functional/Reading/app/composables/useAudioPlayer.ts et functional/Recording/app/composables/useRecorder.ts ; aucun remontage des médias ; FR-020.
- [ ] T024 [US3] Composer les phases et palettes dans app/assets/css/ambience.css avec app/components/SplashScreen.vue, sans modifier les délais ou chemins d’activation du worker ; FR-010, FR-011, FR-022, FR-025, SC-008.
- [ ] T025 [US3] Ajouter choix jour/nuit/auto et explication du mode de luminosité dans technical/Theme/app/components/AppearancePicker.vue ; vérifier aperçu et retour sans effets sonores ; FR-004, FR-010, FR-011, FR-020.

## Phase 6: User Story 4 — Événements (Priority: P2)

Catalogue facultatif, un événement à la fois, retour normal après période. Test indépendant avant/pendant/après chaque période et sur un profil sans naissance.

- [ ] T026 [P] [US4] Écrire tests/unit/ambience-events.test.ts pour 24–25 décembre, 31 décembre–1 janvier, anniversaire, 29 février, désactivation, mode none/manual et priorité anniversaire>Noël>Nouvel An ; FR-013 à FR-017.
- [ ] T027 [US4] Implémenter les périodes locales et priorités des événements dans shared/utils/ambience.ts, sans UTC implicite, sans modifier les règles de fête métier ; FR-013 à FR-017.
- [ ] T028 [P] [US4] Préparer/exporter des accents d’événements limités aux bords dans public/art/ambience/event/ ; aucun flash, son ou portrait fictif embarqué ; FR-014, FR-018, FR-019, FR-020.
- [ ] T029 [US4] Composer data-event avec saison et phase dans app/assets/css/ambience.css, un seul décor d’événement, retour sans résidu après période ; FR-016, FR-017, FR-019.
- [ ] T030 [US4] Ajouter sélection/activation/prévisualisation des événements et option aucun dans technical/Theme/app/components/AppearancePicker.vue ; enabledEvents vide par défaut ; FR-004, FR-013, FR-014.
- [ ] T031 [US4] Raccorder le contexte anniversaire autorisé au profil courant dans app/plugins/theme.client.ts ; vérifier absence de naissance, fin d’année et aucun cache invité personnel ; FR-015, FR-016, FR-028.

## Phase 7: Polish & Cross-Cutting Concerns

Validation des variantes réellement implémentées, documentation honnête et préparation du lot groupé.

- [ ] T032 Étendre scripts/design-audit.ts aux palettes effectivement utilisées, texte >=4,5:1 et composants >=3:1 ; vérifier clair/sombre séparément de la phase décorative ; FR-022, SC-005.
- [ ] T033 Vérifier réduction des mouvements et coupe-circuit global dans technical/Motion/app/components/ChildFoliage.vue, useFoliageMotion.ts et app/components/SplashScreen.vue ; aucune réactivation implicite par profil ; FR-021.
- [ ] T034 Vérifier chargement non bloquant, assets manquants et cache/hors ligne dans app/plugins/pwa.client.ts et scripts/prepare-offline.ts ; ne modifier ces fichiers que si un défaut lié aux nouveaux assets le justifie ; FR-024, FR-025, SC-008.
- [ ] T035 [P] Compléter et relire les neuf dictionnaires app/i18n/locales/{fr,en,mg,de,es,it,pt,ar,zh}/appearance.json et vérifier les libellés Bonjour/Bonsoir existants ; FR-012, FR-027.
- [ ] T036 Exécuter la matrice manuelle des 24 bases et événements pour les deux rôles et les sept tailles, texte 200 % et RTL ; archiver les vraies captures référencées dans specs/001-adaptive-appearance/validation.md ; FR-002, FR-003, FR-018, FR-019, FR-023, FR-026, SC-001, SC-002, SC-004, SC-005.
- [ ] T037 Vérifier écoute/pause/reprise, messages et micro sans interruption, hors connexion et sans services Google sur les appareils disponibles ; consigner disponible/non testé dans specs/001-adaptive-appearance/validation.md ; FR-020, FR-024, SC-006, SC-007.
- [ ] T038 Exécuter les commandes autorisées de specs/001-adaptive-appearance/quickstart.md, dont verify/build ; aucun E2E local ; noter résultats et limites dans validation.md ; FR-022, FR-024, FR-027.
- [ ] T039 Lancer /speckit-converge, mettre à jour specs/001-adaptive-appearance/tasks.md et docs/TASKS.md, puis préparer une unique MR vers dev avec résumé des validations ; publier vers main seulement si autorisé, ne jamais déclarer un contrôle non exécuté réussi ; FR-001 à FR-028.

## Dependencies & Execution Order

Setup → fondations → US1 → US2 → US3 → US4 → validation finale. Les résolveurs des histoires suivantes sont testables séparément, mais l’intégration UI réutilise les fondations et le même sélecteur : ne pas modifier ce fichier en parallèle. Aucun contrat serveur ou migration n’est nécessaire.

Les tests de règle de chaque histoire sont écrits avant sa logique et doivent échouer pour la bonne raison. Une histoire est validée séparément avant d’ajouter la suivante. Tous les tests, captures et observations restent des tâches ouvertes tant qu’ils ne sont pas exécutés.

## Parallel Examples

- US1 : après fondations, fidélité CSS partagée (T007) et hiérarchie adulte (T009) touchent des fichiers distincts ; relire ensemble avant T010.
- US2 : tests calendrier (T013) et exports d’assets (T015) peuvent avancer séparément, puis intégration T014/T016.
- US3 : tests d’horloge (T019) et tests de garde média (T022) sont indépendants ; T020/T023 restent séquentiels avec leurs consommateurs.
- US4 : tests de priorités (T026) et assets événementiels (T028) sont indépendants ; raccord de contexte T031 après la logique T027.
- La traduction transversale T035 intervient après stabilisation des libellés ; éviter les modifications simultanées des mêmes fichiers.

## Implementation Strategy

MVP : fondations et US1 pour consolider l’existant sans nouvelle variation. Ajouter les saisons, puis la phase du jour, puis les événements. Démontrer et relire chaque incrément en local avant d’envisager une publication unique. Les étapes de planification n’autorisent pas à annoncer la future fonctionnalité comme déjà réalisée.
