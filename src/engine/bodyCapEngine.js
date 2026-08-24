const MIN_ATTRIBUTE_VALUE = 25
const MAX_ATTRIBUTE_VALUE = 99
const EXTRAPOLATION_WINDOW_SIZE = 4

function clampAttribute(value) {
  return Math.min(
    MAX_ATTRIBUTE_VALUE,
    Math.max(
      MIN_ATTRIBUTE_VALUE,
      Math.round(value)
    )
  )
}

function vectorToCaps(
  attributeOrder,
  vector
) {
  if (
    !Array.isArray(vector) ||
    vector.length !==
      attributeOrder.length
  ) {
    return null
  }

  return Object.fromEntries(
    attributeOrder.map(
      (
        attributeId,
        index
      ) => [
        attributeId,
        vector[index],
      ]
    )
  )
}

function interpolateNumber(
  valueA,
  valueB,
  ratio
) {
  return (
    valueA +
    (
      valueB -
      valueA
    ) *
      ratio
  )
}

function interpolateVectors(
  vectorA,
  vectorB,
  ratio
) {
  return vectorA.map(
    (
      value,
      index
    ) =>
      interpolateNumber(
        value,
        vectorB[index],
        ratio
      )
  )
}

function getSortedSeriesEntries(
  series
) {
  if (
    !series ||
    typeof series !==
      'object'
  ) {
    return []
  }

  return Object.entries(
    series
  )
    .map(
      ([
        key,
        vector,
      ]) => ({
        value:
          Number(key),

        vector,
      })
    )
    .filter(
      (entry) =>
        Number.isFinite(
          entry.value
        ) &&
        Array.isArray(
          entry.vector
        )
    )
    .sort(
      (a, b) =>
        a.value -
        b.value
    )
}

/*
 * Régression linéaire locale.
 *
 * Elle est utilisée uniquement
 * lorsqu'on sort de la plage
 * réellement mesurée.
 *
 * Exemple poids :
 *
 * plage mesurée :
 * 180 → 250 lbs
 *
 * pour estimer 170 lbs,
 * on utilise les points :
 *
 * 180
 * 185
 * 190
 * 195
 *
 * au lieu d'extrapoler seulement
 * depuis 180 et 185.
 *
 * Cela réduit fortement l'effet
 * du bruit provoqué par les
 * arrondis visibles de NBA 2K.
 */
function extrapolateWithRegression(
  entries,
  requestedValue
) {
  if (
    !Array.isArray(entries) ||
    entries.length ===
      0
  ) {
    return null
  }

  if (
    entries.length ===
    1
  ) {
    return [
      ...entries[0].vector,
    ]
  }

  const xMean =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        entry.value,
      0
    ) /
    entries.length

  const vectorLength =
    entries[0]
      .vector.length

  const denominator =
    entries.reduce(
      (
        total,
        entry
      ) => {
        const difference =
          entry.value -
          xMean

        return (
          total +
          difference *
            difference
        )
      },
      0
    )

  if (
    denominator ===
    0
  ) {
    return [
      ...entries[0].vector,
    ]
  }

  const result = []

  for (
    let attributeIndex = 0;
    attributeIndex <
    vectorLength;
    attributeIndex += 1
  ) {
    const yMean =
      entries.reduce(
        (
          total,
          entry
        ) =>
          total +
          entry.vector[
            attributeIndex
          ],
        0
      ) /
      entries.length

    const numerator =
      entries.reduce(
        (
          total,
          entry
        ) => {
          const xDifference =
            entry.value -
            xMean

          const yDifference =
            entry.vector[
              attributeIndex
            ] -
            yMean

          return (
            total +
            xDifference *
              yDifference
          )
        },
        0
      )

    const slope =
      numerator /
      denominator

    result.push(
      yMean +
        slope *
          (
            requestedValue -
            xMean
          )
    )
  }

  return result
}

function getLowExtrapolationWindow(
  entries
) {
  return entries.slice(
    0,
    Math.min(
      EXTRAPOLATION_WINDOW_SIZE,
      entries.length
    )
  )
}

function getHighExtrapolationWindow(
  entries
) {
  const size =
    Math.min(
      EXTRAPOLATION_WINDOW_SIZE,
      entries.length
    )

  return entries.slice(
    entries.length -
      size
  )
}

function sampleSeries(
  series,
  requestedValue
) {
  const entries =
    getSortedSeriesEntries(
      series
    )

  if (
    entries.length ===
    0
  ) {
    return null
  }

  const value =
    Number(
      requestedValue
    )

  if (
    !Number.isFinite(
      value
    )
  ) {
    return null
  }

  const firstEntry =
    entries[0]

  const lastEntry =
    entries[
      entries.length -
      1
    ]

  const exact =
    entries.find(
      (entry) =>
        entry.value ===
        value
    )

  if (exact) {
    return {
      vector:
        exact.vector,

      mode:
        'exact',

      sourceMin:
        exact.value,

      sourceMax:
        exact.value,

      extrapolationDistance:
        0,
    }
  }

  /*
   * Un seul point ne permet
   * aucune interpolation ou
   * régression réelle.
   */
  if (
    entries.length ===
    1
  ) {
    return {
      vector:
        entries[0].vector,

      mode:
        'extrapolated-single',

      sourceMin:
        entries[0].value,

      sourceMax:
        entries[0].value,

      extrapolationDistance:
        Math.abs(
          value -
          entries[0].value
        ),
    }
  }

  /*
   * Sous la plage mesurée.
   */
  if (
    value <
    firstEntry.value
  ) {
    const window =
      getLowExtrapolationWindow(
        entries
      )

    const vector =
      extrapolateWithRegression(
        window,
        value
      )

    return {
      vector,

      mode:
        'extrapolated-regression',

      sourceMin:
        window[0].value,

      sourceMax:
        window[
          window.length -
          1
        ].value,

      extrapolationDistance:
        firstEntry.value -
        value,
    }
  }

  /*
   * Au-dessus de la plage
   * mesurée.
   */
  if (
    value >
    lastEntry.value
  ) {
    const window =
      getHighExtrapolationWindow(
        entries
      )

    const vector =
      extrapolateWithRegression(
        window,
        value
      )

    return {
      vector,

      mode:
        'extrapolated-regression',

      sourceMin:
        window[0].value,

      sourceMax:
        window[
          window.length -
          1
        ].value,

      extrapolationDistance:
        value -
        lastEntry.value,
    }
  }

  /*
   * Entre deux valeurs connues :
   * interpolation classique.
   *
   * Exemple :
   *
   * 217 lbs
   *
   * est calculé entre
   * 215 et 220 lbs.
   */
  for (
    let index = 0;
    index <
    entries.length - 1;
    index += 1
  ) {
    const a =
      entries[index]

    const b =
      entries[
        index + 1
      ]

    if (
      value >
        a.value &&
      value <
        b.value
    ) {
      const ratio =
        (
          value -
          a.value
        ) /
        (
          b.value -
          a.value
        )

      return {
        vector:
          interpolateVectors(
            a.vector,
            b.vector,
            ratio
          ),

        mode:
          'interpolated',

        sourceMin:
          a.value,

        sourceMax:
          b.value,

        extrapolationDistance:
          0,
      }
    }
  }

  return null
}

function getExactOverride(
  data,
  height,
  weight,
  wingspan
) {
  const key =
    `${height}-${weight}-${wingspan}`

  return (
    data.exactOverrides?.[
      key
    ] ??
    null
  )
}

function isExactMeasuredCombination(
  data,
  height,
  weight,
  wingspan,
  weightSample,
  wingspanSample
) {
  const reference =
    data.reference

  /*
   * Série exacte des tailles :
   *
   * 6'4" → 6'10"
   *
   * à :
   *
   * 215 lbs
   * 6'10" d'envergure
   */
  if (
    weight ===
      reference.weight &&
    wingspan ===
      reference.wingspan &&
    data.heightAnchors?.[
      String(height)
    ]
  ) {
    return true
  }

  /*
   * Série exacte poids :
   *
   * taille 6'7"
   * envergure 6'10"
   */
  if (
    height ===
      reference.height &&
    wingspan ===
      reference.wingspan &&
    weightSample?.mode ===
      'exact'
  ) {
    return true
  }

  /*
   * Série exacte envergure :
   *
   * taille 6'7"
   * poids 215 lbs
   */
  if (
    height ===
      reference.height &&
    weight ===
      reference.weight &&
    wingspanSample?.mode ===
      'exact'
  ) {
    return true
  }

  return false
}

function isExtrapolatedMode(
  mode
) {
  return (
    typeof mode ===
      'string' &&
    mode.startsWith(
      'extrapolated'
    )
  )
}

function getConfidence(
  quality,
  weightMode,
  wingspanMode
) {
  if (
    quality ===
    'exact'
  ) {
    return 'exact'
  }

  if (
    isExtrapolatedMode(
      weightMode
    ) ||
    isExtrapolatedMode(
      wingspanMode
    )
  ) {
    return 'low'
  }

  return 'medium'
}

function getEstimationType(
  quality,
  weightMode,
  wingspanMode
) {
  if (
    quality ===
    'exact'
  ) {
    return 'measured'
  }

  if (
    isExtrapolatedMode(
      weightMode
    ) ||
    isExtrapolatedMode(
      wingspanMode
    )
  ) {
    return 'extrapolated'
  }

  if (
    weightMode ===
      'interpolated' ||
    wingspanMode ===
      'interpolated'
  ) {
    return 'interpolated'
  }

  return 'estimated'
}

export function getBodyCaps(
  data,
  morphology
) {
  const height =
    morphology?.height

  const weight =
    morphology?.weight

  const wingspan =
    morphology?.wingspan

  /*
   * Les trois paramètres sont
   * nécessaires pour calculer
   * les caps.
   */
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

      quality:
        'unavailable',

      confidence:
        'unavailable',

      estimationType:
        'unavailable',

      reason:
        'incomplete-morphology',
    }
  }

  const numericHeight =
    Number(height)

  const numericWeight =
    Number(weight)

  const numericWingspan =
    Number(wingspan)

  const attributeOrder =
    data.attributeOrder ??
    []

  const reference =
    data.reference

  if (
    !reference ||
    attributeOrder.length ===
      0
  ) {
    return {
      available: false,

      caps: null,

      quality:
        'unavailable',

      confidence:
        'unavailable',

      estimationType:
        'unavailable',

      reason:
        'invalid-data',
    }
  }

  /*
   * Pour cette version,
   * une taille doit disposer
   * d'un ancrage mesuré.
   *
   * Actuellement :
   *
   * 6'4" → 6'10".
   */
  const heightVector =
    data.heightAnchors?.[
      String(
        numericHeight
      )
    ]

  if (
    !heightVector
  ) {
    return {
      available: false,

      caps: null,

      quality:
        'unavailable',

      confidence:
        'unavailable',

      estimationType:
        'unavailable',

      reason:
        'height-not-measured',

      supportedHeightRange:
        data.measuredRanges
          ?.height ??
        null,
    }
  }

  /*
   * Une combinaison que nous
   * avons mesurée précisément
   * passe toujours avant le
   * modèle mathématique.
   */
  const exactOverride =
    getExactOverride(
      data,
      numericHeight,
      numericWeight,
      numericWingspan
    )

  if (
    exactOverride
  ) {
    return {
      available: true,

      caps:
        vectorToCaps(
          attributeOrder,
          exactOverride
        ),

      quality:
        'exact',

      confidence:
        'exact',

      estimationType:
        'measured',

      model:
        data.model,

      source:
        'exact-override',

      diagnostics: {
        heightMode:
          'exact',

        weightMode:
          'exact',

        wingspanMode:
          'exact',

        weightExtrapolationDistance:
          0,

        wingspanExtrapolationDistance:
          0,
      },
    }
  }

  const referenceVector =
    data.heightAnchors?.[
      String(
        reference.height
      )
    ]

  if (
    !referenceVector
  ) {
    return {
      available: false,

      caps: null,

      quality:
        'unavailable',

      confidence:
        'unavailable',

      estimationType:
        'unavailable',

      reason:
        'reference-missing',
    }
  }

  const weightSample =
    sampleSeries(
      data
        .weightSeriesAtReferenceHeightAndWingspan,
      numericWeight
    )

  const wingspanSample =
    sampleSeries(
      data
        .wingspanSeriesAtReferenceHeightAndWeight,
      numericWingspan
    )

  if (
    !weightSample ||
    !wingspanSample
  ) {
    return {
      available: false,

      caps: null,

      quality:
        'unavailable',

      confidence:
        'unavailable',

      estimationType:
        'unavailable',

      reason:
        'series-missing',
    }
  }

  /*
   * Modèle :
   *
   * CAP DE BASE DE LA TAILLE
   *
   * +
   *
   * variation observée
   * liée au POIDS
   *
   * +
   *
   * variation observée
   * liée à l'ENVERGURE
   *
   * =
   *
   * CAP MORPHOLOGIQUE ESTIMÉ
   */
  const calculatedVector =
    heightVector.map(
      (
        heightBase,
        index
      ) => {
        const weightDelta =
          weightSample.vector[
            index
          ] -
          referenceVector[
            index
          ]

        const wingspanDelta =
          wingspanSample.vector[
            index
          ] -
          referenceVector[
            index
          ]

        return clampAttribute(
          heightBase +
            weightDelta +
            wingspanDelta
        )
      }
    )

  const quality =
    isExactMeasuredCombination(
      data,
      numericHeight,
      numericWeight,
      numericWingspan,
      weightSample,
      wingspanSample
    )
      ? 'exact'
      : 'estimated'

  const confidence =
    getConfidence(
      quality,
      weightSample.mode,
      wingspanSample.mode
    )

  const estimationType =
    getEstimationType(
      quality,
      weightSample.mode,
      wingspanSample.mode
    )

  return {
    available: true,

    caps:
      vectorToCaps(
        attributeOrder,
        calculatedVector
      ),

    quality,

    confidence,

    estimationType,

    model:
      data.model,

    source:
      quality ===
      'exact'
        ? 'measured-series'
        : estimationType ===
            'extrapolated'
          ? 'regression-extrapolation'
          : 'additive-model',

    diagnostics: {
      heightMode:
        'exact-anchor',

      weightMode:
        weightSample.mode,

      wingspanMode:
        wingspanSample.mode,

      weightSources: {
        min:
          weightSample.sourceMin,

        max:
          weightSample.sourceMax,
      },

      wingspanSources: {
        min:
          wingspanSample.sourceMin,

        max:
          wingspanSample.sourceMax,
      },

      weightExtrapolationDistance:
        weightSample
          .extrapolationDistance ??
        0,

      wingspanExtrapolationDistance:
        wingspanSample
          .extrapolationDistance ??
        0,

      measuredRanges:
        data.measuredRanges,
    },
  }
}

/*
 * Vérifie si une condition
 * d'attribut peut être atteinte
 * avec les caps de la
 * morphologie actuelle.
 */
function isRequirementPossible(
  requirement,
  caps
) {
  if (
    !requirement
  ) {
    return true
  }

  if (
    !caps
  ) {
    return true
  }

  if (
    requirement.attribute
  ) {
    const cap =
      caps[
        requirement.attribute
      ]

    if (
      cap === undefined ||
      cap === null
    ) {
      return true
    }

    return (
      cap >=
      requirement.min
    )
  }

  if (
    Array.isArray(
      requirement.all
    )
  ) {
    return requirement.all.every(
      (item) =>
        isRequirementPossible(
          item,
          caps
        )
    )
  }

  if (
    Array.isArray(
      requirement.any
    )
  ) {
    return requirement.any.some(
      (item) =>
        isRequirementPossible(
          item,
          caps
        )
    )
  }

  return true
}

export function isRequirementOptionPossible(
  option,
  caps
) {
  if (
    !caps
  ) {
    return true
  }

  if (
    Array.isArray(option)
  ) {
    return option.every(
      (requirement) =>
        isRequirementPossible(
          requirement,
          caps
        )
    )
  }

  return isRequirementPossible(
    option,
    caps
  )
}

function readHeightRange(
  source
) {
  if (!source) {
    return null
  }

  if (
    source.height &&
    typeof source.height ===
      'object'
  ) {
    return {
      min:
        source.height.min ??
        null,

      max:
        source.height.max ??
        null,
    }
  }

  if (
    source.heightRange &&
    typeof source.heightRange ===
      'object'
  ) {
    return {
      min:
        source.heightRange.min ??
        null,

      max:
        source.heightRange.max ??
        null,
    }
  }

  const min =
    source.minHeight ??
    source.heightMin ??
    source.min_height ??
    null

  const max =
    source.maxHeight ??
    source.heightMax ??
    source.max_height ??
    null

  if (
    min === null &&
    max === null
  ) {
    return null
  }

  return {
    min,
    max,
  }
}

export function isBadgeHeightCompatible(
  badge,
  height,
  tier = null
) {
  if (
    height === '' ||
    height === null ||
    height === undefined
  ) {
    return true
  }

  let tierData =
    null

  if (
    tier &&
    Array.isArray(
      badge?.tiers
    )
  ) {
    tierData =
      badge.tiers.find(
        (item) =>
          item.id === tier ||
          item.tier === tier ||
          item.level === tier
      ) ??
      null
  }

  const range =
    readHeightRange(
      tierData
    ) ??
    readHeightRange(
      badge
    )

  if (!range) {
    return true
  }

  const numericHeight =
    Number(height)

  if (
    range.min !== null &&
    numericHeight <
      Number(
        range.min
      )
  ) {
    return false
  }

  if (
    range.max !== null &&
    numericHeight >
      Number(
        range.max
      )
  ) {
    return false
  }

  return true
}

export function isBadgeTierPossible(
  badge,
  tier,
  caps,
  getBadgeTierOptions,
  height = null
) {
  if (
    !isBadgeHeightCompatible(
      badge,
      height,
      tier
    )
  ) {
    return false
  }

  const options =
    getBadgeTierOptions(
      badge,
      tier
    )

  if (
    !Array.isArray(options) ||
    options.length ===
      0
  ) {
    return false
  }

  /*
   * Tant que les caps ne sont
   * pas calculables, on ne
   * bloque pas artificiellement
   * les badges.
   */
  if (!caps) {
    return true
  }

  return options.some(
    (option) =>
      isRequirementOptionPossible(
        option,
        caps
      )
  )
}