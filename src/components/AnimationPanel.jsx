import { useEffect, useMemo, useState } from 'react'

import {
  evaluateAnimationAvailability,
  getMissingAnimationRequirements,
} from '../engine/animationEngine.js'

import {
  getAnimationRecommendationScore,
} from '../engine/animationRecommendationEngine.js'

import './AnimationPanel.css'

const ATTRIBUTE_LABELS = Object.freeze({
  agility: 'Agilité',
  ballHandle: 'Contrôle du ballon',
  drivingDunk: 'Dunk en pénétration',
  drivingLayup: 'Double-pas en pénétration',
  passAccuracy: 'Précision des passes',
  postControl: 'Contrôle au poste',
  midRangeShot: 'Tir à mi-distance',
  threePointShot: 'Tir à 3 points',
  speed: 'Vitesse',
  speedWithBall: 'Vitesse avec ballon',
  standingDunk: 'Dunk sans élan',
  vertical: 'Détente',
})

const SHOOTING_GROUPS = Object.freeze([
  'SHOT_JUMPER',
  'GO_TO_SHOT',
  'SHOT_DRIBBLE_PULLUP',
  'SHOT_SPIN',
  'SHOT_SIDE_HOP',
  'FREE_THROW',
  'POST_FADE',
  'POST_HOOK',
  'POST_1STEP_PULLUP',
  'POST_GO_TO_SHOT',
])

const SHOOTING_GROUP_PRIORITY = new Map(
  SHOOTING_GROUPS.map((type, index) => [type, index])
)

const GROUP_LABELS = Object.freeze({
  SHOT_JUMPER: 'Tir en suspension',
  GO_TO_SHOT: 'Tir signature',
  SHOT_DRIBBLE_PULLUP: 'Pull-up après dribble',
  SHOT_SPIN: 'Tir après spin',
  SHOT_SIDE_HOP: 'Hop Jumper',
  FREE_THROW: 'Lancer franc',
  POST_FADE: 'Fadeaway au poste',
  POST_HOOK: 'Bras roulé au poste',
  POST_1STEP_PULLUP: 'Hop Shot au poste',
  POST_GO_TO_SHOT: 'Tir signature au poste',
})

function getAvailabilityState(animation, build) {
  const availability = evaluateAnimationAvailability(animation, build)

  if (availability.available) {
    return {
      id: 'eligible',
      label: 'Éligible',
      availability,
      missing: [],
    }
  }

  const missing = getMissingAnimationRequirements(animation, build)
  const attributeMissing = missing.filter((item) => item.type === 'attribute')
  const hasHeightBlock = missing.some((item) => item.type === 'height')

  const deltas = attributeMissing
    .map((item) => {
      if (!Number.isFinite(item.min) || !Number.isFinite(item.current)) return Infinity
      return Math.max(0, item.min - item.current)
    })

  const near =
    !hasHeightBlock &&
    deltas.length > 0 &&
    deltas.every((delta) => delta <= 3)

  return {
    id: near ? 'near' : 'locked',
    label: near ? 'Proche' : 'Verrouillée',
    availability,
    missing,
  }
}

function requirementText(missing) {
  if (missing.type === 'height') {
    return `Taille incompatible (${missing.allowedSizes})`
  }

  const label = ATTRIBUTE_LABELS[missing.attribute] ?? missing.attribute ?? missing.sourceAttribute
  const current = Number.isFinite(missing.current) ? missing.current : '—'
  const min = Number.isFinite(missing.min) ? missing.min : '—'
  return `${label} ${current} → ${min}`
}

function recommendationLabel(recommendation) {
  if (recommendation.score === null) return 'Pas encore évaluée'
  if (recommendation.score >= 0.85) return 'Très recommandée'
  if (recommendation.score >= 0.7) return 'Recommandée'
  if (recommendation.score >= 0.55) return 'À tester'
  return 'Secondaire'
}

export default function AnimationPanel({
  morphology,
  attributes,
  selectedAnimations = {},
  onSelectAnimation,
}) {
  const [animations, setAnimations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupType, setGroupType] = useState('SHOT_JUMPER')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [useCase, setUseCase] = useState('catch_and_shoot')

  useEffect(() => {
    let cancelled = false

    import('../data/nba2k27/apk/animations.json')
      .then((module) => {
        if (cancelled) return
        const rows = Array.isArray(module.default) ? module.default : []
        setAnimations(
          rows
            .filter((animation) => SHOOTING_GROUP_PRIORITY.has(animation?.group?.type))
            .sort((left, right) => {
              const groupDiff =
                (SHOOTING_GROUP_PRIORITY.get(left?.group?.type) ?? 999) -
                (SHOOTING_GROUP_PRIORITY.get(right?.group?.type) ?? 999)

              if (groupDiff !== 0) return groupDiff
              return String(left?.name?.fr ?? left?.name?.en ?? '').localeCompare(
                String(right?.name?.fr ?? right?.name?.en ?? ''),
                'fr'
              )
            })
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const build = useMemo(
    () => ({ morphology, attributes }),
    [morphology, attributes]
  )

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return animations
      .filter((animation) => animation.group?.type === groupType)
      .map((animation) => {
        const state = getAvailabilityState(animation, build)
        const recommendation = getAnimationRecommendationScore(animation.id, {
          preferredTags: [useCase],
        })

        return {
          animation,
          state,
          recommendation,
        }
      })
      .filter(({ animation, state }) => {
        if (availabilityFilter !== 'all' && state.id !== availabilityFilter) {
          return false
        }

        if (!normalizedSearch) return true

        return [
          animation.name?.fr,
          animation.name?.en,
          animation.id,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      })
      .sort((left, right) => {
        const stateOrder = { eligible: 0, near: 1, locked: 2 }
        const stateDiff = stateOrder[left.state.id] - stateOrder[right.state.id]
        if (stateDiff !== 0) return stateDiff

        const leftScore = left.recommendation.score ?? -1
        const rightScore = right.recommendation.score ?? -1
        if (leftScore !== rightScore) return rightScore - leftScore

        return String(left.animation.name?.fr ?? '').localeCompare(
          String(right.animation.name?.fr ?? ''),
          'fr'
        )
      })
  }, [animations, groupType, build, availabilityFilter, search, useCase])

  const groupCounts = useMemo(() => {
    const result = {}
    for (const animation of animations) {
      const type = animation.group?.type
      result[type] = (result[type] ?? 0) + 1
    }
    return result
  }, [animations])

  const selectedId = selectedAnimations[groupType] ?? null

  return (
    <section className="animation-panel">
      <div className="animation-panel-heading">
        <div>
          <div className="animation-panel-title-line">
            <h2>Animations</h2>
            <span>Phase 1 · Tir</span>
          </div>
          <p>
            Éligibilité calculée depuis les données NBA 2K27 extraites de NBA 2K HQ.
            Les recommandations communautaires restent une couche séparée et sourcée.
          </p>
        </div>

        <div className="animation-priority-roadmap" aria-label="Priorité d’intégration">
          <strong>Tir</strong>
          <span>Dunks ensuite</span>
          <span>Autres animations ensuite</span>
        </div>
      </div>

      <div className="animation-group-tabs" role="tablist" aria-label="Types d'animations de tir">
        {SHOOTING_GROUPS.map((type) => (
          <button
            key={type}
            type="button"
            className={groupType === type ? 'is-active' : ''}
            onClick={() => setGroupType(type)}
          >
            <span>{GROUP_LABELS[type] ?? type}</span>
            <small>{groupCounts[type] ?? 0}</small>
          </button>
        ))}
      </div>

      <div className="animation-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Rechercher une animation…"
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={availabilityFilter}
          onChange={(event) => setAvailabilityFilter(event.target.value)}
          aria-label="Filtrer par disponibilité"
        >
          <option value="all">Toutes</option>
          <option value="eligible">Éligibles</option>
          <option value="near">Proches</option>
          <option value="locked">Verrouillées</option>
        </select>

        <select
          value={useCase}
          onChange={(event) => setUseCase(event.target.value)}
          aria-label="Profil de recommandation"
        >
          <option value="catch_and_shoot">Catch & shoot</option>
          <option value="off_dribble">Création après dribble</option>
          <option value="quick_release">Sortie rapide</option>
          <option value="easy_timing">Timing accessible</option>
          <option value="large_green_window">Fenêtre verte</option>
        </select>
      </div>

      {loading ? (
        <div className="animation-empty-state">Chargement de la bibliothèque d’animations…</div>
      ) : rows.length === 0 ? (
        <div className="animation-empty-state">Aucune animation ne correspond aux filtres.</div>
      ) : (
        <div className="animation-list">
          {rows.map(({ animation, state, recommendation }) => {
            const selected = selectedId === animation.id
            const name = animation.name?.fr || animation.name?.en || animation.id
            const englishName = animation.name?.en && animation.name.en !== name
              ? animation.name.en
              : null

            return (
              <article
                key={animation.id}
                className={`animation-card animation-${state.id} ${selected ? 'is-selected' : ''}`}
              >
                <div className="animation-card-main">
                  <div className="animation-card-title">
                    <strong>{name}</strong>
                    {englishName && <small>{englishName}</small>}
                  </div>

                  <div className="animation-card-badges">
                    <span className={`animation-status animation-status-${state.id}`}>
                      {state.label}
                    </span>

                    <span className="animation-recommendation">
                      {recommendationLabel(recommendation)}
                    </span>
                  </div>
                </div>

                <div className="animation-card-detail">
                  <span>{animation.allowedSizes ?? 'ANY'}</span>

                  {state.missing.length > 0 ? (
                    <div className="animation-missing-list">
                      {state.missing.map((missing, index) => (
                        <small key={`${animation.id}-missing-${index}`}>
                          {requirementText(missing)}
                        </small>
                      ))}
                    </div>
                  ) : (
                    <small>Tous les prérequis sont remplis.</small>
                  )}

                  {recommendation.signalCount > 0 && (
                    <small>
                      {recommendation.signalCount} source{recommendation.signalCount > 1 ? 's' : ''}
                      {' · confiance '}{recommendation.confidence}
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  disabled={state.id !== 'eligible'}
                  className="animation-select-button"
                  onClick={() => onSelectAnimation?.(groupType, selected ? null : animation.id)}
                >
                  {selected ? 'Retirer' : state.id === 'eligible' ? 'Équiper' : 'Non disponible'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
