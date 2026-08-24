function getAttributeValue(
  attributes,
  attributeId
) {
  return (
    attributes?.[
      attributeId
    ] ?? 25
  )
}

function getAttributeCap(
  caps,
  attributeId
) {
  return (
    caps?.[
      attributeId
    ] ?? 99
  )
}

function evaluateLeaf(
  requirement,
  attributes,
  caps
) {
  const current =
    getAttributeValue(
      attributes,
      requirement.attribute
    )

  const cap =
    getAttributeCap(
      caps,
      requirement.attribute
    )

  const unlocked =
    current >=
    requirement.min

  const impossible =
    cap <
    requirement.min

  const delta =
    unlocked
      ? 0
      : Math.max(
          0,
          requirement.min -
            current
        )

  return {
    unlocked,
    impossible,

    missing:
      unlocked
        ? []
        : [
            {
              attribute:
                requirement.attribute,

              current,

              required:
                requirement.min,

              cap,

              delta,

              impossible,
            },
          ],

    totalDelta:
      unlocked
        ? 0
        : impossible
          ? Infinity
          : delta,
  }
}

function evaluateAll(
  requirements,
  attributes,
  caps
) {
  const results =
    requirements.map(
      (requirement) =>
        evaluateRequirement(
          requirement,
          attributes,
          caps
        )
    )

  const unlocked =
    results.every(
      (result) =>
        result.unlocked
    )

  const impossible =
    results.some(
      (result) =>
        result.impossible
    )

  const missing =
    results.flatMap(
      (result) =>
        result.missing
    )

  const totalDelta =
    impossible
      ? Infinity
      : results.reduce(
          (
            total,
            result
          ) =>
            total +
            result.totalDelta,
          0
        )

  return {
    unlocked,
    impossible,
    missing,
    totalDelta,
  }
}

function evaluateAny(
  requirements,
  attributes,
  caps
) {
  const results =
    requirements.map(
      (requirement) =>
        evaluateRequirement(
          requirement,
          attributes,
          caps
        )
    )

  const unlockedResult =
    results.find(
      (result) =>
        result.unlocked
    )

  if (
    unlockedResult
  ) {
    return {
      unlocked: true,
      impossible: false,
      missing: [],
      totalDelta: 0,
    }
  }

  const possibleResults =
    results.filter(
      (result) =>
        !result.impossible
    )

  if (
    possibleResults.length ===
    0
  ) {
    return {
      unlocked: false,
      impossible: true,
      missing:
        results.flatMap(
          (result) =>
            result.missing
        ),
      totalDelta: Infinity,
    }
  }

  /*
   * Pour un OR, on conserve
   * automatiquement le chemin
   * le plus proche à débloquer.
   *
   * Exemple :
   *
   * 85 Mi-distance
   * OU
   * 85 Tir à 3 pts
   *
   * Mid = 80 → manque 5
   * 3PT = 70 → manque 15
   *
   * Le moteur propose Mid +5.
   */
  const bestResult =
    [...possibleResults]
      .sort(
        (a, b) =>
          a.totalDelta -
          b.totalDelta
      )[0]

  return {
    unlocked: false,
    impossible: false,
    missing:
      bestResult.missing,
    totalDelta:
      bestResult.totalDelta,
  }
}

export function evaluateRequirement(
  requirement,
  attributes,
  caps = null
) {
  if (
    !requirement
  ) {
    return {
      unlocked: true,
      impossible: false,
      missing: [],
      totalDelta: 0,
    }
  }

  if (
    requirement.always ===
    true
  ) {
    return {
      unlocked: true,
      impossible: false,
      missing: [],
      totalDelta: 0,
    }
  }

  if (
    requirement.attribute
  ) {
    return evaluateLeaf(
      requirement,
      attributes,
      caps
    )
  }

  if (
    Array.isArray(
      requirement.all
    )
  ) {
    return evaluateAll(
      requirement.all,
      attributes,
      caps
    )
  }

  if (
    Array.isArray(
      requirement.any
    )
  ) {
    return evaluateAny(
      requirement.any,
      attributes,
      caps
    )
  }

  return {
    unlocked: false,
    impossible: true,
    missing: [],
    totalDelta: Infinity,
  }
}

export function getTakeoverState(
  takeover,
  attributes,
  caps = null
) {
  const evaluation =
    evaluateRequirement(
      takeover.requirements,
      attributes,
      caps
    )

  if (
    evaluation.unlocked
  ) {
    return {
      status: 'unlocked',
      ...evaluation,
    }
  }

  if (
    evaluation.impossible
  ) {
    return {
      status: 'impossible',
      ...evaluation,
    }
  }

  return {
    status: 'locked',
    ...evaluation,
  }
}

export function isTakeoverUnlocked(
  takeover,
  attributes,
  caps = null
) {
  return (
    getTakeoverState(
      takeover,
      attributes,
      caps
    ).status ===
    'unlocked'
  )
}

export function getTakeoversByDiscipline(
  takeovers,
  discipline
) {
  return takeovers.filter(
    (takeover) =>
      takeover.discipline ===
      discipline
  )
}

export function getUnlockedTakeovers(
  takeovers,
  attributes,
  caps = null
) {
  return takeovers.filter(
    (takeover) =>
      isTakeoverUnlocked(
        takeover,
        attributes,
        caps
      )
  )
}

export function getTakeoverProgress(
  takeovers,
  attributes,
  caps = null
) {
  return takeovers.map(
    (takeover) => ({
      takeover,

      state:
        getTakeoverState(
          takeover,
          attributes,
          caps
        ),
    })
  )
}