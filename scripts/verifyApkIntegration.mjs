import {
  ATTRIBUTE_DEPENDENCY_FIXTURES,
} from '../src/data/nba2k27/attributeDependencyFixtures.js'

import {
  BUILDER_ATTRIBUTE_IDS,
  calculateExactGnr,
  getExactBodyBounds,
  getExactBodyCaps,
  getExactDependencyRules,
} from '../src/engine/apkBuilderEngine.js'

import {
  solveAttributeDependencies,
} from '../src/engine/attributeDependencyEngine.js'

const morphology = {
  position: 'PG',
  height: 79,
  weight: 215,
  wingspan: 82,
}

const expectedReferenceCaps = {
  closeShot: 99,
  drivingLayup: 99,
  drivingDunk: 96,
  standingDunk: 97,
  postControl: 93,
  midRangeShot: 93,
  threePointShot: 87,
  freeThrow: 99,
  passAccuracy: 99,
  ballHandle: 91,
  speedWithBall: 81,
  interiorDefense: 96,
  perimeterDefense: 95,
  steal: 95,
  block: 79,
  offensiveRebound: 76,
  defensiveRebound: 83,
  speed: 90,
  agility: 86,
  strength: 89,
  vertical: 97,
}

function makeBaseline() {
  return Object.fromEntries(
    BUILDER_ATTRIBUTE_IDS.map((attributeId) => [attributeId, 25])
  )
}

let failures = 0

const capResult = getExactBodyCaps(morphology)

for (const attributeId of BUILDER_ATTRIBUTE_IDS) {
  const actual = capResult.caps?.[attributeId]
  const expected = expectedReferenceCaps[attributeId]

  if (actual !== expected) {
    failures += 1
    console.error(`CAP ${attributeId}: ${actual} != ${expected}`)
  }
}

const bounds = getExactBodyBounds(79, 'PG')

if (
  bounds.weight.min !== 180 ||
  bounds.weight.max !== 230 ||
  bounds.wingspan.min !== 79 ||
  bounds.wingspan.max !== 85
) {
  failures += 1
  console.error('BODY BOUNDS mismatch:', bounds)
}

const rules = getExactDependencyRules(79)

if (rules.length !== 78) {
  failures += 1
  console.error(`DEPENDENCY RULE COUNT: ${rules.length} != 78`)
}

for (const fixture of ATTRIBUTE_DEPENDENCY_FIXTURES) {
  const requested = makeBaseline()
  Object.assign(requested, fixture.requested)

  const solved = solveAttributeDependencies({
    requestedAttributes: requested,
    caps: capResult.caps,
    rules,
    includeProvisional: false,
  })

  for (const [attributeId, expected] of Object.entries(fixture.expected)) {
    const actual = solved.values[attributeId]

    if (actual !== expected) {
      failures += 1
      console.error(
        `${fixture.id} / ${attributeId}: ${actual} != ${expected}`
      )
    }
  }

  const gnr = calculateExactGnr(
    solved.values,
    morphology.height,
    {
      caps: capResult.caps,
    }
  )

  if (gnr.displayed !== fixture.gnr) {
    failures += 1
    console.error(
      `${fixture.id} / GNR: ${gnr.displayed} != ${fixture.gnr}`
    )
  }
}

if (failures > 0) {
  console.error(`\nAPK integration verification failed: ${failures} error(s).`)
  process.exit(1)
}

console.log('APK integration verification passed.')
console.log(`- 21/21 reference morphology caps`)
console.log(`- 78 exact dependency rules at 6'7\"`)
console.log(`- ${ATTRIBUTE_DEPENDENCY_FIXTURES.length}/${ATTRIBUTE_DEPENDENCY_FIXTURES.length} historical fixtures + GNR`)
