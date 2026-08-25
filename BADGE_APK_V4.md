# NBA 2K27 — Badge APK V4

Cette version remplace les seuils d'attributs des 53 badges du Builder par les valeurs extraites directement de NBA 2K HQ.

## Vérifié depuis l'APK

- IDs natifs des 53 badges (17–69)
- noms d'icônes internes GameLib
- catégories natives GameLib (stockées comme métadonnées, sans forcer le regroupement visuel du Builder)
- exigences Bronze / Argent / Or / Hall of Fame
- opérateurs OR / AND exacts

Le tableau natif utilise 6 slots de niveaux. Pour les 53 badges MyPLAYER, seuls les slots 1–4 portent des seuils d'attributs. Le slot 5 est vide dans cette table.

## Comparaison avec la V3

211 des 212 paliers étaient déjà sémantiquement exacts. La seule différence réelle est :

`Unpluckable HOF = Post Control >= 100 OR Ball Handle >= 97`

Le Builder V4 conserve cette branche impossible à 100 afin de représenter exactement la table 2K.

## Pas encore vérifié depuis l'APK

Les limites de taille des badges sont conservées depuis la base de recherche précédente, mais portent `height_status: not-yet-apk-verified`. Elles ne doivent donc pas être présentées comme extraites de l'APK tant que le bloc runtime `BADGES_GetHeightRangeBadgeIsAllowedIn` n'a pas été entièrement reconstruit.
