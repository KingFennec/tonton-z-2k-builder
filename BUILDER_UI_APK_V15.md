# Builder UI APK V15

Cette version intègre un premier lot de textures UI natives extraites des `sharedassets` NBA 2K HQ 1.1.3.

## Intégré dans l'interface

- textures natives des six familles Cap Breakers ;
- fonds / bordures Cap Breaker ;
- texture de fond à points du tableau ;
- boutons + / - issus de `t_attribute_slider_buttons` ;
- poignée de slider `t_myPlayer_slider_handle` ;
- motif verrouillé `t_locked_slider_pattern` ;
- décor `t_deco_wave` sur les titres Cap Breakers / Takeovers.

## Assets conservés pour la suite

Le pack `public/assets/nba2k27/builder-ui/` contient également les panneaux / modes Player Builder extraits, sans les forcer dans l'interface tant que leur utilisation visuelle n'est pas utile.

Deux textures portant du texte ont été corrigées de 180 degrés :
- `logo_myplayer_builder_stacked_alt`
- `t_icon_playerbuilder_protuned`

## Vérification

`npm run verify:apk` et `npm run verify:assets` passent avec les nouvelles textures.
