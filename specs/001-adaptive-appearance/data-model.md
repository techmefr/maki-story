# Data Model — ambiances locales

## BaseAppearance — existant

forest | notebook | library. Conserver TAppearance, tantara-appearance et tantara-appearance:profile:<id>. Le dernier thème appareil reste un simple choix de décor d’entrée ; un nouveau profil reste forêt par défaut.

## AmbiencePreferenceV1 — nouveau, local par profil

Clé proposée : tantara-ambience:v1:profile:<id>. Aucune clé invité contenant des données personnelles.

| Champ | Valeurs / défaut | Validation |
| --- | --- | --- |
| version | 1 | Version inconnue → réglages désactivés sans effacer le document inconnu |
| enabled | false | Booléen strict ; activation explicite pour un profil existant |
| seasonMode | auto, spring, summer, autumn, winter ; auto | Valeurs fermées ; effet uniquement si enabled |
| hemisphere | north, south ; north | Aucune géolocalisation implicite |
| phaseMode | auto, day, night ; auto | Indépendant des préférences de luminosité |
| enabledEvents | birthday, christmas, new-year ; liste vide | Liste dédupliquée de valeurs autorisées |
| eventMode | auto, none, birthday, christmas, new-year ; auto | Un choix manuel explicite peut afficher sa prévisualisation ; choix auto limité à enabledEvents |

Les anciennes préférences de mouvement globales et de luminosité gardent leur propre stockage. Ne pas inclure date de naissance, audio, livre ou données d’une autre personne dans ce document.

## LocalCivilContext — éphémère

year, month (1–12), day, hour (0–23), minute (0–59), timeZone, birthdayTodayAuthorized. Dérivé du client et du profil courant, injecté dans les tests. Dates invalides → pas d’événement et décor de base lisible. La politique du 29 février est celle spécifiée, après audit de son raccord sans modifier les règles métier existantes.

## EffectiveAmbience — dérivé, non persistant

appearance ; season = spring/summer/autumn/winter ou null ; phase = day/night ou null ; event = birthday/christmas/new-year ou null. disabled produit season/phase/event null. L’affichage clair/sombre et le mouvement ne sont pas recalculés ici : ce sont des contraintes existantes prioritaires.

## PresentationState — éphémère

profileId, desired, applied, preview, activeTokens. Les jetons sont des identifiants uniques d’activité ; chaque consommateur doit libérer son jeton. Un changement de profil réinitialise desired/applied/preview dans le même cycle afin de ne pas conserver le décor personnel d’un autre.

Transitions : restore → normalize → resolve → apply si sûr ; sinon pending/desired seulement. À la fin de la dernière activité, recalculer et appliquer la dernière valeur. Une prévisualisation non confirmée disparaît à sa fermeture. Une sauvegarde impossible garde l’application en session et renvoie explicitement persisted=false.
