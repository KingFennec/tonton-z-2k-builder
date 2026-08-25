import morphologyData from '../data/nba2k27/apk/morphology.json' with { type: 'json' }
import constraintsData from '../data/nba2k27/apk/attribute_constraints.json' with { type: 'json' }
import gnrData from '../data/nba2k27/apk/gnr_model.json' with { type: 'json' }

export const BUILDER_ATTRIBUTE_IDS = [
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

export const APK_ATTRIBUTE_KEYS = [
  'shot_close',
  'driving_layup',
  'driving_dunk',
  'standing_dunk',
  'post_control',
  'mid_range',
  'three_point',
  'free_throw',
  'pass_accuracy',
  'ball_handle',
  'speed_with_ball',
  'interior_defense',
  'perimeter_defense',
  'steal',
  'block',
  'offensive_rebound',
  'defensive_rebound',
  'speed',
  'agility',
  'strength',
  'vertical',
]

const BUILDER_TO_APK = Object.fromEntries(
  BUILDER_ATTRIBUTE_IDS.map((id, index) => [id, APK_ATTRIBUTE_KEYS[index]])
)

const APK_TO_BUILDER = Object.fromEntries(
  APK_ATTRIBUTE_KEYS.map((key, index) => [key, BUILDER_ATTRIBUTE_IDS[index]])
)

const POSITION_TO_APK = {
  PG: 'point_guard',
  SG: 'shooting_guard',
  SF: 'small_forward',
  PF: 'power_forward',
  C: 'center',
}

const f32 = Math.fround
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function fadd(a, b) {
  return f32(f32(a) + f32(b))
}

function fsub(a, b) {
  return f32(f32(a) - f32(b))
}

function fmul(a, b) {
  return f32(f32(a) * f32(b))
}

function fdiv(a, b) {
  return f32(f32(a) / f32(b))
}

function fmadd(a, b, c) {
  return f32(Number(f32(a)) * Number(f32(b)) + Number(f32(c)))
}

export function roundTiesEven(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return number
  }

  const floor = Math.floor(number)
  const fraction = number - floor

  if (fraction < 0.5) {
    return floor
  }

  if (fraction > 0.5) {
    return floor + 1
  }

  return floor % 2 === 0 ? floor : floor + 1
}

function heightIndex(heightIn) {
  return clamp(roundTiesEven(Number(heightIn)) - 63, 0, 30)
}

function normalizedHeight(heightIn) {
  return 63 + heightIndex(heightIn)
}

function makeHeightGroups(rows, valueKey) {
  const groups = new Map()

  for (const row of rows) {
    const height = Number(row.height_in)

    if (!groups.has(height)) {
      groups.set(height, [])
    }

    groups.get(height).push(row)
  }

  for (const list of groups.values()) {
    list.sort((a, b) => Number(a[valueKey]) - Number(b[valueKey]))
  }

  return groups
}

const weightGroups = makeHeightGroups(morphologyData.weight_rows, 'weight_lb')
const wingspanGroups = makeHeightGroups(morphologyData.wingspan_rows, 'wingspan_in')
const heightMultipliers = new Map(
  morphologyData.height_multipliers.map((row) => [
    Number(row.height_in),
    row.multipliers,
  ])
)
const constraintHeights = new Map(
  constraintsData.heights.map((row) => [
    Number(row.height_in),
    row.constraints,
  ])
)

function interpF32(x, x0, y0, x1, y1) {
  const nx = f32(x)
  const nx0 = f32(x0)
  const nx1 = f32(x1)
  const ny0 = f32(y0)
  const ny1 = f32(y1)

  if (nx1 === nx0) {
    return ny0
  }

  const ratio = f32((nx - nx0) / (nx1 - nx0))
  return f32(ny0 + f32(ratio * f32(ny1 - ny0)))
}

function bodyMultiplier(groups, valueKey, attributeId, heightIn, bodyValue) {
  const apkKey = BUILDER_TO_APK[attributeId]

  if (!apkKey) {
    throw new Error(`Unknown Builder attribute: ${attributeId}`)
  }

  const heights = [...groups.keys()].sort((a, b) => a - b)
  const height = clamp(roundTiesEven(Number(heightIn)), heights[0], heights.at(-1))
  const pair = groups.get(height)

  const low = pair[0]
  const high = pair.at(-1)
  const value = clamp(
    roundTiesEven(Number(bodyValue)),
    Number(low[valueKey]),
    Number(high[valueKey])
  )

  return interpF32(
    value,
    low[valueKey],
    low.multipliers[apkKey],
    high[valueKey],
    high.multipliers[apkKey]
  )
}

function getHeightMultiplier(attributeId, heightIn) {
  const apkKey = BUILDER_TO_APK[attributeId]
  const row = heightMultipliers.get(normalizedHeight(heightIn))

  if (!apkKey || !row) {
    throw new Error(`Unable to resolve height multiplier for ${attributeId}`)
  }

  return Number(row[apkKey])
}

export function getExactMaxCap(attributeId, heightIn, weightLb, wingspanIn) {
  const heightMultiplier = f32(getHeightMultiplier(attributeId, heightIn))
  const weightMultiplier = f32(
    bodyMultiplier(weightGroups, 'weight_lb', attributeId, heightIn, weightLb)
  )
  const wingspanMultiplier = f32(
    bodyMultiplier(wingspanGroups, 'wingspan_in', attributeId, heightIn, wingspanIn)
  )

  let value = f32(99 - 25)
  value = f32(value * heightMultiplier)
  value = f32(value * weightMultiplier)
  value = f32(value * wingspanMultiplier)
  value = f32(25 + value)

  return clamp(roundTiesEven(value), 25, 99)
}

export function getExactBodyCaps(morphology) {
  const height = morphology?.height
  const weight = morphology?.weight
  const wingspan = morphology?.wingspan

  if (
    height === '' ||
    height === null ||
    height === undefined ||
    weight === '' ||
    weight === null ||
    weight === undefined ||
    wingspan === '' ||
    wingspan === null ||
    wingspan === undefined
  ) {
    return {
      available: false,
      caps: null,
      quality: 'unavailable',
      confidence: 'unavailable',
      estimationType: 'unavailable',
      reason: 'incomplete-morphology',
      source: 'nba2k27-apk',
    }
  }

  const caps = Object.fromEntries(
    BUILDER_ATTRIBUTE_IDS.map((attributeId) => [
      attributeId,
      getExactMaxCap(attributeId, height, weight, wingspan),
    ])
  )

  return {
    available: true,
    caps,
    quality: 'exact',
    confidence: 'exact',
    estimationType: 'measured',
    reason: null,
    source: 'nba2k27-apk',
  }
}

export function getExactBodyBounds(heightIn, positionId = null) {
  if (heightIn === '' || heightIn === null || heightIn === undefined) {
    return null
  }

  const height = roundTiesEven(Number(heightIn))
  const weightHeights = [...weightGroups.keys()].sort((a, b) => a - b)
  const wingspanHeights = [...wingspanGroups.keys()].sort((a, b) => a - b)

  const weightHeight = clamp(height, weightHeights[0], weightHeights.at(-1))
  const wingspanHeight = clamp(height, wingspanHeights[0], wingspanHeights.at(-1))

  const weightRows = weightGroups.get(weightHeight)
  const wingspanRows = wingspanGroups.get(wingspanHeight)

  let minWeight = roundTiesEven(weightRows[0].weight_lb)
  let maxWeight = roundTiesEven(weightRows.at(-1).weight_lb)

  if (positionId && POSITION_TO_APK[positionId]) {
    const positionRange = morphologyData.position_ranges[POSITION_TO_APK[positionId]]

    minWeight = Math.max(minWeight, roundTiesEven(positionRange.min_weight_lb))
    maxWeight = Math.min(maxWeight, roundTiesEven(positionRange.max_weight_lb))
  }

  return {
    weight: {
      min: minWeight,
      max: maxWeight,
    },
    wingspan: {
      min: roundTiesEven(wingspanRows[0].wingspan_in),
      max: roundTiesEven(wingspanRows.at(-1).wingspan_in),
    },
  }
}

export function getExactDependencyRules(heightIn) {
  if (heightIn === '' || heightIn === null || heightIn === undefined) {
    return []
  }

  const height = normalizedHeight(heightIn)
  const constraints = constraintHeights.get(height)

  if (!constraints) {
    return []
  }

  const rules = []

  for (const [sourceApkKey, associated] of Object.entries(constraints)) {
    const source = APK_TO_BUILDER[sourceApkKey]

    if (!source) {
      continue
    }

    for (const rule of associated) {
      const target = APK_TO_BUILDER[rule.attribute]

      if (!target) {
        continue
      }

      const maxDelta = Number(rule.max_delta)

      rules.push({
        id: `apk-${height}-${source}-${target}`,
        source,
        target,
        type: 'linear-offset',
        multiplier: 1,
        offset: -maxDelta,
        floor: 25,
        status: 'verified',
        sourceType: 'nba2k27-apk',
        height,
        maxDelta,
      })
    }
  }

  return rules
}

function normalizeRatings(input, fallback = 25) {
  if (Array.isArray(input)) {
    if (input.length !== 21) {
      throw new Error(`Expected 21 ratings, got ${input.length}`)
    }

    return input.map((value) => Number(value))
  }

  return BUILDER_ATTRIBUTE_IDS.map((id) => Number(input?.[id] ?? fallback))
}

function remap(value, params, doClamp = false) {
  let [inMin, inMax, outMin, outMax] = params.map(f32)
  const x = fsub(f32(value), inMin)
  const outSpan = fsub(outMax, outMin)
  const inSpan = fsub(inMax, inMin)
  let y = fdiv(fmul(outSpan, x), inSpan)
  y = fadd(y, outMin)

  if (doClamp) {
    const low = Math.min(outMin, outMax)
    const high = Math.max(outMin, outMax)
    y = f32(clamp(y, low, high))
  }

  return y
}

function calculateGnrDirect(ratingsInput, heightIn, clampFinalLerp = false) {
  const values = normalizeRatings(ratingsInput, 25).map((value) => Math.trunc(value))
  const hIndex = heightIndex(heightIn)
  const lerp = gnrData.overall_height_lerp[hIndex]

  let bestDetailed = null
  let bestRaw = null
  let bestPlayerType = 0

  for (let playerType = 0; playerType < 15; playerType += 1) {
    let numerator = f32(0)
    let denominator = f32(0)
    const weights = gnrData.overall_weights[hIndex][playerType]

    for (let index = 0; index < 21; index += 1) {
      const rating = values[index]
      const baseWeight = f32(weights[index])

      if (baseWeight === 0) {
        continue
      }

      const scale = f32(gnrData.rating_weight_scale[index][rating])
      const effectiveWeight = fmul(baseWeight, scale)
      numerator = fmadd(effectiveWeight, f32(rating), numerator)
      denominator = fadd(denominator, effectiveWeight)
    }

    let raw = denominator !== 0 ? fdiv(numerator, denominator) : f32(25)
    raw = f32(Math.max(raw, f32(25)))
    const detailed = remap(raw, lerp, clampFinalLerp)

    if (bestDetailed === null || detailed > bestDetailed) {
      bestDetailed = detailed
      bestRaw = raw
      bestPlayerType = playerType
    }
  }

  return {
    detailed: Number(bestDetailed),
    displayed: Math.floor(bestDetailed),
    rawWeightedRating: Number(bestRaw),
    playerType: bestPlayerType,
    heightIndex: hIndex,
  }
}

export function calculateExactGnr(
  ratingsInput,
  heightIn,
  { caps = null, clampFinalLerp = false, uiRounding = true } = {}
) {
  if (heightIn === '' || heightIn === null || heightIn === undefined) {
    return {
      available: false,
      displayed: null,
      detailed: null,
      reason: 'missing-height',
      source: 'nba2k27-apk',
    }
  }

  const values = normalizeRatings(ratingsInput, 25).map((value) => Math.trunc(value))
  const capValues =
    caps == null
      ? Array(21).fill(99)
      : normalizeRatings(caps, 99).map((value) => Math.trunc(value))
  const capsWereSupplied = caps != null

  const current = calculateGnrDirect(values, heightIn, clampFinalLerp)
  let detailed = f32(current.detailed)

  if (uiRounding && detailed >= 84 && detailed <= 99) {
    const nearest = f32(roundTiesEven(detailed))

    if (nearest !== detailed) {
      const baseFloor = Math.floor(detailed)
      let foundNonCrossingUpgrade = false

      for (let index = 0; index < 21; index += 1) {
        if (values[index] >= capValues[index]) {
          continue
        }

        const candidate = values.slice()
        candidate[index] += 1
        const candidateResult = calculateGnrDirect(candidate, heightIn, clampFinalLerp)

        if (Math.floor(candidateResult.detailed) === baseFloor) {
          foundNonCrossingUpgrade = true
          break
        }
      }

      if (!foundNonCrossingUpgrade) {
        detailed = f32(Math.ceil(detailed))
      }
    }
  }

  if (capsWereSupplied) {
    if (values.every((value, index) => value >= capValues[index])) {
      detailed = f32(99)
    } else if (detailed >= 99) {
      detailed = f32(99)
    } else {
      detailed = f32(Math.min(detailed, f32(99.9)))
    }
  }

  return {
    available: true,
    displayed: Math.floor(detailed),
    detailed: Number(detailed),
    rawWeightedRating: current.rawWeightedRating,
    playerType: current.playerType,
    heightIndex: current.heightIndex,
    source: 'nba2k27-apk',
  }
}


/**
 * Reproduction of ATTRIBUTES_GetCapBreakerBoostValuesForAttrAtIndex.
 *
 * The native routine returns up to five successive rating boosts.
 * It does NOT spend GNR budget and it stops at the morphology cap.
 */
export function getCapBreakerProjection(
  attributeId,
  ratingsInput,
  morphology
) {
  const attributeIndex = BUILDER_ATTRIBUTE_IDS.indexOf(attributeId)

  if (attributeIndex < 0) {
    throw new Error(`Unknown Builder attribute: ${attributeId}`)
  }

  const height = morphology?.height
  const weight = morphology?.weight
  const wingspan = morphology?.wingspan

  if (
    height === '' || height === null || height === undefined ||
    weight === '' || weight === null || weight === undefined ||
    wingspan === '' || wingspan === null || wingspan === undefined
  ) {
    return {
      available: false,
      attributeId,
      boosts: [0, 0, 0, 0, 0],
      reason: 'incomplete-morphology',
      source: 'nba2k27-apk',
    }
  }

  const ratings = normalizeRatings(ratingsInput, 25).map((value) =>
    clamp(Math.trunc(Number(value)), 25, 99)
  )

  const baseValue = ratings[attributeIndex]
  const maxCap = getExactMaxCap(attributeId, height, weight, wingspan)

  if (baseValue >= maxCap) {
    return {
      available: true,
      attributeId,
      baseValue,
      maxCap,
      boosts: [0, 0, 0, 0, 0],
      cumulativeValues: [baseValue, baseValue, baseValue, baseValue, baseValue],
      totalBoost: 0,
      finalValue: baseValue,
      playerType: calculateGnrDirect(ratings, height, false).playerType,
      source: 'nba2k27-apk',
    }
  }

  const gnr = calculateGnrDirect(ratings, height, false)
  const weights = gnrData.overall_weights[gnr.heightIndex][gnr.playerType]
  const maxWeight = f32(Math.max(...weights.map((value) => Number(value))))
  const targetWeight = f32(Number(weights[attributeIndex]))

  let rating = baseValue
  const boosts = []
  const cumulativeValues = []

  for (let point = 0; point < 5; point += 1) {
    const remaining = maxCap - rating

    if (remaining <= 0) {
      boosts.push(0)
      cumulativeValues.push(rating)
      continue
    }

    // Exact integer simplification of the native division sequence:
    // 15 - floor(14 * (rating - 25) / 74), for ratings 25..99.
    const ratingFactor = 15 - Math.floor((14 * (rating - 25)) / 74)

    let boost = 1

    if (maxWeight > 0) {
      const weightGap = fsub(maxWeight, targetWeight)
      const scaled = fdiv(fmul(weightGap, f32(ratingFactor)), maxWeight)
      boost = Math.max(1, roundTiesEven(scaled))
    }

    boost = Math.min(boost, remaining)
    boosts.push(boost)
    rating += boost
    cumulativeValues.push(rating)
  }

  return {
    available: true,
    attributeId,
    baseValue,
    maxCap,
    boosts,
    cumulativeValues,
    totalBoost: boosts.reduce((sum, value) => sum + value, 0),
    finalValue: rating,
    playerType: gnr.playerType,
    heightIndex: gnr.heightIndex,
    targetWeight: Number(targetWeight),
    maxWeight: Number(maxWeight),
    source: 'nba2k27-apk',
  }
}

export function getAllCapBreakerProjections(ratingsInput, morphology) {
  return Object.fromEntries(
    BUILDER_ATTRIBUTE_IDS.map((attributeId) => [
      attributeId,
      getCapBreakerProjection(attributeId, ratingsInput, morphology),
    ])
  )
}

export function getApkDataMeta() {
  return {
    source: 'NBA 2K HQ APK',
    game: 'NBA 2K27',
    morphologySchema: morphologyData.schema_version,
    constraintsSchema: constraintsData.schema_version,
    gnrSchema: gnrData.schema_version,
  }
}
