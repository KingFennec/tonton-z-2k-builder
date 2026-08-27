import optimizerData from '../data/nba2k27/apk/animation_optimizer_index.json' with { type: 'json' }
import {
  doesAnimationHeightMeetRequirement,
} from './animationEngine.js'

export const ANIMATION_OPTIMIZER_SCHEMA_VERSION = 1

const REC_EXCLUDED_GROUP_TYPES = new Set([
  'BT_DUNKS',
  'BT_ALLEYOOP',
  'BT_PASS',
])

const CONTACT_GROUP_TYPES = new Set([
  'CONTACT_DUNKS',
])

const DRIBBLE_GROUP_TYPES = new Set([
  'DRIBBLE_STYLE',
  'ISO_CROSSOVER',
  'ISO_TWEENLEGS',
  'ISO_SIZEUP_SIG',
  'ISO_BREAKDOWN',
  'ISO_BREAKDOWNMOVE',
  'ISO_ESCAPECROSS',
  'ISO_ESCAPEHES',
  'ISO_ESCAPETWEEN',
  'ISO_ESCAPEBEHINDBACK',
  'ISO_MISDIRECTHES',
  'ISO_MISDIRECTCROSS',
  'ISO_MISDIRECTBEHINDBACK',
  'ISO_CROSSCOMBO',
  'ISO_COMBOHESICROSS',
  'ISO_COMBODOUBLECROSS',
  'ISO_BEHINDBACK',
  'ISO_BEHINDBACKLAUNCH',
  'ISO_SPIN',
  'ISO_CROSSSPIN',
  'ISO_INANDOUT',
  'ISO_HESITATION',
  'ISO_HESITATIONLATERAL',
  'ISO_STEPBACK',
  'ISO_STEPBACKCROSS',
  'ISO_STEPBACKLATERAL',
])

const TRIPLE_THREAT_GROUP_TYPES = new Set([
  'TRIPLETHREAT_STYLE',
  'TRIPLETHREAT_BREAKDOWN',
  'TRIPLETHREAT_JAB',
  'TRIPLETHREAT_STEPOVER',
])

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function requirementValue(requirement, attributes = {}) {
  return Number(attributes?.[requirement.attribute] ?? 25)
}

function signatureRequirementsMeet(signature, attributes = {}) {
  const requirements = signature?.requirements ?? []

  if (requirements.length === 0) {
    return true
  }

  if (signature.operator === 'OR') {
    return requirements.some(
      (requirement) => requirementValue(requirement, attributes) >= requirement.min
    )
  }

  return requirements.every(
    (requirement) => requirementValue(requirement, attributes) >= requirement.min
  )
}

function signatureAvailable(signature, morphology, attributes) {
  return (
    doesAnimationHeightMeetRequirement(
      signature.allowedSizes,
      morphology?.height
    ) &&
    signatureRequirementsMeet(signature, attributes)
  )
}

function signatureAttainable(signature, morphology, caps) {
  return signatureAvailable(signature, morphology, caps)
}

function addMapWeight(target, key, value) {
  if (!key || !value) {
    return target
  }

  target[key] = Math.max(target[key] ?? 0, value)
  return target
}

function getGroupAffinityMaps(signature) {
  const type = signature.groupType
  const group = normalizeText(signature.groupFr)
  const styles = {}
  const priorities = {}
  let impactMultiplier = 1

  if (REC_EXCLUDED_GROUP_TYPES.has(type)) {
    return {
      styles,
      priorities,
      impactMultiplier: 0,
    }
  }

  switch (type) {
    case 'SHOT_JUMPER':
      addMapWeight(styles, 'spot_up', 1)
      addMapWeight(styles, 'primary_creator', 0.62)
      addMapWeight(styles, 'secondary_creator', 0.68)
      addMapWeight(styles, 'closeout', 0.24)
      addMapWeight(priorities, 'shooting', 1)
      impactMultiplier = 1.12
      break

    case 'FREE_THROW':
      addMapWeight(styles, 'spot_up', 0.15)
      addMapWeight(priorities, 'shooting', 0.18)
      impactMultiplier = 0.45
      break

    case 'GO_TO_SHOT':
      addMapWeight(styles, 'primary_creator', 0.92)
      addMapWeight(styles, 'secondary_creator', 0.82)
      addMapWeight(styles, 'spot_up', 0.45)
      addMapWeight(styles, 'closeout', 0.35)
      addMapWeight(priorities, 'shooting', 0.78)
      addMapWeight(priorities, 'dribbling', 0.42)
      impactMultiplier = 1.08
      break

    case 'SHOT_DRIBBLE_PULLUP':
    case 'SHOT_SPIN':
    case 'SHOT_SIDE_HOP':
      addMapWeight(styles, 'primary_creator', 1)
      addMapWeight(styles, 'secondary_creator', 0.92)
      addMapWeight(styles, 'closeout', 0.38)
      addMapWeight(priorities, 'shooting', 0.82)
      addMapWeight(priorities, 'dribbling', 0.76)
      impactMultiplier = 1.1
      break

    case 'LAYUP':
      addMapWeight(styles, 'closeout', 0.95)
      addMapWeight(styles, 'cuts', 0.78)
      addMapWeight(styles, 'primary_creator', 0.36)
      addMapWeight(styles, 'secondary_creator', 0.46)
      addMapWeight(priorities, 'dunk', 0.36)
      impactMultiplier = 0.9
      break

    case 'POST_FADE':
    case 'POST_HOOK':
    case 'POST_1STEP_PULLUP':
    case 'POST_GO_TO_SHOT':
      addMapWeight(styles, 'post_play', 1)
      addMapWeight(styles, 'pick_roll', 0.15)
      addMapWeight(priorities, 'shooting', type === 'POST_FADE' ? 0.34 : 0.12)
      addMapWeight(priorities, 'strength', 0.2)
      impactMultiplier = 1.04
      break

    case 'MOTION_STYLE':
      addMapWeight(styles, 'cuts', 0.55)
      addMapWeight(styles, 'closeout', 0.42)
      addMapWeight(styles, 'on_ball_defense', 0.62)
      addMapWeight(styles, 'wing_defense', 0.5)
      addMapWeight(styles, 'screen_defense', 0.55)
      addMapWeight(styles, 'switch_defense', 0.38)
      addMapWeight(priorities, 'speed', 1)
      addMapWeight(priorities, 'dribbling', 0.26)
      impactMultiplier = 0.92
      break

    case 'PASS_STYLE':
      addMapWeight(styles, 'primary_creator', 1)
      addMapWeight(styles, 'secondary_creator', 0.86)
      addMapWeight(styles, 'pick_roll', 0.38)
      addMapWeight(styles, 'post_play', 0.16)
      addMapWeight(priorities, 'passing', 1)
      impactMultiplier = 1.18
      break

    case 'DRIBBLE_STYLE':
      addMapWeight(styles, 'primary_creator', 1)
      addMapWeight(styles, 'secondary_creator', 0.82)
      addMapWeight(styles, 'closeout', 0.48)
      addMapWeight(priorities, 'dribbling', 1)
      addMapWeight(priorities, 'speed', 0.38)
      impactMultiplier = 1.18
      break

    case 'DUNKS':
    case 'CONTACT_DUNKS':
      if (group.includes('sans élan')) {
        addMapWeight(styles, 'pick_roll', 0.9)
        addMapWeight(styles, 'post_play', 0.72)
        addMapWeight(styles, 'offensive_rebound', 0.65)
        addMapWeight(styles, 'cuts', 0.42)
      } else {
        addMapWeight(styles, 'cuts', 1)
        addMapWeight(styles, 'closeout', 0.9)
        addMapWeight(styles, 'pick_roll', 0.55)
        addMapWeight(styles, 'primary_creator', 0.38)
        addMapWeight(styles, 'secondary_creator', 0.45)
      }

      addMapWeight(priorities, 'dunk', 1)
      addMapWeight(priorities, 'speed', group.includes('mouvement') ? 0.22 : 0.08)
      impactMultiplier = CONTACT_GROUP_TYPES.has(type) ? 1.5 : 1.12
      break

    case 'ALLEYOOP':
      addMapWeight(styles, 'cuts', 1)
      addMapWeight(styles, 'pick_roll', 0.82)
      addMapWeight(styles, 'offensive_rebound', 0.28)
      addMapWeight(priorities, 'dunk', 0.72)
      impactMultiplier = 1.02
      break

    default:
      if (DRIBBLE_GROUP_TYPES.has(type)) {
        addMapWeight(styles, 'primary_creator', 1)
        addMapWeight(styles, 'secondary_creator', 0.8)
        addMapWeight(styles, 'closeout', 0.34)
        addMapWeight(priorities, 'dribbling', 1)
        addMapWeight(priorities, 'shooting', type.includes('STEPBACK') ? 0.22 : 0)
        impactMultiplier = 1.08
      } else if (TRIPLE_THREAT_GROUP_TYPES.has(type)) {
        addMapWeight(styles, 'secondary_creator', 0.72)
        addMapWeight(styles, 'closeout', 0.7)
        addMapWeight(styles, 'post_play', 0.42)
        addMapWeight(styles, 'primary_creator', 0.28)
        addMapWeight(priorities, 'dribbling', 0.38)
        impactMultiplier = 0.86
      }
      break
  }

  return {
    styles,
    priorities,
    impactMultiplier,
  }
}

function getRequirementRelevance(signature, profile) {
  const requirements = signature.requirements ?? []

  if (requirements.length === 0) {
    return 0.55
  }

  const values = Object.values(profile?.weights ?? {})
  const maxProfileWeight = Math.max(0.35, ...values)
  let highest = 0

  for (const requirement of requirements) {
    highest = Math.max(
      highest,
      Number(profile?.weights?.[requirement.attribute] ?? 0.35) / maxProfileWeight
    )
  }

  return clamp01(highest)
}

export function getAnimationGroupRelevance(signature, profile) {
  const affinity = getGroupAffinityMaps(signature)

  if (affinity.impactMultiplier <= 0) {
    return 0
  }

  const answers = profile?.answers ?? {}
  let raw = 0

  raw += affinity.styles[answers.offensePrimary] ?? 0
  raw += (affinity.styles[answers.offenseSecondary] ?? 0) * 0.55
  raw += (affinity.styles[answers.defensePrimary] ?? 0) * 0.72

  for (const priority of answers.priorities ?? []) {
    raw += (affinity.priorities[priority] ?? 0) * 0.82
  }

  if (raw <= 0) {
    return 0
  }

  const requirementRelevance = getRequirementRelevance(signature, profile)
  const adjusted = raw * (0.72 + requirementRelevance * 0.28)

  return Math.min(2.4, adjusted)
}

function signatureOptionFactor(signature) {
  const count = Math.max(1, Number(signature.count ?? 1))
  const countFactor = 1 + Math.min(0.55, Math.log2(1 + count) * 0.08)
  const requirementCount = signature.requirements?.length ?? 0
  const complexityFactor = 1 + Math.max(0, requirementCount - 1) * 0.07
  const impactMultiplier = getGroupAffinityMaps(signature).impactMultiplier

  return countFactor * complexityFactor * impactMultiplier
}

function signatureValue(signature, profile) {
  const relevance = getAnimationGroupRelevance(signature, profile)

  if (relevance <= 0) {
    return 0
  }

  const noRequirementFactor = (signature.requirements?.length ?? 0) === 0 ? 0.58 : 1

  return relevance * signatureOptionFactor(signature) * noRequirementFactor
}

function getIndex(data = optimizerData) {
  if (
    data?.schemaVersion !== ANIMATION_OPTIMIZER_SCHEMA_VERSION ||
    !Array.isArray(data?.signatures)
  ) {
    return null
  }

  return data
}

export function getAnimationOptimizerStatus(data = optimizerData) {
  const index = getIndex(data)
  const enabled = Boolean(
    index &&
    Number(index.sourceAnimations) === 2914 &&
    index.signatures.length > 0
  )

  return {
    enabled,
    schemaVersion: Number(index?.schemaVersion ?? 0),
    sourceAnimations: Number(index?.sourceAnimations ?? 0),
    eligibleAnimations: Number(index?.eligibleAnimations ?? 0),
    signatureCount: Number(index?.signatures?.length ?? 0),
    groupCount: Number(index?.groups?.length ?? 0),
  }
}

function buildWeightedSignatures(profile, data = optimizerData) {
  const index = getIndex(data)

  if (!index || index.signatures.length === 0) {
    return []
  }

  return index.signatures
    .map((signature, indexPosition) => {
      const value = signatureValue(signature, profile)

      return {
        ...signature,
        indexPosition,
        value,
      }
    })
    .filter((signature) => signature.value >= 0.12)
}

export function createAnimationOptimizationContext(
  profile,
  morphology,
  caps = null,
  data = optimizerData
) {
  const status = getAnimationOptimizerStatus(data)

  if (!status.enabled) {
    return {
      enabled: false,
      status,
      morphology,
      signatures: [],
      attributeIndex: new Map(),
      totalRelevantValue: 0,
      attainableValue: 0,
    }
  }

  const weighted = buildWeightedSignatures(profile, data)
  const signatures = []
  const attributeIndex = new Map()
  let totalRelevantValue = 0
  let heightCompatibleValue = 0
  let attainableValue = 0

  for (const signature of weighted) {
    totalRelevantValue += signature.value

    const heightCompatible = doesAnimationHeightMeetRequirement(
      signature.allowedSizes,
      morphology?.height
    )

    if (!heightCompatible) {
      continue
    }

    heightCompatibleValue += signature.value

    const attainable = caps
      ? signatureAttainable(signature, morphology, caps)
      : true

    if (attainable) {
      attainableValue += signature.value
    }

    const contextSignature = {
      ...signature,
      attainable,
    }

    const contextIndex = signatures.length
    signatures.push(contextSignature)

    for (const requirement of signature.requirements ?? []) {
      if (!attributeIndex.has(requirement.attribute)) {
        attributeIndex.set(requirement.attribute, [])
      }

      attributeIndex.get(requirement.attribute).push(contextIndex)
    }
  }

  return {
    enabled: true,
    status,
    morphology,
    caps,
    signatures,
    attributeIndex,
    totalRelevantValue,
    heightCompatibleValue,
    attainableValue,
  }
}

function evaluateContext(context, attributes = {}) {
  if (!context?.enabled || context.totalRelevantValue <= 0) {
    return {
      enabled: false,
      unlockedValue: 0,
      unlockedAnimations: 0,
      unlockedSignatures: 0,
      globalScore: 0,
      attainableCoverage: 0,
    }
  }

  let unlockedValue = 0
  let unlockedAnimations = 0
  let unlockedSignatures = 0

  for (const signature of context.signatures) {
    if (!signatureRequirementsMeet(signature, attributes)) {
      continue
    }

    unlockedValue += signature.value
    unlockedAnimations += Number(signature.count ?? 1)
    unlockedSignatures += 1
  }

  return {
    enabled: true,
    unlockedValue,
    unlockedAnimations,
    unlockedSignatures,
    globalScore: clamp01(unlockedValue / context.totalRelevantValue),
    attainableCoverage: context.attainableValue > 0
      ? clamp01(unlockedValue / context.attainableValue)
      : 0,
  }
}

export function getAnimationBuildScore(profile, candidate, data = optimizerData) {
  const context = createAnimationOptimizationContext(
    profile,
    candidate?.morphology,
    candidate?.caps ?? null,
    data
  )

  if (!context.enabled) {
    return null
  }

  const coverage = evaluateContext(context, candidate?.attributes ?? {})
  const potential = context.totalRelevantValue > 0
    ? clamp01(context.attainableValue / context.totalRelevantValue)
    : 0

  return clamp01(
    coverage.globalScore * 0.68 +
    coverage.attainableCoverage * 0.22 +
    potential * 0.1
  )
}

export function getAnimationPotentialScore(
  profile,
  morphology,
  caps,
  data = optimizerData
) {
  const context = createAnimationOptimizationContext(
    profile,
    morphology,
    caps,
    data
  )

  if (!context.enabled || context.totalRelevantValue <= 0) {
    return null
  }

  return clamp01(context.attainableValue / context.totalRelevantValue)
}

function getDeficit(signature, attributes = {}) {
  const requirements = signature.requirements ?? []

  if (requirements.length === 0) {
    return 0
  }

  const deficits = requirements.map((requirement) =>
    Math.max(0, requirement.min - requirementValue(requirement, attributes))
  )

  if (signature.operator === 'OR') {
    return Math.min(...deficits)
  }

  return deficits.reduce((sum, value) => sum + value, 0)
}

export function getAnimationStepImpact(
  context,
  beforeAttributes,
  afterAttributes,
  changedAttributeId = null
) {
  if (!context?.enabled || context.totalRelevantValue <= 0) {
    return {
      enabled: false,
      unlockScore: 0,
      lossScore: 0,
      progressScore: 0,
      unlocked: [],
      lost: [],
    }
  }

  const indices = changedAttributeId && context.attributeIndex.has(changedAttributeId)
    ? context.attributeIndex.get(changedAttributeId)
    : context.signatures.map((_, index) => index)

  let unlockedValue = 0
  let lostValue = 0
  let progressValue = 0
  const unlocked = []
  const lost = []

  for (const index of indices) {
    const signature = context.signatures[index]

    if (!signature.attainable) {
      continue
    }

    const beforeMet = signatureRequirementsMeet(signature, beforeAttributes)
    const afterMet = signatureRequirementsMeet(signature, afterAttributes)

    if (!beforeMet && afterMet) {
      unlockedValue += signature.value
      unlocked.push(signature)
      continue
    }

    if (beforeMet && !afterMet) {
      lostValue += signature.value
      lost.push(signature)
      continue
    }

    if (!beforeMet && !afterMet) {
      const beforeDeficit = getDeficit(signature, beforeAttributes)
      const afterDeficit = getDeficit(signature, afterAttributes)

      if (afterDeficit < beforeDeficit && beforeDeficit > 0) {
        const proximity = 1 / Math.max(1, beforeDeficit)
        progressValue += (
          (beforeDeficit - afterDeficit) *
          proximity *
          signature.value
        )
      }
    }
  }

  const denominator = Math.max(0.0001, context.totalRelevantValue)

  return {
    enabled: true,
    unlockScore: clamp01(unlockedValue / denominator),
    lossScore: clamp01(lostValue / denominator),
    progressScore: clamp01(progressValue / denominator),
    unlocked,
    lost,
  }
}

export function getAnimationTargetCeiling(
  context,
  attributeId,
  currentValue,
  cap,
  { maxDistance = 10, attributes = null } = {}
) {
  if (!context?.enabled || !context.attributeIndex.has(attributeId)) {
    return null
  }

  const current = Number(currentValue ?? 25)
  const maximum = Number(cap ?? 99)
  const currentAttributes = {
    ...(attributes ?? {}),
    [attributeId]: current,
  }
  let best = null

  for (const index of context.attributeIndex.get(attributeId)) {
    const signature = context.signatures[index]

    if (!signature.attainable || signatureRequirementsMeet(signature, currentAttributes)) {
      continue
    }

    for (const requirement of signature.requirements ?? []) {
      if (requirement.attribute !== attributeId) {
        continue
      }

      const threshold = Number(requirement.min)
      const distance = threshold - current

      if (
        distance <= 0 ||
        distance > maxDistance ||
        threshold > maximum
      ) {
        continue
      }

      const targetAttributes = {
        ...currentAttributes,
        [attributeId]: threshold,
      }
      const beforeDeficit = getDeficit(signature, currentAttributes)
      const afterDeficit = getDeficit(signature, targetAttributes)

      if (afterDeficit >= beforeDeficit) {
        continue
      }

      const unlocksAtTarget = signatureRequirementsMeet(
        signature,
        targetAttributes
      )
      const deficitReduction = beforeDeficit - afterDeficit
      const score = (
        signature.value *
        (unlocksAtTarget ? 1.6 : 1) *
        (1 + Math.min(0.5, deficitReduction * 0.08))
      ) / Math.max(1, distance)

      if (!best || score > best.score) {
        best = {
          threshold,
          distance,
          score,
          unlocksAtTarget,
          beforeDeficit,
          afterDeficit,
          signature,
        }
      }
    }
  }

  return best
}

function summarizeSignature(signature) {
  const examples = Array.isArray(signature.examples) ? signature.examples : []
  const first = examples[0] ?? null

  return {
    key: signature.key,
    groupType: signature.groupType,
    groupFr: signature.groupFr,
    allowedSizes: signature.allowedSizes,
    operator: signature.operator,
    requirements: signature.requirements ?? [],
    count: Number(signature.count ?? 1),
    name: first?.nameFr ?? first?.nameEn ?? signature.groupFr,
    exampleId: first?.id ?? null,
  }
}

function selectDiverseSignatures(signatures, limit = 5) {
  const selected = []
  const groupCounts = new Map()

  for (const signature of signatures) {
    const groupKey = signature.groupKey ?? `${signature.groupType}|${signature.groupFr}`
    const count = groupCounts.get(groupKey) ?? 0

    if (count >= 1 && selected.length < Math.max(2, limit - 1)) {
      continue
    }

    selected.push(signature)
    groupCounts.set(groupKey, count + 1)

    if (selected.length >= limit) {
      break
    }
  }

  if (selected.length < limit) {
    for (const signature of signatures) {
      if (selected.includes(signature)) {
        continue
      }

      selected.push(signature)
      if (selected.length >= limit) break
    }
  }

  return selected
}

export function getAnimationUnlocksBetween(
  profile,
  beforeBuild,
  afterBuild,
  { limit = 5, data = optimizerData } = {}
) {
  const status = getAnimationOptimizerStatus(data)

  if (!status.enabled) {
    return []
  }

  const weighted = buildWeightedSignatures(profile, data)
  const unlocked = []

  for (const signature of weighted) {
    const beforeAvailable = signatureAvailable(
      signature,
      beforeBuild?.morphology,
      beforeBuild?.attributes ?? {}
    )
    const afterAvailable = signatureAvailable(
      signature,
      afterBuild?.morphology,
      afterBuild?.attributes ?? {}
    )

    if (!beforeAvailable && afterAvailable) {
      unlocked.push(signature)
    }
  }

  unlocked.sort((left, right) => right.value - left.value)

  return selectDiverseSignatures(unlocked, limit).map(summarizeSignature)
}

export function getAnimationAnalysis(
  profile,
  candidate,
  sourceCandidate = null,
  { limit = 5, data = optimizerData } = {}
) {
  const status = getAnimationOptimizerStatus(data)

  if (!status.enabled) {
    return {
      enabled: false,
      status,
      score: null,
      unlockedAnimations: 0,
      unlockedSignatures: 0,
      keyAnimations: [],
      gainedAnimations: [],
    }
  }

  const bodyCaps = candidate?.caps ?? null
  const context = createAnimationOptimizationContext(
    profile,
    candidate?.morphology,
    bodyCaps,
    data
  )
  const coverage = evaluateContext(context, candidate?.attributes ?? {})
  const available = context.signatures
    .filter((signature) => signatureRequirementsMeet(signature, candidate?.attributes ?? {}))
    .sort((left, right) => right.value - left.value)

  const keyAnimations = selectDiverseSignatures(available, limit)
    .map(summarizeSignature)

  const gainedAnimations = sourceCandidate
    ? getAnimationUnlocksBetween(
        profile,
        sourceCandidate,
        candidate,
        { limit, data }
      )
    : []

  return {
    enabled: true,
    status,
    score: Math.round(
      clamp01(
        coverage.globalScore * 0.7 +
        coverage.attainableCoverage * 0.3
      ) * 100
    ),
    unlockedAnimations: coverage.unlockedAnimations,
    unlockedSignatures: coverage.unlockedSignatures,
    relevantPotentialAnimations: context.signatures.reduce(
      (sum, signature) => sum + Number(signature.count ?? 1),
      0
    ),
    keyAnimations,
    gainedAnimations,
  }
}

export default {
  getAnimationOptimizerStatus,
  getAnimationGroupRelevance,
  createAnimationOptimizationContext,
  getAnimationBuildScore,
  getAnimationPotentialScore,
  getAnimationStepImpact,
  getAnimationTargetCeiling,
  getAnimationUnlocksBetween,
  getAnimationAnalysis,
}
