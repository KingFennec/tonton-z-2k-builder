# NBA 2K27 — budget GNR des attributs (V10.2)

## Source native

Le blocage des points d'attribut a été reconstruit depuis `CareerBuilder_AttributeManager` dans `libil2cpp.so`, en le croisant avec les fonctions GNR de `libcsharplib_mobile_CLEAN_OPT.so`.

Méthodes natives pertinentes :

- `CalculateOverallRatingAtCaps` — `0x2CE2714`
- `IncAttributeCap` — `0x2CE27A8`
- `DecAttributeCap` — `0x2CE2A2C`
- `CanUpdateAttribute` — `0x2CE4C30`
- `ATTRIBUTES_GetUncappedDetailedOverallRatingWithUpgradeAvailabilityBasedRounding` — export GameLib `0x235F38`

## Règle vérifiée

Avant d'accepter une hausse d'attribut, le Builder 2K27 :

1. exige que le GNR entier actuel soit `<= 98` ;
2. simule l'incrément et toutes les hausses d'attributs associés ;
3. recalcule le GNR détaillé **non plafonné** ;
4. refuse l'achat si ce GNR détaillé est `> 99.000f`.

Ainsi, voir `99` à l'écran n'est pas la seule règle. Une hausse peut être refusée depuis un GNR affiché à 98 si le coût interne de l'incrément ferait dépasser 99.000.

## Intégration Builder

La V10.2 ajoute :

- `calculateExactUncappedGnr()` ;
- `testExactOverallIncrement()` ;
- validation point par point des sliders ;
- prise en compte du coût des dépendances avant l'autorisation ;
- arrêt automatique au dernier point légal ;
- désactivation du bouton `+` lorsque le GNR affiché est 99 ;
- avertissement expliquant pourquoi le point suivant est refusé.

## Tests

`npm run verify:overall-budget` contrôle trois frontières :

- dernier incrément légal `98 -> 99` ;
- candidat affiché `99` mais GNR détaillé `99.217...` : refus ;
- build déjà affiché `99` : toute hausse supplémentaire est refusée.
