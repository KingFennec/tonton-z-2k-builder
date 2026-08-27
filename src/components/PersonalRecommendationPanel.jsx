import { useMemo, useState } from 'react'

import attributesData from '../data/nba2k27/attributes.json'

export default function PersonalRecommendationPanel({
  recommendation,
  onApplyPlan,
  onClear,
}) {
  const [capTab, setCapTab] = useState(10)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const attributeNames = useMemo(
    () => Object.fromEntries(
      attributesData.attributes.map((attribute) => [
        attribute.id,
        attribute.name_fr,
      ])
    ),
    []
  )

  if (!recommendation) {
    return null
  }

  const plan = recommendation.capBreakerPlans?.[capTab]

  return (
    <section className={`personal-recommendation-panel ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="personal-recommendation-heading">
        <div>
          <span>Plan « Trouver mon build »</span>
          <h2>{recommendation.name ?? 'Build personnalisé'}</h2>
          {!isCollapsed && (
            <p>
              Ce plan reste attaché au build chargé. Tu peux donc revenir ici à tout moment sans devoir noter les Cap Breakers conseillés.
            </p>
          )}
        </div>

        <div className="panel-heading-actions">
          {!isCollapsed && onClear && (
            <button
              type="button"
              className="personal-recommendation-clear"
              onClick={onClear}
            >
              Masquer le plan
            </button>
          )}
          <button
            type="button"
            className="panel-collapse-button"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Déployer le plan conseillé' : 'Réduire le plan conseillé'}
          >
            <span aria-hidden="true">{isCollapsed ? '▾' : '▴'}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="personal-recommendation-meta">
            <div>
              <span>Affinité</span>
              <strong>{recommendation.affinity ?? '—'}%</strong>
            </div>
            <div>
              <span>Architecture de départ</span>
              <strong>{recommendation.sourceCandidateName ?? '—'}</strong>
            </div>
            <div>
              <span>Moteur</span>
              <strong>{recommendation.version ?? 'V22'}</strong>
            </div>
          </div>

          <div className="personal-recommendation-tabs">
            {[5, 10, 15].map((count) => (
              <button
                key={count}
                type="button"
                className={capTab === count ? 'is-selected' : ''}
                onClick={() => setCapTab(count)}
              >
                +{count} CB
              </button>
            ))}
          </div>

          {plan?.lines?.length > 0 ? (
            <div className="personal-recommendation-plan">
              <div className="personal-recommendation-lines">
                {plan.lines.map((line) => (
                  <div key={line.attributeId} className="personal-recommendation-line">
                    <div>
                      <strong>{attributeNames[line.attributeId] ?? line.attributeId}</strong>
                      <span>{line.count} Cap Breaker{line.count > 1 ? 's' : ''}</span>
                    </div>
                    <b>{line.before} → {line.after}</b>
                  </div>
                ))}
              </div>

              {onApplyPlan && (
                <button
                  type="button"
                  className="personal-recommendation-apply"
                  onClick={() => onApplyPlan(plan)}
                >
                  Appliquer le plan +{capTab}
                </button>
              )}
            </div>
          ) : (
            <p className="personal-recommendation-empty">
              Aucun plan exploitable pour +{capTab} Cap Breakers avec cette morphologie.
            </p>
          )}

          {recommendation.synergies?.length > 0 && (
            <div className="personal-recommendation-synergies">
              <span>Synergies conseillées</span>
              <div>
                {recommendation.synergies.map((synergy) => (
                  <strong key={synergy.badgeId}>
                    {synergy.name} · +{synergy.boost}
                  </strong>
                ))}
              </div>
            </div>
          )}

          <small>
            Le plan a été calculé sur le BASE 99 généré. Si tu modifies ensuite fortement les attributs ou la morphologie, il devient indicatif.
          </small>
        </>
      )}
    </section>
  )
}
