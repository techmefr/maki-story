# Mise en page adaptative : proposition

Les maquettes n'existent qu'en une colonne de 440 px. Cette proposition définit les points de rupture et la navigation par appareil. **Rien n'est codé tant que Gaëtan n'a pas validé.**

## Points de rupture

| Nom | Largeur | Cible | Mise en page |
|---|---|---|---|
| Téléphone | moins de 600 px | téléphone | une colonne, marges 16 px, barre du bas |
| Tablette | 600 à 1023 px | tablette, téléphone en paysage | contenu centré (max 720 px), grilles de 2 à 3 colonnes, barre du bas |
| Ordinateur | 1024 à 1599 px | ordinateur, tablette en paysage | rail latéral à gauche (88 px), contenu max 960 px, deux colonnes quand la page s'y prête |
| Grand écran, TV | 1600 px et plus, ou mode télécommande | Android TV | rail latéral, texte et cibles agrandis (échelle 1,25), focus visible renforcé |

Les valeurs sont des variables CSS dans `technical/Theme` (`--bp-tablet`, `--bp-desktop`, `--bp-tv`) ; les composants lisent la largeur par `@media` ou par une requête de conteneur, jamais par l'agent utilisateur.

## Navigation

- **Téléphone et tablette** : barre du bas actuelle (`TabBar`), 3 à 4 entrées, hauteur 64 px, zone sûre respectée.
- **Ordinateur et TV** : rail latéral à gauche avec icône et libellé sous l'icône, l'entrée active en jaune. Le logo en haut du rail, l'avatar du profil et la cloche en bas.
- L'en-tête (`AppHeader`) garde le logo et l'avatar sur téléphone ; sur ordinateur il devient une simple barre de titre de page.
- Enfant : une seule entrée Accueil et le coffre ; boutons de 66 px sur toutes les tailles.

## Mises en page par écran

- **Accueil enfant** : grille de cartes rondes (2 colonnes sur téléphone, 3 sur tablette, 4 sur ordinateur, 5 sur TV).
- **Bibliothèque** : grille de couvertures (2, 3, 4, 6 colonnes) ; filtres en feuille sur téléphone, en colonne latérale à gauche à partir de 1024 px.
- **Studio et Revue** : à partir de 1024 px, la liste des pages à gauche et la page ouverte à droite.
- **Lecture** : photo de la page et texte côte à côte à partir de 600 px en paysage.
- **Formulaires et réglages** : colonne centrée de 560 px maximum.

## Android TV et télécommande

- Navigation au clavier ou à la croix directionnelle : ordre de tabulation logique, `focus-visible` épais (4 px) et décalé, jamais d'élément piégé.
- Les boutons principaux ont un focus par défaut (`data-focus-default`).
- Texte de base 20 px, cibles 72 px, pas de survol nécessaire.
- Le bouton retour de la télécommande revient à l'écran précédent (`popstate`).
- Pas d'interaction tactile obligatoire (pas de balayage seul pour tourner une page).

## Décisions de Gaëtan (2026-10-03)

1. Points de rupture 600 / 1024 / 1600 : validés.
2. Rail latéral : icône avec libellé dessous (choix retenu par défaut, la question n'était pas claire : « icône seule » aurait supprimé le libellé).
3. Toute l'application est responsive, télévision comprise.
4. Détection TV : par la largeur (1600 px et plus) **et** par l'appareil (agent utilisateur de télévision, drapeau `?tv=1`, ou application Capacitor native sans écran tactile).

## Réalisé

- `SideRail` (technical/Molecule) : rail de 104 px à partir de 1024 px, la barre du bas reste en dessous ; l'ancienne navigation de l'en-tête est retirée.
- `app/plugins/tv-layout.client.ts` : classe `tv` selon la largeur ou l'appareil ; échelle de texte 1,25, cibles 72 px, focus de 5 px.
- Navigation à la télécommande : déjà présente (`remote-navigation.client.ts`, flèches, retour).
- Reste : relecture aux quatre largeurs, grilles adaptatives écran par écran, Studio et Revue en deux colonnes à partir de 1024 px.

## Plan de réalisation (après validation)

1. Variables de rupture et échelle de texte dans `technical/Theme`.
2. Composant `AppShell` qui choisit barre du bas ou rail latéral.
3. Grilles adaptatives pour l'accueil enfant et la bibliothèque.
4. Passage clavier et télécommande, vérifié écran par écran.
5. Captures aux quatre largeurs dans le tableau final (maquette / app, clair / sombre).
