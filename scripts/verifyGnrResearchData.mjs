import {
  GNR_ADDITIVITY_FIXTURES,
  GNR_ISOLATED_CURVES,
  GNR_RESEARCH_META,
} from '../src/data/nba2k27/gnrResearchData.js'

let passed =
  0

let failed =
  0

function pass(
  message
) {
  passed += 1

  console.log(
    `PASS  ${message}`
  )
}

function fail(
  message
) {
  failed += 1

  console.log(
    `FAIL  ${message}`
  )
}

console.log('')
console.log(
  'NBA 2K27 — données de recherche GNR'
)
console.log('')

if (
  GNR_RESEARCH_META.baseOverall ===
    25 &&
  GNR_RESEARCH_META.baseAttributeValue ===
    25
) {
  pass(
    'Ancre globale : attributs 25 → GNR 25'
  )
} else {
  fail(
    'Ancre globale invalide'
  )
}

for (
  const curve
  of Object.values(
    GNR_ISOLATED_CURVES
  )
) {
  if (
    curve.points.length ===
    0
  ) {
    fail(
      `${curve.label} : aucune mesure`
    )

    continue
  }

  const firstPoint =
    curve.points[0]

  if (
    firstPoint.value !==
      curve.baseline.value ||
    firstPoint.gnr !==
      curve.baseline.gnr
  ) {
    fail(
      `${curve.label} : baseline incohérente`
    )
  } else {
    pass(
      `${curve.label} : baseline correcte`
    )
  }

  let monotoneValues =
    true

  let monotoneGnr =
    true

  for (
    let index = 1;
    index <
      curve.points.length;
    index += 1
  ) {
    const previous =
      curve.points[
        index - 1
      ]

    const current =
      curve.points[
        index
      ]

    if (
      current.value <=
      previous.value
    ) {
      monotoneValues =
        false
    }

    if (
      current.gnr <
      previous.gnr
    ) {
      monotoneGnr =
        false
    }
  }

  if (
    monotoneValues
  ) {
    pass(
      `${curve.label} : valeurs triées`
    )
  } else {
    fail(
      `${curve.label} : valeurs non triées`
    )
  }

  if (
    monotoneGnr
  ) {
    pass(
      `${curve.label} : GNR monotone`
    )
  } else {
    fail(
      `${curve.label} : GNR non monotone`
    )
  }
}

/*
 * Lancer-franc :
 * aucune variation GNR mesurée.
 */
{
  const freeThrow =
    GNR_ISOLATED_CURVES.freeThrow

  const uniqueGnr =
    new Set(
      freeThrow.points.map(
        (point) =>
          point.gnr
      )
    )

  if (
    uniqueGnr.size ===
    1
  ) {
    pass(
      'Lancer-franc : coût GNR affiché nul sur la plage mesurée'
    )
  } else {
    fail(
      'Lancer-franc : variation inattendue'
    )
  }
}

/*
 * Vérification de l'accélération
 * haute de Tirs de près.
 */
{
  const close =
    Object.fromEntries(
      GNR_ISOLATED_CURVES
        .closeShot
        .points
        .map(
          (point) => [
            point.value,
            point.gnr,
          ]
        )
    )

  if (
    close[95] === 49 &&
    close[96] === 50 &&
    close[97] === 51 &&
    close[98] === 52 &&
    close[99] === 54
  ) {
    pass(
      'Tirs de près : séquence 95–99 correcte'
    )
  } else {
    fail(
      'Tirs de près : séquence 95–99 incorrecte'
    )
  }
}

/*
 * Vérification du test
 * d'additivité Passes.
 *
 * Dans les deux contextes,
 * Pass95 → Pass99 produit
 * exactement +6 GNR affichés.
 */
{
  const first =
    GNR_ADDITIVITY_FIXTURES[0]

  const second =
    GNR_ADDITIVITY_FIXTURES[1]

  function getGnr(
    fixture,
    passAccuracy
  ) {
    return fixture.points.find(
      (point) =>
        point.passAccuracy ===
        passAccuracy
    )?.gnr
  }

  const firstDelta =
    getGnr(
      first,
      99
    ) -
    getGnr(
      first,
      95
    )

  const secondDelta =
    getGnr(
      second,
      99
    ) -
    getGnr(
      second,
      95
    )

  if (
    firstDelta === 6 &&
    secondDelta === 6
  ) {
    pass(
      'Additivité : Pass95→99 = +6 dans les deux contextes'
    )
  } else {
    fail(
      `Additivité : deltas ${firstDelta} / ${secondDelta}`
    )
  }
}

console.log('')
console.log(
  '---------------------------------------------'
)

console.log(
  `${passed} vérifications réussies`
)

console.log(
  `${failed} vérification(s) échouée(s)`
)

if (
  failed === 0
) {
  console.log('')
  console.log(
    'OK : données GNR cohérentes et prêtes pour la modélisation.'
  )

  console.log(
    'Aucun calcul GNR estimé n’est encore utilisé dans le Builder.'
  )
} else {
  console.log('')
  console.log(
    'ERREUR : corriger les données avant de construire le moteur GNR.'
  )

  process.exitCode =
    1
}

console.log('')