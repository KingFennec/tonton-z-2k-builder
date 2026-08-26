import attributesData from '../src/data/nba2k27/attributes.json' with { type: 'json' }
import takeoversData from '../src/data/nba2k27/takeovers.json' with { type: 'json' }
import {
  createBuildPayload,
  decodeBuildPayload,
  encodeBuildPayload,
} from '../src/engine/buildPersistence.js'

const initialAttributes = Object.fromEntries(
  attributesData.attributes.map((attribute) => [attribute.id, attribute.min])
)

const payload = createBuildPayload({
  morphology: {
    position: 'SF',
    height: 79,
    weight: 215,
    wingspan: 82,
  },
  manualAttributes: initialAttributes,
  selectedBadges: {},
  selectedTakeovers: {
    shooting: 'hydration-hero',
  },
  selectedCapBreakers: {
    DrivingDunk: 3,
    ShotThree: 1,
  },
  attributes: attributesData.attributes,
})

const decoded = decodeBuildPayload(
  encodeBuildPayload(payload),
  attributesData.attributes
)

if (
  decoded?.selectedCapBreakers?.DrivingDunk !== 3 ||
  decoded?.selectedCapBreakers?.ShotThree !== 1
) {
  throw new Error('Cap Breaker selections do not survive build persistence.')
}

if (decoded?.selectedTakeovers?.shooting !== 'hydration-hero') {
  throw new Error('Universal Takeover assignment does not survive build persistence.')
}

const universalTakeovers = takeoversData.takeovers.filter(
  (takeover) => takeover.discipline === 'universal'
)

if (
  universalTakeovers.length !== 1 ||
  universalTakeovers[0].id !== 'hydration-hero'
) {
  throw new Error('Unexpected universal Takeover dataset.')
}

console.log('V16 interaction verification passed.')
console.log('- Cap Breaker selections persist in saved/shared builds')
console.log('- Universal Hydration Hero can persist under a playable discipline')
