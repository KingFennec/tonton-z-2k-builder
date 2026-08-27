export default function BuildProfileSummary({
  archetype,
  summary,
  personalRecommendation = null,
}) {
  if (!summary) {
    return null
  }

  return (
    <section className="build-profile-summary">
      <div className="build-profile-summary-heading">
        <div>
          <span>Profil du joueur</span>
          <h3>{archetype || 'Archétype en cours de calcul'}</h3>
          <p>{summary.description}</p>
        </div>

        {personalRecommendation && (
          <div className="build-profile-recommendation-tag">
            <strong>Build personnalisé</strong>
            <span>
              {personalRecommendation.affinity != null
                ? `${personalRecommendation.affinity}% d’affinité`
                : personalRecommendation.version ?? 'Trouver mon build'}
            </span>
          </div>
        )}
      </div>

      <div className="build-profile-summary-columns">
        <div className="build-profile-points strengths">
          <h4>Points forts</h4>
          {summary.strengths.length > 0 ? (
            summary.strengths.map((item) => (
              <div key={item.title} className="build-profile-point positive">
                <b>+</b>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))
          ) : (
            <p>Aucun point fort dominant détecté pour l’instant.</p>
          )}
        </div>

        <div className="build-profile-points weaknesses">
          <h4>Points faibles</h4>
          {summary.weaknesses.length > 0 ? (
            summary.weaknesses.map((item) => (
              <div key={item.attributeId} className="build-profile-point negative">
                <b>-</b>
                <span>{item.text}</span>
              </div>
            ))
          ) : (
            <p>Aucune faiblesse majeure détectée pour le poste.</p>
          )}
        </div>
      </div>
    </section>
  )
}
