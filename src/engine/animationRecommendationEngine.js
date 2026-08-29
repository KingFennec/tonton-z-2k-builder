import animationCommunitySignals from '../data/nba2k27/animationCommunitySignals.js'

const SOURCE_WEIGHT = Object.freeze({
  official: 1,
  developer: 0.98,
  lab_test: 0.96,
  competitive: 0.86,
  community: 0.7,
})

const CONFIDENCE_WEIGHT = Object.freeze({
  high: 1,
  medium: 0.82,
  low: 0.6,
})

export const SHOOTING_USE_CASES = Object.freeze([
  'catch_and_shoot',
  'off_dribble',
  'quick_release',
  'easy_timing',
  'large_green_window',
  'low_contest_exposure',
])

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}

export function getAnimationSignals(animationId, signals = animationCommunitySignals) {
  return signals.filter((signal) => signal?.animationId === animationId)
}

export function getAnimationRecommendationScore(
  animationId,
  {
    preferredTags = [],
    signals = animationCommunitySignals,
  } = {}
) {
  const matched = getAnimationSignals(animationId, signals)

  if (matched.length === 0) {
    return {
      score: null,
      signalCount: 0,
      confidence: null,
      matchedTags: [],
      sources: [],
    }
  }

  const requestedTags = new Set(preferredTags)
  let weightedScore = 0
  let totalWeight = 0
  const matchedTags = new Set()

  for (const signal of matched) {
    const sourceWeight = SOURCE_WEIGHT[signal.sourceType] ?? 0.55
    const confidenceWeight = CONFIDENCE_WEIGHT[signal.confidence] ?? 0.55
    const tags = Array.isArray(signal.tags) ? signal.tags : []

    let useCaseWeight = 1

    if (requestedTags.size > 0) {
      const overlap = tags.filter((tag) => requestedTags.has(tag))
      overlap.forEach((tag) => matchedTags.add(tag))
      useCaseWeight = overlap.length > 0 ? 1 : 0.42
    }

    const weight = sourceWeight * confidenceWeight * useCaseWeight
    weightedScore += clamp01(signal.score ?? 0.5) * weight
    totalWeight += weight
  }

  const score = totalWeight > 0 ? weightedScore / totalWeight : null

  const highConfidenceCount = matched.filter(
    (signal) => signal.confidence === 'high'
  ).length

  const confidence =
    highConfidenceCount >= 2 || matched.some((signal) => signal.sourceType === 'official')
      ? 'high'
      : highConfidenceCount === 1 || matched.length >= 2
        ? 'medium'
        : 'low'

  return {
    score,
    signalCount: matched.length,
    confidence,
    matchedTags: [...matchedTags],
    sources: matched.map((signal) => ({
      sourceType: signal.sourceType,
      sourceName: signal.sourceName,
      sourceUrl: signal.sourceUrl,
      publishedAt: signal.publishedAt,
      note: signal.note,
    })),
  }
}

export function rankAnimationsByRecommendation(
  animations,
  options = {}
) {
  return animations
    .map((animation) => ({
      animation,
      recommendation: getAnimationRecommendationScore(animation.id, options),
    }))
    .sort((left, right) => {
      const a = left.recommendation.score
      const b = right.recommendation.score

      if (a === null && b === null) return 0
      if (a === null) return 1
      if (b === null) return -1
      return b - a
    })
}
