# Cap Breakers — APK V8

Source vérifiée : `libcsharplib_mobile_CLEAN_OPT.so` de NBA 2K HQ.

Fonction native reconstruite :

- `ATTRIBUTES_GetCapBreakerBoostValuesForAttrAtIndex` (`0x235fac`)
- logique interne principale (`0x27c074`)

## Règles confirmées

- 5 Cap Breakers maximum par attribut (`MAX_CAP_BREAKER_POINTS_PER_ATTRIBUTE = 5`).
- Un Cap Breaker n'est pas nécessairement égal à +1 point d'attribut.
- Le gain dépend de la valeur actuelle et du poids de l'attribut pour le Player Type GNR retenu.
- Chaque slot donne au minimum +1 tant qu'il reste de la marge.
- Le cap morphologique calculé par le moteur 2K reste la limite absolue.
- La fonction Cap Breaker ne passe pas par les contraintes associées du Builder : elle travaille après la création du build.
- Le Builder V8 affiche les cinq projections natives sans supposer combien de Cap Breakers le joueur possède globalement.

## Formule reconstruite

Pour chaque slot :

1. `ratingFactor = 15 - floor(14 * (rating - 25) / 74)`
2. `ratio = (maxWeight - attributeWeight) / maxWeight`
3. `boost = max(1, roundTiesEven(ratingFactor * ratio))`
4. le boost est tronqué si nécessaire pour ne jamais dépasser le cap morphologique ;
5. le calcul recommence sur la nouvelle valeur, jusqu'à cinq slots.

`maxWeight` et `attributeWeight` viennent des tables GNR du Player Type choisi par le build courant.
