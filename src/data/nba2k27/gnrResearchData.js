export const GNR_RESEARCH_META = {
  game: 'NBA 2K27',

  source:
    'NBA 2K HQ Builder',

  status:
    'experimental',

  referenceMorphology: {
    position:
      'PG',

    height:
      79,

    weight:
      215,

    wingspan:
      82,
  },

  baseOverall: 25,

  baseAttributeValue: 25,

  notes: [
    'Tous les attributs à 25 donnent un GNR de 25.',
    'Les séries isolées mesurent la variation du GNR lorsqu’un seul attribut final change.',
    'Le GNR affiché est entier et peut masquer un score interne décimal.',
    'Les deltas affichés ne doivent donc pas encore être considérés comme des coûts internes exacts.',
    'Le Lancer-franc semble ne pas avoir de coût GNR direct sur la plage testée.',
  ],
}

export const GNR_ISOLATED_CURVES = {
  passAccuracy: {
    attributeId:
      'passAccuracy',

    label:
      'Précision des passes',

    status:
      'measured',

    baseline: {
      value: 64,
      gnr: 58,
    },

    points: [
      {
        value: 64,
        gnr: 58,
      },
      {
        value: 70,
        gnr: 58,
      },
      {
        value: 75,
        gnr: 59,
      },
      {
        value: 80,
        gnr: 59,
      },
      {
        value: 85,
        gnr: 60,
      },
      {
        value: 90,
        gnr: 61,
      },
      {
        value: 95,
        gnr: 64,
      },
      {
        value: 99,
        gnr: 70,
      },
    ],
  },

  ballHandle: {
    attributeId:
      'ballHandle',

    label:
      'Contrôle de ballon',

    status:
      'measured',

    baseline: {
      value: 66,
      gnr: 55,
    },

    points: [
      {
        value: 66,
        gnr: 55,
      },
      {
        value: 70,
        gnr: 55,
      },
      {
        value: 75,
        gnr: 56,
      },
      {
        value: 80,
        gnr: 57,
      },
      {
        value: 85,
        gnr: 58,
      },
      {
        value: 89,
        gnr: 60,
      },
      {
        value: 91,
        gnr: 61,
      },
    ],
  },

  speed: {
    attributeId:
      'speed',

    label:
      'Vitesse',

    status:
      'measured',

    baseline: {
      value: 65,
      gnr: 52,
    },

    points: [
      {
        value: 65,
        gnr: 52,
      },
      {
        value: 70,
        gnr: 53,
      },
      {
        value: 75,
        gnr: 54,
      },
      {
        value: 80,
        gnr: 54,
      },
      {
        value: 85,
        gnr: 56,
      },
      {
        value: 90,
        gnr: 57,
      },
    ],
  },

  strength: {
    attributeId:
      'strength',

    label:
      'Force',

    status:
      'measured',

    baseline: {
      value: 44,
      gnr: 36,
    },

    points: [
      {
        value: 44,
        gnr: 36,
      },
      {
        value: 50,
        gnr: 36,
      },
      {
        value: 55,
        gnr: 37,
      },
      {
        value: 60,
        gnr: 37,
      },
      {
        value: 67,
        gnr: 38,
      },
      {
        value: 70,
        gnr: 38,
      },
      {
        value: 77,
        gnr: 39,
      },
      {
        value: 80,
        gnr: 39,
      },
      {
        value: 83,
        gnr: 40,
      },
      {
        value: 85,
        gnr: 40,
      },
      {
        value: 87,
        gnr: 41,
      },
      {
        value: 89,
        gnr: 41,
      },
    ],
  },

  perimeterDefense: {
    attributeId:
      'perimeterDefense',

    label:
      'Défense extérieure',

    status:
      'measured',

    baseline: {
      value: 40,
      gnr: 50,
    },

    points: [
      {
        value: 40,
        gnr: 50,
      },
      {
        value: 44,
        gnr: 51,
      },
      {
        value: 53,
        gnr: 52,
      },
      {
        value: 62,
        gnr: 53,
      },
      {
        value: 70,
        gnr: 53,
      },
      {
        value: 71,
        gnr: 54,
      },
      {
        value: 75,
        gnr: 54,
      },
      {
        value: 78,
        gnr: 55,
      },
      {
        value: 80,
        gnr: 55,
      },
      {
        value: 83,
        gnr: 56,
      },
      {
        value: 85,
        gnr: 56,
      },
      {
        value: 88,
        gnr: 57,
      },
      {
        value: 89,
        gnr: 58,
      },
      {
        value: 90,
        gnr: 58,
      },
      {
        value: 91,
        gnr: 59,
      },
      {
        value: 93,
        gnr: 60,
      },
      {
        value: 94,
        gnr: 60,
      },
      {
        value: 95,
        gnr: 62,
      },
    ],
  },

  closeShot: {
    attributeId:
      'closeShot',

    label:
      'Tirs de près',

    status:
      'measured',

    baseline: {
      value: 64,
      gnr: 43,
    },

    points: [
      {
        value: 64,
        gnr: 43,
      },
      {
        value: 65,
        gnr: 44,
      },
      {
        value: 70,
        gnr: 44,
      },
      {
        value: 74,
        gnr: 44,
      },
      {
        value: 75,
        gnr: 44,
      },
      {
        value: 79,
        gnr: 45,
      },
      {
        value: 80,
        gnr: 45,
      },
      {
        value: 84,
        gnr: 45,
      },
      {
        value: 85,
        gnr: 46,
      },
      {
        value: 89,
        gnr: 46,
      },
      {
        value: 90,
        gnr: 47,
      },
      {
        value: 93,
        gnr: 48,
      },
      {
        value: 94,
        gnr: 48,
      },
      {
        value: 95,
        gnr: 49,
      },
      {
        value: 96,
        gnr: 50,
      },
      {
        value: 97,
        gnr: 51,
      },
      {
        value: 98,
        gnr: 52,
      },
      {
        value: 99,
        gnr: 54,
      },
    ],
  },

  midRangeShot: {
    attributeId:
      'midRangeShot',

    label:
      'Tirs à mi-distance',

    status:
      'measured',

    baseline: {
      value: 77,
      gnr: 46,
    },

    points: [
      {
        value: 77,
        gnr: 46,
      },
      {
        value: 80,
        gnr: 47,
      },
      {
        value: 85,
        gnr: 48,
      },
      {
        value: 90,
        gnr: 50,
      },
      {
        value: 93,
        gnr: 51,
      },
    ],
  },

  threePointShot: {
    attributeId:
      'threePointShot',

    label:
      'Tir à 3 pts',

    status:
      'measured',

    baseline: {
      value: 68,
      gnr: 48,
    },

    points: [
      {
        value: 68,
        gnr: 48,
      },
      {
        value: 70,
        gnr: 48,
      },
      {
        value: 75,
        gnr: 48,
      },
      {
        value: 80,
        gnr: 49,
      },
      {
        value: 85,
        gnr: 50,
      },
      {
        value: 87,
        gnr: 51,
      },
    ],
  },

  freeThrow: {
    attributeId:
      'freeThrow',

    label:
      'Lancer-franc',

    status:
      'measured',

    baseline: {
      value: 62,
      gnr: 43,
    },

    points: [
      {
        value: 62,
        gnr: 43,
      },
      {
        value: 70,
        gnr: 43,
      },
      {
        value: 75,
        gnr: 43,
      },
      {
        value: 80,
        gnr: 43,
      },
      {
        value: 85,
        gnr: 43,
      },
      {
        value: 90,
        gnr: 43,
      },
      {
        value: 95,
        gnr: 43,
      },
      {
        value: 99,
        gnr: 43,
      },
    ],
  },
}

/*
 * Deux séries indépendantes de
 * Précision des passes permettent
 * de tester l'additivité du GNR.
 */
export const GNR_ADDITIVITY_FIXTURES = [
  {
    id:
      'pass-with-ball-handle-89',

    fixedAttributes: {
      ballHandle: 89,
    },

    points: [
      {
        passAccuracy: 64,
        gnr: 58,
      },
      {
        passAccuracy: 70,
        gnr: 58,
      },
      {
        passAccuracy: 75,
        gnr: 59,
      },
      {
        passAccuracy: 80,
        gnr: 59,
      },
      {
        passAccuracy: 85,
        gnr: 60,
      },
      {
        passAccuracy: 90,
        gnr: 61,
      },
      {
        passAccuracy: 95,
        gnr: 64,
      },
      {
        passAccuracy: 99,
        gnr: 70,
      },
    ],
  },

  {
    id:
      'pass-with-ball-handle-91',

    fixedAttributes: {
      ballHandle: 91,
    },

    points: [
      {
        passAccuracy: 66,
        gnr: 61,
      },
      {
        passAccuracy: 75,
        gnr: 61,
      },
      {
        passAccuracy: 80,
        gnr: 62,
      },
      {
        passAccuracy: 85,
        gnr: 62,
      },
      {
        passAccuracy: 87,
        gnr: 63,
      },
      {
        passAccuracy: 91,
        gnr: 64,
      },
      {
        passAccuracy: 94,
        gnr: 65,
      },
      {
        passAccuracy: 95,
        gnr: 66,
      },
      {
        passAccuracy: 96,
        gnr: 67,
      },
      {
        passAccuracy: 97,
        gnr: 68,
      },
      {
        passAccuracy: 98,
        gnr: 69,
      },
      {
        passAccuracy: 99,
        gnr: 72,
      },
    ],
  },
]