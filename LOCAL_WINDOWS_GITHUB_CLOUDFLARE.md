# V10.1 — Test local Windows et mise à jour GitHub / Cloudflare

## 1. Ne pas extraire la V10 *dans* un sous-dossier du projet

Le dossier extrait V10.1 contient le projet complet. Pour conserver l'historique Git, garde le dossier `.git` de ton dépôt actuel et remplace les fichiers du projet par ceux de la V10.1.

Méthode conseillée :

1. Faire une copie de sauvegarde de ton dossier actuel `tonton-z-2k-builder`.
2. Extraire la V10.1 dans un dossier temporaire, par exemple `tonton-z-2k-builder-v10.1`.
3. Dans le dépôt actuel, supprimer `node_modules` et `dist` s'ils existent.
4. Copier **le contenu** de `tonton-z-2k-builder-v10.1` dans le dossier actuel `tonton-z-2k-builder` et accepter le remplacement des fichiers.
5. Ne jamais supprimer le dossier caché `.git` du dépôt actuel.

## 2. Pré-requis Windows

Utiliser Node.js 24 pour rester identique au workflow GitHub Actions du projet.

Dans PowerShell, depuis le dossier `tonton-z-2k-builder` :

```powershell
node --version
npm --version
```

## 3. Installation propre

```powershell
npm ci
```

`npm ci` est recommandé ici car `package-lock.json` est présent et fixe exactement les versions des dépendances.

## 4. Vérifier les données APK

```powershell
npm run verify:apk
```

La commande doit valider caps, dépendances, GNR, badges, Takeovers, progression, Cap Breakers, Legend et archétypes.

## 5. Tester en développement local

```powershell
npm run dev
```

Vite affichera l'adresse locale, normalement :

```text
http://localhost:5173/
```

Ouvrir cette adresse dans le navigateur.

## 6. Tester le vrai build de production

```powershell
npm run build
```

Le dossier `dist` doit être créé.

Puis :

```powershell
npm run preview
```

Vite affichera une adresse de prévisualisation, généralement :

```text
http://localhost:4173/
```

Cette étape est la meilleure vérification locale avant GitHub/Cloudflare.

## 7. Mise à jour GitHub recommandée

Créer d'abord une branche :

```powershell
git status
git switch -c v10-apk-buildnames
git add -A
git commit -m "Integrate NBA 2K27 APK data V10"
git push -u origin v10-apk-buildnames
```

Sur GitHub, ouvrir une Pull Request vers `main` et la fusionner après validation.

Le workflow `.github/workflows/deploy.yml` ne déploie que lors d'un push sur `main`.

## 8. Déploiement Cloudflare

Après fusion/push sur `main`, GitHub Actions exécute automatiquement :

```text
npm ci
npm run build
wrangler deploy
```

Le fichier `wrangler.jsonc` publie le dossier :

```text
./dist
```

avec gestion SPA.

Les secrets GitHub nécessaires sont déjà référencés dans le workflow :

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Si le workflow était déjà fonctionnel avant la V10, il n'y a normalement rien à modifier côté Cloudflare.
