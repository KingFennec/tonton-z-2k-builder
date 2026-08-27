# Trouver mon build — V21 Seuils d'animations

La V21 ajoute les seuils d'animations NBA 2K27 à l'optimisation personnalisée du BASE 99.

## Source

Les animations proviennent du glossaire NBA 2K HQ normalisé par `scripts/importAnimationGlossary.mjs`.
L'import conserve les 2914 entrées dans `src/data/nba2k27/apk/animations.json` et génère en parallèle un index compact dans `src/data/nba2k27/apk/animation_optimizer_index.json`.

L'application n'importe que l'index compact dans le moteur de recommandation. Le fichier complet reste disponible pour les vérifications et les travaux futurs, mais n'est pas injecté dans le bundle du Finder.

## Données prises en compte

Le moteur respecte exactement :

- les classes de taille SMALL / SWING / BIG ;
- `ANY`, `SMALLS_ONLY`, `SWINGS_ONLY`, `BIGS_ONLY`, `SWINGS_AND_SMALLS`, `BIGS_AND_SWINGS` ;
- les opérateurs d'exigences `AND` et `OR` ;
- les 12 attributs du glossaire mappés vers les attributs Builder ;
- les seuils entiers d'attributs de chaque animation.

Les animations saisonnières sont exclues de l'optimisation permanente du BASE 99. Les groupes `BT_DUNKS`, `BT_ALLEYOOP` et `BT_PASS`, associés aux contenus ville/Playground dans le glossaire, sont exclus du score REC.

## Principe de scoring

Une animation n'est pas valorisée uniquement parce qu'elle existe. Sa valeur dépend du profil demandé : rôle offensif principal et secondaire, rôle défensif et priorités choisies.

Exemples :

- `PASS_STYLE` est fortement valorisé pour un créateur/passeur ;
- `DRIBBLE_STYLE` et les groupes ISO le sont pour un porteur de balle ;
- `CONTACT_DUNKS` est fortement valorisé pour un slasher ;
- `SHOT_JUMPER` et les tirs en sortie de dribble sont pondérés selon le rôle de tir/création ;
- les mouvements au poste sont essentiellement valorisés pour `post_play` ;
- `MOTION_STYLE` intervient notamment pour les profils vitesse/mobilité et certains rôles défensifs.

Le nombre d'animations partageant exactement le même seuil utilise un rendement décroissant afin qu'un très gros groupe comme `SHOT_JUMPER` ne domine pas artificiellement tous les autres groupes.

## Intégration dans l'optimisation

La V21 intervient à quatre niveaux :

1. Recherche de morphologie : une taille est avantagée si ses restrictions SMALL/SWING/BIG permettent d'atteindre davantage d'animations pertinentes avec les caps disponibles.
2. BASE 99 : le moteur protège les seuils utiles déjà débloqués lorsqu'il libère du budget GNR.
3. Réinvestissement : franchir ou se rapprocher d'un seuil pertinent augmente la valeur d'un incrément, sans contourner les caps, les dépendances APK ou le GNR exact.
4. Cap Breakers : les plans +5/+10/+15 peuvent privilégier un point qui ouvre une animation pertinente et affichent les animations débloquées.

La Meta REC reste indépendante du moteur personnel et n'est jamais modifiée par l'optimisation d'animations.

## Affichage

Chaque résultat peut afficher :

- le score de couverture des animations pertinentes ;
- les animations clés déjà accessibles ;
- les animations gagnées par la personnalisation BASE 99 ;
- les animations supplémentaires ouvertes par les plans de Cap Breakers.

Le score mesure l'accès aux seuils correspondant au profil. Il ne prétend pas classer objectivement la qualité terrain de deux animations spécifiques. Ce classement devra être enrichi avec les tests REC, 2KLab/Tutes et les usages compétitifs.

## Vérification

Après import du glossaire complet :

```powershell
npm.cmd run import:animations
npm.cmd run verify:animations
npm.cmd run verify:finder
```

`verify:animations` valide le dataset complet, l'index d'optimisation et un jeu de tests synthétiques couvrant taille, AND/OR, déblocage, perte d'un seuil et ciblage du prochain seuil.

`verify:finder` vérifie ensuite les BASE 99, morphologies, caps, dépendances, Cap Breakers, Synergies et l'activation de l'analyse d'animations pour tous les résultats des scénarios de référence.
