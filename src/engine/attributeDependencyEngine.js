import {
  ATTRIBUTE_DEPENDENCY_RULES,
  ATTRIBUTE_IDS,
} from '../data/nba2k27/attributeDependencies.js'

export const DEFAULT_ATTRIBUTE_MIN =
  25

export const DEFAULT_ATTRIBUTE_MAX =
  99

function toFiniteNumber(
  value,
  fallback
) {
  const number =
    Number(value)

  return Number.isFinite(
    number
  )
    ? number
    : fallback
}

function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  )
}

function getAttributeCap(
  attributeId,
  caps
) {
  const cap =
    toFiniteNumber(
      caps?.[
        attributeId
      ],
      DEFAULT_ATTRIBUTE_MAX
    )

  return Math.max(
    DEFAULT_ATTRIBUTE_MIN,
    cap
  )
}

export function getDependencyRules({
  rules =
    ATTRIBUTE_DEPENDENCY_RULES,

  includeProvisional =
    false,
} = {}) {
  return rules.filter(
    (rule) =>
      rule.status ===
        'verified' ||
      (
        includeProvisional &&
        rule.status ===
          'provisional'
      )
  )
}

export function calculateRuleMinimum(
  rule,
  sourceValue
) {
  const multiplier =
    toFiniteNumber(
      rule.multiplier,
      1
    )

  const offset =
    toFiniteNumber(
      rule.offset,
      0
    )

  const floor =
    toFiniteNumber(
      rule.floor,
      DEFAULT_ATTRIBUTE_MIN
    )

  const rawValue =
    sourceValue *
      multiplier +
    offset

  /*
   * Pour l'instant tous nos relevés
   * correspondent à des valeurs
   * entières.
   *
   * On garde néanmoins Math.round
   * dans le moteur pour pouvoir
   * accepter plus tard des formules
   * avec coefficients décimaux.
   */
  return Math.max(
    floor,
    Math.round(
      rawValue
    )
  )
}

export function solveAttributeDependencies({
  requestedAttributes = {},
  baseValues = {},
  caps = {},
  rules =
    ATTRIBUTE_DEPENDENCY_RULES,

  includeProvisional =
    false,

  attributeMin =
    DEFAULT_ATTRIBUTE_MIN,
} = {}) {
  const enabledRules =
    getDependencyRules({
      rules,
      includeProvisional,
    })

  const outgoingRules =
    new Map()

  for (
    const attributeId
    of ATTRIBUTE_IDS
  ) {
    outgoingRules.set(
      attributeId,
      []
    )
  }

  for (
    const rule
    of enabledRules
  ) {
    if (
      !outgoingRules.has(
        rule.source
      )
    ) {
      outgoingRules.set(
        rule.source,
        []
      )
    }

    outgoingRules
      .get(
        rule.source
      )
      .push(
        rule
      )
  }

  const values = {}

  const normalizedRequested =
    {}

  const normalizedBase =
    {}

  const requiredMinimums =
    {}

  const capConflicts =
    []

  const contributionMap =
    new Map()

  /*
   * Valeurs initiales.
   */
  for (
    const attributeId
    of ATTRIBUTE_IDS
  ) {
    const cap =
      getAttributeCap(
        attributeId,
        caps
      )

    const baseValue =
      clamp(
        toFiniteNumber(
          baseValues[
            attributeId
          ],
          attributeMin
        ),
        attributeMin,
        cap
      )

    normalizedBase[
      attributeId
    ] =
      baseValue

    requiredMinimums[
      attributeId
    ] =
      attributeMin

    const hasRequestedValue =
      requestedAttributes[
        attributeId
      ] !==
        undefined &&
      requestedAttributes[
        attributeId
      ] !==
        null &&
      requestedAttributes[
        attributeId
      ] !==
        ''

    if (
      hasRequestedValue
    ) {
      const rawRequested =
        toFiniteNumber(
          requestedAttributes[
            attributeId
          ],
          baseValue
        )

      const safeRequested =
        clamp(
          rawRequested,
          attributeMin,
          cap
        )

      normalizedRequested[
        attributeId
      ] =
        safeRequested

      if (
        rawRequested >
        cap
      ) {
        capConflicts.push({
          type:
            'requested-over-cap',

          attribute:
            attributeId,

          requested:
            rawRequested,

          cap,
        })
      }
    }

    values[
      attributeId
    ] =
      Math.max(
        baseValue,
        normalizedRequested[
          attributeId
        ] ??
          attributeMin
      )
  }

  /*
   * File de propagation.
   *
   * On n'a besoin de commencer
   * qu'avec les attributs dont
   * la valeur dépasse leur base.
   */
  const queue = []

  const queued =
    new Set()

  function enqueue(
    attributeId
  ) {
    if (
      queued.has(
        attributeId
      )
    ) {
      return
    }

    queued.add(
      attributeId
    )

    queue.push(
      attributeId
    )
  }

  for (
    const attributeId
    of ATTRIBUTE_IDS
  ) {
    if (
      values[
        attributeId
      ] >
      normalizedBase[
        attributeId
      ]
    ) {
      enqueue(
        attributeId
      )
    }
  }

  let propagationSteps =
    0

  const maxPropagationSteps =
    10000

  while (
    queue.length >
    0
  ) {
    propagationSteps +=
      1

    if (
      propagationSteps >
      maxPropagationSteps
    ) {
      throw new Error(
        'Attribute dependency propagation exceeded the safety limit.'
      )
    }

    const sourceId =
      queue.shift()

    queued.delete(
      sourceId
    )

    const sourceValue =
      values[
        sourceId
      ]

    const sourceRules =
      outgoingRules.get(
        sourceId
      ) ??
      []

    for (
      const rule
      of sourceRules
    ) {
      const targetId =
        rule.target

      const rawRequiredMinimum =
        calculateRuleMinimum(
          rule,
          sourceValue
        )

      const targetCap =
        getAttributeCap(
          targetId,
          caps
        )

      const safeRequiredMinimum =
        Math.min(
          rawRequiredMinimum,
          targetCap
        )

      /*
       * On mémorise toujours la
       * dernière évaluation de
       * chaque relation.
       *
       * C'est utile plus tard
       * pour expliquer dans l'UI
       * pourquoi un attribut est
       * monté automatiquement.
       */
      contributionMap.set(
        rule.id,
        {
          ruleId:
            rule.id,

          status:
            rule.status,

          source:
            rule.source,

          sourceValue,

          target:
            rule.target,

          required:
            safeRequiredMinimum,

          rawRequired:
            rawRequiredMinimum,

          targetCap,
        }
      )

      if (
        rawRequiredMinimum >
        targetCap
      ) {
        capConflicts.push({
          type:
            'dependency-over-cap',

          ruleId:
            rule.id,

          source:
            rule.source,

          sourceValue,

          target:
            rule.target,

          required:
            rawRequiredMinimum,

          cap:
            targetCap,
        })
      }

      if (
        safeRequiredMinimum >
        requiredMinimums[
          targetId
        ]
      ) {
        requiredMinimums[
          targetId
        ] =
          safeRequiredMinimum
      }

      const targetRequested =
        normalizedRequested[
          targetId
        ] ??
        attributeMin

      const newTargetValue =
        Math.max(
          normalizedBase[
            targetId
          ],
          targetRequested,
          requiredMinimums[
            targetId
          ]
        )

      if (
        newTargetValue >
        values[
          targetId
        ]
      ) {
        values[
          targetId
        ] =
          newTargetValue

        enqueue(
          targetId
        )
      }
    }
  }

  /*
   * Toutes les contributions
   * évaluées, regroupées par
   * attribut cible.
   */
  const contributionsByAttribute =
    Object.fromEntries(
      ATTRIBUTE_IDS.map(
        (
          attributeId
        ) => [
          attributeId,
          [],
        ]
      )
    )

  for (
    const contribution
    of contributionMap.values()
  ) {
    contributionsByAttribute[
      contribution.target
    ].push(
      contribution
    )
  }

  /*
   * Les relations qui imposent
   * réellement le minimum final
   * de chaque attribut.
   */
  const activeContributorsByAttribute =
    Object.fromEntries(
      ATTRIBUTE_IDS.map(
        (
          attributeId
        ) => {
          const minimum =
            requiredMinimums[
              attributeId
            ]

          const contributors =
            contributionsByAttribute[
              attributeId
            ].filter(
              (
                contribution
              ) =>
                contribution.required ===
                minimum
            )

          return [
            attributeId,
            contributors,
          ]
        }
      )
    )

  return {
    values,

    requestedAttributes:
      normalizedRequested,

    baseValues:
      normalizedBase,

    requiredMinimums,

    contributionsByAttribute,

    activeContributorsByAttribute,

    capConflicts,

    appliedRules:
      enabledRules,

    includeProvisional,

    propagationSteps,
  }
}

export function getAttributeDependencyMinimum({
  attributeId,
  requestedAttributes,
  baseValues,
  caps,
  includeProvisional =
    false,
} = {}) {
  const result =
    solveAttributeDependencies({
      requestedAttributes,
      baseValues,
      caps,
      includeProvisional,
    })

  return (
    result.requiredMinimums[
      attributeId
    ] ??
    DEFAULT_ATTRIBUTE_MIN
  )
}