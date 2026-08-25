import {
  readFileSync,
} from 'node:fs'

import {
  ATTRIBUTE_DEPENDENCY_FIXTURES,
} from '../src/data/nba2k27/attributeDependencyFixtures.js'

import {
  GNR_ISOLATED_CURVES,
} from '../src/data/nba2k27/gnrResearchData.js'

import {
  getGnrCurveCoverage,
} from '../src/engine/gnrEngine.js'

const attributesFile =
  new URL(
    '../src/data/nba2k27/attributes.json',
    import.meta.url
  )

const attributesData =
  JSON.parse(
    readFileSync(
      attributesFile,
      'utf8'
    )
  )

const attributes =
  attributesData.attributes

const attributeById =
  Object.fromEntries(
    attributes.map(
      (attribute) => [
        attribute.id,
        attribute,
      ]
    )
  )

function getName(
  attributeId
) {
  const attribute =
    attributeById[
      attributeId
    ]

  return (
    attribute?.name_fr ??
    attribute?.name_en ??
    attributeId
  )
}

function getRecordedValues(
  fixture
) {
  /*
   * On utilise uniquement les valeurs
   * explicitement enregistrées dans
   * nos relevés.
   *
   * On ne considère PAS ici une valeur
   * prédite uniquement par le solveur
   * comme une mesure NBA 2K HQ.
   */
  return {
    ...fixture.requested,
    ...fixture.expected,
  }
}

const statistics =
  Object.fromEntries(
    attributes.map(
      (attribute) => [
        attribute.id,
        {
          attributeId:
            attribute.id,

          name:
            getName(
              attribute.id
            ),

          occurrences:
            0,

          values:
            [],

          covered:
            0,

          outsideRange:
            0,

          noCurve:
            0,

          outsideValues:
            [],
        },
      ]
    )
  )

let totalRecordedAbove25 =
  0

let totalCovered =
  0

let totalOutsideRange =
  0

let totalWithoutCurve =
  0

/*
 * =========================================================
 * ANALYSE DES RELEVÉS EXISTANTS
 * =========================================================
 */

for (
  const fixture
  of ATTRIBUTE_DEPENDENCY_FIXTURES
) {
  const recordedValues =
    getRecordedValues(
      fixture
    )

  for (
    const [
      attributeId,
      rawValue,
    ]
    of Object.entries(
      recordedValues
    )
  ) {
    const value =
      Number(
        rawValue
      )

    if (
      !Number.isFinite(
        value
      ) ||
      value <= 25
    ) {
      continue
    }

    const stat =
      statistics[
        attributeId
      ]

    if (!stat) {
      continue
    }

    totalRecordedAbove25 +=
      1

    stat.occurrences +=
      1

    stat.values.push(
      value
    )

    const coverage =
      getGnrCurveCoverage(
        attributeId
      )

    if (
      !coverage.supported
    ) {
      stat.noCurve +=
        1

      totalWithoutCurve +=
        1

      continue
    }

    if (
      value <
        coverage.min ||
      value >
        coverage.max
    ) {
      stat.outsideRange +=
        1

      stat.outsideValues.push(
        value
      )

      totalOutsideRange +=
        1

      continue
    }

    stat.covered +=
      1

    totalCovered +=
      1
  }
}

/*
 * =========================================================
 * ATTRIBUTS SANS COURBE GNR
 * =========================================================
 */

const missingCurves =
  Object.values(
    statistics
  )
    .filter(
      (stat) =>
        !GNR_ISOLATED_CURVES[
          stat.attributeId
        ]
    )
    .sort(
      (first, second) =>
        second.occurrences -
        first.occurrences
    )

/*
 * =========================================================
 * COURBES EXISTANTES MAIS PLAGES INCOMPLÈTES
 * =========================================================
 */

const incompleteCurves =
  Object.values(
    statistics
  )
    .filter(
      (stat) =>
        GNR_ISOLATED_CURVES[
          stat.attributeId
        ] &&
        stat.outsideRange >
          0
    )
    .sort(
      (first, second) =>
        second.outsideRange -
        first.outsideRange
    )

/*
 * =========================================================
 * ATTRIBUTS DÉJÀ BIEN COUVERTS
 * =========================================================
 */

const coveredCurves =
  Object.values(
    statistics
  )
    .filter(
      (stat) =>
        GNR_ISOLATED_CURVES[
          stat.attributeId
        ] &&
        stat.occurrences >
          0 &&
        stat.outsideRange ===
          0
    )
    .sort(
      (first, second) =>
        second.occurrences -
        first.occurrences
    )

function getObservedRange(
  stat
) {
  if (
    stat.values.length ===
    0
  ) {
    return '—'
  }

  return `${Math.min(
    ...stat.values
  )}–${Math.max(
    ...stat.values
  )}`
}

function getMeasuredRange(
  attributeId
) {
  const coverage =
    getGnrCurveCoverage(
      attributeId
    )

  if (
    !coverage.supported
  ) {
    return 'aucune'
  }

  return `${coverage.min}–${coverage.max}`
}

/*
 * =========================================================
 * AFFICHAGE
 * =========================================================
 */

console.log('')
console.log(
  'NBA 2K27 — audit de couverture GNR'
)

console.log('')
console.log(
  '==============================================='
)

console.log('')
console.log(
  `Courbes GNR mesurées : ${Object.keys(
    GNR_ISOLATED_CURVES
  ).length}/${attributes.length}`
)

console.log(
  `Valeurs >25 explicitement enregistrées : ${totalRecordedAbove25}`
)

console.log(
  `Valeurs couvertes par une courbe : ${totalCovered}`
)

console.log(
  `Valeurs hors plage mesurée : ${totalOutsideRange}`
)

console.log(
  `Valeurs appartenant à un attribut sans courbe : ${totalWithoutCurve}`
)

const coveragePercent =
  totalRecordedAbove25 >
  0
    ? (
        totalCovered /
        totalRecordedAbove25
      ) *
      100
    : 0

console.log(
  `Couverture conservatrice : ${coveragePercent.toFixed(
    1
  )}%`
)

/*
 * =========================================================
 * PRIORITÉS
 * =========================================================
 */

console.log('')
console.log(
  '=== PRIORITÉ 1 : ATTRIBUTS SANS COURBE GNR ==='
)

console.log('')

for (
  const stat
  of missingCurves
) {
  const priority =
    stat.occurrences >
    0
      ? 'À MESURER'
      : 'NON OBSERVÉ'

  console.log(
    `${priority.padEnd(
      10
    )} ${stat.name.padEnd(
      30
    )} | relevés ${String(
      stat.occurrences
    ).padStart(
      2
    )} | plage observée ${getObservedRange(
      stat
    )}`
  )
}

/*
 * =========================================================
 * EXTENSIONS DE COURBES
 * =========================================================
 */

console.log('')
console.log(
  '=== PRIORITÉ 2 : COURBES EXISTANTES À ÉTENDRE ==='
)

console.log('')

if (
  incompleteCurves.length ===
  0
) {
  console.log(
    'Aucune valeur enregistrée hors des plages mesurées.'
  )
} else {
  for (
    const stat
    of incompleteCurves
  ) {
    const uniqueOutside =
      [
        ...new Set(
          stat.outsideValues
        ),
      ].sort(
        (a, b) =>
          a - b
      )

    console.log(
      `${stat.name.padEnd(
        30
      )} | courbe ${getMeasuredRange(
        stat.attributeId
      ).padEnd(
        7
      )} | hors plage : ${uniqueOutside.join(
        ', '
      )}`
    )
  }
}

/*
 * =========================================================
 * COURBES COUVERTES
 * =========================================================
 */

console.log('')
console.log(
  '=== COURBES DÉJÀ COUVERTES SUR NOS RELEVÉS ==='
)

console.log('')

for (
  const stat
  of coveredCurves
) {
  console.log(
    `${stat.name.padEnd(
      30
    )} | courbe ${getMeasuredRange(
      stat.attributeId
    ).padEnd(
      7
    )} | ${stat.covered}/${stat.occurrences} valeur(s) couverte(s)`
  )
}

/*
 * =========================================================
 * RECOMMANDATION AUTOMATIQUE
 * =========================================================
 */

const nextMissing =
  missingCurves.find(
    (stat) =>
      stat.occurrences >
      0
  )

console.log('')
console.log(
  '==============================================='
)

if (nextMissing) {
  console.log('')
  console.log(
    `PROCHAIN ATTRIBUT RECOMMANDÉ : ${nextMissing.name}`
  )

  console.log(
    `Il apparaît ${nextMissing.occurrences} fois dans les relevés connus.`
  )

  console.log(
    `Plage déjà observée : ${getObservedRange(
      nextMissing
    )}`
  )

  console.log(
    'Objectif : construire sa première courbe GNR isolée.'
  )
} else if (
  incompleteCurves.length >
  0
) {
  const nextIncomplete =
    incompleteCurves[0]

  console.log('')
  console.log(
    `PROCHAINE EXTENSION RECOMMANDÉE : ${nextIncomplete.name}`
  )

  console.log(
    `Courbe actuelle : ${getMeasuredRange(
      nextIncomplete.attributeId
    )}`
  )

  console.log(
    `Valeurs manquantes observées : ${[
      ...new Set(
        nextIncomplete.outsideValues
      ),
    ]
      .sort(
        (a, b) =>
          a - b
      )
      .join(
        ', '
      )}`
  )
} else {
  console.log('')
  console.log(
    'Tous les attributs explicitement observés sont couverts.'
  )
}

console.log('')
console.log(
  'NOTE : cet audit est volontairement conservateur.'
)

console.log(
  'Il ne transforme jamais une prédiction du solveur en mesure GNR officielle.'
)

console.log('')