import {
  createPersonalBuildPayload,
  recommendPersonalBuilds,
} from '../src/engine/playstyleEngine.js'

const scenarios = [
  {
    position: 'PG',
    offensePrimary: 'primary_creator',
    offenseSecondary: 'closeout',
    defensePrimary: 'on_ball_defense',
    priorities: ['dribbling', 'passing', 'shooting'],
    sacrifices: ['rebounding'],
    teamContext: 'rec_solo',
    morphologyPreference: 'balanced',
    capBreakerStrategy: 'thresholds',
  },
  {
    position: 'SG',
    offensePrimary: 'spot_up',
    offenseSecondary: 'closeout',
    defensePrimary: 'on_ball_defense',
    priorities: ['perimeterDefense', 'steal', 'strength'],
    sacrifices: ['rebounding'],
    teamContext: 'organized_rec',
    morphologyPreference: 'balanced',
    capBreakerStrategy: 'thresholds',
  },
  {
    position: 'SF',
    offensePrimary: 'secondary_creator',
    offenseSecondary: 'spot_up',
    defensePrimary: 'switch_defense',
    priorities: ['perimeterDefense', 'shooting', 'strength'],
    sacrifices: ['rebounding'],
    teamContext: 'friends',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'balanced',
  },
  {
    position: 'PF',
    offensePrimary: 'spot_up',
    offenseSecondary: 'cuts',
    defensePrimary: 'interceptions',
    priorities: ['steal', 'block', 'strength'],
    sacrifices: ['dribbling'],
    teamContext: 'organized_rec',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'thresholds',
  },
  {
    position: 'C',
    offensePrimary: 'pick_roll',
    offenseSecondary: 'spot_up',
    defensePrimary: 'rim_protection',
    priorities: ['rebounding', 'block', 'passing'],
    sacrifices: ['dribbling'],
    teamContext: 'organized_rec',
    morphologyPreference: 'big_physical',
    capBreakerStrategy: 'thresholds',
  },
]

for (const scenario of scenarios) {
  const analysis = recommendPersonalBuilds(scenario)

  if (analysis.results.length !== 3) {
    throw new Error(`${scenario.position}: 3 résultats attendus, ${analysis.results.length} reçus.`)
  }

  for (const result of analysis.results) {
    if (result.gnr.displayed !== 99) {
      throw new Error(`${result.id}: GNR 99 attendu, ${result.gnr.displayed} reçu.`)
    }

    for (const target of [5, 10, 15]) {
      if (result.capBreakerPlans[target].applied !== target) {
        throw new Error(`${result.id}: plan +${target} incomplet.`)
      }
    }

    if (result.synergies.length === 0) {
      throw new Error(`${result.id}: aucune Synergie recommandée.`)
    }

    const payload = createPersonalBuildPayload(result)

    if (
      payload.morphology.position !== scenario.position ||
      Object.keys(payload.manualAttributes).length !== 21
    ) {
      throw new Error(`${result.id}: payload Builder invalide.`)
    }
  }

  console.log(
    `PASS ${scenario.position}: ${analysis.results.map((result) => `${result.id} (${result.affinity}%)`).join(' · ')}`
  )
}

console.log('Playstyle Finder verification passed.')
