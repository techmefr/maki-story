# Reading

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Lecture (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Lecture multivoix : le fond prend la couleur de la voix en cours.
- Pas de bouton pause dans les lecteurs ; précédent disponible ; tourne de page réaliste avec le « ding ».
- Progression par enfant et livre : page et ligne, reprise automatique.
- Langue de lecture choisie parmi les langues disponibles du livre.
- Minuteur de sommeil et verrou après la page respectés.

## États

- Non commencé, en cours, terminé.

## Cas limites

- Voix manquante pour une langue : repli ou ligne passée selon la règle du livre.
- Hors ligne : livres téléchargés.

## Données

ReadingProgress (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`useAudioPlayer`, `usePlaybackProgress`, `usePlaybackLanguages`, `useSleepTimer`, `useOfflineBooks`

## Tests attendus

- La progression reprend à la bonne ligne.
- Aucun bouton pause rendu.

## Validation

- [ ] Relue par Gaëtan
