# Kalli — contexte projet (à lire en premier)

App mobile : les livres papier de la maison, lus à plusieurs voix par la famille. Nom de travail **Kalli** (alt. Lio). Mascotte : un **maki au casque**. Hébergement prévu : sous-domaine de **familiste.fr** (ex. `matteo.familiste.fr`).

## Concept
1. Le parent scanne les pages d'un livre papier (photo).
2. Il découpe en répliques/personnages et **colorie les voix** : chaque proche = 1 couleur. Il peut décrire l'image de la page, le **ton de chaque voix** et une **indication par phrase** (chuchoté, en riant…).
3. Chaque proche enregistre ses répliques dans le **studio**, depuis son téléphone. Il voit avant d'enregistrer : description de l'image, ton de sa voix, indication de la phrase.
4. L'enfant écoute **livre papier en main** : l'écran n'affiche **ni texte ni image** (pas de souci de droits). Il montre qui lit (couleur + initiale/visage), puis à chaque fin de page : **son « ding » + écran maki « Page suivante »** + gros bouton flèche.
5. **Messages vocaux** enfant ↔ proches, façon story.

## Profils
- **Parent** : crée les livres, colorie les voix, enregistre, gère famille/réglages.
- **Proche** : enregistre ses répliques et des histoires solo, laisse des messages à l'enfant.
- **Enfant** : écoute, envoie/reçoit des messages. Aucun réglage.
- Changement de profil : avatar dans l'en-tête → panneau par le bas (écran « Qui écoute ? »).

## Espace enfant
- Accueil : visages des proches en grand (photo à déposer). Bulle « Message » si un message attend.
- Toucher un visage → ses histoires **à une seule voix**. Carte « Histoires à plusieurs voix » → bibliothèque familiale.
- Écoute : fond = couleur du lecteur, grosse initiale/visage, « X lit », pause. Barre de progression fine.

## Messages vocaux (règles)
- Un seul message écoutable à la fois par proche. Écouté = **plus réécoutable**.
- Garder **5 derniers** par conversation (1 actif + 4 historique invisible, pour plus tard). Le plus ancien est purgé.
- L'enfant peut répondre à la fin d'un message (bouton « Répondre ») ou envoyer depuis la page d'un proche.
- Statuts côté enfant : « Envoyé » puis « A écouté ✓ ».

## Phase actuelle : TEST RÉEL (pas le produit final)
- **Un seul compte partagé** (mot de passe ou magic link). Chacun l'utilise sur son téléphone et **change de profil** en haut.
- On enregistre de **vrais livres**, on s'écoute, on envoie des messages.
- Répliques **saisies à la main** (pas d'OCR pour l'instant).
- Pas de : inscription publique, Apple/Google, familles multiples, invitations par code, abonnement. (Écrans déjà dessinés, à brancher plus tard.)
- Le compte partagé deviendra la 1re famille → rien à jeter.
- ⚠ Sans vraie connexion, éviter de mettre de vraies voix d'enfants dans les tests.

## Stack décidée
- **Nuxt 4** (front + `server/api`), déployé sur **Vercel**.
- **Supabase** : Postgres + Storage (audio, photos, pages scannées) + Realtime (bulles de message). Auth plus tard (magic link via **Brevo** en SMTP).
- Couche données : les pages n'accèdent **jamais** directement aux données, seulement via composables `useBooks()`, `useMembers()`, `useMessages()`, `useRecordings()` → on pourra changer de backend sans toucher aux écrans.
- Audio : `MediaRecorder` dans le navigateur. **Tester tôt sur un vrai iPhone** (Safari enregistre en mp4/AAC, les autres en webm/opus → stocker le mimeType, prévoir lecture des deux).
- PWA installable au début ; Capacitor plus tard pour les stores.
- Micro = HTTPS obligatoire (Vercel OK).
- Purge des messages > 5 : cron (Vercel Cron ou Supabase pg_cron).

## Sous-domaine familiste.fr — à configurer
- Décision à confirmer : **1 déploiement par famille** (`matteo.familiste.fr`) OU **1 app multi-familles** avec sous-domaine = famille (wildcard).
- Pour le test : une seule instance `matteo.familiste.fr`.
- Checklist config :
  1. DNS familiste.fr : CNAME `matteo` → `cname.vercel-dns.com` (ou wildcard `*` si multi-familles).
  2. Vercel : ajouter le domaine au projet (wildcard = plan/réglage à vérifier).
  3. Variables d'env Vercel : `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` (serveur seulement), `TEST_ACCESS_PASSWORD`.
  4. Supabase : créer buckets **privés** `recordings`, `photos`, `pages` ; URLs signées pour lire.
  5. Protection d'accès : mot de passe partagé (middleware Nuxt) ou protection Vercel si l'offre le permet.
  6. Plus tard : Brevo (SMTP Supabase + SPF/DKIM sur familiste.fr), Auth, RLS par famille.

## Données (schéma cible)
```
Family(id, nom, code_invitation, plan)
Member(id, family_id, user_id?, prénom, rôle[parent|proche|enfant], couleur, photo_url, statut[actif|invité])
Book(id, family_id, titre, type[multi|solo], solo_member_id?, statut[brouillon|à_enregistrer|prêt], image_desc)
Page(id, book_id, ordre, scan_url)              -- privé à la famille, jamais montré à l'enfant
Line(id, book_id, page_id, ordre, personnage, texte, note)   -- texte = découpage seulement
Voice(book_id, member_id, ton)                   -- description du ton par voix
Casting(book_id, personnage | line_id, member_id)
Recording(id, line_id, member_id, audio_url, mime, durée_ms)
Message(id, from_member, to_member, audio_url, mime, écouté_le, créé_le)   -- 5 max/conversation
```
Couleurs de voix = 6 : corail, soleil, menthe, ciel, raisin, rose.

## Écrans → routes Nuxt
- `pages/index.vue` splash/bienvenue · `pages/auth/login.vue` · `pages/auth/register.vue`
- `pages/profiles.vue` + `components/ProfileSwitcher.vue`
- `pages/home.vue` (accueil parent vide/rempli)
- `pages/books/new/{scan,voices,review}.vue` · `pages/books/[id]/{studio,play}.vue`
- `pages/kid/index.vue` · `kid/[member].vue` · `kid/library.vue` · `kid/listen/[id].vue` · `kid/message/[member].vue`
- `pages/family/{index,invite,new}.vue` · `pages/profile.vue` · `pages/settings.vue` · `pages/premium/{index,success}.vue`

## Design — look retenu : celui de « Tantara Mobile »
Très enfant, simple, coloré, graphique.
- **Contours** sombres 2.5–3px `#1F1B3A`, **ombres dures** décalées (`3px 3px 0 #1F1B3A`), enfoncement au clic (`translate(3px,3px)`, ombre 0).
- **Fond** crème `#FFF4D9` ; encre `#1F1B3A`.
- **Voix** : corail `#FF7A6B`, soleil `#FFC940`, menthe `#4CD4A8`, ciel `#6BB6FF`, raisin `#B08CFF`, rose `#FF94C8`.
- **Polices** : Fredoka (titres, boutons) + Nunito (texte). Couvertures/illustrations = rayures diagonales en placeholder.
- Gros boutons (≥ 44px, enfant ≥ 66–84px), coins très arrondis (14–30px).
- Logo : maki au casque (`Maki.dc.html`, couleur du casque modifiable).
- Alternative plus douce (crème/corail, sans contours) conservée pour référence dans `Kalli App.dc.html`.

## Fichiers du projet
- `Tantara Mobile.dc.html` — **prototype cliquable de référence** (login, profils, bibliothèque, scan, colorier les voix + descriptions, vérifier, studio, lecteur, espace enfant, messages, famille, ajouter proche/famille). Toute la logique d'interaction est dans la classe `Component`.
- `Kalli App.dc.html` — 14 écrans statiques (splash, bienvenue, connexion, onboarding ×3, accueil vide/rempli, profil, réglages, abonnement ×2, écoute, page suivante).
- `Kalli Synthese Projet.dc.html` — synthèse A4 du projet.
- `Maki.dc.html` — logo/mascotte.
- `image-slot.js`, `doc-page.js` — composants utilitaires des maquettes.

## Textes et langue
Interface en **français**. Ton chaleureux, tutoiement. Noms d'exemple malgaches (Nosy Be, Itasy, Ravo, zébu, lémurien).

## Concurrence (positionnement)
Bookinou (livres papier, boîtier, 1 voix) · Weconte (multi-voix, catalogue imposé) · Storyplay'r / Story Time Together (catalogue) · Gramms/HearLoom/Tellioh (voix clonées IA).
**Kalli** : ses propres livres + plusieurs vraies voix colorées + zéro texte à l'écran + messages vocaux + vraie voix (pas de clonage).

## Modèle économique (prévu, plus tard)
Gratuit : 5 livres, 4 proches, 1 famille, messages inclus. Famille : illimité, 5 familles, hors ligne. **3 €/mois** ou **24 €/an** (2 €/mois), 7 jours d'essai.

## Ordre de travail proposé
1. Init Nuxt 4 + module Supabase + layout mobile + tokens de design + composants (Card, Button dur, VoiceDot, Avatar, Maki).
2. Protection par mot de passe partagé + écran profils + switcher.
3. Composables de données + tables Supabase + buckets.
4. Création de livre : scan (upload photo) → saisie des répliques → colorier (image_desc, ton, notes) → vérifier.
5. Studio d'enregistrement (MediaRecorder, test iPhone) → publier.
6. Espace enfant : accueil visages, solo, multi-voix, écoute + ding + « Page suivante ».
7. Messages vocaux (règles ci-dessus) + Realtime.
8. Déploiement Vercel + `matteo.familiste.fr` + test réel en famille.
9. Ensuite : vraie connexion, familles multiples, invitations, abonnement, OCR.
