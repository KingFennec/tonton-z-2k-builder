import {
  ATTRIBUTE_DEPENDENCY_FIXTURES,
} from '../src/data/nba2k27/attributeDependencyFixtures.js'

import {
  ATTRIBUTE_IDS,
} from '../src/data/nba2k27/attributeDependencies.js'

import {
  calculateRuleMinimum,
  solveAttributeDependencies,
} from '../src/engine/attributeDependencyEngine.js'

const ATTRIBUTE_MIN =
  25

const ATTRIBUTE_MAX =
  99

let fixturePassed =
  0

let fixtureFailed =
  0

let verifiedFixtures =
  0

let researchFixtures =
  0

let structuralPassed =
  0

let structuralFailed =
  0

function valuesEqual(
  first,
  second
) {
  return ATTRIBUTE_IDS.every(
    (attributeId) =>
      first[
        attributeId
      ] ===
      second[
        attributeId
      ]
  )
}

function getDifferentValues(
  first,
  second
) {
  return ATTRIBUTE_IDS
    .filter(
      (attributeId) =>
        first[
          attributeId
        ] !==
        second[
          attributeId
        ]
    )
    .map(
      (attributeId) => ({
        attributeId,

        first:
          first[
            attributeId
          ],

        second:
          second[
            attributeId
          ],
      })
    )
}

function passStructural(
  label
) {
  structuralPassed +=
    1

  console.log(
    `PASS  [structure] ${label}`
  )
}

function failStructural(
  label,
  details = []
) {
  structuralFailed +=
    1

  console.log('')
  console.log(
    `FAIL  [structure] ${label}`
  )

  for (
    const detail
    of details
  ) {
    console.log(
      `      ${detail}`
    )
  }
}

console.log('')
console.log(
  'NBA 2K27 — vérification du moteur de dépendances'
)

console.log(
  'Morphologie de référence : MJ 6\'7" / 215 lbs / 6\'10"'
)

console.log('')
console.log(
  '=== RELEVÉS NBA 2K HQ ==='
)

console.log('')

/*
 * =========================================================
 * 1. REPRODUCTION DES RELEVÉS
 * =========================================================
 */

for (
  const fixture
  of ATTRIBUTE_DEPENDENCY_FIXTURES
) {
  const includeProvisional =
    fixture.mode ===
    'research'

  if (
    includeProvisional
  ) {
    researchFixtures +=
      1
  } else {
    verifiedFixtures +=
      1
  }

  const result =
    solveAttributeDependencies({
      requestedAttributes:
        fixture.requested,

      includeProvisional,
    })

  const errors =
    []

  /*
   * Vérifie toutes les valeurs
   * explicitement relevées dans
   * NBA 2K HQ.
   */
  for (
    const [
      attributeId,
      expectedValue,
    ]
    of Object.entries(
      fixture.expected
    )
  ) {
    const actualValue =
      result.values[
        attributeId
      ]

    if (
      actualValue !==
      expectedValue
    ) {
      errors.push(
        `${attributeId}: attendu ${expectedValue}, obtenu ${actualValue}`
      )
    }
  }

  /*
   * Une fixture "verified"
   * ne doit utiliser aucune
   * règle provisoire.
   */
  if (
    fixture.mode !==
      'research'
  ) {
    const provisionalRules =
      result.appliedRules.filter(
        (rule) =>
          rule.status ===
          'provisional'
      )

    if (
      provisionalRules.length >
      0
    ) {
      errors.push(
        `règles provisoires utilisées : ${provisionalRules
          .map(
            (rule) =>
              rule.id
          )
          .join(', ')}`
      )
    }
  }

  /*
   * Toutes les valeurs finales
   * doivent rester comprises
   * entre 25 et 99.
   */
  for (
    const attributeId
    of ATTRIBUTE_IDS
  ) {
    const value =
      result.values[
        attributeId
      ]

    if (
      !Number.isFinite(
        value
      )
    ) {
      errors.push(
        `${attributeId}: valeur non numérique`
      )

      continue
    }

    if (
      value <
        ATTRIBUTE_MIN ||
      value >
        ATTRIBUTE_MAX
    ) {
      errors.push(
        `${attributeId}: valeur hors limites (${value})`
      )
    }
  }

  /*
   * La valeur explicitement
   * demandée par l'utilisateur
   * ne doit jamais être diminuée
   * par le moteur.
   */
  for (
    const [
      attributeId,
      requestedValue,
    ]
    of Object.entries(
      fixture.requested
    )
  ) {
    const finalValue =
      result.values[
        attributeId
      ]

    if (
      finalValue <
      requestedValue
    ) {
      errors.push(
        `${attributeId}: demandé ${requestedValue}, résultat ${finalValue}`
      )
    }
  }

  /*
   * Vérifie que chaque règle
   * appliquée est satisfaite
   * dans l'état final.
   */
  for (
    const rule
    of result.appliedRules
  ) {
    const sourceValue =
      result.values[
        rule.source
      ]

    const targetValue =
      result.values[
        rule.target
      ]

    const requiredValue =
      calculateRuleMinimum(
        rule,
        sourceValue
      )

    if (
      targetValue <
      requiredValue
    ) {
      errors.push(
        `${rule.id}: ${rule.target}=${targetValue}, minimum requis=${requiredValue}`
      )
    }
  }

  /*
   * Test d'idempotence.
   *
   * Si on relance le solveur
   * avec son propre résultat,
   * absolument rien ne doit
   * changer.
   */
  const secondPass =
    solveAttributeDependencies({
      requestedAttributes:
        result.values,

      includeProvisional,
    })

  if (
    !valuesEqual(
      result.values,
      secondPass.values
    )
  ) {
    const differences =
      getDifferentValues(
        result.values,
        secondPass.values
      )

    for (
      const difference
      of differences
    ) {
      errors.push(
        `instabilité ${difference.attributeId}: ${difference.first} → ${difference.second}`
      )
    }
  }

  /*
   * Test de déterminisme.
   *
   * Deux calculs strictement
   * identiques doivent toujours
   * produire le même résultat.
   */
  const repeatedPass =
    solveAttributeDependencies({
      requestedAttributes:
        fixture.requested,

      includeProvisional,
    })

  if (
    !valuesEqual(
      result.values,
      repeatedPass.values
    )
  ) {
    errors.push(
      'le solveur n’est pas déterministe'
    )
  }

  if (
    errors.length ===
    0
  ) {
    fixturePassed +=
      1

    console.log(
      `PASS  [${fixture.mode}] ${fixture.label} | GNR relevé ${fixture.gnr}`
    )

    continue
  }

  fixtureFailed +=
    1

  console.log('')
  console.log(
    `FAIL  [${fixture.mode}] ${fixture.label}`
  )

  console.log(
    `      GNR relevé : ${fixture.gnr}`
  )

  for (
    const error
    of errors
  ) {
    console.log(
      `      ${error}`
    )
  }
}

/*
 * =========================================================
 * 2. TESTS STRUCTURELS DU SOLVEUR
 * =========================================================
 */

console.log('')
console.log(
  '=== TESTS STRUCTURELS ==='
)

console.log('')

/*
 * Test minimum absolu.
 */
{
  const result =
    solveAttributeDependencies({
      requestedAttributes:
        {},
    })

  const errors =
    ATTRIBUTE_IDS.filter(
      (attributeId) =>
        result.values[
          attributeId
        ] !==
        ATTRIBUTE_MIN
    )

  if (
    errors.length ===
    0
  ) {
    passStructural(
      'Build réinitialisé = tous les attributs à 25'
    )
  } else {
    failStructural(
      'Build réinitialisé',
      errors.map(
        (attributeId) =>
          `${attributeId} = ${result.values[attributeId]} au lieu de 25`
      )
    )
  }
}

/*
 * Vérification des caps.
 */
{
  const caps =
    Object.fromEntries(
      ATTRIBUTE_IDS.map(
        (attributeId) => [
          attributeId,
          70,
        ]
      )
    )

  const requestedAttributes =
    Object.fromEntries(
      ATTRIBUTE_IDS.map(
        (attributeId) => [
          attributeId,
          99,
        ]
      )
    )

  const result =
    solveAttributeDependencies({
      requestedAttributes,
      caps,
      includeProvisional:
        true,
    })

  const errors =
    ATTRIBUTE_IDS.filter(
      (attributeId) =>
        result.values[
          attributeId
        ] >
        70
    )

  if (
    errors.length ===
    0
  ) {
    passStructural(
      'Aucune dépendance ne dépasse un cap morphologique'
    )
  } else {
    failStructural(
      'Respect des caps morphologiques',
      errors.map(
        (attributeId) =>
          `${attributeId} = ${result.values[attributeId]}`
      )
    )
  }
}

/*
 * Monotonie.
 *
 * Augmenter un attribut demandé
 * ne doit jamais faire BAISSER
 * un autre attribut final.
 */
const monotonicityLevels = [
  25,
  35,
  50,
  70,
  85,
  99,
]

let monotonicityErrors =
  []

for (
  const sourceAttribute
  of ATTRIBUTE_IDS
) {
  let previousResult =
    null

  for (
    const level
    of monotonicityLevels
  ) {
    const result =
      solveAttributeDependencies({
        requestedAttributes: {
          [sourceAttribute]:
            level,
        },

        includeProvisional:
          true,
      })

    if (
      previousResult
    ) {
      for (
        const targetAttribute
        of ATTRIBUTE_IDS
      ) {
        const previousValue =
          previousResult.values[
            targetAttribute
          ]

        const currentValue =
          result.values[
            targetAttribute
          ]

        if (
          currentValue <
          previousValue
        ) {
          monotonicityErrors.push(
            `${sourceAttribute}: ${targetAttribute} baisse de ${previousValue} à ${currentValue} au niveau ${level}`
          )
        }
      }
    }

    previousResult =
      result
  }
}

if (
  monotonicityErrors.length ===
  0
) {
  passStructural(
    'Propagation monotone sur les 21 attributs'
  )
} else {
  failStructural(
    'Monotonie',
    monotonicityErrors
  )
}

/*
 * Vérifie que chaque règle
 * "verified" fonctionne seule
 * conformément à sa formule.
 */
{
  const result =
    solveAttributeDependencies({
      requestedAttributes: {
        ballHandle:
          70,
      },

      includeProvisional:
        false,
    })

  const expected = {
    passAccuracy:
      45,

    speedWithBall:
      50,

    drivingLayup:
      55,

    postControl:
      30,
  }

  const errors =
    []

  for (
    const [
      attributeId,
      expectedValue,
    ]
    of Object.entries(
      expected
    )
  ) {
    if (
      result.values[
        attributeId
      ] !==
      expectedValue
    ) {
      errors.push(
        `${attributeId}: attendu ${expectedValue}, obtenu ${result.values[attributeId]}`
      )
    }
  }

  if (
    errors.length ===
    0
  ) {
    passStructural(
      'Propagation directe BH70'
    )
  } else {
    failStructural(
      'Propagation directe BH70',
      errors
    )
  }
}

/*
 * Vérifie explicitement une
 * chaîne récursive connue.
 *
 * SWB69
 * → BH64
 * → Layup49
 * → Close39
 *
 * SWB69
 * → Speed65
 * → Perimeter35
 * → Vertical35
 */
{
  const result =
    solveAttributeDependencies({
      requestedAttributes: {
        speedWithBall:
          69,
      },
    })

  const expected = {
    speedWithBall:
      69,

    ballHandle:
      64,

    drivingLayup:
      49,

    closeShot:
      39,

    speed:
      65,

    agility:
      54,

    perimeterDefense:
      35,

    vertical:
      35,
  }

  const errors =
    []

  for (
    const [
      attributeId,
      expectedValue,
    ]
    of Object.entries(
      expected
    )
  ) {
    if (
      result.values[
        attributeId
      ] !==
      expectedValue
    ) {
      errors.push(
        `${attributeId}: attendu ${expectedValue}, obtenu ${result.values[attributeId]}`
      )
    }
  }

  if (
    errors.length ===
    0
  ) {
    passStructural(
      'Cascade récursive SWB69'
    )
  } else {
    failStructural(
      'Cascade récursive SWB69',
      errors
    )
  }
}

/*
 * Vérifie une boucle bidirectionnelle.
 *
 * Une fois stabilisée, elle ne
 * doit ni exploser ni augmenter
 * indéfiniment.
 */
{
  const result =
    solveAttributeDependencies({
      requestedAttributes: {
        midRangeShot:
          75,
      },
    })

  const secondResult =
    solveAttributeDependencies({
      requestedAttributes:
        result.values,
    })

  if (
    valuesEqual(
      result.values,
      secondResult.values
    )
  ) {
    passStructural(
      'Stabilisation des dépendances bidirectionnelles'
    )
  } else {
    failStructural(
      'Stabilisation des dépendances bidirectionnelles'
    )
  }
}

/*
 * =========================================================
 * RÉSULTAT
 * =========================================================
 */

console.log('')
console.log(
  '================================================'
)

console.log('')
console.log(
  `${fixturePassed}/${ATTRIBUTE_DEPENDENCY_FIXTURES.length} relevés NBA 2K HQ reproduits`
)

console.log(
  `${verifiedFixtures} tests avec règles vérifiées uniquement`
)

console.log(
  `${researchFixtures} tests utilisant des règles provisoires`
)

console.log('')

console.log(
  `${structuralPassed} tests structurels réussis`
)

console.log(
  `${structuralFailed} tests structurels échoués`
)

const totalErrors =
  fixtureFailed +
  structuralFailed

if (
  totalErrors ===
  0
) {
  console.log('')
  console.log(
    'OK : moteur de dépendances stable.'
  )

  console.log(
    'OK : propagation récursive cohérente.'
  )

  console.log(
    'OK : caps et minimums respectés.'
  )

  console.log(
    'OK : aucun relevé NBA 2K HQ connu n’est contredit.'
  )

  console.log('')
  console.log(
    'Le moteur peut maintenant être branché au Builder.'
  )
} else {
  console.log('')
  console.log(
    `ERREUR : ${totalErrors} test(s) ont échoué.`
  )

  console.log(
    'Ne pas brancher le moteur à l’interface avant correction.'
  )

  process.exitCode =
    1
}

console.log('')