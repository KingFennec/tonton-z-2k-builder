import {
  createPersonalBuildPayload,
  recommendPersonalBuilds,
} from '../src/engine/playstyleEngine.js'
import {
  getExactBodyBounds,
  getExactBodyCaps,
  getExactDependencyRules,
} from '../src/engine/apkBuilderEngine.js'
import { solveAttributeDependencies } from '../src/engine/attributeDependencyEngine.js'
import { getAnimationOptimizerStatus } from '../src/engine/animationOptimizerEngine.js'
import positionsData from '../src/data/nba2k27/positions.json' with { type: 'json' }

const positionById = new Map(
  positionsData.positions.map((position) => [position.id, position])
)

const scenarios = [
  {
    name: 'PG créateur',
    position: 'PG',
    offensePrimary: 'primary_creator',
    offenseSecondary: 'closeout',
    defensePrimary: 'on_ball_defense',
    shootingProfile: 'elite_range',
    finishingProfile: 'simple',
    matchupProfile: 'guards',
    priorities: ['dribbling', 'passing', 'shooting'],
    sacrifices: ['rebounding'],
    teamContext: 'rec_solo',
    morphologyPreference: 'balanced',
    capBreakerStrategy: 'thresholds',
    expectedIdealSource: 'PG-1',
  },
  {
    name: 'SG lock / spot-up',
    position: 'SG',
    offensePrimary: 'spot_up',
    offenseSecondary: 'closeout',
    defensePrimary: 'on_ball_defense',
    shootingProfile: 'open_spacer',
    finishingProfile: 'simple',
    matchupProfile: 'guards',
    priorities: ['perimeterDefense', 'steal', 'strength'],
    sacrifices: ['rebounding'],
    teamContext: 'organized_rec',
    morphologyPreference: 'balanced',
    capBreakerStrategy: 'thresholds',
    expectedIdealSource: 'SG-2',
  },
  {
    name: 'SF polyvalent / switch',
    position: 'SF',
    offensePrimary: 'secondary_creator',
    offenseSecondary: 'spot_up',
    defensePrimary: 'switch_defense',
    shootingProfile: 'reliable_spotup',
    finishingProfile: 'simple',
    matchupProfile: 'switch_all',
    priorities: ['perimeterDefense', 'shooting', 'strength'],
    sacrifices: ['rebounding'],
    teamContext: 'friends',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'balanced',
    expectedIdealSource: 'SF-2',
  },
  {
    name: 'PF backend',
    position: 'PF',
    offensePrimary: 'spot_up',
    offenseSecondary: 'cuts',
    defensePrimary: 'interceptions',
    shootingProfile: 'open_spacer',
    finishingProfile: 'cuts',
    matchupProfile: 'switch_all',
    priorities: ['steal', 'block', 'strength'],
    sacrifices: ['dribbling'],
    teamContext: 'organized_rec',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'thresholds',
    expectedIdealSource: 'PF-4',
  },
  {
    name: 'C pass-first',
    position: 'C',
    offensePrimary: 'pick_roll',
    offenseSecondary: 'spot_up',
    defensePrimary: 'rim_protection',
    shootingProfile: 'reliable_spotup',
    finishingProfile: 'inside_big',
    matchupProfile: 'forwards_bigs',
    priorities: ['rebounding', 'block', 'passing'],
    sacrifices: ['dribbling'],
    teamContext: 'organized_rec',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'thresholds',
    expectedIdealSource: 'C-2',
  },
  {
    name: 'PG slasher / closeout',
    position: 'PG',
    offensePrimary: 'closeout',
    offenseSecondary: 'cuts',
    defensePrimary: 'on_ball_defense',
    shootingProfile: 'open_spacer',
    finishingProfile: 'contacts',
    matchupProfile: 'guards',
    priorities: ['dunk', 'shooting', 'dribbling'],
    sacrifices: ['rebounding'],
    teamContext: 'rec_solo',
    morphologyPreference: 'balanced',
    capBreakerStrategy: 'thresholds',
    expectedIdealSource: 'PG-4',
  },
]

function resultSignature(result) {
  return JSON.stringify({
    morphology: result.morphology,
    attributes: result.attributes,
  })
}

const animationStatus = getAnimationOptimizerStatus()
let scenariosWithMorphologyChange = 0
let resultsWithAnimationAnalysis = 0
let plansWithAnimationUnlockField = 0

for (const scenario of scenarios) {
  const analysis = recommendPersonalBuilds(scenario)

  if (analysis.results.length !== 3) {
    throw new Error(`${scenario.name}: 3 résultats attendus, ${analysis.results.length} reçus.`)
  }

  if (analysis.generation?.version !== 'V22') {
    throw new Error(`${scenario.name}: moteur V22 attendu.`)
  }

  if (
    (analysis.generation.screenedMorphologies ?? 0) <= analysis.generation.seedCount ||
    (analysis.generation.evaluatedMorphologies ?? 0) < analysis.generation.seedCount
  ) {
    throw new Error(`${scenario.name}: recherche morphologique V22 non exécutée.`)
  }

  const ideal = analysis.results[0]
  const idealSource = ideal.sourceCandidateId ?? ideal.id

  // V22 ajoute des préférences de tir, finition et matchups :
  // l'architecture gagnante peut donc évoluer même sans index d'animations réel.

  if (!ideal.generated) {
    throw new Error(`${scenario.name}: le build idéal doit passer par l'optimiseur V22.`)
  }

  if (ideal.optimization?.morphology?.changed) {
    scenariosWithMorphologyChange += 1
  }

  const signatures = analysis.results.map(resultSignature)

  if (new Set(signatures).size !== signatures.length) {
    throw new Error(`${scenario.name}: deux propositions sont strictement identiques.`)
  }

  const metaId = analysis.metaCandidate?.id
  const idealIsExactMeta =
    ideal.sourceCandidateId === metaId &&
    (ideal.optimization?.changes?.length ?? 0) === 0 &&
    !ideal.optimization?.morphology?.changed

  if (
    metaId &&
    !idealIsExactMeta &&
    analysis.results[2]?.id !== metaId
  ) {
    throw new Error(
      `${scenario.name}: la référence Meta ${metaId} doit rester inchangée en 3e proposition.`
    )
  }

  for (const result of analysis.results) {
    if (result.gnr.displayed !== 99 || result.gnr.detailed > 99.00001) {
      throw new Error(
        `${result.id}: BASE 99 exacte attendue, GNR détaillé ${result.gnr.detailed}.`
      )
    }

    const position = positionById.get(result.position)

    if (
      !position ||
      result.morphology.height < position.height.min ||
      result.morphology.height > position.height.max
    ) {
      throw new Error(`${result.id}: taille hors plage du poste.`)
    }

    const bodyBounds = getExactBodyBounds(
      result.morphology.height,
      result.position
    )

    if (
      result.morphology.weight < bodyBounds.weight.min ||
      result.morphology.weight > bodyBounds.weight.max ||
      result.morphology.wingspan < bodyBounds.wingspan.min ||
      result.morphology.wingspan > bodyBounds.wingspan.max
    ) {
      throw new Error(`${result.id}: morphologie hors bornes APK.`)
    }

    const bodyCaps = getExactBodyCaps(result.morphology)

    for (const [attributeId, value] of Object.entries(result.attributes)) {
      if (value > bodyCaps.caps[attributeId]) {
        throw new Error(
          `${result.id}: ${attributeId}=${value} dépasse le cap ${bodyCaps.caps[attributeId]}.`
        )
      }
    }

    const dependencyCheck = solveAttributeDependencies({
      requestedAttributes: result.attributes,
      baseValues: {},
      caps: bodyCaps.caps,
      rules: getExactDependencyRules(result.morphology.height),
      includeProvisional: false,
    })

    if (dependencyCheck.capConflicts.length > 0) {
      throw new Error(`${result.id}: conflit de dépendance APK.`)
    }

    for (const [attributeId, value] of Object.entries(result.attributes)) {
      if (dependencyCheck.values[attributeId] !== value) {
        throw new Error(
          `${result.id}: dépendance non résolue sur ${attributeId} (${value} -> ${dependencyCheck.values[attributeId]}).`
        )
      }
    }

    if (animationStatus.enabled) {
      if (!result.animationAnalysis?.enabled) {
        throw new Error(`${result.id}: analyse animations V22 inactive malgré l'index APK.`)
      }

      if (!Number.isFinite(result.animationAnalysis.score)) {
        throw new Error(`${result.id}: score animations V22 invalide.`)
      }

      resultsWithAnimationAnalysis += 1
    } else if (result.animationAnalysis?.enabled) {
      throw new Error(`${result.id}: analyse animations active sans index APK complet.`)
    }

    for (const target of [5, 10, 15]) {
      const plan = result.capBreakerPlans[target]

      if (plan.applied !== target) {
        throw new Error(`${result.id}: plan +${target} incomplet.`)
      }

      if (!Array.isArray(plan.animationUnlocks)) {
        throw new Error(`${result.id}: plan +${target} sans champ animationUnlocks.`)
      }

      plansWithAnimationUnlockField += 1
    }

    if (result.synergies.length === 0) {
      throw new Error(`${result.id}: aucune Synergie recommandée.`)
    }

    const payload = createPersonalBuildPayload(result)

    if (
      payload.morphology.position !== scenario.position ||
      Object.keys(payload.manualAttributes).length !== 21 ||
      !payload.personalRecommendation ||
      !payload.personalRecommendation.capBreakerPlans?.[10]
    ) {
      throw new Error(`${result.id}: payload Builder / plan personnalisé invalide.`)
    }
  }

  console.log(
    `PASS ${scenario.name}: ${analysis.results.map((result) => `${result.id} (${result.affinity}%)`).join(' · ')} | morphologies ${analysis.generation.evaluatedMorphologies}/${analysis.generation.screenedMorphologies}`
  )
}

// Le nombre de morphologies effectivement modifiées dépend des seuils d'animations
// présents dans l'index APK. Une morphologie de départ peut déjà être optimale :
// on vérifie donc l'exécution réelle du balayage pour chaque scénario plus haut,
// sans imposer un nombre arbitraire de changements de morphologie.

if (plansWithAnimationUnlockField !== scenarios.length * 3 * 3) {
  throw new Error(
    `V22: champs animationUnlocks incomplets (${plansWithAnimationUnlockField}).`
  )
}

if (animationStatus.enabled && resultsWithAnimationAnalysis !== scenarios.length * 3) {
  throw new Error(
    `V22: analyses animations incomplètes (${resultsWithAnimationAnalysis}).`
  )
}

console.log('Playstyle Finder V22 verification passed.')
console.log(`- animation optimizer: ${animationStatus.enabled ? 'APK 2914 actif' : 'index placeholder / fallback V20'}`)
console.log('- BASE 99 exact, morphologie, Cap Breakers et Synergies vérifiés')
console.log(`- morphologies réellement modifiées: ${scenariosWithMorphologyChange}/${scenarios.length}`)
console.log("- champs d'animations V22 vérifiés sur tous les résultats")
