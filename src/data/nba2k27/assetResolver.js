const ASSET_ROOT = '/assets/nba2k27'

const takeoverSpecialAliases = {
  'default-shooting': 'shooting',
  'shot-artist': 'shot_artist',
  calibrated: 'calibrated',
  'zip-code': 'zip_code',

  'default-finishing': 'finishing',
  navigator: 'navigator',
  airspace: 'airspace',
  'inside-touch': 'inside_touch',
  detonator: 'detonator',
  'paint-surgeon': 'paintsurgeon',

  'default-playmaking': 'playmaking',
  blur: 'blur',
  cook: 'cook',
  // L'asset conserve l'ancien nom interne de cette capacité de passe.
  dishmaster: 'freepassinglanes',

  'default-defense': 'defense',
  glue: 'glue',
  hawk: 'hawk',

  'default-rebounding': 'rebounding',
  demolition: 'demolition',
  muscle: 'muscle',
  'second-chance': 'second_chance',
  'see-the-future': 'seethefuture',

  'hydration-hero': 'hydrationhero',
}

const disciplineAliases = {
  shooting: 'shooting',
  finishing: 'finishing',
  playmaking: 'playmaking',
  defense: 'lockdowndefender',
  rebounding: 'glasscleaner',
}

export function getBadgeIcon(badge) {
  const nativeIconName = badge?.native_icon_name

  if (!nativeIconName) {
    return null
  }

  return `${ASSET_ROOT}/badges/${nativeIconName}.png`
}

export function getBadgeLevelIcon(tier) {
  const tierFileNames = {
    bronze: 'icon_badge_bronze.png',
    silver: 'icon_badge_silver.png',
    gold: 'icon_badge_gold.png',
    hof: 'icon_badge_hof.png',
    legend: 'icon_badge_legend.png',
    equipped: 'icon_badge_equipped.png',
  }

  const fileName = tierFileNames[tier]

  return fileName
    ? `${ASSET_ROOT}/badge-levels/${fileName}`
    : null
}

export function getTakeoverDisciplineIcon(
  disciplineId,
  variant = 'normal'
) {
  if (disciplineId === 'universal') {
    return getTakeoverSpecialIcon(
      'hydration-hero',
      variant === 'grey' ? 'grey' : 'color'
    )
  }

  const token = disciplineAliases[disciplineId]

  if (!token) {
    return null
  }

  const suffix = variant === 'grey' ? '_grey' : ''

  return `${ASSET_ROOT}/takeovers/disciplines/icon_takeover_${token}${suffix}.png`
}

export function getTakeoverSpecialIcon(
  takeoverId,
  variant = 'color'
) {
  // Rim Guardian n'a pas de Texture2D spéciale portant son nom dans le bundle
  // 1.1.3. Le bundle contient toutefois l'icône officielle Rim Protector, utilisée
  // ici plutôt qu'une image inventée ou un mauvais alias.
  if (takeoverId === 'rim-guardian') {
    const suffix = variant === 'grey' ? '_grey' : ''

    return `${ASSET_ROOT}/takeovers/disciplines/icon_takeover_rimprotector${suffix}.png`
  }

  const token = takeoverSpecialAliases[takeoverId]

  if (!token) {
    return null
  }

  const suffix =
    variant === 'grey'
      ? '_grey'
      : variant === 'normal'
        ? ''
        : '_color'

  return `${ASSET_ROOT}/takeovers/special/icon_takeover_special_${token}${suffix}.png`
}

export function getTakeoverIcon(
  takeover,
  variant = 'color'
) {
  if (!takeover) {
    return null
  }

  return (
    getTakeoverSpecialIcon(
      takeover.id,
      variant
    ) ??
    getTakeoverDisciplineIcon(
      takeover.discipline,
      variant === 'grey'
        ? 'grey'
        : 'normal'
    )
  )
}

export function getAttributeCategoryIcon(
  categoryId,
  variant = 'normal'
) {
  const suffix = variant === 'grey' ? '-grey' : ''

  return `${ASSET_ROOT}/attributes/${categoryId}${suffix}.png`
}

export function getAttributeCategoryHeader(categoryId) {
  return `${ASSET_ROOT}/attribute-headers/${categoryId}.png`
}

export function getBodyTypeImage(bodyTypeId) {
  return `${ASSET_ROOT}/body-types/${bodyTypeId}.png`
}

export function getBrandingAsset(fileName) {
  return `${ASSET_ROOT}/branding/${fileName}`
}


const builderUiFiles = {
  'cap-breakers': {
    finishing: 't_cap_breaker_finishing.png',
    shooting: 't_cap_breaker_shooting.png',
    playmaking: 't_cap_breaker_playmaking.png',
    defense: 't_cap_breaker_defense.png',
    rebounding: 't_cap_breaker_rebounding.png',
    physicals: 't_cap_breaker_physicals.png',
    attributeBoxBg: 't_cap_breaker_attribute_box_bg.png',
    attributeBoxBorder: 't_cap_breaker_attribute_box_border.png',
    totalBoxBorder: 't_cap_breaker_total_box_border.png',
    rowDots: 't_cap_breaker_bg_row_dots.png',
  },
  controls: {
    sliderHandle: 't_myPlayer_slider_handle.png',
    ovrHandle: 't_ovr_meter_handle.png',
    lockedPattern: 't_locked_slider_pattern.png',
    minus: 'attribute-minus.png',
    plus: 'attribute-plus.png',
    buttonOutline: 'attribute-button-outline.png',
    buttonFilled: 'attribute-button-filled.png',
  },
  panels: {
    modeProTuned: 't_player_builder_modeselect_protuned.png',
    modeCommunity: 't_player_builder_modeselect_community.png',
    modeMyPlayer: 't_player_builder_modeselect_mp.png',
    modeTemplate: 't_player_builder_modeselect_template.png',
    panelDetail: 't_player_builder_panel_button_detail.png',
    panelFrame: 't_player_builder_panel_button_frame.png',
    sideNavHighlight: 't_next_menu_side_nav_highlight.png',
    popupBg: 't_playerbuilder_popup_bg.png',
    popupTab: 't_playerbuilder_popup_tab.png',
    scanCode: 't_panel_playerbuilder_scancode.png',
    proTunedIcon: 't_icon_playerbuilder_protuned.png',
    communityIcon: 'icon_community_builds.png',
    tile: 'bg_player_builder_tile_a.png',
    stackedLogo: 'logo_myplayer_builder_stacked_alt.png',
    floatingBanner: 'ph_image_player_builder_floating_banner.png',
  },
  decoration: {
    wave: 't_deco_wave.png',
    scale: 't_deco_scale.png',
  },
}

export function getBuilderUiAsset(group, name) {
  const fileName = builderUiFiles[group]?.[name]

  return fileName
    ? `${ASSET_ROOT}/builder-ui/${group}/${fileName}`
    : null
}
