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

## Ce qui reste à décider

1. Les valeurs des points de rupture (600 / 1024 / 1600) conviennent-elles ?
2. Le rail latéral sur ordinateur : icône et libellé, ou icône seule avec infobulle ?
3. L'Android TV est-elle réservée aux enfants (lecture) ou aussi aux adultes (gestion) ?
4. Détection TV : par la largeur seulement, ou par un indicateur de l'application Capacitor ?

## Plan de réalisation (après validation)

1. Variables de rupture et échelle de texte dans `technical/Theme`.
2. Composant `AppShell` qui choisit barre du bas ou rail latéral.
3. Grilles adaptatives pour l'accueil enfant et la bibliothèque.
4. Passage clavier et télécommande, vérifié écran par écran.
5. Captures aux quatre largeurs dans le tableau final (maquette / app, clair / sombre).
