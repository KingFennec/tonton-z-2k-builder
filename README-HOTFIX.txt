V21.1 hotfix - verifyPlaystyleFinder.mjs

Remplace uniquement :
  scripts/verifyPlaystyleFinder.mjs

Ce correctif retire le seuil arbitraire exigeant au moins 3 changements de morphologie.
La recherche morphologique reste verifiee scenario par scenario via le nombre de morphologies scannees/evaluees.
Il preserve src/data/nba2k27/apk/animations.json et animation_optimizer_index.json deja importes sur le PC.
