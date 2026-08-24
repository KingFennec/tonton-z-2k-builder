export const ATTRIBUTE_IDS = [
  'closeShot',
  'drivingLayup',
  'drivingDunk',
  'standingDunk',
  'postControl',

  'midRangeShot',
  'threePointShot',
  'freeThrow',

  'passAccuracy',
  'ballHandle',
  'speedWithBall',

  'interiorDefense',
  'perimeterDefense',
  'steal',
  'block',

  'offensiveRebound',
  'defensiveRebound',

  'speed',
  'agility',
  'strength',
  'vertical',
]

export const ATTRIBUTE_DEPENDENCY_META = {
  game: 'NBA 2K27',

  source:
    'NBA 2K HQ Builder',

  version:
    'reference-mj-6-7-215-6-10-v1',

  referenceMorphology: {
    position: 'PG',
    height: 79,
    weight: 215,
    wingspan: 82,
  },

  minimumAttributeValue: 25,

  note:
    'Le statut verified signifie que la relation a été reproduite sur plusieurs relevés NBA 2K27 pour la morphologie de référence. Cela ne prouve pas encore que la formule est identique pour toutes les morphologies.',
}

function verified(
  id,
  source,
  target,
  offset,
  evidence = []
) {
  return {
    id,
    source,
    target,

    type:
      'linear-offset',

    multiplier: 1,
    offset,

    floor: 25,

    status:
      'verified',

    evidence,
  }
}

function provisional(
  id,
  source,
  target,
  offset,
  evidence = []
) {
  return {
    id,
    source,
    target,

    type:
      'linear-offset',

    multiplier: 1,
    offset,

    floor: 25,

    status:
      'provisional',

    evidence,
  }
}

export const ATTRIBUTE_DEPENDENCY_RULES = [
  /*
   * =====================================================
   * CONTRÔLE DE BALLON
   * =====================================================
   */

  verified(
    'ballHandle-passAccuracy',
    'ballHandle',
    'passAccuracy',
    -25,
    [
      'BH70 → Pass45',
      'BH89 → Pass64',
      'BH91 → Pass66',
    ]
  ),

  verified(
    'ballHandle-speedWithBall',
    'ballHandle',
    'speedWithBall',
    -20,
    [
      'BH70 → SWB50',
      'BH89 → SWB69',
      'BH91 → SWB71',
    ]
  ),

  verified(
    'ballHandle-drivingLayup',
    'ballHandle',
    'drivingLayup',
    -15,
    [
      'BH70 → Layup55',
      'BH89 → Layup74',
      'BH91 → Layup76',
    ]
  ),

  verified(
    'ballHandle-postControl',
    'ballHandle',
    'postControl',
    -40,
    [
      'BH70 → Post30',
      'BH89 → Post49',
      'BH91 → Post51',
    ]
  ),

  /*
   * =====================================================
   * VITESSE AVEC LE BALLON
   * =====================================================
   */

  verified(
    'speedWithBall-ballHandle',
    'speedWithBall',
    'ballHandle',
    -5,
    [
      'SWB50 → BH45',
      'SWB69 → BH64',
    ]
  ),

  verified(
    'speedWithBall-speed',
    'speedWithBall',
    'speed',
    -4,
    [
      'SWB50 → Speed46',
      'SWB69 → Speed65',
      'SWB71 → Speed67',
    ]
  ),

  verified(
    'speedWithBall-agility',
    'speedWithBall',
    'agility',
    -15,
    [
      'SWB50 → Agility35',
      'SWB69 → Agility54',
      'SWB71 → Agility56',
    ]
  ),

  /*
   * =====================================================
   * DOUBLE-PAS
   * =====================================================
   */

  verified(
    'drivingLayup-closeShot',
    'drivingLayup',
    'closeShot',
    -10,
    [
      'Layup55 → Close45',
      'Layup75 → Close65',
      'Layup85 → Close75',
    ]
  ),

  verified(
    'drivingLayup-ballHandle',
    'drivingLayup',
    'ballHandle',
    -25,
    [
      'Layup55 → BH30',
      'Layup75 → BH50',
      'Layup85 → BH60',
    ]
  ),

  verified(
    'drivingLayup-strength',
    'drivingLayup',
    'strength',
    -40,
    [
      'Layup75 → Strength35',
      'Layup85 → Strength45',
    ]
  ),

  /*
   * =====================================================
   * TIRS DE PRÈS
   * =====================================================
   */

  verified(
    'closeShot-drivingLayup',
    'closeShot',
    'drivingLayup',
    -25,
    [
      'Close75 → Layup50',
      'Close95 → Layup70',
    ]
  ),

  verified(
    'closeShot-postControl',
    'closeShot',
    'postControl',
    -50,
    [
      'Close75 → Post25',
      'Close95 → Post45',
    ]
  ),

  verified(
    'closeShot-midRangeShot',
    'closeShot',
    'midRangeShot',
    -40,
    [
      'Close75 → Mid35',
      'Close95 → Mid55',
    ]
  ),

  verified(
    'closeShot-freeThrow',
    'closeShot',
    'freeThrow',
    -40,
    [
      'Close75 → FT35',
      'Close95 → FT55',
    ]
  ),

  verified(
    'closeShot-vertical',
    'closeShot',
    'vertical',
    -45,
    [
      'Close75 → Vertical30',
      'Close95 → Vertical50',
    ]
  ),

  /*
   * Ces deux relations expliquent les valeurs observées
   * avec Close95 mais nous n'avons pas encore deux points
   * indépendants au-dessus du plancher.
   */

  provisional(
    'closeShot-threePointShot',
    'closeShot',
    'threePointShot',
    -60,
    [
      'Close95 → 3PT35',
    ]
  ),

  provisional(
    'closeShot-offensiveRebound',
    'closeShot',
    'offensiveRebound',
    -60,
    [
      'Close95 → OREB35',
    ]
  ),

  /*
   * =====================================================
   * TIRS À MI-DISTANCE
   * =====================================================
   */

  verified(
    'midRangeShot-closeShot',
    'midRangeShot',
    'closeShot',
    -15,
    [
      'Mid55 → Close40',
      'Mid75 → Close60',
    ]
  ),

  verified(
    'midRangeShot-threePointShot',
    'midRangeShot',
    'threePointShot',
    -25,
    [
      'Mid55 → 3PT30',
      'Mid75 → 3PT50',
    ]
  ),

  verified(
    'midRangeShot-freeThrow',
    'midRangeShot',
    'freeThrow',
    -25,
    [
      'Mid55 → FT30',
      'Mid75 → FT50',
    ]
  ),

  /*
   * =====================================================
   * TIR À 3 POINTS
   * =====================================================
   */

  verified(
    'threePointShot-midRangeShot',
    'threePointShot',
    'midRangeShot',
    -10,
    [
      '3PT70 → Mid60',
      '3PT75 → Mid65',
      '3PT87 → Mid77',
    ]
  ),

  verified(
    'threePointShot-freeThrow',
    'threePointShot',
    'freeThrow',
    -25,
    [
      '3PT70 → FT45',
      '3PT75 → FT50',
      '3PT87 → FT62',
    ]
  ),

  /*
   * =====================================================
   * LANCER-FRANC
   * =====================================================
   */

  verified(
    'freeThrow-midRangeShot',
    'freeThrow',
    'midRangeShot',
    -25,
    [
      'FT70 → Mid45',
      'FT90 → Mid65',
    ]
  ),

  verified(
    'freeThrow-threePointShot',
    'freeThrow',
    'threePointShot',
    -20,
    [
      'FT70 → 3PT50',
      'FT90 → 3PT70',
    ]
  ),

  /*
   * =====================================================
   * VITESSE
   * =====================================================
   */

  verified(
    'speed-speedWithBall',
    'speed',
    'speedWithBall',
    -25,
    [
      'Speed65 → SWB40',
      'Speed90 → SWB65',
    ]
  ),

  verified(
    'speed-agility',
    'speed',
    'agility',
    -15,
    [
      'Speed65 → Agility50',
      'Speed90 → Agility75',
    ]
  ),

  verified(
    'speed-perimeterDefense',
    'speed',
    'perimeterDefense',
    -30,
    [
      'Speed65 → Perimeter35',
      'Speed90 → Perimeter60',
    ]
  ),

  verified(
    'speed-vertical',
    'speed',
    'vertical',
    -30,
    [
      'Speed65 → Vertical35',
      'Speed90 → Vertical60',
    ]
  ),

  provisional(
    'speed-defensiveRebound',
    'speed',
    'defensiveRebound',
    -55,
    [
      'Speed90 → DREB35',
    ]
  ),

  /*
   * =====================================================
   * DUNK EN PÉNÉTRATION
   * =====================================================
   */

  verified(
    'drivingDunk-closeShot',
    'drivingDunk',
    'closeShot',
    -20,
    [
      'DD70 → Close50',
      'DD85 → Close65',
      'DD96 → Close76',
    ]
  ),

  verified(
    'drivingDunk-drivingLayup',
    'drivingDunk',
    'drivingLayup',
    -20,
    [
      'DD70 → Layup50',
      'DD85 → Layup65',
      'DD96 → Layup76',
    ]
  ),

  verified(
    'drivingDunk-ballHandle',
    'drivingDunk',
    'ballHandle',
    -25,
    [
      'DD70 → BH45',
      'DD85 → BH60',
    ]
  ),

  verified(
    'drivingDunk-standingDunk',
    'drivingDunk',
    'standingDunk',
    -50,
    [
      'DD85 → Standing35',
      'DD96 → Standing46',
    ]
  ),

  verified(
    'drivingDunk-vertical',
    'drivingDunk',
    'vertical',
    -20,
    [
      'DD70 → Vertical50',
      'DD85 → Vertical65',
    ]
  ),

  provisional(
    'drivingDunk-strength',
    'drivingDunk',
    'strength',
    -45,
    [
      'DD85 → Strength40',
    ]
  ),

  /*
   * =====================================================
   * DÉTENTE
   * =====================================================
   */

  verified(
    'vertical-closeShot',
    'vertical',
    'closeShot',
    -25,
    [
      'Vertical65 → Close40',
      'Vertical85 → Close60',
    ]
  ),

  verified(
    'vertical-drivingDunk',
    'vertical',
    'drivingDunk',
    -30,
    [
      'Vertical65 → DD35',
      'Vertical85 → DD55',
    ]
  ),

  verified(
    'vertical-defensiveRebound',
    'vertical',
    'defensiveRebound',
    -37,
    [
      'Vertical65 → DREB28',
      'Vertical85 → DREB48',
    ]
  ),

  provisional(
    'vertical-standingDunk',
    'vertical',
    'standingDunk',
    -45,
    [
      'Vertical85 → Standing40',
    ]
  ),

  provisional(
    'vertical-block',
    'vertical',
    'block',
    -45,
    [
      'Vertical85 → Block40',
    ]
  ),

  provisional(
    'vertical-offensiveRebound',
    'vertical',
    'offensiveRebound',
    -55,
    [
      'Vertical85 → OREB30',
    ]
  ),

  /*
   * =====================================================
   * PRÉCISION DES PASSES
   * =====================================================
   */

  provisional(
    'passAccuracy-ballHandle',
    'passAccuracy',
    'ballHandle',
    -10,
    [
      'Pass99 → BH89',
    ]
  ),

  /*
   * =====================================================
   * AGILITÉ
   * =====================================================
   */

  provisional(
    'agility-speed',
    'agility',
    'speed',
    -10,
    [
      'Perimeter95 → Agility73 → Speed63',
      'Agility35 → Speed reste au plancher25',
    ]
  ),

  /*
   * =====================================================
   * REBOND DÉFENSIF
   * =====================================================
   */

  provisional(
    'defensiveRebound-offensiveRebound',
    'defensiveRebound',
    'offensiveRebound',
    -25,
    [
      'Perimeter95 → DREB55 → OREB30',
    ]
  ),

  /*
   * =====================================================
   * FORCE
   *
   * Un seul relevé isolé Force89.
   * Ces relations restent donc provisoires.
   * =====================================================
   */

  provisional(
    'strength-closeShot',
    'strength',
    'closeShot',
    -42,
    [
      'Strength89 → Close47',
    ]
  ),

  provisional(
    'strength-postControl',
    'strength',
    'postControl',
    -35,
    [
      'Strength89 → Post54',
    ]
  ),

  provisional(
    'strength-interiorDefense',
    'strength',
    'interiorDefense',
    -25,
    [
      'Strength89 → Interior64',
    ]
  ),

  provisional(
    'strength-perimeterDefense',
    'strength',
    'perimeterDefense',
    -55,
    [
      'Strength89 → Perimeter34',
    ]
  ),

  provisional(
    'strength-block',
    'strength',
    'block',
    -55,
    [
      'Strength89 → Block34',
    ]
  ),

  provisional(
    'strength-defensiveRebound',
    'strength',
    'defensiveRebound',
    -45,
    [
      'Strength89 → DREB44',
    ]
  ),

  provisional(
    'strength-ballHandle',
    'strength',
    'ballHandle',
    -55,
    [
      'Strength89 → BH34',
    ]
  ),

  /*
   * =====================================================
   * DÉFENSE EXTÉRIEURE
   *
   * Un seul relevé isolé Perimeter95.
   * =====================================================
   */

  provisional(
    'perimeterDefense-interiorDefense',
    'perimeterDefense',
    'interiorDefense',
    -45,
    [
      'Perimeter95 → Interior50',
    ]
  ),

  provisional(
    'perimeterDefense-steal',
    'perimeterDefense',
    'steal',
    -30,
    [
      'Perimeter95 → Steal65',
    ]
  ),

  provisional(
    'perimeterDefense-block',
    'perimeterDefense',
    'block',
    -45,
    [
      'Perimeter95 → Block50',
    ]
  ),

  provisional(
    'perimeterDefense-defensiveRebound',
    'perimeterDefense',
    'defensiveRebound',
    -40,
    [
      'Perimeter95 → DREB55',
    ]
  ),

  provisional(
    'perimeterDefense-agility',
    'perimeterDefense',
    'agility',
    -22,
    [
      'Perimeter95 → Agility73',
    ]
  ),

  provisional(
    'perimeterDefense-strength',
    'perimeterDefense',
    'strength',
    -35,
    [
      'Perimeter95 → Strength60',
    ]
  ),
]