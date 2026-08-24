function fixture({
  id,
  label,
  mode = 'verified',
  requested,
  gnr,
  expected,
}) {
  return {
    id,
    label,
    mode,
    requested,
    gnr,
    expected,
  }
}

export const ATTRIBUTE_DEPENDENCY_FIXTURES = [
  fixture({
    id:
      'three-point-87',

    label:
      'Tir à 3 pts 87',

    requested: {
      threePointShot: 87,
    },

    gnr: 43,

    expected: {
      threePointShot: 87,
      midRangeShot: 77,
      freeThrow: 62,
    },
  }),

  fixture({
    id:
      'driving-dunk-96',

    label:
      'Dunk en pénétration 96',

    requested: {
      drivingDunk: 96,
    },

    gnr: 67,

    expected: {
      drivingDunk: 96,
      closeShot: 76,
      drivingLayup: 76,
      standingDunk: 46,
      postControl: 31,
      midRangeShot: 36,
    },
  }),

  fixture({
    id:
      'speed-90',

    label:
      'Vitesse 90',

    mode:
      'research',

    requested: {
      speed: 90,
    },

    gnr: 57,

    expected: {
      speed: 90,
      speedWithBall: 65,
      ballHandle: 60,
      passAccuracy: 35,
      drivingLayup: 45,
      closeShot: 35,
      drivingDunk: 30,
      perimeterDefense: 60,
      steal: 30,
      defensiveRebound: 35,
      agility: 75,
      vertical: 60,
    },
  }),

  fixture({
    id:
      'ball-handle-91',

    label:
      'Contrôle de ballon 91',

    requested: {
      ballHandle: 91,
    },

    gnr: 61,

    expected: {
      ballHandle: 91,
      passAccuracy: 66,
      speedWithBall: 71,
      drivingLayup: 76,
      postControl: 51,
      closeShot: 66,
      midRangeShot: 26,
      freeThrow: 26,
      perimeterDefense: 37,
      speed: 67,
      agility: 56,
      strength: 36,
      vertical: 37,
    },
  }),

  fixture({
    id:
      'perimeter-defense-95',

    label:
      'Défense extérieure 95',

    mode:
      'research',

    requested: {
      perimeterDefense: 95,
    },

    gnr: 62,

    expected: {
      perimeterDefense: 95,
      interiorDefense: 50,
      steal: 65,
      block: 50,
      defensiveRebound: 55,
      offensiveRebound: 30,
      agility: 73,
      strength: 60,
      speed: 63,
      speedWithBall: 38,
      ballHandle: 33,
      vertical: 33,
    },
  }),

  fixture({
    id:
      'strength-89',

    label:
      'Force 89',

    mode:
      'research',

    requested: {
      strength: 89,
    },

    gnr: 41,

    expected: {
      strength: 89,
      closeShot: 47,
      postControl: 54,
      interiorDefense: 64,
      perimeterDefense: 34,
      block: 34,
      defensiveRebound: 44,
      ballHandle: 34,
    },
  }),

  fixture({
    id:
      'pass-accuracy-99',

    label:
      'Précision des passes 99',

    mode:
      'research',

    requested: {
      passAccuracy: 99,
    },

    gnr: 70,

    expected: {
      passAccuracy: 99,
      ballHandle: 89,
      speedWithBall: 69,
      drivingLayup: 74,
      postControl: 49,
      closeShot: 64,
      perimeterDefense: 35,
      speed: 65,
      agility: 54,
      strength: 34,
      vertical: 35,
    },
  }),

  fixture({
    id:
      'ball-handle-89',

    label:
      'Contrôle de ballon 89',

    requested: {
      ballHandle: 89,
    },

    gnr: 58,

    expected: {
      ballHandle: 89,
      passAccuracy: 64,
      speedWithBall: 69,
      drivingLayup: 74,
      postControl: 49,
      closeShot: 64,
      perimeterDefense: 35,
      speed: 65,
      agility: 54,
      strength: 34,
      vertical: 35,
    },
  }),

  fixture({
    id:
      'ball-handle-70',

    label:
      'Contrôle de ballon 70',

    requested: {
      ballHandle: 70,
    },

    gnr: 41,

    expected: {
      ballHandle: 70,
      passAccuracy: 45,
      speedWithBall: 50,
      drivingLayup: 55,
      postControl: 30,
      closeShot: 45,
      speed: 46,
      agility: 35,
    },
  }),

  fixture({
    id:
      'speed-with-ball-50',

    label:
      'Vitesse avec le ballon 50',

    requested: {
      speedWithBall: 50,
    },

    gnr: 33,

    expected: {
      speedWithBall: 50,
      ballHandle: 45,
      speed: 46,
      agility: 35,
      drivingLayup: 30,
    },
  }),

  fixture({
    id:
      'driving-layup-55',

    label:
      'Double-pas 55',

    requested: {
      drivingLayup: 55,
    },

    gnr: 29,

    expected: {
      drivingLayup: 55,
      closeShot: 45,
      ballHandle: 30,
    },
  }),

  fixture({
    id:
      'agility-35',

    label:
      'Agilité 35',

    requested: {
      agility: 35,
    },

    gnr: 26,

    expected: {
      agility: 35,
      speed: 25,
      strength: 25,
      defensiveRebound: 25,
      steal: 25,
    },
  }),

  fixture({
    id:
      'driving-layup-75',

    label:
      'Double-pas 75',

    requested: {
      drivingLayup: 75,
    },

    gnr: 35,

    expected: {
      drivingLayup: 75,
      closeShot: 65,
      ballHandle: 50,
      speedWithBall: 30,
      speed: 26,
      strength: 35,
    },
  }),

  fixture({
    id:
      'speed-with-ball-69',

    label:
      'Vitesse avec le ballon 69',

    requested: {
      speedWithBall: 69,
    },

    gnr: 47,

    expected: {
      speedWithBall: 69,
      ballHandle: 64,
      passAccuracy: 39,
      drivingLayup: 49,
      closeShot: 39,
      speed: 65,
      agility: 54,
      perimeterDefense: 35,
      vertical: 35,
    },
  }),

  fixture({
    id:
      'driving-layup-85',

    label:
      'Double-pas 85',

    requested: {
      drivingLayup: 85,
    },

    gnr: 44,

    expected: {
      drivingLayup: 85,
      closeShot: 75,
      ballHandle: 60,
      passAccuracy: 35,
      speedWithBall: 40,
      speed: 36,
      strength: 45,
      vertical: 30,
      midRangeShot: 35,
      freeThrow: 35,
    },
  }),

  fixture({
    id:
      'speed-65',

    label:
      'Vitesse 65',

    requested: {
      speed: 65,
    },

    gnr: 36,

    expected: {
      speed: 65,
      speedWithBall: 40,
      ballHandle: 35,
      agility: 50,
      perimeterDefense: 35,
      vertical: 35,
    },
  }),

  fixture({
    id:
      'close-shot-75',

    label:
      'Tirs de près 75',

    requested: {
      closeShot: 75,
    },

    gnr: 31,

    expected: {
      closeShot: 75,
      drivingLayup: 50,
      midRangeShot: 35,
      freeThrow: 35,
      vertical: 30,
    },
  }),

  fixture({
    id:
      'close-shot-95',

    label:
      'Tirs de près 95',

    mode:
      'research',

    requested: {
      closeShot: 95,
    },

    gnr: 46,

    expected: {
      closeShot: 95,
      drivingLayup: 70,
      postControl: 45,
      midRangeShot: 55,
      threePointShot: 35,
      freeThrow: 55,
      offensiveRebound: 35,
      ballHandle: 45,
      strength: 30,
      vertical: 50,
    },
  }),

  fixture({
    id:
      'mid-range-55',

    label:
      'Tirs à mi-distance 55',

    requested: {
      midRangeShot: 55,
    },

    gnr: 29,

    expected: {
      midRangeShot: 55,
      closeShot: 40,
      threePointShot: 30,
      freeThrow: 30,
    },
  }),

  fixture({
    id:
      'mid-range-75',

    label:
      'Tirs à mi-distance 75',

    requested: {
      midRangeShot: 75,
    },

    gnr: 36,

    expected: {
      midRangeShot: 75,
      closeShot: 60,
      drivingLayup: 35,
      threePointShot: 50,
      freeThrow: 50,
    },
  }),

  fixture({
    id:
      'three-point-75',

    label:
      'Tir à 3 pts 75',

    requested: {
      threePointShot: 75,
    },

    gnr: 36,

    expected: {
      threePointShot: 75,
      midRangeShot: 65,
      closeShot: 50,
      freeThrow: 50,
    },
  }),

  fixture({
    id:
      'three-point-70',

    label:
      'Tir à 3 pts 70',

    requested: {
      threePointShot: 70,
    },

    gnr: 35,

    expected: {
      threePointShot: 70,
      midRangeShot: 60,
      closeShot: 45,
      freeThrow: 45,
    },
  }),

  fixture({
    id:
      'free-throw-70',

    label:
      'Lancer-franc 70',

    requested: {
      freeThrow: 70,
    },

    gnr: 30,

    expected: {
      freeThrow: 70,
      midRangeShot: 45,
      threePointShot: 50,
      closeShot: 30,
    },
  }),

  fixture({
    id:
      'free-throw-90',

    label:
      'Lancer-franc 90',

    requested: {
      freeThrow: 90,
    },

    gnr: 36,

    expected: {
      freeThrow: 90,
      midRangeShot: 65,
      threePointShot: 70,
      closeShot: 50,
    },
  }),

  fixture({
    id:
      'driving-dunk-70',

    label:
      'Dunk en pénétration 70',

    requested: {
      drivingDunk: 70,
    },

    gnr: 38,

    expected: {
      drivingDunk: 70,
      closeShot: 50,
      drivingLayup: 50,
      ballHandle: 45,
      standingDunk: 25,
      vertical: 50,
      strength: 25,
    },
  }),

  fixture({
    id:
      'driving-dunk-85',

    label:
      'Dunk en pénétration 85',

    mode:
      'research',

    requested: {
      drivingDunk: 85,
    },

    gnr: 50,

    expected: {
      drivingDunk: 85,
      closeShot: 65,
      drivingLayup: 65,
      standingDunk: 35,
      ballHandle: 60,
      passAccuracy: 35,
      speedWithBall: 40,
      speed: 36,
      agility: 25,
      strength: 40,
      vertical: 65,
      defensiveRebound: 28,
    },
  }),

  fixture({
    id:
      'vertical-65',

    label:
      'Détente 65',

    requested: {
      vertical: 65,
    },

    gnr: 30,

    expected: {
      vertical: 65,
      defensiveRebound: 28,
      closeShot: 40,
      drivingDunk: 35,
    },
  }),

  fixture({
    id:
      'vertical-85',

    label:
      'Détente 85',

    mode:
      'research',

    requested: {
      vertical: 85,
    },

    gnr: 40,

    expected: {
      vertical: 85,
      offensiveRebound: 30,
      defensiveRebound: 48,
      block: 40,
      closeShot: 60,
      drivingDunk: 55,
      standingDunk: 40,
      ballHandle: 30,
      drivingLayup: 35,
    },
  }),
]