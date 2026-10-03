# Builds natifs et poids

État vérifié le 2026-10-03.

## Ce qui existe

- PWA : `public/manifest.webmanifest`, `public/sw.js`, icônes 192, 512 et maskable, enregistrement du service worker en production (`app/plugins/pwa.client.ts`).
- Capacitor 8 : `capacitor.config.ts` (`app.tantara.mobile`, `webDir: .output/public`), script `pnpm cap:sync` (génération statique puis `cap sync`), plugin biométrie.
- Pas de dossiers `android/` ni `ios/` dans le dépôt : ils se créent avec `npx cap add android` et `npx cap add ios`, ce qui demande le SDK Android et Xcode (non disponibles dans l'environnement de travail, donc **aucun build natif n'a été lancé**).

## À faire pour chaque cible

- **Android** : `npx cap add android`, puis `pnpm cap:sync`, puis ouvrir dans Android Studio. Vérifier l'icône adaptative, le nom, les permissions micro et caméra, l'orientation libre.
- **Android TV** : dans `AndroidManifest.xml`, déclarer `android.software.leanback` (non requis), `android.hardware.touchscreen` (non requis) et la catégorie `LEANBACK_LAUNCHER` sur l'activité principale, ajouter une bannière 320 × 180. La classe `tv` du site s'active toute seule sur une application native sans écran tactile.
- **iOS** : `npx cap add ios`, descriptions d'usage du micro, de la caméra et des notifications dans `Info.plist`, icônes, signature.
- **PWA** : déjà installable ; vérifier le score Lighthouse après le premier déploiement.

## Poids pour Madagascar (déjà en place)

- Audio : Opus mono 16 kHz, 24 kbit/s variable, 10 minutes au plus (`shared/utils/recording.ts`, `useRecorder`). La spec visait 16 à 24 kbit/s : à 24 on reste dans la fourchette, on peut descendre à 16.
- Images : WebP, côté le plus long limité à 1200 px (`app/utils/image.ts`), repli JPEG si WebP indisponible.
- Envoi : par morceaux avec reprise (`useChunkedUpload`, `/api/uploads/[id]`), file d'attente hors ligne (`useOutbox`, `OutboxStatus`).
- Hors ligne : livres téléchargés (`useOfflineBooks`), page de stockage pour les gérer.

## À mesurer

- Poids d'un livre type de 10 pages (audio + images), en mégaoctets, une fois un livre réel enregistré.
- Temps de premier affichage sur connexion lente (profil réseau « 3G lente » des outils du navigateur).
