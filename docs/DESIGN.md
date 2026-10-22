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

## Mascotte

Un seul composant, `MakiScene` (`technical/Media`), props `pose` (39 poses, correspondance dans `app/utils/maki-poses.ts`), `size` et `label`. Sans `label`, l'image est décorative (`alt` vide, `aria-hidden`) ; avec `label`, elle porte son texte alternatif. Images WebP de 520 px au plus, chargement différé, bornées par `min(size, 56vw)` et `34vh`. Le mouvement vient des classes `anim-*`, coupées par « réduire les animations ». L'ancienne mascotte SVG (`AppMaki`, `MakiSleeping`) est supprimée ; le logo, la favicon, les icônes PWA et l'écran de lancement montrent déjà le nouveau dessin.

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

## Direction enfant validée le 2026-10-19

L'espace enfant reprend le splashscreen : fond crème, feuillage et bois sculpté, actions dorées, mascotte 3D. Les styles restent sous `.kid-world` et les tokens enfant ; les écrans adultes conservent leur direction. Référence : maquettes coffre, bibliothèque et écoute validées dans la session, puis ajustements pour livre papier.

L'écoute accompagne un livre physique : aucune image de page ni réplique affichée. Photo réelle et nom seul de la personne qui parle, couleur de voix autour du portrait. Titre sur deux lignes au maximum puis ellipse. Au ding de fin de page, le bouton suivant garde un halo doré jusqu'à l'action, sans clignotement. L'alerte existante des trente dernières minutes montre Maki regardant sa montre. Portrait et paysage changent la disposition, les commandes passent à côté du portrait sur téléphone paysage ; pas de verrouillage d'orientation.

## Three appearance scenes — validated 2026-10-22 (#216)

The user-selected comparison boards supersede previous appearance-only directions: forest (default), family notebook and warm library, shared by adults and children. They preserve the existing navigation, real family photos, voice and message interactions. Adult shells use a restrained system sans-serif body/title with Fredoka retained for the brand; child shells retain playful Fredoka. Learning-font and text-size preferences remain available.

Appearance lives independently from light/dark/automatic mode. Choose it in the profile menu using three preview cards; the preference is saved per profile on this device. A new profile starts with forest. Unknown values/private-mode storage failures fail safely. The device-level last choice styles the splash before a profile is restored.

Forest uses the existing illustrated edge frame plus independent Ravenala layers. Notebook uses paper ruling, binding details and cream labels; library uses a 136 KB WebP edge frame with books/lanterns and a clear center. Shared structural layouts and controls prevent navigation differences between themes. Decorative movement respects pause and prefers-reduced-motion.

Splash uses the selected scene, an uncropped headphone Maki and responsive title; no screenshot/status bar is baked into the composition. A preview action in Appearance replays the visual only and does not trigger an update or reload. Startup update handling remains unchanged. Adult home promotes a real actionable book alongside the family; empty task sections and zero-count shortcuts are hidden while library/navigation remain available.

Palette contrast audit includes appearance light/dark tokens. Full rendered responsive and assistive-technology review remains pending; this is not an RGAA certification. Weather, seasons and holiday scenes remain deferred.
