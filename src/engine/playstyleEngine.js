import attributesData from '../data/nba2k27/attributes.json' with { type: 'json' }
import badgesData from '../data/nba2k27/badges.json' with { type: 'json' }
import {
  playstyleCandidates,
  provisionalMetaBuildByPosition,
} from '../data/nba2k27/playstyleCandidates.js'
import { getBadgeTranslation } from '../data/nba2k27/badgeTranslations.js'
import { getHighestUnlockedTier } from './badgeEngine.js'
import {
  calculateExactGnr,
  getAllCapBreakerProjections,
  getExactBodyCaps,
} from './apkBuilderEngine.js'

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

  const blendedScore =
    baseScore * 0.9 +
    tagBonus * 0.55 +
    morphologyBonus * 0.55 +
    priorityFocusBonus * 0.55 +
    badgeThresholdBonus * 0.55

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

  return {
    requested: targetCount,
    applied,
    lines,
    projectedAttributes: values,
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

  return {
    ...candidate,
    affinity: Math.round(affinity * 100),
    gnr,
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
  const positionCandidates = playstyleCandidates.filter(
    (candidate) => candidate.position === answers.position
  )

  const ranked = positionCandidates
    .map((candidate) => ({
      candidate,
      affinity: scoreCandidate(candidate, profile),
    }))
    .sort((left, right) => right.affinity - left.affinity)

  const metaId = provisionalMetaBuildByPosition[answers.position]
  const metaCandidate = positionCandidates.find((candidate) => candidate.id === metaId) ?? null

  const selected = []

  if (ranked[0]) {
    selected.push(ranked[0])
  }

  const rankedMeta = ranked.find(
    (entry) => entry.candidate.id === metaId
  )

  const idealIsMeta =
    ranked[0]?.candidate.id === metaId

  const second = chooseVariant(
    ranked,
    selected,
    ranked[0]?.candidate,
    idealIsMeta ? null : metaId
  )

  if (second) {
    selected.push(second)
  }

  if (
    !idealIsMeta &&
    rankedMeta &&
    !selected.some((entry) => entry.candidate.id === rankedMeta.candidate.id)
  ) {
    selected.push(rankedMeta)
  }

  while (selected.length < 3) {
    const fallback = chooseVariant(
      ranked,
      selected,
      ranked[0]?.candidate
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
        index === 0
          ? 'ideal'
          : entry.candidate.id === metaId
            ? 'meta'
            : 'variant',
      metaComparison: getMetaComparison(enriched, metaCandidate),
    }
  })

  return {
    profile,
    results,
    metaCandidate,
  }
}

export function createPersonalBuildPayload(result) {
  return {
    morphology: result.morphology,
    manualAttributes: result.attributes,
    selectedBadges: {},
    selectedTakeovers: {},
    selectedCapBreakers: {},
  }
}

export default recommendPersonalBuilds
