# Tonton-Z 2K Builder — NBA 2K27

Builder React/Vite alimenté progressivement par les données réelles extraites de l'installation Android de NBA 2K HQ.

## Données APK actuellement intégrées

- morphologie et caps des 21 attributs ;
- dépendances entre attributs selon la taille ;
- calcul du GNR avec les 15 Player Types ;
- budget réel des points d’attribut et blocage natif à la limite GNR 99 ;
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

## Budget GNR V10.2

La V10.2 reproduit le contrôle natif du `CareerBuilder_AttributeManager` avant chaque hausse d’attribut :

- GNR entier actuel <= 98 ;
- simulation de la hausse et de ses dépendances ;
- GNR détaillé non plafonné du candidat <= 99.000 ;
- arrêt du slider au dernier point légal.

Voir `OVERALL_BUDGET_APK_V10_2.md`.

## Validation

```bash
npm run verify:apk
```

Cette commande vérifie caps, dépendances, GNR, budget des points d’attribut, badges, Takeovers, progression, Cap Breakers, Legend et noms de builds.

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

## V13 — Assets visuels officiels

- Icônes de catégories intégrées aux badges et attributs.
- Headers APK utilisés en filigrane.
- 11 Body Types affichés comme références visuelles uniquement.
- Branding NBA 2K27 / Player Builder intégré au header.
- `npm run verify:assets` contrôle désormais l’ensemble de ces assets.

## V17 — Trouver mon build

Une page distincte du Builder principal permet désormais de décrire son style de jeu via un questionnaire puis de recevoir trois propositions du même poste : build idéal, variante et référence Meta REC provisoire.

Chaque proposition affiche la morphologie, les 21 attributs BASE 99, un plan +5 / +10 / +15 Cap Breakers, des Synergies conseillées et une comparaison directe avec la référence Meta REC du poste. Le build choisi peut être chargé directement dans le Builder principal.

Vérification dédiée :

```bash
npm run verify:finder
```

Voir `PLAYSTYLE_FINDER_V17.md`.
