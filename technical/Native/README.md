# Native

Projets Android et iOS versionnés à la racine, Capacitor 8.5.2. Le même APK Android cible téléphone, tablette et TV (Leanback), sans bibliothèque Google Play Services ni Firebase. Pas de verrouillage d’orientation. Le micro, la caméra et l’écran tactile restent optionnels pour installer sur TV ; l’OS demande les permissions à l’utilisation.

Le paquet web est produit avec `pnpm generate`, puis `pnpm exec cap sync`. Fournir `NUXT_PUBLIC_API_BASE` avec une origine HTTPS ; la valeur temporaire de compilation est https://tantara.vercel.app. Le transport HTTP natif prend en charge les appels API ; la session et les transferts doivent encore être vérifiés sur appareils réels.

`.github/workflows/native-build.yml` compile Android/TV et iOS simulateur, et conserve le paquet PWA. Aucun E2E ni déploiement. Android utilise Java 21 et SDK 36 ; iOS nécessite macOS et Xcode 26 minimum. Référence : https://capacitorjs.com/docs/getting-started/environment-setup.

Le push reste facultatif : absence de service, refus ou échec d’inscription ne bloque pas l’application. Les notifications intégrées se rafraîchissent au retour au premier plan et chaque minute quand l’app est visible. Les services Google ne sont pas requis pour la connexion e-mail, les livres, les voix, les messages ou le coffre. Cela ne garantit pas des notifications système en arrière-plan sur un appareil sans fournisseur push.
