import {
  getExactBodyCaps,
  getExactDependencyRules,
  testExactOverallIncrement,
} from '../src/engine/apkBuilderEngine.js'

import {
  solveAttributeDependencies,
} from '../src/engine/attributeDependencyEngine.js'

const morphology = {
  position: 'SF',
  height: 79,
  weight: 215,
  wingspan: 82,
}

const caps = getExactBodyCaps(morphology).caps
const rules = getExactDependencyRules(morphology.height)

function solve(values) {
  return solveAttributeDependencies({
    requestedAttributes: values,
    caps,
    rules,
    includeProvisional: false,
  }).values
}

function approx(actual, expected, tolerance = 0.0001) {
  return Math.abs(Number(actual) - Number(expected)) <= tolerance
}

let failures = 0

function fail(message, details = null) {
  failures += 1
  console.error(message)
  if (details) console.error(details)
}

/*
 * Fixture A — a legal last purchase.
 * Current displayed OVR is 98 and Strength 87 -> 88 lands exactly at
 * detailed 99.000, so the native gate must allow it.
 */
const legal98 = {
  closeShot: 88,
  drivingLayup: 98,
  drivingDunk: 85,
  standingDunk: 35,
  postControl: 69,
  midRangeShot: 82,
  threePointShot: 57,
  freeThrow: 57,
  passAccuracy: 48,
  ballHandle: 73,
  speedWithBall: 69,
  interiorDefense: 93,
  perimeterDefense: 72,
  steal: 95,
  block: 63,
  offensiveRebound: 67,
  defensiveRebound: 73,
  speed: 81,
  agility: 66,
  strength: 87,
  vertical: 65,
}

const legal98Candidate = solve({
  ...legal98,
  strength: 88,
})

const legalCheck = testExactOverallIncrement(
  legal98,
  legal98Candidate,
  morphology.height,
  { caps }
)

if (!legalCheck.allowed) {
  fail('OVERALL BUDGET: legal 98 -> 99 increment was blocked.', legalCheck)
}

if (
  legalCheck.current.displayed !== 98 ||
  legalCheck.candidate.displayed !== 99 ||
  !approx(legalCheck.candidate.detailed, 99)
) {
  fail('OVERALL BUDGET: legal boundary fixture does not match native values.', legalCheck)
}

/*
 * Fixture B — displayed 98, but the simulated +1 (plus associated linked
 * increases) would produce detailed 99.217..., therefore 2K blocks it even
 * though the visible candidate would still read 99.
 */
const crossing98 = {
  closeShot: 97,
  drivingLayup: 72,
  drivingDunk: 62,
  standingDunk: 72,
  postControl: 81,
  midRangeShot: 75,
  threePointShot: 85,
  freeThrow: 60,
  passAccuracy: 57,
  ballHandle: 82,
  speedWithBall: 79,
  interiorDefense: 66,
  perimeterDefense: 93,
  steal: 84,
  block: 79,
  offensiveRebound: 41,
  defensiveRebound: 54,
  speed: 75,
  agility: 71,
  strength: 89,
  vertical: 52,
}

const crossingCandidate = solve({
  ...crossing98,
  closeShot: 98,
})

const crossingCheck = testExactOverallIncrement(
  crossing98,
  crossingCandidate,
  morphology.height,
  { caps }
)

if (
  crossingCheck.allowed ||
  crossingCheck.reason !== 'candidate-over-99'
) {
  fail('OVERALL BUDGET: detailed >99 candidate was not blocked.', crossingCheck)
}

if (
  crossingCheck.current.displayed !== 98 ||
  crossingCheck.candidate.displayed !== 99 ||
  !approx(crossingCheck.candidate.detailed, 99.21702575683594)
) {
  fail('OVERALL BUDGET: over-99 fixture does not match native values.', crossingCheck)
}

if (
  crossingCandidate.drivingLayup !== 73 ||
  crossingCandidate.vertical !== 53
) {
  fail(
    'OVERALL BUDGET: dependency simulation did not include linked increases.',
    crossingCandidate
  )
}

/*
 * Fixture C — the native manager refuses any new attribute increase once its
 * stored integer OVR is already 99, even if the candidate detailed value
 * itself would remain <= 99.0.
 */
const already99 = {
  closeShot: 99,
  drivingLayup: 92,
  drivingDunk: 50,
  standingDunk: 35,
  postControl: 79,
  midRangeShot: 72,
  threePointShot: 82,
  freeThrow: 59,
  passAccuracy: 70,
  ballHandle: 90,
  speedWithBall: 70,
  interiorDefense: 82,
  perimeterDefense: 88,
  steal: 58,
  block: 52,
  offensiveRebound: 55,
  defensiveRebound: 70,
  speed: 77,
  agility: 83,
  strength: 62,
  vertical: 80,
}

const already99Candidate = solve({
  ...already99,
  drivingLayup: 93,
})

const already99Check = testExactOverallIncrement(
  already99,
  already99Candidate,
  morphology.height,
  { caps }
)

if (
  already99Check.allowed ||
  already99Check.reason !== 'overall-already-99'
) {
  fail('OVERALL BUDGET: increase from displayed 99 was not blocked.', already99Check)
}

if (already99Check.current.displayed !== 99) {
  fail('OVERALL BUDGET: displayed-99 fixture no longer resolves to 99.', already99Check)
}

if (failures > 0) {
  console.error(`\nOverall budget APK verification failed: ${failures} error(s).`)
  process.exit(1)
}

console.log('Overall budget APK verification passed.')
console.log('- 98 -> 99 legal boundary increment')
console.log('- 98 -> 99.217 detailed overflow blocked')
console.log('- displayed 99 -> further increase blocked')
console.log('- linked-attribute costs included before validation')
