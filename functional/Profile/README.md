# Profile

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Page Profils, Menu Profil, Modifier Profil, Code Chiffres, Code Formes (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Page Profils : un profil par personne, couleur = avatar = fond de lecture de sa voix.
- Code adulte : 4 à 8 chiffres. Code enfant : 4 à 6 formes parmi 6 touches (rond, carré, étoile, triangle, losange, cœur), longueur choisie par l'enfant.
- Codes toujours hachés ; essais limités ; un enfant réinitialise via un parent.
- L'app s'ouvre toujours sur le choix du profil ; retour au choix après mise en veille.
- Préférences par profil : langue, taille du texte, thème, sons et volume, langues parlées.

## États

- Profil sans code, avec code, verrouillé après trop d'essais.

## Cas limites

- Changement de longueur du code enfant : l'ancien code reste valide jusqu'à confirmation du nouveau.
- Photo de profil optionnelle.

## Données

Profile, ProfileLanguage (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/members`, `useProfileUnlockers`, `useTextSize`, `useTheme`, `useSoundSetting`

## Tests attendus

- Longueurs 4 à 8 chiffres et 4 à 6 formes validées côté serveur.
- Hachage et limitation d'essais.
- Réinitialisation du code enfant par un parent.

## Validation

- [ ] Relue par Gaëtan
