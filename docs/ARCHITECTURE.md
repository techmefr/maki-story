# Architecture — Tantara

## Stack gardée

Nuxt 4 en SPA, Capacitor 8, PostgreSQL avec le pilote `postgres` et des migrations SQL, tâches Nitro planifiées, Vercel, tests Playwright.

## OSDD : deux couches Nuxt

Référence : nuxt-osdd.xefi.com.

- `technical/` : ce qui est transverse et sans règle métier (authentification, permissions, clients d'API, adaptateurs).
- `functional/` : les domaines métier. Chaque domaine a ses pages, composables, composants et assets.

Chaque couche est un dossier Nuxt complet : `nuxt.config.ts`, `app/`, `README.md`. La config racine les déclare :

```ts
defineOSDDNuxtConfig({
  osdd: {
    technical: ['Atom', 'Molecule', 'Audio', 'Sound', 'Storage', 'Native', 'Motion', 'Locale', 'Theme', 'Auth', 'Mail', 'Upload', 'Media'],
    functional: ['Account', 'Family', 'Profile', 'Invitation', 'Book', 'Recording', 'Review', 'Message', 'Vault', 'Tag', 'Lock', 'Reading', 'Notification', 'Help']
  }
})
```

À vérifier dans le README du paquet `nuxt-osdd` à l'installation : l'emplacement exact des couches côté serveur et la façon de déclarer les couches serveur.

## Arborescence cible

```
app/
  pages/            pages fines, elles assemblent des organismes de domaine
  layouts/
  functional/<Domaine>/   types, composables, components, spécification
  technical/<Couche>/
server/
  functional/<Domaine>/   routes, services, règles
  technical/<Couche>/
  migrations/             0019_*.up.sql et suivantes
mobile/
  capacitor.config.ts
docs/
```

Noms : PascalCase au singulier pour les dossiers, `useXxx` pour les composables.

## Domaines

Les écrans cités sont les fichiers de `docs/maquettes/` (`<Écran>.dc.html`).

| Domaine | Écrans | Responsabilité |
| --- | --- | --- |
| Account | Onboarding, Legal, Connexion, Lien Magique, Code Oublie, Permissions, Compte | Connexion, consentements, export et suppression des données |
| Family | Creer Famille, Choix Famille, Famille | Familles, membres, rôle par famille |
| Profile | Page Profils, Menu Profil, Modifier Profil, Code Chiffres, Code Formes | Profils, codes, préférences, langues parlées |
| Invitation | Ajouter Proche, Rejoindre, Profil Proche | Codes et liens d'invitation |
| Book | Bibliotheque, Livre Detail, Ajouter Livre, Acces Livres | Livres, pages, personnages, ISBN, accès par enfant |
| Recording | Studio, Enregistrer | Prises de voix par personnage et par langue |
| Review | Revue Parent | Approbation ou corrections, validation |
| Message | Message Enfant, Accueil Enfant, Accueil Proche, Categorie | Messages vocaux, limite de 5, expiration 24 h |
| Vault | Coffre Adulte, coffre de Accueil Enfant | Coffres, limite de 10 |
| Tag | Tags | Tags multilingues |
| Lock | Controle Parental, Ecran Verrouille | Verrouillage par profil |
| Reading | Lecture | Progression, lecture multivoix |
| Notification | Notifications, e-mails | Notifications, e-mail quotidien |
| Help | Aide, Etat Erreur | Aide, erreurs, hors ligne |

## Où vit chaque règle

| Règle | Foyer |
| --- | --- |
| Parents, proches, rôle par famille | `server/functional/Family`, `Membership` |
| 5 messages par adulte et par enfant | `server/functional/Message` (transaction), `useMessageQuota` |
| Expiration 24 h | `server/functional/Message`, tâche de purge, `useMessageExpiry` |
| Coffre 10 | `server/functional/Vault`, `useVault` |
| Codes | `server/technical/Auth`, `useCodePad` |
| Droits des parents | garde de permission serveur |
| Tags | `server/functional/Tag`, `useTagLabel` |
| Langues de la famille | `useFamilyLanguage` |
| Verrouillage | `server/functional/Lock` (heure du serveur), `useLock` |
| Validation d'un livre | `server/functional/Book` (machine d'états), `Review` |
| Hors ligne et poids | `app/technical/Storage`, `Audio`, `server/technical/Upload` |
| E-mail quotidien | `server/functional/Notification` (tâche planifiée) |

Le serveur garantit les limites dans une transaction ; l'interface les reflète sans les porter.

## Modèle de données (28 entités)

Account, Profile, Family, Membership, FamilyLanguage, ProfileLanguage, AllowedProvider, Invitation, MagicLink, Book, BookLanguage, BookShare, BookAccess, Page, PageTranslation, Character, CharacterTranslation, Recording, Review, Tag, TagTranslation, BookTag, Message, VaultItem, LockRule, ReadingProgress, Notification, NotificationPreference.

Points clés :

- Un enfant appartient à une seule famille ; `Membership` est unique par famille et profil ; une famille garde au moins un parent.
- Les codes sont toujours hachés.
- `Message.expiresAt = firstListenedAt + 24 h`, écrit une seule fois.
- Ajouter au coffre renseigne `savedAt` et supprime l'expiration.
- `Book.origin` vaut `manuel` aujourd'hui, `ia` plus tard sans migration.
- `Book.status` : brouillon, en enregistrement, en relecture, validé.
- `LockRule` : un par profil, `unlockedUntil` pour le déverrouillage de 30 minutes.

Le détail des champs et contraintes est dans le document « Tantara — architecture cible et modèle de données ».

## Migrations

Les 18 migrations existantes ont 4 numéros en double. Ne pas renuméroter celles déjà appliquées en production ; les nouvelles partent de `0019`.
