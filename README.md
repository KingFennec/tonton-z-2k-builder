# Tonton-Z 2K Builder — NBA 2K27

Builder React/Vite alimenté progressivement par les données réelles extraites de l'installation Android de NBA 2K HQ.

## Données APK actuellement intégrées

- morphologie et caps des 21 attributs ;
- dépendances entre attributs selon la taille ;
- calcul du GNR avec les 15 Player Types ;
- badges Bronze → HOF et restrictions de taille ;
- mécanique Legend / perk-level boost ;
- Takeovers, rangs D→S et progression ;
- Cap Breakers ;
- archétype / nom officiel de build NBA 2K27 en français et anglais.

Les données normalisées sont regroupées dans :

```text
src/data/nba2k27/apk/
```

Les moteurs d'interface sont dans :

```text
src/engine/
```

## Archétypes V10

La V10 utilise `player_descriptions` et `ATTRIBUTES_DetermineDescription` :

- 137 959 combinaisons natives ;
- 3 721 noms localisés ;
- localisation anglaise et française complète ;
- lancer franc exclu du naming comme dans le code natif ;
- seuils et priorités propres à chaque poste.

Voir `BUILD_NAMES_APK_V10.md`.

## Validation

```bash
npm run verify:apk
```

Cette commande vérifie caps, dépendances, GNR, badges, Takeovers, progression, Cap Breakers, Legend et noms de builds.

Vérification dédiée aux archétypes :

```bash
npm run verify:buildnames
```

## Développement

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
```

## Windows / GitHub / Cloudflare

Guide complet : `LOCAL_WINDOWS_GITHUB_CLOUDFLARE.md`.

Validation automatisée Windows :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-windows.ps1
```
