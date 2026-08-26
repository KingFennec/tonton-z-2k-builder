# Tonton-Z 2K Builder — V16

## Cap Breakers interactifs

- CB1 à CB5 sont cliquables par attribut.
- Les boosts sont successifs : sélectionner CB3 applique CB1 + CB2 + CB3.
- Cliquer à nouveau sur le dernier niveau sélectionné le retire.
- La cellule « Après » applique / retire tous les Cap Breakers disponibles de la ligne.
- Bouton « Réinitialiser » pour retirer toutes les simulations.
- Bloc récapitulatif : Avant / Après / Badges gagnés.
- Les sélections Cap Breakers sont sauvegardées dans le build local et les liens de partage.
- La simulation n'augmente pas le GNR du build : elle représente les boosts post-build natifs.

## Takeover Universel

- Suppression de la catégorie Universel séparée.
- Hydration Hero apparaît maintenant comme choix « Universel » dans chacune des cinq disciplines : Tir, Finition, Organisation, Défense, Rebonds.
- Il peut être équipé indépendamment dans chaque discipline.

## Branding

- Correction du logo NBA 2K27 d'en-tête : le fichier source étant déjà orienté correctement, la rotation CSS supplémentaire a été supprimée.

## Vérifications

- `npm run verify:apk` : OK
- `npm run verify:v16` : OK
- ESLint parse la V16 ; les erreurs restantes sont les anciennes règles `setState` dans `useEffect` déjà présentes avant cette version.
- Le build Vite Linux reste non testable dans cet environnement à cause du binding Rolldown Windows inclus dans `node_modules`.
