import {
  getExactBodyBounds,
} from './apkBuilderEngine.js'

const DEFAULT_LIMITS = {
  height: {
    min: null,
    max: null,
  },
  weight: {
    min: null,
    max: null,
  },
  wingspan: {
    min: null,
    max: null,
  },
}

function normalizeNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const number =
    Number(value)

  return Number.isFinite(
    number
  )
    ? number
    : null
}

function normalizeRange(
  range
) {
  if (!range) {
    return {
      min: null,
      max: null,
    }
  }

  return {
    min: normalizeNumber(
      range.min
    ),
    max: normalizeNumber(
      range.max
    ),
  }
}

function hasRangeConstraint(
  range
) {
  return (
    range &&
    (
      range.min !==
        null ||
      range.max !==
        null
    )
  )
}

export function intersectRanges(
  firstRange,
  secondRange
) {
  const first =
    normalizeRange(
      firstRange
    )

  const second =
    normalizeRange(
      secondRange
    )

  let min = null
  let max = null

  const minimums = [
    first.min,
    second.min,
  ].filter(
    (value) =>
      value !== null
  )

  const maximums = [
    first.max,
    second.max,
  ].filter(
    (value) =>
      value !== null
  )

  if (
    minimums.length >
    0
  ) {
    min = Math.max(
      ...minimums
    )
  }

  if (
    maximums.length >
    0
  ) {
    max = Math.min(
      ...maximums
    )
  }

  return {
    min,
    max,
    impossible:
      min !== null &&
      max !== null &&
      min > max,
  }
}

export function isValueInRange(
  value,
  range
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return true
  }

  const numericValue =
    Number(value)

  const normalized =
    normalizeRange(
      range
    )

  if (
    normalized.min !==
      null &&
    numericValue <
      normalized.min
  ) {
    return false
  }

  if (
    normalized.max !==
      null &&
    numericValue >
      normalized.max
  ) {
    return false
  }

  return true
}

export function rangesOverlap(
  firstRange,
  secondRange
) {
  const intersection =
    intersectRanges(
      firstRange,
      secondRange
    )

  return (
    !intersection.impossible
  )
}

/*
 * Le moteur accepte plusieurs
 * formats de données.
 *
 * Format actuel :
 *
 * badge.height
 *
 * Mais il acceptera aussi :
 *
 * badge.weight
 * badge.wingspan
 *
 * ou :
 *
 * badge.morphology.height
 *
 * ou même une restriction
 * spécifique à un niveau :
 *
 * badge.tiers.gold.morphology.height
 */
export function getBadgeMorphologyRestriction(
  badge,
  tier
) {
  const tierMorphology =
    badge?.tiers?.[
      tier
    ]?.morphology ??
    {}

  const badgeMorphology =
    badge?.morphology ??
    {}

  return {
    height:
      normalizeRange(
        tierMorphology.height ??
        badgeMorphology.height ??
        badge?.height
      ),

    weight:
      normalizeRange(
        tierMorphology.weight ??
        badgeMorphology.weight ??
        badge?.weight
      ),

    wingspan:
      normalizeRange(
        tierMorphology.wingspan ??
        badgeMorphology.wingspan ??
        badge?.wingspan
      ),
  }
}

export function mergeMorphologyLimits(
  baseLimits,
  newRestriction
) {
  const base =
    baseLimits ??
    DEFAULT_LIMITS

  const restriction =
    newRestriction ??
    DEFAULT_LIMITS

  const height =
    intersectRanges(
      base.height,
      restriction.height
    )

  const weight =
    intersectRanges(
      base.weight,
      restriction.weight
    )

  const wingspan =
    intersectRanges(
      base.wingspan,
      restriction.wingspan
    )

  return {
    height: {
      min: height.min,
      max: height.max,
    },

    weight: {
      min: weight.min,
      max: weight.max,
    },

    wingspan: {
      min:
        wingspan.min,
      max:
        wingspan.max,
    },

    impossible:
      Boolean(
        base.impossible
      ) ||
      height.impossible ||
      weight.impossible ||
      wingspan.impossible,

    sources:
      base.sources ?? {
        height: [],
        weight: [],
        wingspan: [],
      },
  }
}

export function getSelectedBadgeMorphologyLimits(
  badges,
  selectedBadges,
  excludeBadgeId = null
) {
  let limits = {
    height: {
      min: null,
      max: null,
    },

    weight: {
      min: null,
      max: null,
    },

    wingspan: {
      min: null,
      max: null,
    },

    impossible: false,

    sources: {
      height: [],
      weight: [],
      wingspan: [],
    },
  }

  for (
    const [
      badgeId,
      selection,
    ] of Object.entries(
      selectedBadges
    )
  ) {
    if (
      badgeId ===
      excludeBadgeId
    ) {
      continue
    }

    const badge =
      badges.find(
        (item) =>
          item.id ===
          badgeId
      )

    if (!badge) {
      continue
    }

    const restriction =
      getBadgeMorphologyRestriction(
        badge,
        selection.tier
      )

    const merged =
      mergeMorphologyLimits(
        limits,
        restriction
      )

    const sources = {
      height: [
        ...limits.sources.height,
      ],

      weight: [
        ...limits.sources.weight,
      ],

      wingspan: [
        ...limits.sources.wingspan,
      ],
    }

    for (
      const field of [
        'height',
        'weight',
        'wingspan',
      ]
    ) {
      if (
        hasRangeConstraint(
          restriction[
            field
          ]
        )
      ) {
        sources[
          field
        ].push({
          badgeId,
          tier:
            selection.tier,
          range:
            restriction[
              field
            ],
        })
      }
    }

    limits = {
      ...merged,
      sources,
    }
  }

  return limits
}

function getPositionFieldRange(
  position,
  field,
  morphology = {}
) {
  const fallback =
    position?.[field] ?? {
      min: null,
      max: null,
    }

  if (
    (field !== 'weight' &&
      field !== 'wingspan') ||
    morphology?.height === '' ||
    morphology?.height === null ||
    morphology?.height === undefined
  ) {
    return fallback
  }

  const exactBounds =
    getExactBodyBounds(
      morphology.height,
      position?.id ?? null
    )

  const exactRange =
    exactBounds?.[field]

  if (!exactRange) {
    return fallback
  }

  const intersection =
    intersectRanges(
      fallback,
      exactRange
    )

  if (intersection.impossible) {
    return fallback
  }

  return {
    min:
      intersection.min ??
      fallback.min,

    max:
      intersection.max ??
      fallback.max,
  }
}

export function isPositionCompatibleWithConstraints(
  position,
  morphology = {},
  limits = DEFAULT_LIMITS
) {
  if (!position) {
    return false
  }

  if (
    limits.impossible
  ) {
    return false
  }

  const fields = [
    'height',
    'weight',
    'wingspan',
  ]

  for (
    const field
    of fields
  ) {
    const positionRange =
      getPositionFieldRange(
        position,
        field,
        morphology
      )

    const badgeRange =
      limits[field] ??
      {
        min: null,
        max: null,
      }

    if (
      !rangesOverlap(
        positionRange,
        badgeRange
      )
    ) {
      return false
    }

    const currentValue =
      morphology[field]

    if (
      currentValue !== '' &&
      currentValue !== null &&
      currentValue !==
        undefined
    ) {
      if (
        !isValueInRange(
          currentValue,
          positionRange
        )
      ) {
        return false
      }

      if (
        !isValueInRange(
          currentValue,
          badgeRange
        )
      ) {
        return false
      }
    }
  }

  return true
}

export function isMorphologyCompatibleWithLimits(
  morphology,
  position,
  limits
) {
  if (
    limits?.impossible
  ) {
    return false
  }

  if (position) {
    return (
      isPositionCompatibleWithConstraints(
        position,
        morphology,
        limits
      )
    )
  }

  for (
    const field of [
      'height',
      'weight',
      'wingspan',
    ]
  ) {
    if (
      !isValueInRange(
        morphology?.[
          field
        ],
        limits?.[
          field
        ]
      )
    ) {
      return false
    }
  }

  return true
}

export function isBadgeMorphologyCompatibleWithBuild(
  badge,
  tier,
  morphology,
  position,
  otherBadgeLimits
) {
  const restriction =
    getBadgeMorphologyRestriction(
      badge,
      tier
    )

  const combined =
    mergeMorphologyLimits(
      otherBadgeLimits,
      restriction
    )

  return (
    isMorphologyCompatibleWithLimits(
      morphology,
      position,
      combined
    )
  )
}

export function getCompatiblePositions(
  positions,
  morphology = {},
  limits = DEFAULT_LIMITS
) {
  /*
   * Compatibilité avec
   * l'ancienne signature :
   *
   * getCompatiblePositions(
   *   positions,
   *   height
   * )
   */
  const normalizedMorphology =
    typeof morphology ===
    'object'
      ? morphology
      : {
          height:
            morphology,
        }

  return positions.filter(
    (position) =>
      isPositionCompatibleWithConstraints(
        position,
        normalizedMorphology,
        limits
      )
  )
}

export function getPositionById(
  positions,
  positionId
) {
  if (!positionId) {
    return null
  }

  return (
    positions.find(
      (position) =>
        position.id ===
        positionId
    ) ??
    null
  )
}

export function inchesToHeight(
  inches
) {
  if (
    inches === '' ||
    inches === null ||
    inches === undefined
  ) {
    return '—'
  }

  const feet =
    Math.floor(
      inches / 12
    )

  const remainingInches =
    inches % 12

  return `${feet}'${remainingInches}"`
}

export function getHeightOptions(
  min = 69,
  max = 88
) {
  const options = []

  for (
    let height = min;
    height <= max;
    height += 1
  ) {
    options.push(
      height
    )
  }

  return options
}

export function getAvailableHeightOptions(
  allOptions,
  selectedPosition,
  limits
) {
  return allOptions.filter(
    (height) => {
      if (
        selectedPosition &&
        !isValueInRange(
          height,
          selectedPosition.height
        )
      ) {
        return false
      }

      if (
        !isValueInRange(
          height,
          limits?.height
        )
      ) {
        return false
      }

      return true
    }
  )
}

function getRangeForPositions(
  positions,
  field,
  fallback,
  badgeLimit
) {
  let baseRange

  if (
    positions.length ===
    0
  ) {
    baseRange = {
      ...fallback,
    }
  } else {
    baseRange = {
      min: Math.min(
        ...positions.map(
          (position) =>
            position[
              field
            ].min
        )
      ),

      max: Math.max(
        ...positions.map(
          (position) =>
            position[
              field
            ].max
        )
      ),
    }
  }

  const intersection =
    intersectRanges(
      baseRange,
      badgeLimit
    )

  if (
    intersection.impossible
  ) {
    return baseRange
  }

  return {
    min:
      intersection.min ??
      baseRange.min,

    max:
      intersection.max ??
      baseRange.max,
  }
}

function getExactRangeForPositions(
  positions,
  field,
  fallback,
  badgeLimit,
  height
) {
  if (
    height === '' ||
    height === null ||
    height === undefined
  ) {
    return getRangeForPositions(
      positions,
      field,
      fallback,
      badgeLimit
    )
  }

  const ranges =
    positions
      .map((position) =>
        getPositionFieldRange(
          position,
          field,
          { height }
        )
      )
      .filter((range) =>
        range?.min !== null &&
        range?.max !== null
      )

  if (ranges.length === 0) {
    return getRangeForPositions(
      positions,
      field,
      fallback,
      badgeLimit
    )
  }

  const baseRange = {
    min: Math.min(
      ...ranges.map(
        (range) => range.min
      )
    ),
    max: Math.max(
      ...ranges.map(
        (range) => range.max
      )
    ),
  }

  const intersection =
    intersectRanges(
      baseRange,
      badgeLimit
    )

  if (intersection.impossible) {
    return baseRange
  }

  return {
    min:
      intersection.min ??
      baseRange.min,
    max:
      intersection.max ??
      baseRange.max,
  }
}

export function getWeightRangeForPositions(
  positions,
  badgeLimit = null,
  height = null
) {
  return getExactRangeForPositions(
    positions,
    'weight',
    {
      min: 145,
      max: 290,
    },
    badgeLimit,
    height
  )
}

export function getWingspanRangeForPositions(
  positions,
  badgeLimit = null,
  height = null
) {
  return getExactRangeForPositions(
    positions,
    'wingspan',
    {
      min: 69,
      max: 94,
    },
    badgeLimit,
    height
  )
}

export function clampValueToRange(
  value,
  range
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return value
  }

  let result =
    Number(value)

  if (
    range?.min !==
    null &&
    range?.min !==
    undefined
  ) {
    result =
      Math.max(
        result,
        range.min
      )
  }

  if (
    range?.max !==
    null &&
    range?.max !==
    undefined
  ) {
    result =
      Math.min(
        result,
        range.max
      )
  }

  return result
}