import { useMemo, useState } from 'react'

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
      {plan.applied < plan.requested && (
        <small>{plan.applied}/{plan.requested} Cap Breakers exploitables avec cette morphologie.</small>
      )}
    </div>
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
          <small className="finder-muted">Recommandation V1 : priorité calculée selon ton style et le niveau naturel du badge. Le gain terrain réel sera affiné avec les tests REC.</small>
        </section>
      </div>

      <MetaComparison result={result} attributeNameById={attributeNameById} />
    </article>
  )
}

export default function FindMyBuild({ onLoadBuild, onSwitchToBuilder }) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [analysis, setAnalysis] = useState(null)

  const positionChoices = positionsData.positions.map((position) => ({
    id: position.id,
    label: `${position.abbr_fr} · ${position.name_en}`,
  }))

  const attributeNameById = useMemo(
    () => Object.fromEntries(attributesData.attributes.map((attribute) => [attribute.id, attribute.name_fr])),
    []
  )

  function update(field, value) {
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
    if (!canAnalyze) return
    setAnalysis(recommendPersonalBuilds(answers))
  }

  return (
    <section className="finder-page">
      <div className="finder-intro">
        <div>
          <span className="finder-eyebrow">Trouver mon build</span>
          <h2>Décris ta façon de jouer.</h2>
          <p>
            Le moteur compare ton profil aux constructions REC actuellement référencées dans le Builder. Il propose un build idéal, une vraie variante de compromis et une référence Meta provisoire du même poste.
          </p>
        </div>
        <div className="finder-version-card">
          <strong>V18 · Profil joueur</strong>
          <span>Scoring sémantique · seuils badges · variantes différenciées · comparaison Meta</span>
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
            <h3>Que veux-tu surtout faire en défense ?</h3>
            <ChoiceGrid choices={defenseChoices} value={answers.defensePrimary} onChange={(value) => update('defensePrimary', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">5</div>
          <div>
            <h3>Quels sont les éléments que tu refuses de sacrifier ?</h3>
            <p>Choisis jusqu’à 3 priorités. Au moins une est nécessaire.</p>
            <MultiChoiceGrid choices={priorityChoices} values={answers.priorities} onChange={(value) => update('priorities', value)} max={3} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">6</div>
          <div>
            <h3>Qu’acceptes-tu de sacrifier ?</h3>
            <p>Facultatif, jusqu’à 3 choix.</p>
            <MultiChoiceGrid choices={priorityChoices} values={answers.sacrifices} onChange={(value) => update('sacrifices', value)} max={3} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">7</div>
          <div>
            <h3>Avec quel type d’équipe joues-tu surtout ?</h3>
            <ChoiceGrid choices={teamChoices} value={answers.teamContext} onChange={(value) => update('teamContext', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">8</div>
          <div>
            <h3>Quel type de morphologie préfères-tu ?</h3>
            <ChoiceGrid choices={morphologyChoices} value={answers.morphologyPreference} onChange={(value) => update('morphologyPreference', value)} />
          </div>
        </section>

        <section className="finder-question">
          <div className="finder-question-number">9</div>
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
        <button type="button" disabled={!canAnalyze} onClick={runAnalysis}>
          Trouver mes builds
        </button>
      </div>

      {analysis && (
        <div className="finder-results">
          <div className="finder-results-heading">
            <div>
              <span className="finder-eyebrow">Résultats</span>
              <h2>3 constructions à comparer</h2>
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
