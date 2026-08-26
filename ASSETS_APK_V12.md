# NBA 2K27 — Assets visuels APK V12

Cette version branche les assets officiels extraits de NBA 2K HQ 1.1.3 dans l'interface existante.

## Intégration active

- 53 badges utilisés par le builder : icône résolue via `native_icon_name`.
- Badges : icône affichée dans les chips et dans le panneau de détail.
- Takeovers : icône affichée dans les en-têtes de discipline et chaque capacité.
- Variantes Takeover : `color` pour les capacités débloquées/équipées, `grey` pour les capacités verrouillées.
- Les assets sont servis depuis `public/assets/nba2k27`.
- La résolution centralisée est dans `src/data/nba2k27/assetResolver.js`.

## Cas de compatibilité d'assets

Le bundle 1.1.3 conserve certains noms d'assets historiques :

- `Dishmaster` utilise l'asset `freepassinglanes`.
- `Rim Guardian` n'a pas de Texture2D spéciale portant son nom dans le bundle ; le resolver utilise l'icône officielle `rimprotector` comme fallback explicite.

Aucun moteur gameplay n'est modifié par cette version.
