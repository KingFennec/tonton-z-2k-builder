# Trouver mon build — V20

## Objectif

La V20 ajoute une vraie recherche morphologique au moteur personnalisé.

Le moteur ne reste plus enfermé dans la taille, le poids et l'envergure du seed REC d'origine. Pour chaque architecture validée du poste, il parcourt l'espace morphologique légal NBA 2K27, retient les morphologies les plus prometteuses, reconstruit un BASE 99 exact puis compare les versions obtenues.

La Meta reste indépendante et inchangée.

## Pipeline V20

1. Questionnaire joueur -> `buildPlaystyleProfile`.
2. Sélection des architectures REC validées du poste.
3. Pour chaque architecture :
   - parcours de toutes les tailles légales du poste ;
   - parcours de tous les poids entiers légaux pour chaque taille ;
   - parcours de toutes les envergures entières légales ;
   - calcul des caps exacts APK de chaque morphologie ;
   - score rapide de potentiel selon le profil, la conservation de l'architecture, les priorités et la préférence morphologique.
4. Les 5 meilleures morphologies diversifiées de chaque architecture passent dans l'optimiseur complet :
   - adaptation des 21 notes aux caps ;
   - résolution des dépendances exactes APK ;
   - réallocation du budget GNR ;
   - validation incrément par incrément avec la porte exacte du Builder ;
   - BASE affiché 99 et GNR détaillé <= 99 obligatoires.
5. Classement des architectures personnalisées finales.
6. Résultats : build idéal, variante réellement différente, puis Meta fixe si le build idéal n'est pas exactement la Meta inchangée.
7. Calcul +5/+10/+15 Cap Breakers et Synergies sur la morphologie finale.

## Garde-fous

- Plage de taille légale du poste.
- Bornes poids/envergure exactes de la taille.
- Aucun attribut au-dessus des caps exacts de morphologie.
- Dépendances APK exactes respectées.
- BASE 99 exact : GNR affiché 99 et valeur détaillée <= 99.
- La morphologie d'origine reste toujours dans le pool de validation.
- Si la recherche morphologique échoue pour une architecture, retour à l'optimiseur V19 sur la morphologie d'origine.
- La référence Meta n'est jamais réécrite.

## Recherche en deux étages

Le screening morphologique est exhaustif sur les valeurs entières légales de taille, poids et envergure. Pour éviter de lancer l'optimiseur GNR complet sur des milliers de combinaisons dans le navigateur, seules les meilleures morphologies issues de ce screening passent ensuite dans la reconstruction BASE 99 complète.

Cette séparation garde une recherche très large tout en maintenant un temps de réponse utilisable dans l'interface.

## Tests V20

`npm run verify:finder` vérifie notamment :

- 6 profils de jeu ;
- 3 résultats par profil ;
- architecture idéale attendue ;
- exécution effective de la recherche morphologique ;
- morphologie dans les bornes APK ;
- caps exacts ;
- dépendances exactes ;
- BASE 99 exact ;
- +5/+10/+15 Cap Breakers ;
- Synergies ;
- payload de chargement dans le Builder ;
- Meta fixe quand nécessaire.
