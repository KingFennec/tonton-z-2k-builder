# V10 — Archétypes / noms de builds NBA 2K27

La V10 intègre le générateur natif de descriptions de builds utilisé par NBA 2K HQ pour les builds personnalisés.

## Sources APK

Asset Unity :

```text
assets/bin/Data/0209451968881494e86bd533f7786c47
resource: player_descriptions
```

Fonctions GameLib associées :

```text
LoadPlayerDescriptions
ATTRIBUTES_DetermineDescription
```

Le fichier décompressé contient :

- 137 959 combinaisons de 2 à 7 attributs parmi les 20 attributs pris en compte ;
- 5 résultats localisés par combinaison, un pour chaque poste PG / SG / SF / PF / C ;
- 3 721 identifiants de noms distincts.

Les 3 721 noms ont été résolus depuis les tables de localisation anglaise et française de NBA 2K HQ.

## Algorithme reproduit

Le moteur :

1. ignore volontairement le lancer franc ;
2. compare les 20 autres attributs à des seuils dépendant du poste ;
3. ajuste les groupes physique / non-physique quand trop ou trop peu d'attributs dépassent les seuils ;
4. départage les égalités selon les priorités natives du poste ;
5. sélectionne de 3 à 7 attributs dominants dans le chemin utilisé par le Builder ;
6. construit le masque natif 20 bits ;
7. cherche ce masque dans `player_descriptions` ;
8. retourne le nom français et anglais correspondant au poste.

Fichiers :

```text
src/data/nba2k27/apk/build_descriptions.json
src/engine/buildDescriptionEngine.js
```

## Validation

Un jeu de 1 020 fixtures a été produit avec une reconstruction Python indépendante de l'algorithme natif puis comparé au moteur JavaScript.

```bash
npm run verify:buildnames
```

Résultat attendu :

```text
Build description APK verification passed.
- 137,959 native attribute combinations
- 3,721 localized names EN/FR
- 1020/1020 independent selection fixtures
```

L'interface affiche désormais l'archétype 2K27 à côté du GNR, sans remplacer le nom personnalisé utilisé pour sauvegarder un build.
