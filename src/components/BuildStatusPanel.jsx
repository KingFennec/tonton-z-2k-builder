import './BuildStatusPanel.css'

function getConfidenceLabel(
  confidence
) {
  if (
    confidence ===
    'exact'
  ) {
    return 'Exacte'
  }

  if (
    confidence ===
    'medium'
  ) {
    return 'Moyenne'
  }

  if (
    confidence ===
    'low'
  ) {
    return 'Faible'
  }

  return null
}

function getCapStatus(
  result
) {
  if (
    !result?.available
  ) {
    if (
      result?.reason ===
      'incomplete-morphology'
    ) {
      return {
        tone: 'neutral',

        label:
          'Caps non calculés',

        description:
          'Définis la taille, le poids et l’envergure pour calculer les caps d’attributs.',
      }
    }

    if (
      result?.reason ===
      'height-not-measured'
    ) {
      return {
        tone: 'unavailable',

        label:
          'Caps non disponibles',

        description:
          'Cette taille n’est pas encore couverte par notre modèle de caps morphologiques.',
      }
    }

    return {
      tone: 'neutral',

      label:
        'Caps non calculés',

      description:
        'Les caps seront calculés dès que la morphologie pourra être évaluée.',
    }
  }

  if (
    result.quality ===
    'exact'
  ) {
    return {
      tone: 'exact',

      label:
        'Caps exacts',

      description:
        'Cette combinaison correspond à des données réellement relevées.',
    }
  }

  if (
    result.estimationType ===
    'interpolated'
  ) {
    return {
      tone:
        'estimated',

      label:
        'Caps estimés · interpolation',

      description:
        'La combinaison se situe entre plusieurs relevés existants.',
    }
  }

  if (
    result.estimationType ===
    'extrapolated'
  ) {
    return {
      tone:
        'extrapolated',

      label:
        'Caps estimés · extrapolation',

      description:
        'Au moins une valeur se situe hors de notre série mesurée. Le résultat est utilisable mais moins fiable.',
    }
  }

  return {
    tone: 'estimated',

    label:
      'Caps estimés',

    description:
      'Les caps sont calculés à partir de notre modèle morphologique multi-tailles.',
  }
}

function BuildStatusPanel({
  bodyCapResult,
  morphologyRestrictions,
  notices,
  onDismissNotice,
  onDismissAll,
}) {
  const status =
    getCapStatus(
      bodyCapResult
    )

  const confidenceLabel =
    getConfidenceLabel(
      bodyCapResult
        ?.confidence
    )

  return (
    <div className="build-status-panel">
      <div
        className={[
          'cap-reliability-card',
          `cap-reliability-${status.tone}`,
        ].join(' ')}
      >
        <div className="cap-reliability-main">
          <span className="cap-reliability-dot" />

          <div>
            <strong>
              {status.label}
            </strong>

            <span>
              {
                status.description
              }
            </span>
          </div>
        </div>

        {confidenceLabel && (
          <div className="cap-confidence">
            <span>
              Confiance
            </span>

            <strong>
              {
                confidenceLabel
              }
            </strong>
          </div>
        )}
      </div>

      {morphologyRestrictions && (
        <div className="active-morphology-restrictions">
          <strong>
            Restrictions des badges
          </strong>

          <span>
            {
              morphologyRestrictions
            }
          </span>
        </div>
      )}

      {notices.length >
        0 && (
        <div className="build-notices">
          <div className="build-notices-heading">
            <strong>
              Ajustements du build
            </strong>

            {notices.length >
              1 && (
              <button
                type="button"
                onClick={
                  onDismissAll
                }
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="build-notices-list">
            {notices.map(
              (notice) => (
                <div
                  key={
                    notice.id
                  }
                  className={[
                    'build-notice',
                    `build-notice-${notice.type}`,
                  ].join(' ')}
                >
                  <span className="build-notice-icon">
                    {notice.type ===
                    'warning'
                      ? '!'
                      : 'i'}
                  </span>

                  <div className="build-notice-content">
                    <strong>
                      {
                        notice.title
                      }
                    </strong>

                    <span>
                      {
                        notice.message
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    className="build-notice-close"
                    aria-label="Fermer"
                    onClick={() =>
                      onDismissNotice(
                        notice.id
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BuildStatusPanel