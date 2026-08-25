import {
  GNR_ISOLATED_CURVES,
  GNR_RESEARCH_META,
} from '../data/nba2k27/gnrResearchData.js'

const EPSILON =
  0.0000001

function toFiniteNumber(
  value
) {
  const number =
    Number(value)

  return Number.isFinite(
    number
  )
    ? number
    : null
}

function almostEqual(
  first,
  second
) {
  return (
    Math.abs(
      first -
      second
    ) <=
    EPSILON
  )
}

function getCurve(
  attributeId
) {
  return (
    GNR_ISOLATED_CURVES[
      attributeId
    ] ??
    null
  )
}

function getExactPoint(
  curve,
  value
) {
  return (
    curve.points.find(
      (point) =>
        almostEqual(
          point.value,
          value
        )
    ) ??
    null
  )
}

function getBoundingPoints(
  curve,
  value
) {
  let lower =
    null

  let upper =
    null

  for (
    const point
    of curve.points
  ) {
    if (
      point.value <
      value
    ) {
      lower =
        point

      continue
    }

    if (
      point.value >
      value
    ) {
      upper =
        point

      break
    }
  }

  return {
    lower,
    upper,
  }
}

/*
 * =========================================================
 * INFORMATIONS DE COUVERTURE
 * =========================================================
 */

export function getGnrCurveCoverage(
  attributeId
) {
  const curve =
    getCurve(
      attributeId
    )

  if (!curve) {
    return {
      supported:
        false,

      attributeId,

      min:
        null,

      max:
        null,

      measuredPoints:
        [],
    }
  }

  const firstPoint =
    curve.points[0]

  const lastPoint =
    curve.points[
      curve.points.length -
        1
    ]

  return {
    supported:
      true,

    attributeId,

    label:
      curve.label,

    min:
      firstPoint.value,

    max:
      lastPoint.value,

    baseline:
      curve.baseline,

    measuredPoints:
      curve.points.map(
        (point) => ({
          ...point,
        })
      ),
  }
}

/*
 * =========================================================
 * GNR AFFICHÉ OBSERVÉ / INTERPOLÉ
 *
 * IMPORTANT :
 *
 * Ce n'est PAS encore le coût interne exact utilisé
 * par NBA 2K27.
 *
 * Nous interpolons uniquement entre des valeurs de GNR
 * affichées et réellement relevées.
 *
 * Aucune extrapolation n'est autorisée.
 * =========================================================
 */

export function getExperimentalDisplayedGnrAtValue(
  attributeId,
  rawValue
) {
  const value =
    toFiniteNumber(
      rawValue
    )

  if (
    value ===
    null
  ) {
    return {
      supported:
        false,

      reason:
        'invalid-value',

      attributeId,
      value:
        rawValue,
    }
  }

  const curve =
    getCurve(
      attributeId
    )

  if (!curve) {
    return {
      supported:
        false,

      reason:
        'missing-curve',

      attributeId,
      value,
    }
  }

  const firstPoint =
    curve.points[0]

  const lastPoint =
    curve.points[
      curve.points.length -
        1
    ]

  if (
    value <
      firstPoint.value ||
    value >
      lastPoint.value
  ) {
    return {
      supported:
        false,

      reason:
        'outside-measured-range',

      attributeId,
      value,

      measuredRange: {
        min:
          firstPoint.value,

        max:
          lastPoint.value,
      },
    }
  }

  const exactPoint =
    getExactPoint(
      curve,
      value
    )

  if (exactPoint) {
    return {
      supported:
        true,

      attributeId,
      value,

      displayedGnr:
        exactPoint.gnr,

      mode:
        'measured',

      lowerPoint:
        exactPoint,

      upperPoint:
        exactPoint,
    }
  }

  const {
    lower,
    upper,
  } =
    getBoundingPoints(
      curve,
      value
    )

  if (
    !lower ||
    !upper
  ) {
    return {
      supported:
        false,

      reason:
        'missing-interpolation-bracket',

      attributeId,
      value,
    }
  }

  const range =
    upper.value -
    lower.value

  if (
    range <=
    0
  ) {
    return {
      supported:
        false,

      reason:
        'invalid-curve-range',

      attributeId,
      value,
    }
  }

  const progress =
    (
      value -
      lower.value
    ) /
    range

  const displayedGnr =
    lower.gnr +
    (
      upper.gnr -
      lower.gnr
    ) *
      progress

  return {
    supported:
      true,

    attributeId,
    value,

    displayedGnr,

    mode:
      'interpolated',

    lowerPoint:
      lower,

    upperPoint:
      upper,
  }
}

/*
 * =========================================================
 * COÛT RELATIF À LA BASELINE DE LA COURBE
 *
 * Exemple :
 *
 * Pass64 = GNR58
 * Pass99 = GNR70
 *
 * coût relatif Pass99
 * = 70 - 58
 * = +12
 *
 * Cela ne signifie PAS encore que Pass99 coûte 12 points
 * depuis un attribut à 25.
 * =========================================================
 */

export function getExperimentalRelativeGnrCost(
  attributeId,
  rawValue
) {
  const curve =
    getCurve(
      attributeId
    )

  if (!curve) {
    return {
      supported:
        false,

      reason:
        'missing-curve',

      attributeId,
    }
  }

  const valueResult =
    getExperimentalDisplayedGnrAtValue(
      attributeId,
      rawValue
    )

  if (
    !valueResult.supported
  ) {
    return {
      ...valueResult,

      relativeCost:
        null,
    }
  }

  const baselineResult =
    getExperimentalDisplayedGnrAtValue(
      attributeId,
      curve.baseline.value
    )

  if (
    !baselineResult.supported
  ) {
    return {
      supported:
        false,

      reason:
        'invalid-baseline',

      attributeId,
    }
  }

  return {
    supported:
      true,

    attributeId,

    value:
      valueResult.value,

    baselineValue:
      curve.baseline.value,

    baselineGnr:
      curve.baseline.gnr,

    relativeCost:
      valueResult.displayedGnr -
      baselineResult.displayedGnr,

    mode:
      valueResult.mode,
  }
}

/*
 * =========================================================
 * DELTA ENTRE DEUX VALEURS DU MÊME ATTRIBUT
 * =========================================================
 */

export function getExperimentalGnrDelta(
  attributeId,
  rawFromValue,
  rawToValue
) {
  const fromResult =
    getExperimentalDisplayedGnrAtValue(
      attributeId,
      rawFromValue
    )

  const toResult =
    getExperimentalDisplayedGnrAtValue(
      attributeId,
      rawToValue
    )

  if (
    !fromResult.supported ||
    !toResult.supported
  ) {
    return {
      supported:
        false,

      attributeId,

      from:
        rawFromValue,

      to:
        rawToValue,

      reason:
        !fromResult.supported
          ? fromResult.reason
          : toResult.reason,

      fromResult,
      toResult,
    }
  }

  const exact =
    fromResult.mode ===
      'measured' &&
    toResult.mode ===
      'measured'

  return {
    supported:
      true,

    attributeId,

    from:
      fromResult.value,

    to:
      toResult.value,

    delta:
      toResult.displayedGnr -
      fromResult.displayedGnr,

    mode:
      exact
        ? 'measured'
        : 'interpolated',

    fromResult,
    toResult,
  }
}

/*
 * =========================================================
 * COMPARAISON DE DEUX BUILDS
 *
 * Cette fonction additionne les variations mesurées
 * attribut par attribut.
 *
 * Elle n'est valide que si CHAQUE attribut modifié reste
 * dans une plage déjà mesurée.
 * =========================================================
 */

export function estimateExperimentalBuildGnrDelta({
  fromAttributes = {},
  toAttributes = {},
} = {}) {
  const attributeIds =
    new Set([
      ...Object.keys(
        fromAttributes
      ),

      ...Object.keys(
        toAttributes
      ),
    ])

  const contributions =
    []

  const unsupported =
    []

  let totalDelta =
    0

  let hasInterpolation =
    false

  for (
    const attributeId
    of attributeIds
  ) {
    const fromValue =
      toFiniteNumber(
        fromAttributes[
          attributeId
        ]
      )

    const toValue =
      toFiniteNumber(
        toAttributes[
          attributeId
        ]
      )

    if (
      fromValue ===
        null ||
      toValue ===
        null
    ) {
      unsupported.push({
        attributeId,

        reason:
          'missing-value',

        fromValue,
        toValue,
      })

      continue
    }

    if (
      almostEqual(
        fromValue,
        toValue
      )
    ) {
      continue
    }

    const deltaResult =
      getExperimentalGnrDelta(
        attributeId,
        fromValue,
        toValue
      )

    if (
      !deltaResult.supported
    ) {
      unsupported.push({
        attributeId,

        reason:
          deltaResult.reason,

        fromValue,
        toValue,

        details:
          deltaResult,
      })

      continue
    }

    if (
      deltaResult.mode ===
      'interpolated'
    ) {
      hasInterpolation =
        true
    }

    totalDelta +=
      deltaResult.delta

    contributions.push({
      attributeId,

      from:
        fromValue,

      to:
        toValue,

      delta:
        deltaResult.delta,

      mode:
        deltaResult.mode,
    })
  }

  return {
    status:
      unsupported.length ===
      0
        ? hasInterpolation
          ? 'experimental-interpolated'
          : 'measured'
        : 'incomplete',

    supported:
      unsupported.length ===
      0,

    totalDelta,

    contributions,

    unsupported,

    hasInterpolation,
  }
}

/*
 * =========================================================
 * ESTIMATION À PARTIR D'UN BUILD-ANCRE
 *
 * Exemple :
 *
 * build connu :
 * Pass64 = GNR58
 *
 * build cible :
 * Pass99
 *
 * variation connue :
 * +12
 *
 * résultat :
 * 58 + 12 = 70
 *
 * Cette fonction ne doit PAS être utilisée avec le build
 * global à 25 tant que les coûts 25 → baseline ne sont
 * pas reconstruits.
 * =========================================================
 */

export function estimateExperimentalGnrFromAnchor({
  anchorGnr,
  anchorAttributes = {},
  targetAttributes = {},
} = {}) {
  const safeAnchorGnr =
    toFiniteNumber(
      anchorGnr
    )

  if (
    safeAnchorGnr ===
    null
  ) {
    return {
      supported:
        false,

      status:
        'invalid-anchor',

      estimatedGnr:
        null,

      delta:
        null,
    }
  }

  const deltaResult =
    estimateExperimentalBuildGnrDelta({
      fromAttributes:
        anchorAttributes,

      toAttributes:
        targetAttributes,
    })

  if (
    !deltaResult.supported
  ) {
    return {
      supported:
        false,

      status:
        'incomplete',

      anchorGnr:
        safeAnchorGnr,

      estimatedGnr:
        null,

      delta:
        deltaResult.totalDelta,

      deltaResult,
    }
  }

  const estimatedGnr =
    safeAnchorGnr +
    deltaResult.totalDelta

  return {
    supported:
      true,

    status:
      deltaResult.status,

    anchorGnr:
      safeAnchorGnr,

    delta:
      deltaResult.totalDelta,

    estimatedGnr,

    contributions:
      deltaResult.contributions,

    hasInterpolation:
      deltaResult.hasInterpolation,
  }
}

/*
 * =========================================================
 * ÉTAT DU MOTEUR
 * =========================================================
 */

export function getExperimentalGnrEngineStatus() {
  const curves =
    Object.values(
      GNR_ISOLATED_CURVES
    )

  const measuredAttributes =
    curves.map(
      (curve) =>
        curve.attributeId
    )

  return {
    status:
      'experimental',

    baseOverall:
      GNR_RESEARCH_META.baseOverall,

    baseAttributeValue:
      GNR_RESEARCH_META.baseAttributeValue,

    measuredAttributeCount:
      measuredAttributes.length,

    measuredAttributes,

    absoluteOverallAvailable:
      false,

    relativeDeltaAvailable:
      true,

    reasonAbsoluteUnavailable:
      'Les coûts entre 25 et la première valeur mesurée de chaque attribut ne sont pas encore tous connus.',

    warning:
      'Les courbes utilisent le GNR entier affiché par NBA 2K HQ. Le score interne décimal reste inconnu.',
  }
}