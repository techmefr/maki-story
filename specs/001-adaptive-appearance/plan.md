# Implementation Plan: Ambiances adaptatives Maki Story

**Branch**: `dev` (passation) | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-adaptive-appearance/spec.md`

## Summary

Composer les trois thèmes existants avec saison, phase jour/nuit et événement facultatif, sans recréer les pages ou toucher aux données métier. Garder la logique de calendrier pure et testable, les préférences locales par profil, une orchestration client unique et des attributs de décor indépendants des tokens clair/sombre. Consolider d’abord la fidélité visuelle des trois thèmes, puis ajouter chaque dimension par incréments. Ce dossier prépare le travail : aucune tâche d’implémentation n’est déclarée terminée.

## Technical Context

**Language/Version**: TypeScript strict, Vue 3.5, Nuxt 4.5 ; Node >=22 selon le dépôt, environnement récent Node 24.

**Primary Dependencies**: dépendances existantes uniquement. Vue pour l’état/réactivité ; Date/Intl natifs pour contexte local ; CSS pour composition et animations. Aucun besoin de Motion/Barba ou de fournisseur météo.

**Storage**: localStorage avec schéma versionné et clés par profil, séparé du thème de base existant. PostgreSQL et schéma serveur inchangés. Aucune synchronisation distante.

**Testing**: node:test dans tests/unit ; pnpm verify pour lint/types/i18n/docs/contrastes/unitaires/migrations ; build Nuxt. Revue visuelle locale manuelle si outil disponible. Aucun E2E local sous l’instruction utilisateur actuelle ; état distant historique suivi dans #197.

**Target Platform**: navigateur/PWA, Capacitor Android/iOS et TV, appareils sans Google services ; portrait/paysage jusqu’au 4K, RTL, texte à 200 %.

**Project Type**: monorepo Nuxt SPA avec couches OSDD, pas un workspace multirepo.

**Performance Goals**: réutiliser le minuteur de contexte local plutôt que multiplier les minuteurs ; aucun appel réseau pour décider l’ambiance ; chargement du décor non bloquant ; respecter les délais existants de démarrage et ne pas remonter les composants média.

**Constraints**: 4,5:1 texte, 3:1 composants, 44px cibles ; vraie photo et livre papier ; mouvement réduit/pause prioritaires ; ne pas accéder aux domaines fonctionnels depuis technical/Theme ; aucune modification de main sans publication groupée autorisée.

**Scale/Scope**: 3 thèmes × 4 saisons × 2 phases, puis un événement parmi anniversaire/Noël/Nouvel An ou aucun ; deux rôles visuels, neuf langues, toutes les pages des parcours concernés. Images d’intention archivées, assets de production à exporter séparément.

## Constitution Check

Pré-recherche et contrôle après conception : **PASS**.

| Principe | Choix retenu | Résultat |
| --- | --- | --- |
| Règles produit existantes | Aucune migration, permission ou règle message/livre modifiée | PASS |
| Expérience stable et accessible | Structure commune, CSS orthogonal, tokens contrôlés, matrice manuelle | PASS |
| Frontières techniques | Résolveurs purs ; les adaptateurs fonctionnels fournissent contexte et activité | PASS |
| Hors ligne/non-Google | Date/Intl et préférences locales ; décor de repli | PASS |
| Validation et publication | Tests ciblés, verify/build ; pas d’E2E local ni push main dans ce lot | PASS |

Aucune dérogation de constitution requise. Les choix de calendrier et périodes sont des hypothèses produit clairement relisibles dans spec.md.

## Project Structure

### Documentation (this feature)

```text
specs/001-adaptive-appearance/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/appearance-ui.md
├── checklists/requirements.md
├── tasks.md
└── README.md
```

### Source Code (repository root)

```text
shared/utils/appearance.ts                         existant, conserver le contrat
shared/utils/ambience.ts                           nouveau : types/normalisation/résolution pure
shared/utils/ambienceStorage.ts                    nouveau : stockage et résultat explicite
technical/Theme/app/composables/useAppearance.ts  thème de base existant
technical/Theme/app/composables/useAmbience.ts    nouveau : état effectif/pending par profil
technical/Theme/app/composables/useLocalCivilTime.ts nouveau : horloge civile partagée
technical/Theme/app/composables/useSceneryActivity.ts nouveau : garde d’activité technique
technical/Theme/app/components/AppearancePicker.vue
app/plugins/theme.client.ts                       orchestration client et contexte profil
app/composables/useLocalGreeting.ts                partager la source d’heure si nécessaire
app/assets/css/appearance.css                      thèmes actuels
app/assets/css/ambience.css                        nouvelles dimensions orthogonales
app/components/SplashScreen.vue
functional/Profile/app/components/ProfileMenu.vue
functional/Reading/app/composables/useAudioPlayer.ts
functional/Reading/app/components/ChildReader.vue
functional/Recording/app/composables/useRecorder.ts
public/art/ambience/                               futurs assets de décor optimisés
app/i18n/locales/{fr,en,mg,de,es,it,pt,ar,zh}/appearance.json
tests/unit/ambience-*.test.ts
scripts/design-audit.ts
```

**Structure Decision**: étendre les couches existantes, sans nouveau dépôt ni nouveau framework. Le module technique reçoit un identifiant de profil, le contexte civil et une indication d’anniversaire autorisée ; il n’importe aucun composable Reading/Recording/Profile. Les chemins nouveaux ci-dessus sont des cibles de travail, pas des fichiers déjà implémentés.

## Phase 0 — Research

Voir [research.md](research.md). Recherche locale du stockage, des minuteurs, du mode clair/sombre, du feuillage et des signaux audio ; points vérifiés avec une revue de plan indépendante. Pas de dépendance externe nécessaire. Les incertitudes techniques ont une décision ; les valeurs produit proposées restent identifiées comme hypothèses.

## Phase 1 — Design

1. Conserver les clés tantara-appearance et TAppearance ; stocker les dimensions adaptatives dans une clé versionnée séparée par profil.
2. Normaliser toute donnée lue ; une donnée inconnue, corrompue ou d’une version future revient aux adaptations désactivées, sans effacer la clé d’origine.
3. Résoudre un contexte civil local injecté vers saison/phase/événement. Ne pas dériver une fête locale avec toISOString ou l’heure du serveur.
4. Appliquer data-appearance, data-season, data-day-phase et data-event séparément. useTheme reste seul responsable de data-theme et de la luminosité du navigateur.
5. Prévoir deux valeurs effectives : desired et applied ; durant une activité sensible, les changements automatiques ne remplacent que desired. À la sortie sûre, appliquer le dernier contexte, pas une file d’animations.
6. Les gardes lecture, audio et enregistrement sont transmises par les consommateurs fonctionnels et libérées lors de leur destruction. Ne pas assimiler useSoundCues.setBusy à une protection visuelle complète.
7. Le splash avant profil connu reprend uniquement le dernier thème de base public ; après restauration il suit l’ambiance autorisée. Pas de fuite d’anniversaire ou réglage personnel entre profils.
8. Le réglage existant de pause des feuilles est global appareil ; le conserver comme coupe-circuit supérieur aux préférences nouvelles. Ne pas annoncer une nouvelle isolation par profil de ce réglage.
9. Exposer aperçu non persistant et retour sans sauvegarde, puis application avec résultat persisté/session seulement. Le replay du splash n’appelle pas l’updater.
10. Utiliser les fichiers de décor de production bornés aux bords ; ne pas intégrer les PNG de planches ou leurs faux portraits à l’application.

Modèle, contrats et validation sont dans data-model.md, contracts/appearance-ui.md et quickstart.md. Aucun endpoint nouveau.

## Delivery Sequence

Fondations → US1 fidélité/préférences → US2 saisons → US3 phase du jour/garde média → US4 événements → validation transversale. Chaque étape peut être relue sans attendre une nouvelle publication. La mise en production éventuelle reste un unique lot après validation explicite.

## Complexity Tracking

Aucune exception. Une simple couche de contexte/décor suffit ; ni moteur de thème par page, ni route dupliquée, ni service météo, ni migration serveur.
