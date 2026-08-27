import attributesData from '../src/data/nba2k27/attributes.json' with { type: 'json' }
import { recommendPersonalBuilds, createPersonalBuildPayload } from '../src/engine/playstyleEngine.js'
import { createBuildPayload, encodeBuildPayload, decodeBuildPayload } from '../src/engine/buildPersistence.js'
import { getPlayerSummary } from '../src/engine/playerSummaryEngine.js'

const answers = {
  position: 'PF',
  offensePrimary: 'spot_up',
  offenseSecondary: 'cuts',
  defensePrimary: 'switch_defense',
  shootingProfile: 'open_spacer',
  finishingProfile: 'cuts',
  matchupProfile: 'switch_all',
  priorities: ['steal', 'block', 'strength'],
  sacrifices: ['dribbling'],
  teamContext: 'organized_rec',
  morphologyPreference: 'big_physical',
  capBreakerStrategy: 'thresholds',
}

const analysis = recommendPersonalBuilds(answers)
const result = analysis.results[0]

if (!result || analysis.generation?.version !== 'V22') {
  throw new Error('V22: résultat personnalisé attendu.')
}

if ((analysis.generation.screenedMorphologies ?? Infinity) > 6000) {
  throw new Error(`V22: screening trop large (${analysis.generation.screenedMorphologies}).`)
}

const finderPayload = createPersonalBuildPayload(result)

if (!finderPayload.personalRecommendation?.capBreakerPlans?.[10]) {
  throw new Error('V22: plan Cap Breakers non conservé dans le payload Finder.')
}

const persistentPayload = createBuildPayload({
  ...finderPayload,
  personalRecommendation: finderPayload.personalRecommendation,
  attributes: attributesData.attributes,
})
const encoded = encodeBuildPayload(persistentPayload)
const decoded = decodeBuildPayload(encoded, attributesData.attributes)

if (!decoded?.personalRecommendation?.capBreakerPlans?.[10]) {
  throw new Error('V22: plan personnalisé perdu après sauvegarde / partage.')
}

const summary = getPlayerSummary(result.attributes, result.position)

if (!summary.strengths.length || !summary.weaknesses.length) {
  throw new Error('V22: résumé points forts / faibles incomplet.')
}

console.log('V22 experience verification passed.')
console.log(`- screening morphologies: ${analysis.generation.screenedMorphologies}`)
console.log(`- build: ${result.id} (${result.affinity}%)`)
console.log(`- plan +10 persistant: ${decoded.personalRecommendation.capBreakerPlans[10].lines.length} lignes`)
console.log(`- résumé: ${summary.strengths.length} points forts / ${summary.weaknesses.length} points faibles`)
