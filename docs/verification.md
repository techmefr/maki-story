# Vérification écran par écran

État au 2026-10-04. Colonnes : **Code** = écran codé d'après la maquette ; **Vu** = relu dans le navigateur (M = mobile, D = ordinateur, C = clair, S = sombre) ; **Reste** = ce qui manque.

Aucun écran n'a encore été relu dans les quatre combinaisons (mobile et ordinateur, clair et sombre) ni en tablette. Les cases de `docs/TASKS.md` restent donc décochées.

| Maquette | Code | Vu | Reste |
|---|---|---|---|
| Onboarding, Légal, Permissions | repris avant ce lot | non | relecture |
| Connexion, Lien Magique, Code Oublié | oui | M C, M S | Code Oublié, Lien Magique |
| Compte | oui | non | relecture |
| Page Profils | oui, bouton Déconnexion corrigé | M S | clair, ordinateur |
| Code Chiffres, Code Formes | oui | M S (pavé) | clair, ordinateur |
| Menu Profil, Modifier Profil | oui | non | relecture |
| Choix Famille | oui | M S | clair, ordinateur |
| Creer Famille | oui, cinq étapes plus « Et toi ? » | M S | clair, ordinateur, étape photo |
| Famille | oui | M S, D S | clair |
| Ajouter Proche | oui (e-mail ou code, rôle) | M S | clair, ordinateur |
| Rejoindre | oui (trois étapes) | non | relecture |
| Profil Proche | oui | non | relecture avec un vrai proche |
| Contrôle Parental | oui | M S | clair, ordinateur |
| Écran Verrouillé | oui | non | relecture avec un vrai verrouillage |
| Accueil Enfant | partiel (compteur n/5 ajouté) | non | relecture, lecteur plein écran de la maquette non repris |
| Message Enfant | oui, repris avant ce lot | non | relecture |
| Coffre Adulte | oui | non | relecture avec des souvenirs |
| Lecture | lecteurs sans pause | non | relecture, fond de couleur par voix à comparer |
| Bibliothèque | filtres en feuille, tags, statut | M S (feuille) | clair, ordinateur, grille de la maquette |
| Livre Détail | oui | non | relecture avec un livre |
| Ajouter Livre | oui (Open Library) | non | relecture, scan à tester sur un appareil |
| Accès Livres | oui | non | relecture avec des livres validés |
| Studio | partiel : puces de la maquette, titre de page, assistant en étapes conservé | non | éditeur d'une seule page de la maquette non repris |
| Enregistrer | partiel : en-tête, langues, voix ; prompteur et aide vocale conservés | non | cartes de réplique de la maquette non reprises |
| Revue Parent | partiel : résumé, ancien texte barré et nouveau en vert | non | pages repliables de la maquette non reprises |
| Accueil Proche | oui (bloc À corriger, catégories) | non | relecture |
| Catégorie | oui | non | relecture avec des données |
| Tags | oui, repris avant ce lot | non | relecture |
| Notifications | oui | non | relecture |
| Aide | oui | non | relecture |
| Etat Erreur | oui (403, 404, 500, hors ligne, mise à jour, erreur) | M S (404) | autres états |
| Mails (9) | tous branchés | non | rendu dans une vraie boîte, domaine et contact à fournir |
| Activité, Appareils, Corbeille, Stockage, Grimace, Traduction | oui, d'après `docs/maquettes-sans-maquette.md` | non | relecture |
| Adaptatif (rail, TV) | oui | D S (rail) | tablette, TV réelle |

## Constats de la relecture ponctuelle

- État sélectionné des puces illisible (corrigé).
- Bouton Déconnexion illisible en sombre (corrigé).
- Étiquette « Bibliothèque » coupée dans le rail (corrigé).
- Ces corrections viennent de relectures isolées ; une relecture complète reste à faire.

## Tests

- Unitaires : 27 tests, passent.
- Lint, audit du design, build, migrations (39 montées, descendues, remontées), `i18n:check` : passent.
- e2e : une première exécution partielle a été interrompue au bout de 44 tests sur 778. Les échecs vus venaient en partie de specs obsolètes (par exemple `/` mène à `/onboarding`). La suite complète reste à lancer.
