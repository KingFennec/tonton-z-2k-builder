import { useEffect, useMemo, useRef, useState } from 'react'

import attributesData from '../data/nba2k27/attributes.json'
import positionsData from '../data/nba2k27/positions.json'
import {
  createPersonalBuildPayload,
  recommendPersonalBuilds,
} from '../engine/playstyleEngine'

const offenseChoices = [
  { id: 'primary_creator', label: 'Porteur principal' },
  { id: 'secondary_creator', label: 'Créateur secondaire' },
  { id: 'spot_up', label: 'Catch-and-shoot / spot-up' },
  { id: 'closeout', label: 'Attaque des closeouts' },
  { id: 'cuts', label: 'Cuts / finition au cercle' },
  { id: 'post_play', label: 'Jeu au poste' },
  { id: 'pick_roll', label: 'Écrans / pick-and-roll' },
  { id: 'offensive_rebound', label: 'Rebond offensif' },
]

const defenseChoices = [
  { id: 'on_ball_defense', label: 'Défendre le porteur principal' },
  { id: 'wing_defense', label: 'Défendre les ailes' },
  { id: 'interceptions', label: 'Couper les lignes de passe / interceptions' },
  { id: 'screen_defense', label: 'Passer les écrans' },
  { id: 'switch_defense', label: 'Switcher sur plusieurs postes' },
  { id: 'rim_protection', label: 'Protéger le cercle' },
  { id: 'interior_defense', label: 'Défendre les intérieurs' },
  { id: 'rebounding', label: 'Prendre les rebonds' },
  { id: 'physical_defense', label: 'Défendre très physique' },
]

const shootingProfileChoices = [
  { id: 'flexible', label: 'Aucune exigence particulière' },
  { id: 'secondary', label: 'Le tir peut rester secondaire' },
  { id: 'open_spacer', label: 'Fiable ouvert / corner, je préfère investir ailleurs' },
  { id: 'reliable_spotup', label: 'Catch-and-shoot très fiable' },
  { id: 'shot_creator', label: 'Créer mon tir / pull-up / mi-distance' },
  { id: 'elite_range', label: 'Très longue distance / tir élite' },
]

const finishingProfileChoices = [
  { id: 'flexible', label: 'Aucune exigence particulière' },
  { id: 'simple', label: 'Finir simplement quand le cercle est ouvert' },
  { id: 'cuts', label: 'Cuts / dunks sûrs sans surinvestir' },
  { id: 'contacts', label: 'Contacts dunks / finition explosive' },
  { id: 'layups', label: 'Double-pas / finesse' },
  { id: 'inside_big', label: 'Dunk sans élan / finition intérieure' },
]

const matchupProfileChoices = [
  { id: 'natural', label: 'Mon matchup naturel du poste' },
  { id: 'guards', label: 'Surtout les meneurs et arrières rapides' },
  { id: 'wings', label: 'Surtout les ailes / scoreurs physiques' },
  { id: 'forwards_bigs', label: 'Surtout les intérieurs / grands' },
  { id: 'switch_all', label: 'Je veux pouvoir switcher sur presque tout' },
]

const priorityChoices = [
  { id: 'shooting', label: 'Tir' },
  { id: 'dunk', label: 'Dunk / finition' },
  { id: 'passing', label: 'Précision des passes' },
  { id: 'dribbling', label: 'Dribble' },
  { id: 'perimeterDefense', label: 'Défense extérieure' },
  { id: 'steal', label: 'Interception' },
  { id: 'block', label: 'Contre' },
  { id: 'rebounding', label: 'Rebond' },
  { id: 'strength', label: 'Force' },
  { id: 'speed', label: 'Vitesse / agilité' },
]

const teamChoices = [
  { id: 'rec_solo', label: 'REC solo / random' },
  { id: 'friends', label: 'Avec 1 ou 2 amis' },
  { id: 'organized_rec', label: 'Équipe régulière à 5' },
  { id: 'pro_am', label: 'Pro-Am organisé' },
]

const morphologyChoices = [
  { id: 'none', label: 'Aucune préférence' },
  { id: 'small_fast', label: 'Petit / rapide' },
  { id: 'balanced', label: 'Équilibré' },
  { id: 'big_physical', label: 'Grand / physique' },
]

const capBreakerChoices = [
  { id: 'thresholds', label: 'Maximiser les seuils / badges' },
  { id: 'strengths', label: 'Renforcer mes points forts' },
  { id: 'weaknesses', label: 'Corriger mes faiblesses' },
  { id: 'balanced', label: 'Progression équilibrée' },
]

const categoryLabels = {
  finishing: 'Finition',
  shooting: 'Tir',
  playmaking: 'Organisation',
  defense: 'Défense',
  rebounding: 'Rebonds',
  physicals: 'Qualités physiques',
}

const tierClass = {
  Bronze: 'bronze',
  Argent: 'silver',
  Or: 'gold',
  'Hall of Fame': 'hof',
}

const initialAnswers = {
  position: '',
  offensePrimary: '',
  offenseSecondary: '',
  defensePrimary: '',
  shootingProfile: 'flexible',
  finishingProfile: 'flexible',
  matchupProfile: 'natural',
  priorities: [],
  sacrifices: [],
  teamContext: 'rec_solo',
  morphologyPreference: 'none',
  capBreakerStrategy: 'thresholds',
}

function formatHeight(inches) {
  if (!Number.isFinite(Number(inches))) return '—'
  const total = Number(inches)
  return `${Math.floor(total / 12)}'${total % 12}"`
}

function ChoiceGrid({ choices, value, onChange, allowEmpty = false }) {
  return (
    <div className="finder-choice-grid">
      {allowEmpty && (
        <button
          type="button"
          className={`finder-choice ${!value ? 'is-selected' : ''}`}
          onClick={() => onChange('')}
        >
          Aucune préférence
        </button>
      )}

      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className={`finder-choice ${value === choice.id ? 'is-selected' : ''}`}
          onClick={() => onChange(choice.id)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}

function MultiChoiceGrid({ choices, values, onChange, max = 3 }) {
  function toggle(id) {
    if (values.includes(id)) {
      onChange(values.filter((value) => value !== id))
      return
    }

    if (values.length >= max) {
      return
    }

    onChange([...values, id])
  }

  return (
    <div className="finder-choice-grid">
      {choices.map((choice) => {
        const selected = values.includes(choice.id)
        const disabled = !selected && values.length >= max

        return (
          <button
            key={choice.id}
            type="button"
            className={`finder-choice ${selected ? 'is-selected' : ''}`}
            disabled={disabled}
            onClick={() => toggle(choice.id)}
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}

function AttributeTable({ attributes }) {
  const grouped = useMemo(() => {
    const result = {}

    for (const attribute of attributesData.attributes) {
      if (!result[attribute.category]) result[attribute.category] = []
      result[attribute.category].push({
        ...attribute,
        value: attributes[attribute.id] ?? attribute.min,
      })
    }

    return result
  }, [attributes])

  return (
    <div className="finder-attribute-groups">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className={`finder-attribute-group category-${category}`}>
          <h5>{categoryLabels[category] ?? category}</h5>
          {items.map((attribute) => (
            <div key={attribute.id} className="finder-attribute-row">
              <span>{attribute.name_fr}</span>
              <strong>{attribute.value}</strong>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function formatAnimationRequirements(animation, attributeNameById) {
  const requirements = animation?.requirements ?? []

  if (!requirements.length) return 'Aucun seuil d’attribut'

  const separator = animation.operator === 'OR' ? ' ou ' : ' + '

  return requirements
    .map((requirement) => `${attributeNameById[requirement.attribute] ?? requirement.attribute} ${requirement.min}`)
    .join(separator)
}

function AnimationItems({ items, attributeNameById, emptyText = null }) {
  if (!items?.length) {
    return emptyText ? <p className="finder-muted">{emptyText}</p> : null
  }

  return (
    <div className="finder-animation-list">
      {items.map((animation) => (
        <div key={animation.key} className="finder-animation-item">
          <div>
            <strong>{animation.name}</strong>
            <span>{animation.groupFr}</span>
          </div>
          <div className="finder-animation-meta">
            <b>{formatAnimationRequirements(animation, attributeNameById)}</b>
            {animation.count > 1 && <small>{animation.count} animations avec ce seuil</small>}
          </div>
        </div>
      ))}
    </div>
  )
}

function CapBreakerPlan({ plan, attributeNameById }) {
  if (!plan?.lines?.length) {
    return <p className="finder-muted">Aucune progression disponible avec les caps actuels.</p>
  }

  return (
    <div className="finder-cb-lines">
      {plan.lines.map((line) => (
        <div key={line.attributeId} className="finder-cb-line">
          <div>
            <strong>{attributeNameById[line.attributeId] ?? line.attributeId}</strong>
            <span>{line.count} CB</span>
          </div>
          <b>{line.before} → {line.after}</b>
        </div>
      ))}
      {plan.animationUnlocks?.length > 0 && (
        <div className="finder-cb-animation-unlocks">
          <span>Animations débloquées par ce plan</span>
          <AnimationItems
            items={plan.animationUnlocks}
            attributeNameById={attributeNameById}
          />
        </div>
      )}
      {plan.applied < plan.requested && (
        <small>{plan.applied}/{plan.requested} Cap Breakers exploitables avec cette morphologie.</small>
      )}
    </div>
  )
}

function AnimationPanel({ analysis, attributeNameById }) {
  if (!analysis?.enabled) {
    return (
      <section className="finder-detail-panel finder-animation-panel">
        <div className="finder-panel-heading">
          <div>
            <span>Animations</span>
            <h4>Index APK non chargé</h4>
          </div>
        </div>
        <p className="finder-muted">
          Relance l’import des animations pour activer les seuils exacts dans l’optimiseur.
        </p>
      </section>
    )
  }

  return (
    <section className="finder-detail-panel finder-animation-panel">
      <div className="finder-panel-heading">
        <div>
          <span>Animations · APK</span>
          <h4>Seuils utiles au profil</h4>
        </div>
        <div className="finder-animation-score">
          <strong>{analysis.score}%</strong>
          <span>couverture profil</span>
        </div>
      </div>

      {analysis.gainedAnimations?.length > 0 && (
        <div className="finder-animation-section">
          <h5>Débloquées par l’optimisation BASE 99</h5>
          <AnimationItems
            items={analysis.gainedAnimations}
            attributeNameById={attributeNameById}
          />
        </div>
      )}

      <div className="finder-animation-section">
        <h5>Animations clés accessibles</h5>
        <AnimationItems
          items={analysis.keyAnimations}
          attributeNameById={attributeNameById}
          emptyText="Aucune animation prioritaire détectée pour ce profil."
        />
      </div>

      <small className="finder-muted">
        V21 valorise les seuils exacts AND/OR et les restrictions SMALL / SWING / BIG. Le classement d’une animation face à une autre reste à confirmer par les tests terrain REC.
      </small>
    </section>
  )
}

function MetaComparison({ result, attributeNameById }) {
  const comparison = result.metaComparison

  if (!comparison?.metaCandidate) return null

  const meta = comparison.metaCandidate

  return (
    <div className="finder-meta-compare">
      <div className="finder-meta-heading">
        <div>
          <span>Référence</span>
          <strong>Meta REC provisoire : {meta.name}</strong>
        </div>
        {result.id === meta.id && <em>Ce résultat est la référence Meta actuelle</em>}
      </div>

      <div className="finder-morphology-compare">
        <span>Ton build : {formatHeight(result.morphology.height)} / {result.morphology.weight} lbs / {formatHeight(result.morphology.wingspan)}</span>
        <span>Meta : {formatHeight(meta.morphology.height)} / {meta.morphology.weight} lbs / {formatHeight(meta.morphology.wingspan)}</span>
      </div>

      {comparison.differences.length > 0 && (
        <div className="finder-difference-grid">
          {comparison.differences.map((difference) => (
            <div
              key={difference.attributeId}
              className={`finder-difference ${difference.delta > 0 ? 'is-positive' : 'is-negative'}`}
            >
              <span>{attributeNameById[difference.attributeId] ?? difference.attributeId}</span>
              <strong>{difference.personal}</strong>
              <small>{difference.delta > 0 ? '+' : ''}{difference.delta} vs Meta</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


function OptimizationSummary({ result, attributeNameById }) {
  if (!result.generated || !result.optimization) return null

  const changes = result.optimization.changes ?? []
  const morphology = result.optimization.morphology
  const morphologyChanged = Boolean(morphology?.changed)
  const optimized = morphologyChanged || changes.length > 0

  return (
    <div className="finder-meta-compare">
      <div className="finder-meta-heading">
        <div>
          <span>Optimisation V21</span>
          <strong>
            {optimized
              ? `Morphologie / allocation personnalisée depuis ${result.sourceCandidateName}`
              : `Architecture conservée : ${result.sourceCandidateName}`}
          </strong>
        </div>
        <em>
          {optimized
            ? [
                morphologyChanged ? 'Morphologie optimisée' : null,
                changes.length > 0
                  ? `${changes.length} attribut${changes.length > 1 ? 's' : ''} ajusté${changes.length > 1 ? 's' : ''}`
                  : null,
              ].filter(Boolean).join(' · ')
            : 'Aucune variante plus efficace trouvée'}
        </em>
      </div>

      {morphologyChanged && (
        <div className="finder-morphology-compare">
          <span>
            Base : {formatHeight(morphology.before.height)} / {morphology.before.weight} lbs / {formatHeight(morphology.before.wingspan)}
          </span>
          <span>
            Optimisée : {formatHeight(morphology.after.height)} / {morphology.after.weight} lbs / {formatHeight(morphology.after.wingspan)}
          </span>
        </div>
      )}

      {changes.length > 0 ? (
        <div className="finder-difference-grid">
          {changes.slice(0, 8).map((change) => (
            <div
              key={change.attributeId}
              className={`finder-difference ${change.delta > 0 ? 'is-positive' : 'is-negative'}`}
            >
              <span>{attributeNameById[change.attributeId] ?? change.attributeId}</span>
              <strong>{change.before} → {change.after}</strong>
              <small>{change.delta > 0 ? '+' : ''}{change.delta}</small>
            </div>
          ))}
        </div>
      ) : optimized ? (
        <p className="finder-muted">
          La morphologie change les caps et la marge de progression sans nécessiter de déplacer les 21 notes du BASE 99 de départ.
        </p>
      ) : (
        <p className="finder-muted">
          Le moteur a parcouru les morphologies retenues et testé une réallocation du budget GNR, mais la base validée reste la plus cohérente pour ce profil.
        </p>
      )}
    </div>
  )
}

function ResultCard({ result, index, onLoadBuild, onSwitchToBuilder }) {
  const [capTab, setCapTab] = useState(10)
  const [showAttributes, setShowAttributes] = useState(index === 0)

  const attributeNameById = useMemo(
    () => Object.fromEntries(attributesData.attributes.map((attribute) => [attribute.id, attribute.name_fr])),
    []
  )

  const label =
    result.recommendationType === 'ideal'
      ? 'Ton build idéal'
      : result.recommendationType === 'meta'
        ? 'Alternative Meta'
        : 'Variante recommandée'

  function loadBuild() {
    onLoadBuild(createPersonalBuildPayload(result), result.name)
    onSwitchToBuilder()
  }

  return (
    <article className={`finder-result-card result-${result.recommendationType}`}>
      <div className="finder-result-heading">
        <div>
          <span className="finder-result-kicker">#{index + 1} · {label}</span>
          <h3>{result.name}</h3>
          <p>{result.role}</p>
        </div>

        <div className="finder-affinity">
          <strong>{result.affinity}%</strong>
          <span>Affinité</span>
        </div>
      </div>

      <div className="finder-morphology-strip">
        <div><span>Poste</span><strong>{result.position}</strong></div>
        <div><span>Taille</span><strong>{formatHeight(result.morphology.height)}</strong></div>
        <div><span>Poids</span><strong>{result.morphology.weight} lbs</strong></div>
        <div><span>Envergure</span><strong>{formatHeight(result.morphology.wingspan)}</strong></div>
        <div><span>GNR</span><strong>{result.gnr?.displayed ?? 99}</strong></div>
      </div>

      <OptimizationSummary result={result} attributeNameById={attributeNameById} />

      <div className="finder-result-actions">
        <button type="button" className="finder-primary-action" onClick={loadBuild}>
          Charger dans le Builder
        </button>
        <button type="button" className="finder-secondary-action" onClick={() => setShowAttributes((current) => !current)}>
          {showAttributes ? 'Masquer les attributs' : 'Voir BASE 99'}
        </button>
      </div>

      {showAttributes && <AttributeTable attributes={result.attributes} />}

      <div className="finder-detail-grid">
        <section className="finder-detail-panel">
          <div className="finder-panel-heading">
            <div>
              <span>Progression</span>
              <h4>Plan Cap Breakers</h4>
            </div>
            <div className="finder-cb-tabs">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={capTab === count ? 'is-selected' : ''}
                  onClick={() => setCapTab(count)}
                >
                  +{count}
                </button>
              ))}
            </div>
          </div>
          <CapBreakerPlan plan={result.capBreakerPlans[capTab]} attributeNameById={attributeNameById} />
        </section>

        <section className="finder-detail-panel">
          <div className="finder-panel-heading">
            <div>
              <span>Synergie</span>
              <h4>Badges conseillés</h4>
            </div>
          </div>
          <div className="finder-synergy-list">
            {result.synergies.map((synergy) => (
              <div key={synergy.badgeId} className="finder-synergy-item">
                <div>
                  <strong>{synergy.name}</strong>
                  <span className={`finder-tier tier-${tierClass[synergy.tierLabel] ?? ''}`}>
                    {synergy.tierLabel}
                  </span>
                </div>
                <b>Fusion +{synergy.boost}</b>
              </div>
            ))}
          </div>
          <small className="finder-muted">Recommandation V21 : priorité calculée selon ton style, le niveau naturel du badge, la BASE 99 personnalisée et les seuils d’animations pertinents. Le gain terrain réel sera affiné avec les tests REC.</small>
        </section>

        <AnimationPanel
          analysis={result.animationAnalysis}
          attributeNameById={attributeNameById}
        />
      </div>

      <MetaComparison result={result} attributeNameById={attributeNameById} />
    </article>
  )
}

export default function FindMyBuild({ onLoadBuild, onSwitchToBuilder }) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)

  const positionNames = {
    PG: 'Meneur',
    SG: 'Arrière',
    SF: 'Ailier',
    PF: 'Ailier fort',
    C: 'Pivot',
  }

  const positionChoices = positionsData.positions.map((position) => ({
    id: position.id,
    label: `${position.abbr_fr} · ${positionNames[position.id] ?? position.name_en}`,
  }))

  const attributeNameById = useMemo(
    () => Object.fromEntries(attributesData.attributes.map((attribute) => [attribute.id, attribute.name_fr])),
    []
  )

  function stopWorker() {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }

  useEffect(() => () => stopWorker(), [])

  function update(field, value) {
    stopWorker()
    setIsAnalyzing(false)
    setAnalysisError('')
    setAnswers((current) => ({ ...current, [field]: value }))
    setAnalysis(null)
  }

  const canAnalyze = Boolean(
    answers.position &&
    answers.offensePrimary &&
    answers.defensePrimary &&
    answers.priorities.length > 0
  )

  function runAnalysis() {
    if (!canAnalyze || isAnalyzing) return

    stopWorker()
    setAnalysis(null)
    setAnalysisError('')
    setIsAnalyzing(true)

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const finish = (nextAnalysis, error = '') => {
      if (requestId !== requestIdRef.current) return
      setAnalysis(nextAnalysis)
      setAnalysisError(error)
      setIsAnalyzing(false)
      stopWorker()
    }

    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/playstyleWorker.js', import.meta.url),
          { type: 'module' }
        )

        workerRef.current = worker
        worker.onmessage = (event) => {
          const payload = event.data ?? {}
          if (payload.requestId !== requestId) return
          if (payload.error) {
            finish(null, payload.error)
            return
          }
          finish(payload.analysis ?? null)
        }
        worker.onerror = () => {
          finish(null, 'Le moteur de recherche a rencontré une erreur. Relance l’analyse.')
        }
        worker.postMessage({ requestId, answers })
        return
      } catch {
        // Fallback synchrone uniquement si le navigateur ne permet pas le Worker module.
      }
    }

    setTimeout(() => {
      try {
        finish(recommendPersonalBuilds(answers))
      } catch (error) {
        finish(null, error instanceof Error ? error.message : String(error))
      }
    }, 0)
  }

  return (
    <section className="finder-page">
      <div className="finder-intro">
        <div>
          <span className="finder-eyebrow">Trouver mon build</span>
          <h2>Décris ta façon de jouer.</h2>
          <p>
            Le moteur part des architectures REC validées, explore automatiquement les tailles, poids et envergures possibles, reconstruit un BASE 99 exact et valorise désormais les seuils d’animations réellement accessibles pour ton style avant de comparer le résultat à une référence Meta indépendante du même poste.
          </p>
        </div>
        <div className="finder-version-card">
          <strong>V22 · Optimisation rapide et profil affiné</strong>
          <span>Worker dédié · recherche morphologique accélérée · BASE 99 exact · animations APK · Meta indépendante</span>
        </div>
      </div>

      <div className="finder-questionnaire">
        <section className="finder-question">
          <div className="finder-question-number">1</div>
          <div>
            <h3>Quel poste veux-tu jouer ?</h3>
            <p>Le moteur ne comparera que les constructions compatibles avec ce poste.</p>
            <ChoiceGrid choices={positionChoices} value={answers.position} onChange={(value) => update('position', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">2</div>
          <div>
            <h3>Quel est ton rôle offensif principal ?</h3>
            <ChoiceGrid choices={offenseChoices} value={answers.offensePrimary} onChange={(value) => update('offensePrimary', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">3</div>
          <div>
            <h3>As-tu un rôle offensif secondaire ?</h3>
            <p>Facultatif. Il comptera moins que ton rôle principal.</p>
            <ChoiceGrid choices={offenseChoices} value={answers.offenseSecondary} onChange={(value) => update('offenseSecondary', value)} allowEmpty />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">4</div>
          <div>
            <h3>Quel niveau de tir veux-tu réellement payer ?</h3>
            <p>Cette réponse évite de surinvestir à 3 points si un simple spacing fiable te suffit.</p>
            <ChoiceGrid choices={shootingProfileChoices} value={answers.shootingProfile} onChange={(value) => update('shootingProfile', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">5</div>
          <div>
            <h3>Quelle finition te correspond le mieux ?</h3>
            <ChoiceGrid choices={finishingProfileChoices} value={answers.finishingProfile} onChange={(value) => update('finishingProfile', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">6</div>
          <div>
            <h3>Que veux-tu surtout faire en défense ?</h3>
            <ChoiceGrid choices={defenseChoices} value={answers.defensePrimary} onChange={(value) => update('defensePrimary', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">7</div>
          <div>
            <h3>Quel type de matchup veux-tu pouvoir défendre ?</h3>
            <ChoiceGrid choices={matchupProfileChoices} value={answers.matchupProfile} onChange={(value) => update('matchupProfile', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">8</div>
          <div>
            <h3>Quelles sont tes 3 priorités absolues ?</h3>
            <p>Choisis jusqu’à 3 priorités. Au moins une est nécessaire.</p>
            <MultiChoiceGrid choices={priorityChoices} values={answers.priorities} onChange={(value) => update('priorities', value)} max={3} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">9</div>
          <div>
            <h3>Qu’acceptes-tu réellement de sacrifier ?</h3>
            <p>Facultatif, jusqu’à 3 choix.</p>
            <MultiChoiceGrid choices={priorityChoices} values={answers.sacrifices} onChange={(value) => update('sacrifices', value)} max={3} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">10</div>
          <div>
            <h3>Avec quel type d’équipe joues-tu surtout ?</h3>
            <ChoiceGrid choices={teamChoices} value={answers.teamContext} onChange={(value) => update('teamContext', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">11</div>
          <div>
            <h3>Quel type de morphologie préfères-tu ?</h3>
            <ChoiceGrid choices={morphologyChoices} value={answers.morphologyPreference} onChange={(value) => update('morphologyPreference', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">12</div>
          <div>
            <h3>Comment veux-tu utiliser tes Cap Breakers ?</h3>
            <ChoiceGrid choices={capBreakerChoices} value={answers.capBreakerStrategy} onChange={(value) => update('capBreakerStrategy', value)} />
          </div>
        </section>
      </div>

      <div className="finder-submit-bar">
        <div>
          <strong>{canAnalyze ? 'Profil prêt à analyser' : 'Complète les choix essentiels'}</strong>
          <span>Poste + rôle offensif + rôle défensif + au moins 1 priorité.</span>
        </div>
        <button type="button" disabled={!canAnalyze || isAnalyzing} onClick={runAnalysis}>
          {isAnalyzing ? 'Analyse en cours…' : 'Trouver mes builds'}
        </button>
      </div>

      {isAnalyzing && (
        <div className="finder-analysis-progress" role="status">
          <span className="finder-analysis-spinner" aria-hidden="true" />
          <div>
            <strong>Recherche du meilleur BASE 99…</strong>
            <span>Le calcul tourne dans un Worker séparé : la page reste utilisable pendant l’analyse.</span>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="finder-analysis-error">{analysisError}</div>
      )}

      {analysis && (
        <div className="finder-results">
          <div className="finder-results-heading">
            <div>
              <span className="finder-eyebrow">Résultats</span>
              <h2>3 constructions à comparer</h2>
              <p className="finder-muted">Les deux premières propositions peuvent être réallouées automatiquement. La référence Meta reste inchangée.</p>
            </div>
            <div className="finder-profile-summary">
              <strong>Priorités détectées</strong>
              <span>
                {analysis.profile.sortedPriorities.slice(0, 4).map((item) => attributeNameById[item.attributeId] ?? item.attributeId).join(' · ')}
              </span>
            </div>
          </div>

          {analysis.results.map((result, index) => (
            <ResultCard
              key={result.id}
              result={result}
              index={index}
              onLoadBuild={onLoadBuild}
              onSwitchToBuilder={onSwitchToBuilder}
            />
          ))}
        </div>
      )}
    </section>
  )
}
