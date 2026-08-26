# Trouver mon build — V19

## Objectif

La V19 fait évoluer le module personnalisé d'un simple classement de builds connus vers un optimiseur de budget autour d'architectures REC déjà validées.

Le moteur Meta reste indépendant : les builds de référence dans `provisionalMetaBuildByPosition` ne sont jamais réécrits par l'optimiseur personnel.

## Pipeline V19

1. Questionnaire joueur -> `buildPlaystyleProfile`.
2. Sélection des architectures validées du poste.
3. Pour chaque architecture :
   - lecture des caps exacts de morphologie APK ;
   - lecture des dépendances exactes de la taille ;
   - libération contrôlée d'une petite réserve de GNR sur les attributs peu importants ou explicitement sacrifiés ;
   - réinvestissement sur les priorités et les attributs les plus importants ;
   - validation de chaque incrément avec la porte de budget exacte NBA 2K27 ;
   - retour au seed si aucune réallocation GNR 99 valide n'est meilleure/cohérente.
4. Classement des variantes personnalisées.
5. Proposition : build idéal personnalisé, variante différenciée, puis Meta fixe si elle n'est pas déjà représentée sans modification.
6. Calcul +5/+10/+15 Cap Breakers et Synergies sur le résultat final.

## Garde-fous

- GNR BASE affiché = 99 obligatoire.
- Aucun attribut au-dessus du cap de morphologie.
- Dépendances exactes APK respectées.
- Réallocation volontairement limitée pour ne pas dénaturer une architecture validée.
- Les attributs explicitement sacrifiés sont les premiers candidats à une baisse.
- Les priorités explicites disposent des plafonds de progression les plus élevés.
- La Meta n'est jamais modifiée par le moteur personnel.
- Si aucune réallocation plus cohérente n'est trouvée, l'architecture de départ est conservée.

## Limite volontaire de la V19

La V19 optimise les attributs à l'intérieur des morphologies déjà validées. Elle ne parcourt pas encore toutes les tailles, tous les poids et toutes les envergures possibles du Builder. Cette recherche morphologique élargie est prévue comme étape suivante.
