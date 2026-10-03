# Recording

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Studio, Enregistrer (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Studio page par page conservé : photo de page, titre et description de page, personnages avec texte par langue.
- Optionnels : photo de page, titre et description de page, description de personnage (intonation), auteur, couverture, ISBN. Obligatoires : titre du livre, au moins une langue, et pour chaque personnage nom, couleur et texte dans la langue déclarée.
- Une couleur par personnage parmi 6 ; une voix assignée avant le passage en enregistrement.
- Une prise par personnage, langue et voix ; 10 minutes au maximum ; Opus 16 à 24 kbps.
- Choix de langue d'enregistrement limité aux langues parlées par la personne.
- Envoi hors ligne en file d'attente, repris après coupure.

## États

- Aucune prise, prise enregistrée, prise approuvée, changement demandé.

## Cas limites

- Nouvelle prise : ne remplace jamais une prise approuvée sans nouvelle revue.
- Coupure réseau en plein envoi.

## Données

Recording, Character, CharacterTranslation, PageTranslation (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`useRecorder`, `useChunkedUpload`, `useOutbox`, `server/api/uploads`, `server/api/files`

## Tests attendus

- Durée et type MIME vérifiés côté serveur.
- Champs obligatoires imposés par le serveur.
- Reprise d'envoi après coupure.

## Validation

- [ ] Relue par Gaëtan
