# NBA 2K27 — Animations UI V23

## Objectif

Intégrer le choix des animations directement dans Tonton-Z 2K Builder en respectant l'ordre de priorité :

1. tirs ;
2. dunks ;
3. autres animations.

## Base déjà vérifiée

La bibliothèque APK / NBA 2K HQ contient 2914 animations et le moteur `src/engine/animationEngine.js` applique déjà :

- restrictions de taille SMALL / SWING / BIG ;
- exigences d'attributs AND / OR ;
- fenêtres saisonnières ;
- explication des exigences manquantes.

Le moteur d'optimisation `animationOptimizerEngine.js` utilise déjà les seuils d'animations pour valoriser les choix d'attributs.

## V23 — Phase 1 Tir

Nouveaux fichiers :

- `src/components/AnimationPanel.jsx`
- `src/components/AnimationPanel.css`
- `src/engine/animationRecommendationEngine.js`
- `src/data/nba2k27/animationCommunitySignals.js`

Le panneau :

- charge `animations.json` dynamiquement afin de conserver la bibliothèque de ~2 Mo hors du chunk initial ;
- filtre les groupes de tir ;
- affiche `Éligible`, `Proche` ou `Verrouillée` ;
- considère une animation `Proche` si la morphologie est compatible et qu'il manque au maximum 3 points sur chaque prérequis d'attribut ;
- affiche les prérequis manquants ;
- permet recherche et filtrage ;
- prévoit un choix de profil de recommandation (catch & shoot, création après dribble, sortie rapide, timing accessible, fenêtre verte) ;
- permet d'équiper une animation éligible via `onSelectAnimation`.

## Séparation données objectives / recommandations

`animationCommunitySignals.js` est volontairement vide au départ.

Aucune opinion communautaire ne doit modifier l'éligibilité provenant de l'APK.

Chaque futur signal qualitatif doit comporter au minimum :

- animationId ;
- tags d'usage ;
- score ;
- type de source (`official`, `developer`, `lab_test`, `competitive`, `community`) ;
- niveau de confiance ;
- nom de la source ;
- URL ;
- date de publication ;
- note synthétique.

Les informations de développeurs (ex. Mike Wang), tests de laboratoire, joueurs compétitifs et retours communautaires peuvent alors être croisés sans être confondus avec les règles du jeu.

## Branchement restant dans App.jsx

La V23 doit ensuite être reliée à l'état principal du build :

```jsx
<AnimationPanel
  morphology={morphology}
  attributes={effectiveAttributes}
  selectedAnimations={selectedAnimations}
  onSelectAnimation={selectAnimation}
/>
```

À ajouter également à la persistance :

- `selectedAnimations` dans l'état `App` ;
- sérialisation dans `createBuildPayload` ;
- désérialisation dans `decodeBuildPayload` ;
- restauration des builds sauvegardés / partagés ;
- suppression automatique d'une sélection devenue non éligible après changement de morphologie ou d'attributs.

## Étapes suivantes

### Phase 1B — données qualitatives tir

Recouper et intégrer progressivement :

- déclarations officielles / développeurs ;
- NBA2KLab et autres tests mesurés ;
- joueurs compétitifs / créateurs reconnus ;
- consensus communautaire récent.

### Phase 2 — Dunks

Réutiliser le même panneau et le même moteur avec :

- `DUNKS` ;
- `CONTACT_DUNKS` ;
- `ALLEYOOP` ;
- les variantes pertinentes REC.

### Phase 3 — Autres animations

Dribble, passes, layups, motion style, triple threat et animations de poste.
