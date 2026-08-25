# Intégration des données NBA 2K27 extraites de NBA 2K HQ

## Ce qui est désormais alimenté par les données APK

### Morphologie / caps

Le Builder n'utilise plus `bodyCaps.json` pour calculer les caps affichés.

Source active :

```text
src/data/nba2k27/apk/morphology.json
```

Moteur :

```text
src/engine/apkBuilderEngine.js
```

La formule reproduit les opérations float32 et l'arrondi du code natif 2K.

Les plages de poids et d'envergure sont également corrigées selon la taille sélectionnée. Exemple : pour un MJ de 6'7", le poids disponible est 180–230 lbs et l'envergure 6'7"–7'1".

### Dépendances entre attributs

Les anciennes règles de `attributeDependencies.js` ne sont plus utilisées par l'interface comme source des contraintes.

Les règles sont générées à partir de :

```text
src/data/nba2k27/apk/attribute_constraints.json
```

Elles changent automatiquement avec la taille du joueur.

### GNR

Le GNR affiché dans l'en-tête des attributs est calculé depuis :

```text
src/data/nba2k27/apk/gnr_model.json
```

Le calcul prend en compte :

- l'index de taille ;
- les 15 Player Types ;
- les poids des 21 attributs ;
- les courbes `rating_weight_scale` ;
- la table `overall_height_lerp` ;
- la règle d'arrondi liée aux upgrades disponibles.

## Validation effectuée

Profil de référence :

```text
MJ / PG
6'7"
215 lbs
6'10"
```

Résultats :

- 21/21 caps de référence conformes ;
- 78 règles exactes de dépendance à 6'7" ;
- 28/28 relevés historiques de dépendances conformes ;
- 28/28 GNR historiques conformes ;
- cross-check extraction : 80/80 cas morphologiques et 28/28 cas GNR conformes.

Commande locale :

```bash
npm run verify:apk
```

## État actuel de l'intégration APK

Les caps, dépendances, GNR, budget des points d'attribut, badges, Takeovers, progression Takeover, Cap Breakers, mécanique Legend et noms d'archétypes sont désormais alimentés par des données ou fonctions APK vérifiées.

Les anciens fichiers de recherche manuelle sont conservés pour comparaison et historique, mais ne pilotent plus ces systèmes.

## Badges — APK V5

Les exigences d'attributs et les restrictions de taille des badges sont maintenant extraites directement de `careermode_progression_tuning` et validées avec les fonctions natives GameLib (`BADGES_GetMinAttributeRequirements`, `BADGES_GetHeightRangeBadgeIsAllowedIn`, `BADGES_GetBadgeIconName`, `BADGES_GetBadgeCategory`).

- 53 badges MyPLAYER : IDs natifs 17 à 69.
- 4 paliers d'exigences d'attributs remplis : Bronze, Argent, Or, Hall of Fame.
- 212/212 paliers du fichier `badges.json` correspondent à l'extraction APK normalisée.
- 211/212 paliers de la V3 étaient déjà sémantiquement identiques.
- Seul `Unpluckable` HOF diffère : l'APK contient `Post Control >= 100 OU Ball Handle >= 97`. La branche Post Control 100 est impossible avec un attribut plafonné à 99, mais elle est conservée pour reproduire fidèlement la donnée 2K.
- Le slot natif de niveau 5 n'a aucune exigence d'attribut directe pour les 53 badges. Cela ne signifie pas que le niveau Legend n'existe pas : seulement qu'il n'est pas défini ici par une cinquième ligne de seuils d'attributs.

### Restrictions de taille

- 31 indices de taille natifs sont décodés (63 à 93 pouces).
- `BADGES_GetHeightRangeBadgeIsAllowedIn` considère le badge autorisé lorsque l'octet de la ligne de taille est >= 1.
- 53/53 restrictions effectives du Builder correspondent aux données APK.
- Les limites natives hors de la plage réellement accessible aux postes NBA MyPLAYER (69 à 88 pouces) sont conservées en métadonnées mais normalisées à `null` lorsqu'elles ne contraignent pas le Builder.

Données brutes normalisées :

- `src/data/nba2k27/apk/badge_requirements.json`
- `src/data/nba2k27/apk/badge_height_restrictions.json`

Vérification :

```bash
npm run verify:badges
# ou toute l'intégration APK :
npm run verify:apk
```

## V6 — Takeovers APK

Takeover MyPLAYER eligibility requirements and native D/C/B/A/S ranks are now sourced from the installed NBA 2K HQ tuning (`careermode_progression_tuning`). Raw extraction is stored in `src/data/nba2k27/apk/takeover_tuning.json` and verified by `scripts/verifyTakeoverApkData.mjs`.

## V10 — Archétypes / noms de builds

Le nom d'archétype affiché par le Builder provient désormais de l'asset `player_descriptions` et de la logique native `ATTRIBUTES_DetermineDescription`.

- 137 959 combinaisons natives décodées ;
- 3 721 noms uniques résolus en anglais et en français ;
- seuils propres aux postes PG/SG/SF/PF/C ;
- lancer franc exclu du calcul de naming ;
- sélection et départage des attributs dominants reproduits dans `buildDescriptionEngine.js` ;
- 1 020 fixtures indépendantes conformes.

Le nom personnalisé de sauvegarde reste séparé de l'archétype 2K27.

## V10.2 — Budget des points d'attribut / limite GNR 99

Le contrôle natif de `CareerBuilder_AttributeManager` a été reproduit. Avant une hausse, 2K vérifie le GNR entier actuel, simule le nouvel état avec les dépendances, puis refuse l'achat lorsque le GNR détaillé non plafonné dépasse `99.000f`.

La V10.2 teste les sliders point par point et s'arrête au dernier point légal. Voir `OVERALL_BUDGET_APK_V10_2.md` et `npm run verify:overall-budget`.
