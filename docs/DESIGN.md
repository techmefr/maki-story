# Design system — Maki Story

Référence visuelle : `docs/maquettes/Design System.dc.html`. Les maquettes de `docs/maquettes/` font foi (une par écran, voir `docs/maquettes/README.md` pour les parcours et `docs/maquettes/PROMPT - Appliquer le design Maki Story.md` pour la spécification page par page). Les anciennes maquettes de `design/` (Kalli) sont obsolètes. Les composants sont atomiques : un composant = un fichier = une section du design system. Atomes et molécules vivent dans `technical/` ; les organismes (écrans) assemblent ces briques dans les domaines `functional/`.

## Tokens

### Couleurs

| Nom | Valeur | Usage |
| --- | --- | --- |
| bg | `#FFF3DC` | fond de page |
| ink | `#1E1A3F` | texte, contours |
| ink-soft | `#3b3466` | texte secondaire |
| yellow | `#FFC933` | action principale, sélection |
| sky | `#CFE5FF` | retour, fermer, secondaire |
| mint | `#4AD3A5` | valider |
| mint-soft | `#ADE6C4` | succès, statuts |
| coral | `#FF7766` | enregistrer, retirer |
| pink | `#FF8FC9` | profils, cœur |
| violet | `#B28DFF` | profils, verrouillage |
| blue | `#6DB5FF` | profils |
| danger-soft | `#FFD9D3` | alerte, suppression |
| grey | `#E5E3F0` | désactivé, neutre |
| grey-line | `#9a9390` | bordure désactivée |

Texte toujours en `ink`, jamais de texte clair sur couleur.

### Typographie

Fredoka 400, 600, 700. Titre de page 32-34, section 22-26, bouton 18-21, texte 16-19, secondaire 14-15, jamais sous 14.

### Forme

- Contour 3 px `ink` partout.
- Ombre pleine, décalée, sans flou : grande `4px 5px 0 ink`, petite `3px 4px 0 ink`.
- Rayons : cartes 22-26, boutons 24-28, chips et champs 999, feuille du bas 32 en haut.
- Espacement en multiples de 4, marges de page 20, largeur maximale 440.

### États

- Appui : translation (3, 4), ombre `1px 1px 0`.
- Sélectionné : fond jaune et ombre.
- Désactivé : fond `grey`, bordure `grey-line`.
- Mouvement : 150-500 ms, ease-out, coupé si « réduire les animations ».

## Atomes (`technical/Atom`)

| Composant | Rôle | Props |
| --- | --- | --- |
| Button | action, toujours icône + libellé | variant (primary, success, danger, secondary, neutral), icon, label, disabled |
| IconButton | rond 44-52 px, libellé d'accessibilité obligatoire | icon, tone, size, label |
| Chip | pilule sélectionnable, variantes drapeau et icône | label, selected, flag, icon |
| Badge | compteur rond, statut, bulle n/5 | value, tone, kind (dot, pill, bubble) |
| Avatar | initiale ou photo, 5 tailles | name, color, photo, size |
| Input, Textarea | champ pilule 54 px, verrouillable | value, placeholder, locked |
| Switch | 64 × 38 | checked |
| Checkbox | 30 px | checked |
| Progress | barre ou segments par page | value ou steps, current |

## Molécules (`technical/Molecule`)

| Composant | Rôle |
| --- | --- |
| Tabs | chips exclusives, langues avec drapeau, onglet « + », pastille de manque |
| ListRow | avatar, titre, sous-titre, action |
| ProfileCard | grande carte ronde avec bulle de messages |
| BookCard | couverture 3/4, badge de statut, titre |
| BottomSheet | feuille du bas : filtres, confirmation, édition, avis |
| CodePad | pavé chiffres (8 points) ou formes (4 à 6 cases, 6 touches) |
| Header, TabBar | en-tête avec retour, cloche, réglages, avatar ; barre du bas enfant |
| EmptyState | illustration, titre, phrase, action ; variantes erreur 403 et 500 |

## Règles d'usage

1. Une action principale par écran, en couleur pleine.
2. Tous les boutons portent une icône.
3. Jamais d'emoji. Icônes à traits arrondis de 2 à 2,5 px, couleur encre.
4. La couleur d'une personne est son avatar et le fond de lecture de sa voix.
5. Pas de bouton pause dans les lecteurs.
6. Sons et animations existants conservés ; sons via soundcn, jamais avant une action de l'utilisateur ; réglage global interrupteur et volume.

## Vérification par écran

Couleurs, contours, ombres et rayons identiques aux maquettes ; zones tactiles d'au moins 44 px ; états vides prévus (notifications, coffre, bibliothèque filtrée).

## Accessibilité (RGAA) et thèmes clair et sombre

- Les deux thèmes (clair, sombre, auto) sont conservés. Chaque token existe en version claire et sombre.
- Contraste minimal : 4,5:1 pour le texte, 3:1 pour les contours, icônes et composants d'interface, dans les deux thèmes.
- Aucune superposition de couleurs qui rende un texte illisible : chaque fond a sa couleur de texte associée (jamais de texte clair sur couleur claire, jamais de texte sombre sur fond sombre).
- Le contrôle est automatisé : `scripts/design-audit.ts` vérifie les paires fond/texte des tokens dans les deux thèmes.
- Navigation clavier, focus visible et libellés d'accessibilité sur tous les contrôles.

## Écarts connus avec le dépôt actuel

`scripts/design-audit.ts` exige encore `--shadow 3px`, `#1f1b3a`, Nunito et `--tap 48px` : à aligner sur ce document (`4px 5px 0`, `#1E1A3F`, Fredoka seule, 44 px).

## À compléter

Vrai logo et favicon, photos de profil, mise en page tablette, ordinateur et Android TV.
