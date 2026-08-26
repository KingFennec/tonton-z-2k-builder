export const ANIMATION_ATTRIBUTE_TO_BUILDER = Object.freeze({
  Agility: 'agility',
  BallControl: 'ballHandle',
  DrivingDunk: 'drivingDunk',
  DrivingLayup: 'drivingLayup',
  PassAccuracy: 'passAccuracy',
  PostControl: 'postControl',
  ShotMidrange: 'midRangeShot',
  ShotThree: 'threePointShot',
  Speed: 'speed',
  SpeedWithBall: 'speedWithBall',
  StandingDunk: 'standingDunk',
  Vertical: 'vertical',
})

export const ANIMATION_ALLOWED_SIZES = Object.freeze([
  'ANY',
  'BIGS_AND_SWINGS',
  'BIGS_ONLY',
  'SMALLS_ONLY',
  'SWINGS_AND_SMALLS',
  'SWINGS_ONLY',
])

export const ANIMATION_REQUIREMENT_OPERATORS = Object.freeze([
  'AND',
  'OR',
])

/*
 * NBA 2K HQ native thresholds recovered from
 * CareerMode_Player_Build_Animation_Library.DoesHeightMeetRequirement:
 *
 *   small/swing boundary = 195
 *   swing/big boundary   = 208
 *
 * In the Builder's integer-inch height domain these boundaries correspond to:
 *   Small = <= 6'4" (76 in)
 *   Swing = 6'5"..6'9" (77..81 in)
 *   Big   = >= 6'10" (82 in)
 */
export const ANIMATION_HEIGHT_THRESHOLDS = Object.freeze({
  nativeSmallSwingCm: 195,
  nativeSwingBigCm: 208,
  swingMinIn: 77,
  bigMinIn: 82,
})

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function getAnimationHeightClass(heightIn) {
  const height = normalizeNumber(heightIn)

  if (height === null) {
    return null
  }

  if (height < ANIMATION_HEIGHT_THRESHOLDS.swingMinIn) {
    return 'SMALL'
  }

  if (height < ANIMATION_HEIGHT_THRESHOLDS.bigMinIn) {
    return 'SWING'
  }

  return 'BIG'
}

export function doesAnimationHeightMeetRequirement(allowedSizes, heightIn) {
  const heightClass = getAnimationHeightClass(heightIn)

  if (heightClass === null) {
    return true
  }

  switch (allowedSizes) {
    case 'SMALLS_ONLY':
      return heightClass === 'SMALL'

    case 'SWINGS_ONLY':
      return heightClass === 'SWING'

    case 'BIGS_ONLY':
      return heightClass === 'BIG'

    case 'SWINGS_AND_SMALLS':
      return heightClass === 'SMALL' || heightClass === 'SWING'

    case 'BIGS_AND_SWINGS':
      return heightClass === 'SWING' || heightClass === 'BIG'

    case 'ANY':
    case null:
    case undefined:
    case '':
      return true

    default:
      return false
  }
}

export function getAnimationBuilderAttributeId(attributeType) {
  return ANIMATION_ATTRIBUTE_TO_BUILDER[attributeType] ?? null
}

export function doesAnimationAttributeRequirementMeet(requirement, attributes = {}) {
  if (!requirement) {
    return true
  }

  const sourceAttribute = requirement.attribute ?? requirement['Attrib Type']
  const minimum = normalizeNumber(requirement.min ?? requirement['Attrib Min'])
  const builderAttributeId = getAnimationBuilderAttributeId(sourceAttribute)

  if (!builderAttributeId || minimum === null) {
    return false
  }

  const currentValue = normalizeNumber(attributes?.[builderAttributeId])

  return currentValue !== null && currentValue >= minimum
}

export function doAnimationAttributeRequirementsMeet(animation, attributes = {}) {
  const normalizedRequirements =
    animation?.requirements?.attributes ??
    animation?.['Attrib Reqs'] ??
    []

  const requirements = Array.isArray(normalizedRequirements)
    ? normalizedRequirements.filter(Boolean)
    : []

  // NBA 2K HQ treats an empty requirements list as satisfied.
  // This includes SIG_GO_TO_SHOT_NONE (OR + 0 requirements).
  if (requirements.length === 0) {
    return true
  }

  const operator =
    animation?.requirements?.operator ??
    animation?.['Attrib Reqs Operator'] ??
    'AND'

  if (operator === 'OR') {
    return requirements.some((requirement) =>
      doesAnimationAttributeRequirementMeet(requirement, attributes)
    )
  }

  return requirements.every((requirement) =>
    doesAnimationAttributeRequirementMeet(requirement, attributes)
  )
}

export function isAnimationSeasonAvailable(animation, season = null) {
  const seasonSpecific = Boolean(
    animation?.seasonSpecific ?? animation?.['Is Season Specific']
  )

  if (!seasonSpecific || season === null || season === undefined || season === '') {
    return true
  }

  const currentSeason = normalizeNumber(season)
  const seasonStart = normalizeNumber(
    animation?.seasonStart ?? animation?.['Season Start']
  )
  const seasonEnd = normalizeNumber(
    animation?.seasonEnd ?? animation?.['Season End']
  )

  if (currentSeason === null || seasonStart === null || seasonEnd === null) {
    return false
  }

  return currentSeason >= seasonStart && currentSeason <= seasonEnd
}

export function evaluateAnimationAvailability(animation, build = {}, options = {}) {
  const height = build?.morphology?.height ?? build?.height
  const attributes = build?.attributes ?? build?.attributeValues ?? {}
  const allowedSizes = animation?.allowedSizes ?? animation?.['Allowed Sizes'] ?? 'ANY'

  const heightMet = doesAnimationHeightMeetRequirement(allowedSizes, height)
  const attributesMet = doAnimationAttributeRequirementsMeet(animation, attributes)
  const seasonMet = isAnimationSeasonAvailable(animation, options.season)

  return {
    available: heightMet && attributesMet && seasonMet,
    heightMet,
    attributesMet,
    seasonMet,
  }
}

export function getMissingAnimationRequirements(animation, build = {}) {
  const missing = []
  const height = build?.morphology?.height ?? build?.height
  const attributes = build?.attributes ?? build?.attributeValues ?? {}
  const allowedSizes = animation?.allowedSizes ?? animation?.['Allowed Sizes'] ?? 'ANY'

  if (!doesAnimationHeightMeetRequirement(allowedSizes, height)) {
    missing.push({
      type: 'height',
      allowedSizes,
    })
  }

  const requirements =
    animation?.requirements?.attributes ??
    animation?.['Attrib Reqs'] ??
    []

  if (!Array.isArray(requirements) || requirements.length === 0) {
    return missing
  }

  const operator =
    animation?.requirements?.operator ??
    animation?.['Attrib Reqs Operator'] ??
    'AND'

  const evaluated = requirements.map((requirement) => {
    const sourceAttribute = requirement.attribute ?? requirement['Attrib Type']
    const builderAttributeId = getAnimationBuilderAttributeId(sourceAttribute)
    const minimum = normalizeNumber(requirement.min ?? requirement['Attrib Min'])
    const current = normalizeNumber(attributes?.[builderAttributeId])

    return {
      sourceAttribute,
      attribute: builderAttributeId,
      min: minimum,
      current,
      met:
        builderAttributeId !== null &&
        minimum !== null &&
        current !== null &&
        current >= minimum,
    }
  })

  if (operator === 'OR' && evaluated.some((item) => item.met)) {
    return missing
  }

  for (const item of evaluated) {
    if (!item.met) {
      missing.push({
        type: 'attribute',
        operator,
        ...item,
      })
    }
  }

  return missing
}
