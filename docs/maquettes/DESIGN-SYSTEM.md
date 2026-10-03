# Tantara — design system

Référence visuelle : `Design System.dc.html` (composants vivants). Les maquettes `*.dc.html` font foi.

## Tokens

### Couleurs
| Nom | Valeur | Usage |
| --- | --- | --- |
| `bg` | `#FFF3DC` | fond de page |
| `ink` | `#1E1A3F` | texte, contours |
| `ink-soft` | `#3b3466` | texte secondaire |
| `yellow` | `#FFC933` | action principale, sélection |
| `sky` | `#CFE5FF` | retour, fermer, secondaire |
| `mint` | `#4AD3A5` | valider |
| `mint-soft` | `#ADE6C4` | succès, statuts |
| `coral` | `#FF7766` | enregistrer, retirer |
| `pink` | `#FF8FC9` | profils, cœur |
| `violet` | `#B28DFF` | profils, verrouillage |
| `blue` | `#6DB5FF` | profils |
| `danger-soft` | `#FFD9D3` | alerte, suppression |
| `grey` | `#E5E3F0` | désactivé, neutre |
| `grey-line` | `#9a9390` | bordure désactivée |

Contraste : texte toujours en `ink` sur ces fonds (aucun texte clair sur couleur).

### Typographie
Fredoka 400 / 600 / 700. Titre de page 32-34, section 22-26, bouton 18-21, texte 16-19, secondaire 14-15 (minimum absolu 14).

### Forme
- Contour : 3 px `ink` partout.
- Ombre : pleine, décalée, sans flou. Grande `4px 5px 0 ink`, petite `3px 4px 0 ink`.
- Rayons : cartes 22-26, boutons 24-28, chips et champs 999, feuille du bas 32 en haut.
- Espacement : multiples de 4. Marges de page 20. Largeur max 440.

### États
- Appui : translation (3, 4) et ombre `1px 1px 0`.
- Sélectionné : fond jaune + ombre.
- Désactivé : fond `grey`, bordure `grey-line`.
- Mouvement : 150-500 ms, ease-out, coupé si « réduire les animations ».

## Composants (développement atomique)

Un composant = un fichier = une section de `Design System.dc.html`.

### Atomes
| Composant | Rôle | Props |
| --- | --- | --- |
| `Button` | action, toujours icône + libellé | variant (primary, success, danger, secondary, neutral), icon, label, disabled, onPress |
| `IconButton` | rond 44-52 px, libellé d'accessibilité obligatoire | icon, tone, size, label, onPress |
| `Chip` | pilule sélectionnable, variantes drapeau et icône | label, selected, flag, icon, onPress |
| `Badge` | compteur rond, statut, bulle de conversation n/5 | value, tone, kind (dot, pill, bubble) |
| `Avatar` | initiale ou photo, 5 tailles | name, color, photo, size |
| `Input` / `Textarea` | champ pilule 54 px, verrouillable | value, placeholder, locked, onChange |
| `Switch` | 64 × 38 | checked, onChange |
| `Checkbox` | 30 px | checked, onChange |
| `Progress` | barre ou segments par page | value ou steps, current |

### Molécules
| Composant | Rôle |
| --- | --- |
| `Tabs` | chips exclusives, langues avec drapeau, onglet « + », pastille de manque |
| `ListRow` | avatar, titre, sous-titre, action |
| `ProfileCard` | grande carte ronde avec bulle de messages |
| `BookCard` | couverture 3/4, badge de statut, titre |
| `BottomSheet` | feuille du bas : filtres, confirmation, édition, avis |
| `CodePad` | pavé chiffres (8 points) ou formes (4 cases, 6 touches) |
| `TabBar` / `Header` | barre du bas enfant, en-tête avec retour, cloche, réglages, avatar |
| `EmptyState` | illustration, titre, phrase, action ; variante erreur 403 / 500 |

### Organismes (écrans)
Voir la section « Écrans » de `Design System.dc.html` : chaque écran liste les composants qu'il assemble et renvoie à sa maquette.

## Règles d'usage
1. Une action principale par écran, en couleur pleine.
2. Tous les boutons portent une icône.
3. Jamais d'emoji. Icônes à traits arrondis 2-2,5 px, couleur encre.
4. Couleur d'une personne = son avatar = le fond de lecture de sa voix.
5. Pas de bouton pause dans les lecteurs.
6. Sons et animations existants conservés, sons via soundcn, jamais avant une action de l'utilisateur.
