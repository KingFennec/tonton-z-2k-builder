Tonton-Z 2K Builder — V22 patch
==================================

Ce ZIP est un PATCH : il contient uniquement les fichiers complets modifiés/ajoutés.
Copiez son contenu à la racine de votre projet V21 actuel en autorisant le remplacement.

IMPORTANT
---------
Ce patch NE contient PAS :
- src/data/nba2k27/apk/animations.json
- src/data/nba2k27/apk/animation_optimizer_index.json

Vos données réelles des 2 914 animations restent donc intactes.

Principales évolutions V22
--------------------------
1. Performance de "Trouver mon build"
   - recherche morphologique allégée
   - cache partagé des caps / potentiels animations
   - calcul déplacé dans un Web Worker pour ne plus bloquer l'interface

2. Questionnaire plus précis
   - niveau de tir réellement recherché
   - type de finition
   - type d'adversaires / switchs à défendre
   - réponses existantes conservées

3. Plan Cap Breakers persistant
   - les recommandations +5 / +10 / +15 suivent le build dans le Builder
   - bouton pour appliquer directement un plan conseillé
   - sauvegarde locale et lien partagé conservent le plan

4. Résumé du joueur dans le Builder
   - archétype officiel calculé par le moteur APK existant
   - description synthétique
   - points forts
   - points faibles
   - indication du profil personnalisé lorsqu'il vient de "Trouver mon build"

Vérifications locales
---------------------
Depuis PowerShell, à la racine du projet :

npm.cmd run verify:finder
npm.cmd run verify:v22
npm.cmd run verify:animations
npm.cmd run dev

À vérifier dans l'interface :
- "Trouver mon build" ne fige plus la page pendant le calcul.
- Tester plusieurs profils et vérifier la cohérence des nouvelles questions.
- Charger un résultat dans le Builder.
- Vérifier que "Plan Trouver mon build" affiche encore +5 / +10 / +15.
- Tester "Appliquer le plan +10".
- Vérifier le panneau Archétype / Points forts / Points faibles.

Publication seulement après validation locale
----------------------------------------------
git status
git add .
git commit -m "V22 - accélération Finder, profil affiné et plan persistant"
git push origin main

npm.cmd run build
npx.cmd wrangler deploy
