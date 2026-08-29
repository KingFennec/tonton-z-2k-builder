/*
 * Couche qualitative séparée des règles APK.
 *
 * IMPORTANT :
 * - aucune entrée ici ne modifie l'éligibilité d'une animation ;
 * - chaque signal doit être sourcé, daté et qualifié ;
 * - les informations officielles / développeurs sont distinguées
 *   des tests communautaires et des préférences subjectives.
 *
 * Les entrées seront ajoutées progressivement au fil de la veille 2K27.
 */

export const ANIMATION_SIGNAL_SOURCE_TYPES = Object.freeze({
  OFFICIAL: 'official',
  DEVELOPER: 'developer',
  LAB_TEST: 'lab_test',
  COMPETITIVE: 'competitive',
  COMMUNITY: 'community',
})

export const ANIMATION_SIGNAL_CONFIDENCE = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
})

/*
 * Exemple de forme attendue :
 * {
 *   animationId: '...',
 *   tags: ['catch_and_shoot', 'fast_release'],
 *   score: 0.86,
 *   sourceType: ANIMATION_SIGNAL_SOURCE_TYPES.LAB_TEST,
 *   confidence: ANIMATION_SIGNAL_CONFIDENCE.HIGH,
 *   sourceName: 'NBA2KLab',
 *   sourceUrl: 'https://...',
 *   publishedAt: '2026-08-29',
 *   note: '...',
 * }
 */
export const animationCommunitySignals = Object.freeze([])

export default animationCommunitySignals
