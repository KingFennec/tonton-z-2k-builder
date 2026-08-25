import {
  BUILDER_ATTRIBUTE_IDS,
  getAllCapBreakerProjections,
  getCapBreakerProjection,
  getExactBodyCaps,
} from '../src/engine/apkBuilderEngine.js'

const morphology = {
  position: 'SF',
  height: 79,
  weight: 215,
  wingspan: 82,
}

const all25 = Object.fromEntries(
  BUILDER_ATTRIBUTE_IDS.map((id) => [id, 25])
)

const expectedBoosts = {
  closeShot: [6, 6, 5, 5, 4],
  drivingLayup: [4, 4, 4, 3, 3],
  drivingDunk: [2, 2, 2, 2, 2],
  standingDunk: [10, 10, 8, 7, 6],
  postControl: [14, 12, 10, 8, 6],
  midRangeShot: [1, 1, 1, 1, 1],
  threePointShot: [1, 1, 1, 1, 1],
  freeThrow: [14, 12, 10, 8, 6],
  passAccuracy: [4, 4, 4, 4, 4],
  ballHandle: [1, 1, 1, 1, 1],
  speedWithBall: [1, 1, 1, 1, 1],
  interiorDefense: [10, 10, 8, 7, 6],
  perimeterDefense: [2, 2, 2, 2, 2],
  steal: [1, 1, 1, 1, 1],
  block: [13, 11, 9, 8, 7],
  offensiveRebound: [15, 13, 10, 8, 5],
  defensiveRebound: [9, 9, 7, 7, 5],
  speed: [2, 2, 2, 2, 2],
  agility: [3, 3, 3, 3, 3],
  strength: [4, 4, 4, 4, 4],
  vertical: [4, 4, 4, 4, 3],
}

const projections = getAllCapBreakerProjections(all25, morphology)
let checked = 0

for (const id of BUILDER_ATTRIBUTE_IDS) {
  const actual = projections[id]
  const expected = expectedBoosts[id]

  if (!actual?.available) {
    throw new Error(`${id}: projection unavailable`)
  }

  if (JSON.stringify(actual.boosts) !== JSON.stringify(expected)) {
    throw new Error(
      `${id}: expected ${expected.join(',')} but got ${actual.boosts.join(',')}`
    )
  }

  if (actual.boosts.length !== 5) {
    throw new Error(`${id}: expected exactly five Cap Breaker slots`)
  }

  if (actual.finalValue > actual.maxCap) {
    throw new Error(`${id}: projection exceeds morphology cap`)
  }

  checked += 1
}

const caps = getExactBodyCaps(morphology).caps
const atCaps = { ...all25, ...caps }

for (const id of BUILDER_ATTRIBUTE_IDS) {
  const projection = getCapBreakerProjection(id, atCaps, morphology)

  if (projection.boosts.some((value) => value !== 0)) {
    throw new Error(`${id}: a capped attribute should have no Cap Breaker room`)
  }
}

const highBallHandle = {
  ...all25,
  ballHandle: 90,
}
const bhProjection = getCapBreakerProjection(
  'ballHandle',
  highBallHandle,
  morphology
)

if (JSON.stringify(bhProjection.boosts) !== JSON.stringify([1, 0, 0, 0, 0])) {
  throw new Error(`Ball Handle 90 expected [1,0,0,0,0], got ${bhProjection.boosts}`)
}

console.log('Cap Breaker APK verification passed.')
console.log(`- ${checked}/21 reference attribute projections`)
console.log('- 5/5 native slots per attribute')
console.log('- morphology cap clipping verified')
console.log('- high-rating +1 behavior verified')
