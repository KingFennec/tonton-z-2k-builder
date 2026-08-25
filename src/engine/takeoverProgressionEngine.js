import progressionData from '../data/nba2k27/apk/takeover_progression.json' with { type: 'json' }

const thresholds = progressionData.level_progression.xp_thresholds
const rewards = progressionData.level_rewards
const locations = progressionData.location_context_progression_speeds
const matrix = progressionData.xp_per_highest_state.matrix_by_speed

const locationById = new Map(locations.map((entry) => [entry.location_context_id, entry]))
const locationByName = new Map(locations.map((entry) => [entry.location_context, entry]))

export const TAKEOVER_STATE = Object.freeze({
  FROZEN_STATE: 0,
  COLD_STATE: 1,
  NEUTRAL_STATE: 2,
  WARM_STATE: 3,
  HOT_STATE: 4,
  TAKEOVER_STATE: 5,
})

export function getTakeoverLevelFromXp(xp) {
  const safeXp = Math.max(0, Math.trunc(Number(xp) || 0))
  let level = 0
  for (const threshold of thresholds) {
    if (safeXp < threshold.total_xp_required) break
    level = threshold.level
  }
  return level
}

export function getTakeoverXpRequiredForLevel(level) {
  const safeLevel = Math.trunc(Number(level) || 0)
  if (safeLevel <= 0) return 0
  const clamped = Math.min(safeLevel, thresholds.length)
  return thresholds[clamped - 1].total_xp_required
}

export function getTakeoverRewardForLevel(level) {
  const safeLevel = Math.trunc(Number(level) || 0)
  if (safeLevel < 1 || safeLevel > rewards.length) return null
  return rewards[safeLevel - 1]
}

export function getTakeoverProgressionLocation(locationContext) {
  if (typeof locationContext === 'number') return locationById.get(locationContext) ?? null
  return locationByName.get(String(locationContext)) ?? null
}

export function calculateTakeoverXpEarned(locationContext, highestStates) {
  const location = getTakeoverProgressionLocation(locationContext)
  if (!location) return 0
  const states = Array.isArray(highestStates) ? highestStates : Object.values(highestStates ?? {})
  if (states.length !== 5) return 0
  const speedRow = matrix[location.progression_speed]
  if (!speedRow) return 0
  return states.reduce((total, state) => {
    const stateId = Math.trunc(Number(state))
    if (stateId < 0 || stateId > 5) return total
    const stateName = progressionData.xp_per_highest_state.state_order[stateId]
    return total + (speedRow[stateName] ?? 0)
  }, 0)
}

export function getNativeTakeoverRankModifier(rank) {
  return progressionData.rank_attribute_modifier.values[rank] ?? null
}

export const TAKEOVER_PROGRESSION_DATA = progressionData
