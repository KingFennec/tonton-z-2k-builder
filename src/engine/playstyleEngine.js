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

function getTagBonus(candidate, answers) {
  const desiredTags = new Set([
    answers.offensePrimary,
    answers.offenseSecondary,
    answers.defensePrimary,
  ].filter(Boolean))

  let bonus = 0

  for (const tag of candidate.tags ?? []) {
    if (desiredTags.has(tag)) {
      bonus += 0.035
    }
  }

  return bonus
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

  return Math.max(0, Math.min(1, baseScore + tagBonus + morphologyBonus))
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

  const second = ranked.find(
    (entry) => !selected.some((selectedEntry) => selectedEntry.candidate.id === entry.candidate.id)
  )

  if (second) {
    selected.push(second)
  }

  const rankedMeta = ranked.find((entry) => entry.candidate.id === metaId)

  if (
    rankedMeta &&
    !selected.some((entry) => entry.candidate.id === rankedMeta.candidate.id)
  ) {
    selected.push(rankedMeta)
  }

  const third = ranked.find(
    (entry) => !selected.some((selectedEntry) => selectedEntry.candidate.id === entry.candidate.id)
  )

  if (selected.length < 3 && third) {
    selected.push(third)
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
