import attributesData from '../data/nba2k27/attributes.json' with { type: 'json' }
import badgesData from '../data/nba2k27/badges.json' with { type: 'json' }
import positionsData from '../data/nba2k27/positions.json' with { type: 'json' }
import {
  playstyleCandidates,
  provisionalMetaBuildByPosition,
} from '../data/nba2k27/playstyleCandidates.js'
import { getBadgeTranslation } from '../data/nba2k27/badgeTranslations.js'
import { getHighestUnlockedTier } from './badgeEngine.js'
import {
  calculateExactGnr,
  getAllCapBreakerProjections,
  getExactBodyBounds,
  getExactBodyCaps,
  getExactDependencyRules,
  testExactOverallIncrement,
} from './apkBuilderEngine.js'
import { solveAttributeDependencies } from './attributeDependencyEngine.js'
import {
  createAnimationOptimizationContext,
  getAnimationAnalysis,
  getAnimationBuildScore,
  getAnimationPotentialScore,
  getAnimationStepImpact,
  getAnimationTargetCeiling,
  getAnimationUnlocksBetween,
} from './animationOptimizerEngine.js'

const ATTRIBUTE_IDS = attributesData.attributes.map((attribute) => attribute.id)

const TIER_RANK = {
  bronze: 1,
  silver: 2,
  gold: 3,
  hof: 4,
}

const TIER_LABEL = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  hof: 'Hall of Fame',
}

const BASE_WEIGHTS = Object.fromEntries(
  ATTRIBUTE_IDS.map((attributeId) => [attributeId, 0.35])
)

const offenseWeights = {
  primary_creator: {
    passAccuracy: 1.35,
    ballHandle: 1.55,
    speedWithBall: 1.45,
    threePointShot: 1.15,
    midRangeShot: 0.8,
    speed: 0.8,
  },
  secondary_creator: {
    passAccuracy: 1.05,
    ballHandle: 1.2,
    speedWithBall: 1.05,
    threePointShot: 1.05,
    drivingLayup: 0.7,
  },
  spot_up: {
    threePointShot: 1.55,
    midRangeShot: 0.95,
    freeThrow: 0.45,
  },
  closeout: {
    drivingLayup: 1.15,
    drivingDunk: 1.25,
    speedWithBall: 0.85,
    speed: 0.7,
    threePointShot: 0.75,
  },
  cuts: {
    drivingDunk: 1.5,
    drivingLayup: 1.0,
    speed: 0.95,
    vertical: 0.85,
    standingDunk: 0.55,
  },
  post_play: {
    postControl: 1.5,
    closeShot: 1.15,
    standingDunk: 0.95,
    strength: 1.05,
    midRangeShot: 0.6,
  },
  pick_roll: {
    standingDunk: 1.25,
    drivingDunk: 1.15,
    strength: 1.05,
    vertical: 0.9,
    offensiveRebound: 0.9,
    passAccuracy: 0.55,
  },
  offensive_rebound: {
    offensiveRebound: 1.55,
    strength: 1.05,
    vertical: 0.95,
    standingDunk: 0.8,
  },
}

const defenseWeights = {
  on_ball_defense: {
    perimeterDefense: 1.6,
    agility: 1.4,
    strength: 1.0,
    speed: 0.95,
    steal: 0.75,
  },
  wing_defense: {
    perimeterDefense: 1.45,
    steal: 1.15,
    agility: 1.15,
    strength: 0.8,
    speed: 0.75,
  },
  interceptions: {
    steal: 1.75,
    perimeterDefense: 1.0,
    agility: 0.95,
    speed: 0.65,
  },
  screen_defense: {
    perimeterDefense: 1.45,
    strength: 1.25,
    agility: 1.15,
    speed: 0.7,
  },
  switch_defense: {
    perimeterDefense: 1.25,
    interiorDefense: 1.15,
    strength: 1.15,
    agility: 0.95,
    block: 0.75,
  },
  rim_protection: {
    block: 1.65,
    interiorDefense: 1.45,
    vertical: 1.0,
    strength: 0.95,
    defensiveRebound: 0.7,
  },
  interior_defense: {
    interiorDefense: 1.65,
    strength: 1.3,
    block: 1.15,
    defensiveRebound: 0.85,
  },
  rebounding: {
    defensiveRebound: 1.55,
    offensiveRebound: 1.05,
    strength: 1.15,
    vertical: 0.9,
  },
  physical_defense: {
    strength: 1.6,
    perimeterDefense: 1.05,
    interiorDefense: 1.05,
    agility: 0.7,
  },
}

const priorityWeights = {
  shooting: { threePointShot: 1.6, midRangeShot: 1.0, freeThrow: 0.45 },
  dunk: { drivingDunk: 1.65, standingDunk: 1.0, vertical: 0.7 },
  passing: { passAccuracy: 1.8 },
  dribbling: { ballHandle: 1.65, speedWithBall: 1.55 },
  perimeterDefense: { perimeterDefense: 1.8, agility: 0.75 },
  steal: { steal: 1.9 },
  block: { block: 1.9, interiorDefense: 0.6 },
  rebounding: { defensiveRebound: 1.6, offensiveRebound: 1.25 },
  strength: { strength: 1.9 },
  speed: { speed: 1.55, agility: 1.35 },
}

const teamContextWeights = {
  rec_solo: {
    passAccuracy: 0.55,
    threePointShot: 0.4,
    ballHandle: 0.35,
    perimeterDefense: 0.35,
  },
  friends: {
    passAccuracy: 0.35,
    threePointShot: 0.35,
    perimeterDefense: 0.35,
  },
  organized_rec: {
    perimeterDefense: 0.5,
    steal: 0.5,
    threePointShot: 0.35,
    passAccuracy: 0.25,
    defensiveRebound: 0.25,
  },
  pro_am: {
    perimeterDefense: 0.55,
    steal: 0.55,
    threePointShot: 0.35,
    block: 0.35,
    defensiveRebound: 0.35,
  },
}

const shootingProfileWeights = {
  flexible: {},
  secondary: {
    threePointShot: 0.22,
    midRangeShot: 0.08,
  },
  open_spacer: {
    threePointShot: 0.62,
    midRangeShot: 0.12,
  },
  reliable_spotup: {
    threePointShot: 0.95,
    midRangeShot: 0.22,
  },
  shot_creator: {
    threePointShot: 0.82,
    midRangeShot: 0.92,
    ballHandle: 0.42,
    speedWithBall: 0.32,
  },
  elite_range: {
    threePointShot: 1.35,
    midRangeShot: 0.32,
  },
}

const finishingProfileWeights = {
  flexible: {},
  simple: {
    drivingLayup: 0.35,
    drivingDunk: 0.38,
  },
  cuts: {
    drivingDunk: 0.82,
    drivingLayup: 0.36,
    vertical: 0.42,
    speed: 0.24,
  },
  contacts: {
    drivingDunk: 1.22,
    vertical: 0.78,
    strength: 0.28,
  },
  layups: {
    drivingLayup: 1.05,
    speedWithBall: 0.24,
    ballHandle: 0.18,
  },
  inside_big: {
    standingDunk: 1.15,
    closeShot: 0.68,
    strength: 0.5,
    offensiveRebound: 0.22,
  },
}

const matchupProfileWeights = {
  natural: {},
  guards: {
    perimeterDefense: 0.72,
    agility: 0.72,
    speed: 0.48,
    steal: 0.28,
  },
  wings: {
    perimeterDefense: 0.62,
    strength: 0.52,
    steal: 0.34,
    agility: 0.3,
  },
  forwards_bigs: {
    interiorDefense: 0.62,
    strength: 0.68,
    block: 0.48,
    defensiveRebound: 0.36,
  },
  switch_all: {
    perimeterDefense: 0.52,
    interiorDefense: 0.48,
    strength: 0.52,
    agility: 0.44,
    block: 0.28,
  },
}

const shootingProfileTargets = {
  secondary: {
    threePointShot: { min: 72, ideal: 78, ceiling: 82, budgetSensitive: true },
  },
  open_spacer: {
    threePointShot: { min: 78, ideal: 82, ceiling: 84, budgetSensitive: true },
  },
  reliable_spotup: {
    threePointShot: { min: 84, ideal: 87, ceiling: 90, budgetSensitive: true },
  },
  shot_creator: {
    threePointShot: { min: 84, ideal: 89, ceiling: 94 },
    midRangeShot: { min: 80, ideal: 87, ceiling: 94 },
  },
  elite_range: {
    threePointShot: { min: 92, ideal: 95, ceiling: 99 },
  },
}

const finishingProfileTargets = {
  simple: {
    drivingLayup: { min: 65, ideal: 75, ceiling: 82, budgetSensitive: true },
    drivingDunk: { min: 60, ideal: 73, ceiling: 80, budgetSensitive: true },
  },
  cuts: {
    drivingDunk: { min: 73, ideal: 80, ceiling: 87 },
    vertical: { min: 65, ideal: 75, ceiling: 82 },
  },
  contacts: {
    drivingDunk: { min: 87, ideal: 93, ceiling: 99 },
    vertical: { min: 75, ideal: 82, ceiling: 90 },
  },
  layups: {
    drivingLayup: { min: 80, ideal: 88, ceiling: 96 },
  },
  inside_big: {
    standingDunk: { min: 81, ideal: 90, ceiling: 99 },
    closeShot: { min: 70, ideal: 82, ceiling: 94 },
  },
}

function buildPreferenceTargets(answers = {}) {
  return {
    ...(shootingProfileTargets[answers.shootingProfile] ?? {}),
    ...(finishingProfileTargets[answers.finishingProfile] ?? {}),
  }
}


const STYLE_TAG_AFFINITY = {
  primary_creator: { primary_creator: 1, secondary_creator: 0.25, scoring: 0.3, shooting: 0.15, playmaking_big: 0.15 },
  secondary_creator: { secondary_creator: 1, primary_creator: 0.45, scoring: 0.35, balanced: 0.25, playmaking_big: 0.3 },
  spot_up: { spot_up: 1, shooting: 0.62, scoring: 0.18 },
  closeout: { closeout: 1, slashing: 0.95, scoring: 0.4, secondary_creator: 0.15 },
  cuts: { cuts: 1, slashing: 1, pick_roll: 0.35, offensive_rebound: 0.2 },
  post_play: { post_play: 1, physical: 0.35 },
  pick_roll: { pick_roll: 1, slashing: 0.4, physical: 0.3, playmaking_big: 0.2 },
  offensive_rebound: { offensive_rebound: 1, rebounding: 0.78, physical: 0.3 },
  on_ball_defense: { on_ball_defense: 1, wing_defense: 0.6, physical: 0.2 },
  wing_defense: { wing_defense: 1, on_ball_defense: 0.55, interceptions: 0.4, switch_defense: 0.35 },
  interceptions: { interceptions: 1, wing_defense: 0.45, on_ball_defense: 0.2 },
  screen_defense: { screen_defense: 1, on_ball_defense: 0.75, physical: 0.5, wing_defense: 0.25 },
  switch_defense: { switch_defense: 1, wing_defense: 0.45, rim_protection: 0.4, physical: 0.3 },
  rim_protection: { rim_protection: 1, rebounding: 0.25, physical: 0.25 },
  interior_defense: { interior_defense: 1, rim_protection: 0.72, physical: 0.5, rebounding: 0.2 },
  rebounding: { rebounding: 1, offensive_rebound: 0.5, rim_protection: 0.22, physical: 0.2 },
  physical_defense: { physical: 1, on_ball_defense: 0.4, switch_defense: 0.4, rim_protection: 0.25 },
}

const BADGE_TIER_SCORE = {
  bronze: 0.12,
  silver: 0.34,
  gold: 0.66,
  hof: 1,
}

const PERSONALIZER_VERSION = 'V22'

const BUILDER_MILESTONES = [
  60, 65, 70, 75, 80, 85, 87, 89, 90, 92, 93, 95, 97, 99,
]

const PRIORITY_CORE_ATTRIBUTES = {
  shooting: ['threePointShot', 'midRangeShot'],
  dunk: ['drivingDunk', 'vertical'],
  passing: ['passAccuracy'],
  dribbling: ['ballHandle', 'speedWithBall'],
  perimeterDefense: ['perimeterDefense', 'agility'],
  steal: ['steal'],
  block: ['block', 'interiorDefense'],
  rebounding: ['defensiveRebound', 'offensiveRebound'],
  strength: ['strength'],
  speed: ['speed', 'agility'],
}



const MORPHOLOGY_COARSE_WEIGHT_STEP = 5
const MORPHOLOGY_SCREEN_PER_SEED = 5
const MORPHOLOGY_LOCAL_WEIGHT_RADIUS = 4
const MORPHOLOGY_HEIGHT_DIVERSITY_LIMIT = 2

const positionById = new Map(
  positionsData.positions.map((position) => [position.id, position])
)

const DIVERSITY_ATTRIBUTE_IDS = [
  'drivingDunk',
  'threePointShot',
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


function addWeights(target, source, multiplier = 1) {
  if (!source) {
    return
  }

  for (const [attributeId, value] of Object.entries(source)) {
    target[attributeId] = (target[attributeId] ?? 0) + value * multiplier
  }
}

function getSacrificeMap(sacrifices = []) {
  const result = {}

  for (const sacrifice of sacrifices) {
    addWeights(result, priorityWeights[sacrifice], 1)
  }

  return result
}

export function buildPlaystyleProfile(answers = {}) {
  const weights = { ...BASE_WEIGHTS }

  addWeights(weights, offenseWeights[answers.offensePrimary], 1)
  addWeights(weights, offenseWeights[answers.offenseSecondary], 0.55)
  addWeights(weights, defenseWeights[answers.defensePrimary], 1)
  addWeights(weights, teamContextWeights[answers.teamContext], 1)
  addWeights(weights, shootingProfileWeights[answers.shootingProfile], 1)
  addWeights(weights, finishingProfileWeights[answers.finishingProfile], 1)
  addWeights(weights, matchupProfileWeights[answers.matchupProfile], 1)

  for (const priority of answers.priorities ?? []) {
    addWeights(weights, priorityWeights[priority], 1)
  }

  const sacrificeMap = getSacrificeMap(answers.sacrifices)

  for (const [attributeId, value] of Object.entries(sacrificeMap)) {
    weights[attributeId] = Math.max(
      0.08,
      (weights[attributeId] ?? 0.35) - value * 0.7
    )
  }

  const sortedPriorities = Object.entries(weights)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 6)
    .map(([attributeId, weight]) => ({ attributeId, weight }))

  return {
    position: answers.position,
    answers,
    weights,
    targets: buildPreferenceTargets(answers),
    sortedPriorities,
  }
}

function getStyleAffinity(candidate, styleId) {
  if (!styleId) {
    return 0
  }

  const affinities = STYLE_TAG_AFFINITY[styleId] ?? {
    [styleId]: 1,
  }

  let best = 0

  for (const tag of candidate.tags ?? []) {
    best = Math.max(best, affinities[tag] ?? 0)
  }

  return best
}

function getTagBonus(candidate, answers) {
  const primaryAffinity = getStyleAffinity(candidate, answers.offensePrimary)
  const secondaryAffinity = getStyleAffinity(candidate, answers.offenseSecondary)
  const defenseAffinity = getStyleAffinity(candidate, answers.defensePrimary)

  const weightedAffinity =
    primaryAffinity * 1 +
    secondaryAffinity * 0.55 +
    defenseAffinity * 1.05

  return Math.min(0.11, weightedAffinity * 0.042)
}

function getMorphologyBonus(candidate, preference) {
  const { height, wingspan } = candidate.morphology
  const { speed, agility, strength } = candidate.attributes

  if (preference === 'small_fast') {
    return ((speed + agility) / 198) * 0.045 - Math.max(0, height - 78) * 0.004
  }

  if (preference === 'big_physical') {
    return (
      (strength / 99) * 0.025 +
      Math.max(0, height - 75) * 0.004 +
      Math.max(0, wingspan - height) * 0.003
    )
  }

  if (preference === 'balanced') {
    return 0.018
  }

  return 0
}

function getPriorityFocusBonus(candidate, profile) {
  const priorities = profile.answers.priorities ?? []

  if (priorities.length === 0) {
    return 0
  }

  let categoryScore = 0
  let categoryCount = 0

  for (const priority of priorities) {
    const attributeWeights = priorityWeights[priority]

    if (!attributeWeights) {
      continue
    }

    let weightedValue = 0
    let weightTotal = 0

    for (const [attributeId, weight] of Object.entries(attributeWeights)) {
      const value = candidate.attributes[attributeId] ?? 25
      const normalized = Math.max(0, Math.min(1, (value - 25) / 74))

      weightedValue += Math.pow(normalized, 1.65) * weight
      weightTotal += weight
    }

    if (weightTotal > 0) {
      categoryScore += weightedValue / weightTotal
      categoryCount += 1
    }
  }

  if (categoryCount === 0) {
    return 0
  }

  return Math.min(
    0.075,
    (categoryScore / categoryCount) * 0.075
  )
}

function getBadgeThresholdBonus(candidate, profile) {
  let weightedScore = 0
  let relevanceTotal = 0

  for (const badge of badgesData.badges) {
    if (!isBadgeHeightCompatible(badge, candidate.morphology.height)) {
      continue
    }

    const tier = getHighestUnlockedTier(badge, candidate.attributes)

    if (!tier) {
      continue
    }

    const requirementAttributes = getAttributeRequirements(badge)
    const relevance = requirementAttributes.reduce(
      (highest, attributeId) => Math.max(highest, profile.weights[attributeId] ?? 0),
      0
    )

    if (relevance < 0.9) {
      continue
    }

    const tierScore = BADGE_TIER_SCORE[tier] ?? 0

    weightedScore += tierScore * relevance
    relevanceTotal += relevance
  }

  if (relevanceTotal <= 0) {
    return 0
  }

  const normalized = weightedScore / relevanceTotal

  return Math.min(0.04, normalized * 0.04)
}

function getPreferenceTargetAdjustment(candidate, profile) {
  const targets = profile.targets ?? {}
  let adjustment = 0
  let count = 0

  for (const [attributeId, target] of Object.entries(targets)) {
    const value = Number(candidate.attributes?.[attributeId] ?? 25)
    const minimum = Number(target.min ?? 25)
    const ideal = Number(target.ideal ?? minimum)
    const ceiling = Number(target.ceiling ?? 99)
    const importance = Math.max(0.55, getProfileImportance(profile, attributeId))

    count += 1

    if (value < minimum) {
      adjustment -= Math.min(0.055, ((minimum - value) / 18) * 0.055) * importance
      continue
    }

    const idealDistance = Math.abs(value - ideal)
    adjustment += Math.max(0, 0.018 - idealDistance * 0.0015) * importance

    if (target.budgetSensitive && value > ceiling) {
      adjustment -= Math.min(0.025, ((value - ceiling) / 15) * 0.025)
    }
  }

  if (count === 0) {
    return 0
  }

  return Math.max(-0.08, Math.min(0.04, adjustment / Math.sqrt(count)))
}

function scoreCandidate(candidate, profile) {
  const weights = profile.weights
  let weightedScore = 0
  let maxScore = 0

  for (const attributeId of ATTRIBUTE_IDS) {
    const weight = weights[attributeId] ?? 0.35
    const value = candidate.attributes[attributeId] ?? 25
    const normalized = Math.max(0, Math.min(1, (value - 25) / 74))

    weightedScore += normalized * weight
    maxScore += weight
  }

  const baseScore = maxScore > 0 ? weightedScore / maxScore : 0
  const tagBonus = getTagBonus(candidate, profile.answers)
  const morphologyBonus = getMorphologyBonus(
    candidate,
    profile.answers.morphologyPreference
  )

  const priorityFocusBonus = getPriorityFocusBonus(
    candidate,
    profile
  )

  const badgeThresholdBonus = getBadgeThresholdBonus(
    candidate,
    profile
  )

  const preferenceTargetAdjustment = getPreferenceTargetAdjustment(
    candidate,
    profile
  )

  const animationCaps = getExactBodyCaps(candidate.morphology)
  const animationBuildScore = getAnimationBuildScore(
    profile,
    animationCaps.available
      ? { ...candidate, caps: animationCaps.caps }
      : candidate
  )
  const animationEnabled = animationBuildScore !== null

  const blendedScore =
    baseScore * (animationEnabled ? 0.84 : 0.9) +
    tagBonus * 0.55 +
    morphologyBonus * 0.55 +
    priorityFocusBonus * 0.55 +
    badgeThresholdBonus * 0.55 +
    preferenceTargetAdjustment +
    (animationEnabled ? animationBuildScore * 0.06 : 0)

  return Math.max(
    0,
    Math.min(0.99, blendedScore)
  )
}

function getAttributeRequirements(badge) {
  const ids = new Set()

  for (const tier of Object.values(badge.tiers ?? {})) {
    const requirements = tier?.requirements ?? {}

    for (const requirement of requirements.any ?? []) {
      if (requirement.attribute) ids.add(requirement.attribute)
    }

    for (const requirement of requirements.all ?? []) {
      if (requirement.attribute) ids.add(requirement.attribute)
    }
  }

  return [...ids]
}

function isBadgeHeightCompatible(badge, height) {
  const range = badge.native_height_range_in

  if (!range) {
    return true
  }

  return (
    (range.min == null || height >= range.min) &&
    (range.max == null || height <= range.max)
  )
}

function getSynergyRecommendations(candidate, profile) {
  const recommendations = []

  for (const badge of badgesData.badges) {
    if (!isBadgeHeightCompatible(badge, candidate.morphology.height)) {
      continue
    }

    const tier = getHighestUnlockedTier(badge, candidate.attributes)

    if (!tier) {
      continue
    }

    const requirementAttributes = getAttributeRequirements(badge)
    const relevance = requirementAttributes.reduce(
      (highest, attributeId) => Math.max(highest, profile.weights[attributeId] ?? 0),
      0
    )

    const tierRank = TIER_RANK[tier] ?? 0

    recommendations.push({
      badgeId: badge.id,
      name: getBadgeTranslation(badge).name_fr,
      tier,
      tierLabel: TIER_LABEL[tier] ?? tier,
      relevance,
      score: relevance + tierRank * 0.18,
    })
  }

  recommendations.sort((left, right) => right.score - left.score)

  return recommendations.slice(0, 3).map((recommendation, index) => ({
    ...recommendation,
    boost: index === 0 ? 2 : 1,
  }))
}

function thresholdBonus(before, after, strategy) {
  const thresholds = [75, 80, 85, 87, 89, 90, 92, 93, 95, 97, 99]
  let bonus = 0

  for (const threshold of thresholds) {
    if (before < threshold && after >= threshold) {
      bonus += strategy === 'thresholds' ? 1.2 : 0.55
    }
  }

  return bonus
}

function allocateCapBreakers(candidate, profile, targetCount) {
  const projections = getAllCapBreakerProjections(
    candidate.attributes,
    candidate.morphology
  )

  const selected = Object.fromEntries(ATTRIBUTE_IDS.map((attributeId) => [attributeId, 0]))
  const values = { ...candidate.attributes }
  const strategy = profile.answers.capBreakerStrategy ?? 'thresholds'
  const candidateBodyCaps = getExactBodyCaps(candidate.morphology)
  const animationContext = createAnimationOptimizationContext(
    profile,
    candidate.morphology,
    candidateBodyCaps.available ? candidateBodyCaps.caps : null
  )
  let applied = 0

  while (applied < targetCount) {
    let best = null

    for (const attributeId of ATTRIBUTE_IDS) {
      const projection = projections[attributeId]
      const currentStage = selected[attributeId] ?? 0

      if (!projection?.available || currentStage >= 5) {
        continue
      }

      const nextValue = projection.cumulativeValues?.[currentStage]
      const boost = projection.boosts?.[currentStage] ?? 0

      if (!nextValue || boost <= 0 || nextValue <= values[attributeId]) {
        continue
      }

      const relevance = profile.weights[attributeId] ?? 0.35
      let score = (relevance * relevance) * (1 + Math.sqrt(boost) * 0.28)
      score += thresholdBonus(values[attributeId], nextValue, strategy) * relevance

      const animationImpact = getAnimationStepImpact(
        animationContext,
        values,
        { ...values, [attributeId]: nextValue },
        attributeId
      )
      score += (
        animationImpact.unlockScore * 3.5 +
        animationImpact.progressScore * 0.7
      ) * Math.max(0.75, relevance)

      if (strategy === 'strengths' && (profile.weights[attributeId] ?? 0) >= 1.5) {
        score *= 1.18
      }

      if (strategy === 'weaknesses' && candidate.attributes[attributeId] < 75) {
        score *= 1.15
      }

      if (strategy === 'balanced' && currentStage >= 2) {
        score *= 0.88
      }

      if (!best || score > best.score) {
        best = {
          attributeId,
          score,
          nextValue,
        }
      }
    }

    if (!best) {
      break
    }

    selected[best.attributeId] += 1
    values[best.attributeId] = best.nextValue
    applied += 1
  }

  const lines = ATTRIBUTE_IDS
    .filter((attributeId) => selected[attributeId] > 0)
    .map((attributeId) => ({
      attributeId,
      count: selected[attributeId],
      before: candidate.attributes[attributeId],
      after: values[attributeId],
      gain: values[attributeId] - candidate.attributes[attributeId],
    }))
    .sort((left, right) => right.count - left.count)

  const animationUnlocks = getAnimationUnlocksBetween(
    profile,
    {
      morphology: candidate.morphology,
      attributes: candidate.attributes,
    },
    {
      morphology: candidate.morphology,
      attributes: values,
    },
    { limit: 4 }
  )

  return {
    requested: targetCount,
    applied,
    lines,
    projectedAttributes: values,
    animationUnlocks,
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function getCategoryAttributeSet(categories = []) {
  const result = new Set()

  for (const category of categories) {
    for (const attributeId of Object.keys(priorityWeights[category] ?? {})) {
      result.add(attributeId)
    }
  }

  return result
}

function getPriorityCoreAttributeSet(categories = []) {
  const result = new Set()

  for (const category of categories) {
    for (const attributeId of PRIORITY_CORE_ATTRIBUTES[category] ?? []) {
      result.add(attributeId)
    }
  }

  return result
}

function getProfileImportance(profile, attributeId) {
  const values = Object.values(profile.weights)
  const maximum = Math.max(...values, 0.35)
  const minimum = Math.min(...values, 0.08)
  const value = profile.weights[attributeId] ?? 0.35

  if (maximum <= minimum) {
    return 0.5
  }

  return clamp01((value - minimum) / (maximum - minimum))
}

function solvePersonalizedRequest(requested, morphology, caps, rules) {
  return solveAttributeDependencies({
    requestedAttributes: requested,
    baseValues: {},
    caps,
    rules,
    includeProvisional: false,
  })
}

function getAllocationUtility(attributes, profile) {
  let weighted = 0
  let total = 0

  for (const attributeId of ATTRIBUTE_IDS) {
    const weight = profile.weights[attributeId] ?? 0.35
    const value = attributes[attributeId] ?? 25
    const normalized = clamp01((value - 25) / 74)

    // Rendement décroissant pour privilégier les seuils utiles plutôt que
    // de pousser mécaniquement une seule note à 99.
    weighted += Math.pow(normalized, 0.82) * weight
    total += weight
  }

  return total > 0 ? weighted / total : 0
}

function getMilestoneGain(beforeValues, afterValues, profile, attributeId) {
  const before = beforeValues[attributeId] ?? 25
  const after = afterValues[attributeId] ?? before

  if (after <= before) {
    return 0
  }

  let crossed = 0

  for (const milestone of BUILDER_MILESTONES) {
    if (before < milestone && after >= milestone) {
      crossed += 1
    }
  }

  return crossed * (profile.weights[attributeId] ?? 0.35) * 0.018
}

function getMaxPersonalizedDrop(seedCandidate, profile, attributeId) {
  const priorityAttributes = getPriorityCoreAttributeSet(profile.answers.priorities)
  const sacrificeAttributes = getCategoryAttributeSet(profile.answers.sacrifices)
  const importance = getProfileImportance(profile, attributeId)
  const target = profile.targets?.[attributeId]
  const seedValue = Number(seedCandidate.attributes?.[attributeId] ?? 25)

  if (
    target?.budgetSensitive &&
    Number.isFinite(Number(target.ceiling)) &&
    seedValue > Number(target.ceiling) &&
    !priorityAttributes.has(attributeId)
  ) {
    return Math.min(12, Math.max(1, seedValue - Number(target.ceiling)))
  }

  if (priorityAttributes.has(attributeId) || importance >= 0.62) {
    return 0
  }

  if (sacrificeAttributes.has(attributeId)) {
    return 12
  }

  if (importance < 0.18) {
    return 8
  }

  if (importance < 0.32) {
    return 5
  }

  if (importance < 0.46) {
    return 3
  }

  return 0
}

function getMaxPersonalizedGain(
  seedCandidate,
  profile,
  attributeId,
  cap,
  animationContext = null,
  currentAttributes = null
) {
  const priorityAttributes = getPriorityCoreAttributeSet(profile.answers.priorities)
  const sacrificeAttributes = getCategoryAttributeSet(profile.answers.sacrifices)
  const importance = getProfileImportance(profile, attributeId)
  const seedValue = seedCandidate.attributes[attributeId] ?? 25

  if (sacrificeAttributes.has(attributeId)) {
    return seedValue
  }

  if (priorityAttributes.has(attributeId)) {
    return cap
  }

  let ceiling = seedValue

  if (importance >= 0.78) {
    ceiling = Math.min(cap, seedValue + 7)
  } else if (importance >= 0.58) {
    ceiling = Math.min(cap, seedValue + 5)
  } else if (importance >= 0.42) {
    ceiling = Math.min(cap, seedValue + 3)
  }

  const currentValue = Number(currentAttributes?.[attributeId] ?? seedValue)
  const animationTarget = getAnimationTargetCeiling(
    animationContext,
    attributeId,
    currentValue,
    cap,
    {
      maxDistance: 9,
      attributes: currentAttributes,
    }
  )

  if (animationTarget && importance >= 0.24) {
    ceiling = Math.max(
      ceiling,
      Math.min(cap, animationTarget.threshold)
    )
  }

  const target = profile.targets?.[attributeId]

  if (target) {
    const ideal = Math.min(cap, Number(target.ideal ?? ceiling))
    const targetCeiling = Math.min(cap, Number(target.ceiling ?? cap))

    if (Number.isFinite(ideal)) {
      ceiling = Math.max(ceiling, ideal)
    }

    if (Number.isFinite(targetCeiling)) {
      ceiling = Math.min(ceiling, targetCeiling)
    }
  }

  return ceiling
}


function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(value))))
}

function morphologyKey(morphology) {
  return [
    morphology.position,
    morphology.height,
    morphology.weight,
    morphology.wingspan,
  ].join('|')
}

function getMorphologyPreferenceScreenScore(morphology, caps, profile, seedCandidate) {
  const preference = profile.answers.morphologyPreference
  const position = positionById.get(profile.position)

  if (!position) {
    return 0.5
  }

  const heightSpan = Math.max(1, position.height.max - position.height.min)
  const heightNorm = clamp01(
    (morphology.height - position.height.min) / heightSpan
  )
  const wingspanExtension = clamp01(
    (morphology.wingspan - morphology.height + 2) / 10
  )
  const speedCap = ((caps.speed ?? 25) + (caps.agility ?? 25)) / 198
  const strengthCap = (caps.strength ?? 25) / 99

  if (preference === 'small_fast') {
    return clamp01(
      speedCap * 0.58 +
      (1 - heightNorm) * 0.32 +
      (1 - wingspanExtension) * 0.1
    )
  }

  if (preference === 'big_physical') {
    return clamp01(
      strengthCap * 0.42 +
      heightNorm * 0.3 +
      wingspanExtension * 0.28
    )
  }

  if (preference === 'balanced') {
    const seedHeightDistance = Math.abs(
      morphology.height - seedCandidate.morphology.height
    )
    const sizeStability = 1 - Math.min(1, seedHeightDistance / 5)

    return clamp01(
      0.45 + sizeStability * 0.25 + speedCap * 0.15 + strengthCap * 0.15
    )
  }

  return 0.5
}

function createMorphologySearchCache() {
  return {
    bodyCaps: new Map(),
    animationPotential: new Map(),
  }
}

function scoreMorphologyPotential(seedCandidate, profile, morphology, searchCache = null) {

  const cacheKey = morphologyKey(morphology)
  let bodyCaps = searchCache?.bodyCaps?.get(cacheKey)

  if (!bodyCaps) {
    bodyCaps = getExactBodyCaps(morphology)
    searchCache?.bodyCaps?.set(cacheKey, bodyCaps)
  }

  if (!bodyCaps.available) {
    return null
  }

  const caps = bodyCaps.caps
  let capPotential = 0
  let retention = 0
  let runway = 0
  let weightTotal = 0
  const priorityAttributes = getPriorityCoreAttributeSet(profile.answers.priorities)

  for (const attributeId of ATTRIBUTE_IDS) {
    const weight = profile.weights[attributeId] ?? 0.35
    const cap = caps[attributeId] ?? 25
    const seedValue = seedCandidate.attributes[attributeId] ?? 25
    const capNorm = clamp01((cap - 25) / 74)
    const seedNorm = clamp01((seedValue - 25) / 74)
    const retainedValue = Math.min(seedValue, cap)
    const retainedNorm = seedNorm > 0
      ? clamp01((retainedValue - 25) / Math.max(1, seedValue - 25))
      : 1

    capPotential += Math.pow(capNorm, 0.9) * weight
    retention += retainedNorm * weight

    if (priorityAttributes.has(attributeId)) {
      runway += clamp01((cap - retainedValue) / 12) * weight
    }

    weightTotal += weight
  }

  if (weightTotal <= 0) {
    return null
  }

  const preferenceScore = getMorphologyPreferenceScreenScore(
    morphology,
    caps,
    profile,
    seedCandidate
  )
  let animationPotential = searchCache?.animationPotential?.get(cacheKey)

  if (animationPotential === undefined) {
    animationPotential = getAnimationPotentialScore(
      profile,
      morphology,
      caps
    )
    searchCache?.animationPotential?.set(cacheKey, animationPotential)
  }

  const score = animationPotential === null
    ? (
        (capPotential / weightTotal) * 0.46 +
        (retention / weightTotal) * 0.39 +
        clamp01(runway / Math.max(1, weightTotal * 0.28)) * 0.08 +
        preferenceScore * 0.07
      )
    : (
        (capPotential / weightTotal) * 0.43 +
        (retention / weightTotal) * 0.36 +
        clamp01(runway / Math.max(1, weightTotal * 0.28)) * 0.07 +
        preferenceScore * 0.06 +
        animationPotential * 0.08
      )

  return {
    morphology,
    caps,
    animationPotential,
    score,
  }
}

function getCoarseWeightValues(min, max, seedWeight) {
  const values = new Set([min, max, clampInteger(seedWeight, min, max)])

  for (
    let weight = min;
    weight <= max;
    weight += MORPHOLOGY_COARSE_WEIGHT_STEP
  ) {
    values.add(weight)
  }

  return [...values].sort((left, right) => left - right)
}

function selectMorphologyScreensWithDiversity(entries, limit) {
  const selected = []
  const heightCounts = new Map()

  for (const entry of entries) {
    const height = entry.morphology.height
    const count = heightCounts.get(height) ?? 0

    if (count >= MORPHOLOGY_HEIGHT_DIVERSITY_LIMIT) {
      continue
    }

    selected.push(entry)
    heightCounts.set(height, count + 1)

    if (selected.length >= limit) {
      break
    }
  }

  return selected
}

function getMorphologySearchScreens(seedCandidate, profile, searchCache = null) {
  const position = positionById.get(seedCandidate.position)

  if (!position) {
    const fallback = scoreMorphologyPotential(
      seedCandidate,
      profile,
      seedCandidate.morphology,
      searchCache
    )

    return fallback ? [fallback] : []
  }

  const coarse = []
  let screenedCount = 0

  for (
    let height = position.height.min;
    height <= position.height.max;
    height += 1
  ) {
    const bounds = getExactBodyBounds(height, seedCandidate.position)

    if (!bounds) {
      continue
    }

    const weights = getCoarseWeightValues(
      bounds.weight.min,
      bounds.weight.max,
      seedCandidate.morphology.weight
    )

    for (const weight of weights) {
      for (
        let wingspan = bounds.wingspan.min;
        wingspan <= bounds.wingspan.max;
        wingspan += 1
      ) {
        const morphology = {
          position: seedCandidate.position,
          height,
          weight,
          wingspan,
        }
        const screen = scoreMorphologyPotential(
          seedCandidate,
          profile,
          morphology,
          searchCache
        )

        screenedCount += 1

        if (screen) {
          coarse.push(screen)
        }
      }
    }
  }

  coarse.sort((left, right) => right.score - left.score)

  const refinementSeeds = selectMorphologyScreensWithDiversity(
    coarse,
    Math.max(12, MORPHOLOGY_SCREEN_PER_SEED * 3)
  )
  const refinedByKey = new Map()

  function addScreen(screen) {
    if (!screen) {
      return
    }

    const key = morphologyKey(screen.morphology)
    const existing = refinedByKey.get(key)

    if (!existing || screen.score > existing.score) {
      refinedByKey.set(key, screen)
    }
  }

  for (const entry of refinementSeeds) {
    const morphology = entry.morphology
    const bounds = getExactBodyBounds(
      morphology.height,
      seedCandidate.position
    )

    for (
      let delta = -MORPHOLOGY_LOCAL_WEIGHT_RADIUS;
      delta <= MORPHOLOGY_LOCAL_WEIGHT_RADIUS;
      delta += 1
    ) {
      const weight = clampInteger(
        morphology.weight + delta,
        bounds.weight.min,
        bounds.weight.max
      )

      addScreen(
        scoreMorphologyPotential(
          seedCandidate,
          profile,
          {
            ...morphology,
            weight,
          },
          searchCache
        )
      )
    }
  }

  // L'architecture d'origine reste toujours dans le pool de validation.
  addScreen(
    scoreMorphologyPotential(
      seedCandidate,
      profile,
      seedCandidate.morphology,
      searchCache
    )
  )

  const refined = [...refinedByKey.values()]
    .sort((left, right) => right.score - left.score)

  const selected = selectMorphologyScreensWithDiversity(
    refined,
    MORPHOLOGY_SCREEN_PER_SEED
  )

  const originalKey = morphologyKey(seedCandidate.morphology)

  if (!selected.some((entry) => morphologyKey(entry.morphology) === originalKey)) {
    const original = refinedByKey.get(originalKey)

    if (original) {
      if (selected.length >= MORPHOLOGY_SCREEN_PER_SEED) {
        selected[selected.length - 1] = original
      } else {
        selected.push(original)
      }
    }
  }

  return selected.map((entry) => ({
    ...entry,
    screenedCount,
  }))
}

function adaptSeedToMorphology(seedCandidate, morphology) {
  const bodyCaps = getExactBodyCaps(morphology)

  if (!bodyCaps.available) {
    return null
  }

  const caps = bodyCaps.caps
  const rules = getExactDependencyRules(morphology.height)
  const requested = Object.fromEntries(
    ATTRIBUTE_IDS.map((attributeId) => [
      attributeId,
      Math.min(
        seedCandidate.attributes[attributeId] ?? 25,
        caps[attributeId] ?? 99
      ),
    ])
  )
  const solved = solvePersonalizedRequest(
    requested,
    morphology,
    caps,
    rules
  )

  if (solved.capConflicts.length > 0) {
    return null
  }

  return {
    ...seedCandidate,
    id: `${seedCandidate.id}-morph-${morphology.height}-${morphology.weight}-${morphology.wingspan}`,
    morphology: { ...morphology },
    attributes: { ...solved.values },
  }
}

function isExactBase99Candidate(candidate) {
  const bodyCaps = getExactBodyCaps(candidate.morphology)

  if (!bodyCaps.available) {
    return false
  }

  for (const attributeId of ATTRIBUTE_IDS) {
    if (
      (candidate.attributes[attributeId] ?? 25) >
      (bodyCaps.caps[attributeId] ?? 99)
    ) {
      return false
    }
  }

  const gnr = calculateExactGnr(
    candidate.attributes,
    candidate.morphology.height,
    { caps: bodyCaps.caps }
  )

  return Boolean(gnr.available && gnr.displayed === 99 && gnr.detailed <= 99.00001)
}

function wrapOptimizedCandidate(
  seedCandidate,
  values,
  iterations,
  context = {}
) {
  const sourceCandidate = context.sourceCandidate ?? seedCandidate
  const changes = ATTRIBUTE_IDS
    .map((attributeId) => ({
      attributeId,
      before: sourceCandidate.attributes[attributeId] ?? 25,
      after: values[attributeId] ?? 25,
      delta:
        (values[attributeId] ?? 25) -
        (sourceCandidate.attributes[attributeId] ?? 25),
    }))
    .filter((change) => change.delta !== 0)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))

  const morphologyBefore = { ...sourceCandidate.morphology }
  const morphologyAfter = { ...seedCandidate.morphology }
  const morphologyChanged =
    morphologyKey(morphologyBefore) !== morphologyKey(morphologyAfter)
  const allocationChanged = changes.length > 0
  const suffix = [
    morphologyAfter.height,
    morphologyAfter.weight,
    morphologyAfter.wingspan,
  ].join('-')

  return {
    ...seedCandidate,
    id: `${PERSONALIZER_VERSION}-${sourceCandidate.id}-${suffix}`,
    name: `${sourceCandidate.name} · personnalisé`,
    role:
      morphologyChanged || allocationChanged
        ? `${sourceCandidate.role} — morphologie et allocation adaptées à ton profil`
        : `${sourceCandidate.role} — architecture déjà adaptée à ton profil`,
    attributes: { ...values },
    generated: true,
    sourceCandidateId: sourceCandidate.id,
    sourceCandidateName: sourceCandidate.name,
    optimization: {
      version: PERSONALIZER_VERSION,
      iterations,
      applied: morphologyChanged || allocationChanged,
      changes,
      morphology: {
        before: morphologyBefore,
        after: morphologyAfter,
        changed: morphologyChanged,
      },
      morphologyScreenScore: context.morphologyScreenScore ?? null,
      morphologyRank: context.morphologyRank ?? null,
      screenedMorphologies: context.screenedMorphologies ?? null,
    },
  }
}

function optimizeCandidateForProfile(seedCandidate, profile, context = {}) {
  const bodyCaps = getExactBodyCaps(seedCandidate.morphology)

  if (!bodyCaps.available) {
    return wrapOptimizedCandidate(seedCandidate, seedCandidate.attributes, 0, context)
  }

  const caps = bodyCaps.caps
  const rules = getExactDependencyRules(seedCandidate.morphology.height)
  const sacrificeAttributes = getCategoryAttributeSet(profile.answers.sacrifices)
  const priorityAttributes = getPriorityCoreAttributeSet(profile.answers.priorities)
  const animationContext = createAnimationOptimizationContext(
    profile,
    seedCandidate.morphology,
    caps
  )
  let requested = { ...seedCandidate.attributes }
  let solved = solvePersonalizedRequest(
    requested,
    seedCandidate.morphology,
    caps,
    rules
  )

  if (solved.capConflicts.length > 0) {
    return wrapOptimizedCandidate(seedCandidate, seedCandidate.attributes, 0, context)
  }

  let values = solved.values
  let utility = getAllocationUtility(values, profile)
  let iterations = 0
  const maxIterations = 500
  const totalDrops = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, 0]))

  // 1) Libérer une petite réserve de budget sur les attributs les moins
  // importants pour ce profil. On vise ~98 GNR : assez pour effectuer de
  // vrais arbitrages, sans dénaturer l'architecture validée du seed.
  while (iterations < maxIterations) {
    iterations += 1
    const currentGnr = calculateExactGnr(
      values,
      seedCandidate.morphology.height,
      { caps }
    )

    if (!currentGnr.available || currentGnr.detailed <= 98.05) {
      break
    }

    let bestDrop = null

    for (const attributeId of ATTRIBUTE_IDS) {
      const maxDrop = getMaxPersonalizedDrop(
        seedCandidate,
        profile,
        attributeId
      )

      if (maxDrop <= 0 || totalDrops[attributeId] >= maxDrop) {
        continue
      }

      const currentValue = values[attributeId] ?? 25
      const seedValue = seedCandidate.attributes[attributeId] ?? 25
      const minimum = Math.max(25, seedValue - maxDrop)

      if (currentValue <= minimum) {
        continue
      }

      const nextRequested = {
        ...requested,
        [attributeId]: Math.max(25, (requested[attributeId] ?? currentValue) - 1),
      }

      const nextSolved = solvePersonalizedRequest(
        nextRequested,
        seedCandidate.morphology,
        caps,
        rules
      )

      if (nextSolved.capConflicts.length > 0) {
        continue
      }

      const nextValues = nextSolved.values

      if ((nextValues[attributeId] ?? currentValue) >= currentValue) {
        continue
      }

      const nextGnr = calculateExactGnr(
        nextValues,
        seedCandidate.morphology.height,
        { caps }
      )

      const freed = Math.max(
        0,
        currentGnr.detailed - (nextGnr.detailed ?? currentGnr.detailed)
      )

      if (freed <= 0) {
        continue
      }

      const nextUtility = getAllocationUtility(nextValues, profile)
      const utilityLoss = Math.max(0.00001, utility - nextUtility)
      const animationImpact = getAnimationStepImpact(
        animationContext,
        values,
        nextValues,
        attributeId
      )
      const animationLossPenalty = animationImpact.lossScore * 0.12
      let score = (utilityLoss + animationLossPenalty) / freed

      if (sacrificeAttributes.has(attributeId)) {
        score *= 0.48
      }

      if (!bestDrop || score < bestDrop.score) {
        bestDrop = {
          attributeId,
          score,
          requested: nextRequested,
          solved: nextSolved,
          utility: nextUtility,
        }
      }
    }

    if (!bestDrop) {
      break
    }

    requested = bestDrop.requested
    solved = bestDrop.solved
    values = solved.values
    utility = bestDrop.utility
    totalDrops[bestDrop.attributeId] += 1
  }

  // 2) Réinvestir ce budget en priorité sur les attributs explicitement
  // demandés puis sur les notes les plus importantes du profil.
  while (iterations < maxIterations) {
    iterations += 1
    const currentGnr = calculateExactGnr(
      values,
      seedCandidate.morphology.height,
      { caps }
    )

    if (!currentGnr.available || currentGnr.displayed >= 99) {
      break
    }

    let bestGain = null

    for (const attributeId of ATTRIBUTE_IDS) {
      const cap = caps[attributeId] ?? 99
      const ceiling = getMaxPersonalizedGain(
        seedCandidate,
        profile,
        attributeId,
        cap,
        animationContext,
        values
      )
      const currentValue = values[attributeId] ?? 25

      if (currentValue >= ceiling || currentValue >= cap) {
        continue
      }

      const nextRequested = {
        ...requested,
        [attributeId]: Math.min(
          cap,
          Math.max(requested[attributeId] ?? 25, currentValue) + 1
        ),
      }

      const nextSolved = solvePersonalizedRequest(
        nextRequested,
        seedCandidate.morphology,
        caps,
        rules
      )

      if (nextSolved.capConflicts.length > 0) {
        continue
      }

      const gate = testExactOverallIncrement(
        values,
        nextSolved.values,
        seedCandidate.morphology.height,
        { caps }
      )

      if (!gate.allowed) {
        continue
      }

      const nextUtility = getAllocationUtility(nextSolved.values, profile)
      const utilityGain = Math.max(0.00001, nextUtility - utility)
      const cost = Math.max(
        0.002,
        (gate.candidate.detailed ?? 0) - (gate.current.detailed ?? 0)
      )
      const milestone = getMilestoneGain(
        values,
        nextSolved.values,
        profile,
        attributeId
      )
      const animationImpact = getAnimationStepImpact(
        animationContext,
        values,
        nextSolved.values,
        attributeId
      )
      const animationGain =
        animationImpact.unlockScore * 0.14 +
        animationImpact.progressScore * 0.035

      let score = (utilityGain + milestone + animationGain) / cost

      if (priorityAttributes.has(attributeId)) {
        score *= 1.18
      }

      if (!bestGain || score > bestGain.score) {
        bestGain = {
          attributeId,
          score,
          requested: nextRequested,
          solved: nextSolved,
          utility: nextUtility,
        }
      }
    }

    if (!bestGain) {
      break
    }

    requested = bestGain.requested
    solved = bestGain.solved
    values = solved.values
    utility = bestGain.utility
  }

  // 3) Si un petit reliquat subsiste, restaurer les points retranchés du
  // seed plutôt que de créer des notes de remplissage incohérentes.
  while (iterations < maxIterations) {
    iterations += 1
    const currentGnr = calculateExactGnr(
      values,
      seedCandidate.morphology.height,
      { caps }
    )

    if (!currentGnr.available || currentGnr.displayed >= 99) {
      break
    }

    let bestRestore = null

    for (const attributeId of ATTRIBUTE_IDS) {
      const seedValue = seedCandidate.attributes[attributeId] ?? 25
      const currentValue = values[attributeId] ?? 25

      if (currentValue >= seedValue) {
        continue
      }

      const nextRequested = {
        ...requested,
        [attributeId]: Math.min(
          seedValue,
          Math.max(requested[attributeId] ?? 25, currentValue) + 1
        ),
      }

      const nextSolved = solvePersonalizedRequest(
        nextRequested,
        seedCandidate.morphology,
        caps,
        rules
      )

      const gate = testExactOverallIncrement(
        values,
        nextSolved.values,
        seedCandidate.morphology.height,
        { caps }
      )

      if (!gate.allowed) {
        continue
      }

      const nextUtility = getAllocationUtility(nextSolved.values, profile)
      const cost = Math.max(
        0.002,
        (gate.candidate.detailed ?? 0) - (gate.current.detailed ?? 0)
      )
      const animationImpact = getAnimationStepImpact(
        animationContext,
        values,
        nextSolved.values,
        attributeId
      )
      let score = (
        Math.max(0.00001, nextUtility - utility) +
        animationImpact.unlockScore * 0.09 +
        animationImpact.progressScore * 0.02
      ) / cost

      if (sacrificeAttributes.has(attributeId)) {
        score *= 0.35
      }

      if (!bestRestore || score > bestRestore.score) {
        bestRestore = {
          attributeId,
          score,
          requested: nextRequested,
          solved: nextSolved,
          utility: nextUtility,
        }
      }
    }

    if (!bestRestore) {
      break
    }

    requested = bestRestore.requested
    solved = bestRestore.solved
    values = solved.values
    utility = bestRestore.utility
  }

  const finalGnr = calculateExactGnr(
    values,
    seedCandidate.morphology.height,
    { caps }
  )

  if (!finalGnr.available || finalGnr.displayed !== 99) {
    return wrapOptimizedCandidate(seedCandidate, seedCandidate.attributes, iterations, context)
  }

  return wrapOptimizedCandidate(seedCandidate, values, iterations, context)
}


function optimizeSeedAcrossMorphologies(seedCandidate, profile, searchCache = null) {
  const screens = getMorphologySearchScreens(seedCandidate, profile, searchCache)
  const evaluated = []

  for (let index = 0; index < screens.length; index += 1) {
    const screen = screens[index]
    const adaptedSeed = adaptSeedToMorphology(
      seedCandidate,
      screen.morphology
    )

    if (!adaptedSeed) {
      continue
    }

    const optimized = optimizeCandidateForProfile(
      adaptedSeed,
      profile,
      {
        sourceCandidate: seedCandidate,
        morphologyScreenScore: screen.score,
        morphologyRank: index + 1,
        screenedMorphologies: screen.screenedCount,
      }
    )

    if (!isExactBase99Candidate(optimized)) {
      continue
    }

    evaluated.push({
      candidate: optimized,
      affinity: scoreCandidate(optimized, profile),
      screenScore: screen.score,
    })
  }

  // Garde-fou : si la recherche morphologique n'aboutit pas, on conserve
  // l'optimiseur V19 sur la morphologie validée d'origine.
  if (evaluated.length === 0) {
    const fallback = optimizeCandidateForProfile(
      seedCandidate,
      profile,
      {
        sourceCandidate: seedCandidate,
        morphologyScreenScore: null,
        morphologyRank: null,
        screenedMorphologies: screens[0]?.screenedCount ?? 0,
      }
    )

    return {
      candidate: fallback,
      affinity: scoreCandidate(fallback, profile),
      searchedCount: screens[0]?.screenedCount ?? 0,
      evaluatedCount: 1,
      validCount: isExactBase99Candidate(fallback) ? 1 : 0,
    }
  }

  evaluated.sort((left, right) => {
    if (right.affinity !== left.affinity) {
      return right.affinity - left.affinity
    }

    return right.screenScore - left.screenScore
  })

  return {
    ...evaluated[0],
    searchedCount: screens[0]?.screenedCount ?? 0,
    evaluatedCount: screens.length,
    validCount: evaluated.length,
  }
}

function getCandidateDiversity(candidate, referenceCandidate) {
  if (!referenceCandidate) {
    return 1
  }

  let attributeDistance = 0

  for (const attributeId of DIVERSITY_ATTRIBUTE_IDS) {
    const left = candidate.attributes[attributeId] ?? 25
    const right = referenceCandidate.attributes[attributeId] ?? 25

    attributeDistance += Math.abs(left - right) / 74
  }

  attributeDistance /= DIVERSITY_ATTRIBUTE_IDS.length

  const morphologyDistance = Math.min(
    1,
    (
      Math.abs(candidate.morphology.height - referenceCandidate.morphology.height) / 8 +
      Math.abs(candidate.morphology.wingspan - referenceCandidate.morphology.wingspan) / 10 +
      Math.abs(candidate.morphology.weight - referenceCandidate.morphology.weight) / 80
    ) / 3
  )

  const leftTags = new Set(candidate.tags ?? [])
  const rightTags = new Set(referenceCandidate.tags ?? [])
  const union = new Set([...leftTags, ...rightTags])

  let shared = 0

  for (const tag of leftTags) {
    if (rightTags.has(tag)) {
      shared += 1
    }
  }

  const tagDistance = union.size > 0 ? 1 - shared / union.size : 0

  return Math.max(
    0,
    Math.min(
      1,
      attributeDistance * 0.55 +
        morphologyDistance * 0.2 +
        tagDistance * 0.25
    )
  )
}

function chooseVariant(ranked, selected, primaryCandidate, excludedId = null) {
  const remaining = ranked.filter(
    (entry) =>
      entry.candidate.id !== excludedId &&
      !selected.some(
        (selectedEntry) => selectedEntry.candidate.id === entry.candidate.id
      )
  )

  if (remaining.length === 0) {
    return null
  }

  return remaining
    .map((entry) => {
      const diversity = getCandidateDiversity(
        entry.candidate,
        primaryCandidate
      )

      return {
        ...entry,
        diversity,
        variantScore: entry.affinity * 0.72 + diversity * 0.28,
      }
    })
    .sort((left, right) => right.variantScore - left.variantScore)[0]
}

function getMetaComparison(candidate, metaCandidate) {
  if (!metaCandidate) {
    return null
  }

  const differences = ATTRIBUTE_IDS.map((attributeId) => ({
    attributeId,
    personal: candidate.attributes[attributeId] ?? 25,
    meta: metaCandidate.attributes[attributeId] ?? 25,
    delta: (candidate.attributes[attributeId] ?? 25) - (metaCandidate.attributes[attributeId] ?? 25),
  }))
    .filter((difference) => difference.delta !== 0)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 8)

  return {
    metaCandidate,
    differences,
  }
}

function enrichCandidate(candidate, profile, affinity) {
  const bodyCaps = getExactBodyCaps(candidate.morphology)
  const gnr = calculateExactGnr(
    candidate.attributes,
    candidate.morphology.height,
    { caps: bodyCaps.caps }
  )
  const sourceCandidate = playstyleCandidates.find(
    (entry) => entry.id === (candidate.sourceCandidateId ?? candidate.id)
  ) ?? candidate
  const animationAnalysis = getAnimationAnalysis(
    profile,
    {
      ...candidate,
      caps: bodyCaps.caps,
    },
    sourceCandidate
  )

  return {
    ...candidate,
    affinity: Math.round(affinity * 100),
    gnr,
    animationAnalysis,
    capBreakerPlans: {
      5: allocateCapBreakers(candidate, profile, 5),
      10: allocateCapBreakers(candidate, profile, 10),
      15: allocateCapBreakers(candidate, profile, 15),
    },
    synergies: getSynergyRecommendations(candidate, profile),
  }
}

export function recommendPersonalBuilds(answers = {}) {
  if (!answers.position) {
    return {
      profile: buildPlaystyleProfile(answers),
      results: [],
      metaCandidate: null,
    }
  }

  const profile = buildPlaystyleProfile(answers)
  const positionSeeds = playstyleCandidates.filter(
    (candidate) => candidate.position === answers.position
  )

  const metaId = provisionalMetaBuildByPosition[answers.position]
  const metaCandidate = positionSeeds.find(
    (candidate) => candidate.id === metaId
  ) ?? null

  const morphologySearchCache = createMorphologySearchCache()

  const morphologySearchResults = positionSeeds.map(
    (seedCandidate) => optimizeSeedAcrossMorphologies(
      seedCandidate,
      profile,
      morphologySearchCache
    )
  )

  const generatedCandidates = morphologySearchResults.map(
    (result) => result.candidate
  )

  const ranked = morphologySearchResults
    .map((result) => ({
      candidate: result.candidate,
      affinity: result.affinity,
      morphologySearch: {
        searchedCount: result.searchedCount,
        evaluatedCount: result.evaluatedCount,
        validCount: result.validCount,
      },
    }))
    .sort((left, right) => right.affinity - left.affinity)

  const selected = []
  const ideal = ranked[0] ?? null

  if (ideal) {
    selected.push(ideal)
  }

  const idealUsesMetaArchitecture =
    ideal?.candidate.sourceCandidateId === metaId

  const idealChanges =
    ideal?.candidate.optimization?.changes?.length ?? 0

  const idealMorphologyChanged = Boolean(
    ideal?.candidate.optimization?.morphology?.changed
  )

  const idealEqualsMetaReference =
    idealUsesMetaArchitecture &&
    idealChanges === 0 &&
    !idealMorphologyChanged

  // Si la Meta fixe doit apparaître en 3e position, on évite de choisir
  // sa copie générée comme variante n°2.
  const variantPool =
    metaCandidate && !idealEqualsMetaReference
      ? ranked.filter(
          (entry) => entry.candidate.sourceCandidateId !== metaId
        )
      : ranked

  const second = chooseVariant(
    variantPool,
    selected,
    ideal?.candidate
  )

  if (second) {
    selected.push(second)
  }

  if (metaCandidate && !idealEqualsMetaReference) {
    selected.push({
      candidate: metaCandidate,
      affinity: scoreCandidate(metaCandidate, profile),
      fixedMetaReference: true,
    })
  }

  while (selected.length < 3) {
    const fallback = chooseVariant(
      ranked,
      selected,
      ideal?.candidate
    )

    if (!fallback) {
      break
    }

    selected.push(fallback)
  }

  const results = selected.slice(0, 3).map((entry, index) => {
    const enriched = enrichCandidate(entry.candidate, profile, entry.affinity)

    return {
      ...enriched,
      recommendationType:
        entry.fixedMetaReference
          ? 'meta'
          : index === 0
            ? 'ideal'
            : 'variant',
      isMetaArchitecture:
        entry.candidate.sourceCandidateId === metaId ||
        entry.candidate.id === metaId,
      metaComparison: getMetaComparison(enriched, metaCandidate),
    }
  })

  return {
    profile,
    results,
    metaCandidate,
    generation: {
      version: PERSONALIZER_VERSION,
      generatedCount: generatedCandidates.length,
      optimizedCount: generatedCandidates.filter(
        (candidate) => candidate.optimization?.applied
      ).length,
      morphologyChangedCount: generatedCandidates.filter(
        (candidate) => candidate.optimization?.morphology?.changed
      ).length,
      seedCount: positionSeeds.length,
      screenedMorphologies: morphologySearchResults.reduce(
        (total, result) => total + (result.searchedCount ?? 0),
        0
      ),
      evaluatedMorphologies: morphologySearchResults.reduce(
        (total, result) => total + (result.evaluatedCount ?? 0),
        0
      ),
      validMorphologies: morphologySearchResults.reduce(
        (total, result) => total + (result.validCount ?? 0),
        0
      ),
    },
  }
}

function createRecommendationSnapshot(result) {
  const capBreakerPlans = {}

  for (const count of [5, 10, 15]) {
    const plan = result.capBreakerPlans?.[count]

    if (!plan) {
      continue
    }

    capBreakerPlans[count] = {
      requested: plan.requested,
      applied: plan.applied,
      lines: (plan.lines ?? []).map((line) => ({
        attributeId: line.attributeId,
        count: line.count,
        before: line.before,
        after: line.after,
        gain: line.gain,
      })),
    }
  }

  return {
    version: PERSONALIZER_VERSION,
    name: result.name,
    role: result.role,
    affinity: result.affinity,
    sourceCandidateName: result.sourceCandidateName ?? result.name,
    capBreakerPlans,
    synergies: (result.synergies ?? []).map((synergy) => ({
      badgeId: synergy.badgeId,
      name: synergy.name,
      tier: synergy.tier,
      tierLabel: synergy.tierLabel,
      boost: synergy.boost,
    })),
  }
}

export function createPersonalBuildPayload(result) {
  return {
    morphology: result.morphology,
    manualAttributes: result.attributes,
    selectedBadges: {},
    selectedTakeovers: {},
    selectedCapBreakers: {},
    personalRecommendation: createRecommendationSnapshot(result),
  }
}

export default recommendPersonalBuilds
