# NBA 2K27 — Badge APK V5

Cette version complète l'extraction des badges NBA 2K27 depuis NBA 2K HQ.

## Vérifié depuis l'APK

- IDs natifs des 53 badges (17–69)
- noms d'icônes internes GameLib
- catégories natives GameLib
- exigences Bronze / Argent / Or / Hall of Fame
- opérateurs OR / AND exacts
- restrictions de taille des 53 badges

Les exigences d'attributs proviennent de `careermode_progression_tuning` et de la logique native `BADGES_GetMinAttributeRequirements`.

Les restrictions de taille sont vérifiées par `BADGES_GetHeightRangeBadgeIsAllowedIn`. La fonction native parcourt 31 indices de taille, lit un octet par badge et considère le badge autorisé lorsque cet octet est >= 1. Dans le fichier sérialisé NBA 2K27, les valeurs observées pour les badges MyPLAYER 17–69 sont 0 (interdit) et 5 (autorisé).

Le bloc sérialisé utilise 31 lignes de taille espacées de `0xAC6` octets. Le runtime GameLib reconstruit ces lignes avec un stride de `0xAC8`.

## Normalisation Builder

Le tuning natif couvre les indices `63..93` pouces, tandis que les plages de postes NBA MyPLAYER réellement accessibles couvrent globalement `69..88` pouces (5'9" à 7'4").

Une limite native située hors de cette plage accessible est stockée dans les métadonnées `native_height_range_in`, mais elle est normalisée à `null` dans `badge.height` lorsqu'elle ne contraint pas réellement le Builder.

Exemples :

- Mini Marksman : maximum 6'4" (76 in)
- Layup Mixmaster : maximum 7'0" (84 in)
- Challenger : maximum 6'11" (83 in)
- Rise Up : minimum 6'5" (77 in)
- Paint Prodigy : minimum 6'3" (75 in)
- Post Spin Catalyst : minimum 6'1" (73 in)

## Validation

- 53/53 restrictions de taille de la V4 correspondent déjà aux données APK une fois normalisées au Builder.
- 211/212 paliers d'attributs V3 correspondaient déjà aux données APK ; la seule différence reste `Unpluckable HOF = Post Control >= 100 OR Ball Handle >= 97`.
- Le slot natif de niveau 5 des exigences directes d'attributs reste vide pour les 53 badges.
