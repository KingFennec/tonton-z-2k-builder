# Trouver mon build — V17

Cette version ajoute une page distincte du Builder principal pour proposer des builds adaptés au style de jeu du joueur, sans modifier la logique des builds Meta REC.

## Fonctionnement V1

Le questionnaire prend en compte :

- poste ;
- rôle offensif principal et secondaire ;
- rôle défensif principal ;
- jusqu'à 3 priorités absolues ;
- jusqu'à 3 sacrifices acceptés ;
- contexte de jeu ;
- préférence morphologique ;
- stratégie Cap Breakers.

Le moteur transforme ces réponses en poids d'attributs puis classe trois candidats du poste : build idéal, variante et référence Meta REC provisoire lorsque celle-ci n'est pas déjà sélectionnée.

## Résultat affiché

Chaque proposition affiche :

- morphologie ;
- 21 attributs BASE 99 ;
- affinité avec le profil ;
- plan +5 / +10 / +15 Cap Breakers ;
- Synergies recommandées ;
- comparaison avec le build Meta REC provisoire du poste ;
- bouton pour charger directement la proposition dans le Builder principal.

## Fichiers principaux

- `src/components/FindMyBuild.jsx`
- `src/engine/playstyleEngine.js`
- `src/data/nba2k27/playstyleCandidates.js`
- `src/App.jsx`
- `src/App.css`
- `scripts/verifyPlaystyleFinder.mjs`

## Vérification

```bash
npm run verify:finder
```

La V1 classe une bibliothèque contrôlée de candidats REC. Une future V2 pourra générer directement de nouvelles morphologies et allocations BASE 99 à partir du profil au lieu de rester limitée à cette bibliothèque.
