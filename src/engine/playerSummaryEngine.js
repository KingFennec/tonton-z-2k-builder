const POSITION_LABELS = {
  PG: 'Meneur',
  SG: 'Arrière',
  SF: 'Ailier',
  PF: 'Ailier fort',
  C: 'Pivot',
}

const POSITION_EXPECTATIONS = {
  PG: {
    threePointShot: 78,
    passAccuracy: 80,
    ballHandle: 84,
    speedWithBall: 80,
    perimeterDefense: 74,
    speed: 80,
    agility: 78,
  },
  SG: {
    threePointShot: 78,
    passAccuracy: 68,
    ballHandle: 74,
    speedWithBall: 70,
    perimeterDefense: 80,
    steal: 72,
    speed: 80,
    agility: 78,
  },
  SF: {
    threePointShot: 76,
    passAccuracy: 68,
    perimeterDefense: 78,
    steal: 70,
    strength: 72,
    speed: 76,
    defensiveRebound: 58,
  },
  PF: {
    threePointShot: 74,
    passAccuracy: 65,
    interiorDefense: 75,
    perimeterDefense: 68,
    block: 74,
    defensiveRebound: 78,
    strength: 80,
  },
  C: {
    passAccuracy: 65,
    standingDunk: 72,
    interiorDefense: 80,
    block: 80,
    defensiveRebound: 84,
    strength: 84,
  },
}

const WEAKNESS_LABELS = {
  threePointShot: 'Le spacing extérieur reste limité.',
  passAccuracy: 'La création pour les partenaires est limitée.',
  ballHandle: 'La création balle en main est limitée.',
  speedWithBall: 'Le joueur perd de l’impact lorsqu’il doit créer en dribble.',
  perimeterDefense: 'La défense sur porteur extérieur est en retrait.',
  steal: 'Peu de marge pour jouer agressivement les lignes de passe.',
  interiorDefense: 'La présence défensive intérieure est limitée.',
  block: 'La protection du cercle est moyenne.',
  defensiveRebound: 'Le rebond défensif peut être une faiblesse.',
  strength: 'Le joueur peut souffrir dans les contacts physiques.',
  speed: 'La vitesse pure est en retrait pour son poste.',
  agility: 'Les changements de direction défensifs sont moins efficaces.',
  standingDunk: 'La finition sans élan près du cercle est limitée.',
}

function value(attributes, id) {
  return Number(attributes?.[id] ?? 25)
}

function addStrength(list, condition, score, title, text) {
  if (!condition) return
  list.push({ score, title, text })
}

function getStrengths(attributes, positionId) {
  const list = []
  const three = value(attributes, 'threePointShot')
  const mid = value(attributes, 'midRangeShot')
  const dunk = value(attributes, 'drivingDunk')
  const layup = value(attributes, 'drivingLayup')
  const standing = value(attributes, 'standingDunk')
  const pass = value(attributes, 'passAccuracy')
  const handle = value(attributes, 'ballHandle')
  const swb = value(attributes, 'speedWithBall')
  const perimeter = value(attributes, 'perimeterDefense')
  const interior = value(attributes, 'interiorDefense')
  const steal = value(attributes, 'steal')
  const block = value(attributes, 'block')
  const oreb = value(attributes, 'offensiveRebound')
  const dreb = value(attributes, 'defensiveRebound')
  const speed = value(attributes, 'speed')
  const agility = value(attributes, 'agility')
  const strength = value(attributes, 'strength')
  const vertical = value(attributes, 'vertical')

  addStrength(
    list,
    three >= 92,
    1.2 + (three - 92) / 20,
    'Tir extérieur élite',
    'Peut étirer très loin la défense et punir régulièrement derrière l’arc.'
  )
  addStrength(
    list,
    three >= 82 && three < 92,
    0.86 + (three - 82) / 24,
    'Spacing fiable',
    'Apporte une vraie menace extérieure lorsque la défense lui laisse de l’espace.'
  )
  addStrength(
    list,
    mid >= 86,
    0.72 + (mid - 86) / 28,
    'Création à mi-distance',
    'Dispose d’une solution efficace entre le cercle et la ligne à 3 points.'
  )
  addStrength(
    list,
    dunk >= 87 && vertical >= 70,
    1.02 + (dunk - 87) / 22,
    'Finition explosive',
    'Menace fortement le cercle en pénétration et sur les coupes.'
  )
  addStrength(
    list,
    layup >= 82,
    0.72 + (layup - 82) / 25,
    'Finition en finesse',
    'Peut convertir efficacement les situations où le dunk n’est pas disponible.'
  )
  addStrength(
    list,
    standing >= 85,
    0.9 + (standing - 85) / 22,
    'Finition intérieure',
    'Très dangereux près du cercle lorsqu’il reçoit le ballon sans élan.'
  )
  addStrength(
    list,
    pass >= 85,
    0.98 + (pass - 85) / 24,
    'Qualité de passe',
    'Peut accélérer la circulation du ballon et trouver rapidement les partenaires.'
  )
  addStrength(
    list,
    handle >= 86 && swb >= 80,
    1 + ((handle - 86) + (swb - 80)) / 45,
    'Création balle en main',
    'Peut initier l’attaque et créer un avantage directement en dribble.'
  )
  addStrength(
    list,
    perimeter >= 90,
    1.05 + (perimeter - 90) / 20,
    'Défense extérieure',
    'Peut contenir efficacement le porteur de balle et gêner les tirs extérieurs.'
  )
  addStrength(
    list,
    steal >= 90,
    1.02 + (steal - 90) / 20,
    'Interceptions',
    'Très dangereux sur les lignes de passe et les erreurs de manipulation.'
  )
  addStrength(
    list,
    interior >= 84,
    0.9 + (interior - 84) / 24,
    'Défense intérieure',
    'Résiste bien près du cercle et limite les finitions adverses.'
  )
  addStrength(
    list,
    block >= 88,
    1 + (block - 88) / 20,
    'Protection du cercle',
    'Peut réellement dissuader et sanctionner les attaques au cercle.'
  )
  addStrength(
    list,
    dreb >= 88,
    0.96 + (dreb - 88) / 20,
    'Rebond défensif',
    'Sécurise régulièrement la possession après un tir adverse.'
  )
  addStrength(
    list,
    oreb >= 82,
    0.8 + (oreb - 82) / 24,
    'Rebond offensif',
    'Crée des secondes chances et reste une menace après les tirs manqués.'
  )
  addStrength(
    list,
    strength >= 85,
    0.88 + (strength - 85) / 24,
    'Impact physique',
    'Résiste bien aux contacts et peut imposer son gabarit dans les duels.'
  )
  addStrength(
    list,
    speed >= 84 && agility >= 82,
    0.9 + ((speed - 84) + (agility - 82)) / 40,
    'Mobilité',
    'Se déplace rapidement des deux côtés du terrain et couvre beaucoup d’espace.'
  )

  if (positionId === 'C' || positionId === 'PF') {
    addStrength(
      list,
      strength >= 88 && dreb >= 88 && block >= 88,
      1.28,
      'Ancre défensive',
      'Combine présence physique, rebond et protection du cercle.'
    )
  }

  return list
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

function getWeaknesses(attributes, positionId) {
  const expectations = POSITION_EXPECTATIONS[positionId] ?? POSITION_EXPECTATIONS.SF
  const weaknesses = []

  for (const [attributeId, expected] of Object.entries(expectations)) {
    const current = value(attributes, attributeId)
    const deficit = expected - current

    if (deficit <= 0) {
      continue
    }

    weaknesses.push({
      attributeId,
      score: deficit / Math.max(10, expected - 25),
      text: WEAKNESS_LABELS[attributeId] ?? `${attributeId} est en retrait pour le poste.`,
    })
  }

  if (weaknesses.length < 2) {
    const fallbackByPosition = {
      PG: [
        ['strength', 75, 'Le joueur n’est pas construit pour dominer les contacts physiques.'],
        ['drivingDunk', 80, 'La pression au cercle reste secondaire face à ses qualités de création.'],
        ['defensiveRebound', 55, 'Le rebond défensif n’est pas une spécialité.'],
      ],
      SG: [
        ['passAccuracy', 80, 'La création pour les autres reste secondaire.'],
        ['defensiveRebound', 65, 'Le rebond n’est pas un point fort du profil.'],
        ['interiorDefense', 72, 'La défense intérieure reste moins fiable que la défense extérieure.'],
      ],
      SF: [
        ['passAccuracy', 80, 'La création pour les partenaires reste secondaire.'],
        ['ballHandle', 82, 'La création balle en main n’est pas au niveau d’un porteur principal.'],
        ['defensiveRebound', 78, 'Le rebond est correct sans être dominant.'],
        ['block', 80, 'La protection du cercle reste davantage une aide qu’une spécialité.'],
      ],
      PF: [
        ['ballHandle', 80, 'La création balle en main reste limitée face aux profils extérieurs.'],
        ['offensiveRebound', 75, 'La présence au rebond offensif reste moyenne.'],
        ['drivingDunk', 80, 'La finition en pénétration est utile sans être dominante.'],
        ['threePointShot', 84, 'Le tir extérieur apporte du spacing sans être une arme élite.'],
      ],
      C: [
        ['perimeterDefense', 70, 'La défense loin du cercle reste le compromis principal.'],
        ['threePointShot', 80, 'Le spacing extérieur reste secondaire.'],
        ['speed', 70, 'La mobilité en transition est moins forte que celle des intérieurs plus petits.'],
        ['passAccuracy', 80, 'La relance et la création ne sont pas au niveau d’un pivot passeur élite.'],
      ],
    }

    const secondaryChecks = fallbackByPosition[positionId] ?? [
      ['drivingDunk', 75, 'La menace en finition au cercle reste modérée.'],
      ['threePointShot', 80, 'Le tir extérieur demande de sélectionner ses tentatives.'],
      ['strength', 78, 'Le joueur n’est pas construit pour dominer les contacts.'],
    ]

    for (const [attributeId, threshold, text] of secondaryChecks) {
      const current = value(attributes, attributeId)
      if (current >= threshold || weaknesses.some((item) => item.attributeId === attributeId)) {
        continue
      }
      weaknesses.push({
        attributeId,
        score: Math.max(0.05, (threshold - current) / 50),
        text,
      })
    }
  }

  return weaknesses
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
}

export function getPlayerSummary(attributes, positionId) {
  const strengths = getStrengths(attributes, positionId)
  const weaknesses = getWeaknesses(attributes, positionId)
  const positionLabel = POSITION_LABELS[positionId] ?? 'Joueur'

  const strengthLabels = strengths.slice(0, 3).map((item) => item.title.toLowerCase())
  const description = strengthLabels.length > 0
    ? `${positionLabel} construit autour de ${strengthLabels.join(', ')}.`
    : `${positionLabel} équilibré sans spécialité dominante clairement identifiée.`

  return {
    positionLabel,
    description,
    strengths,
    weaknesses,
  }
}

export default getPlayerSummary
