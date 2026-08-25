export const BADGE_LEVELS = ['unequipped', 'bronze', 'silver', 'gold', 'hof', 'legend']

const NATURAL_TIER_TO_LEVEL = {
  bronze: 1,
  silver: 2,
  gold: 3,
  hof: 4,
}

export function tierToNativeBadgeLevel(tier) {
  return NATURAL_TIER_TO_LEVEL[tier] ?? 0
}

export function nativeBadgeLevelToTier(level) {
  const safeLevel = Math.max(0, Math.min(5, Number(level) || 0))
  return BADGE_LEVELS[safeLevel]
}

export function getBadgeNativeMaxLevelForHeight(badge, heightIn) {
  if (!badge || !Number.isFinite(heightIn)) return 0

  const min = badge.native_height_range_in?.min
  const max = badge.native_height_range_in?.max

  if (Number.isFinite(min) && heightIn < min) return 0
  if (Number.isFinite(max) && heightIn > max) return 0

  // Packed NBA 2K27 tuning encodes allowed badge-height cells as 5.
  return 5
}

export function applyNativeBadgePerkBoost({
  naturalTier,
  numLevelsBoostedFromPerks = 0,
  badge,
  heightIn,
}) {
  const naturalLevel = tierToNativeBadgeLevel(naturalTier)
  const perkLevels = Math.max(0, Math.trunc(numLevelsBoostedFromPerks || 0))
  const maxLevelAllowedAtHeight = getBadgeNativeMaxLevelForHeight(badge, heightIn)

  if (maxLevelAllowedAtHeight < 1) {
    return {
      naturalLevel,
      perkLevels,
      maxLevelAllowedAtHeight,
      finalLevel: 0,
      naturalTier: nativeBadgeLevelToTier(naturalLevel),
      finalTier: 'unequipped',
      boosted: false,
      status: 'apk-verified',
    }
  }

  if (naturalLevel < 1 || perkLevels < 1 || maxLevelAllowedAtHeight <= naturalLevel) {
    return {
      naturalLevel,
      perkLevels,
      maxLevelAllowedAtHeight,
      finalLevel: naturalLevel,
      naturalTier: nativeBadgeLevelToTier(naturalLevel),
      finalTier: nativeBadgeLevelToTier(naturalLevel),
      boosted: false,
      status: 'apk-verified',
    }
  }

  const finalLevel = Math.min(
    naturalLevel + perkLevels,
    maxLevelAllowedAtHeight
  )

  return {
    naturalLevel,
    perkLevels,
    maxLevelAllowedAtHeight,
    finalLevel,
    naturalTier: nativeBadgeLevelToTier(naturalLevel),
    finalTier: nativeBadgeLevelToTier(finalLevel),
    boosted: finalLevel > naturalLevel,
    status: 'apk-verified',
  }
}

export function getNativeBadgePerkProjection(badge, naturalTier, heightIn) {
  return {
    natural: applyNativeBadgePerkBoost({ badge, naturalTier, heightIn, numLevelsBoostedFromPerks: 0 }),
    maxPlus1: applyNativeBadgePerkBoost({ badge, naturalTier, heightIn, numLevelsBoostedFromPerks: 1 }),
    maxPlus2: applyNativeBadgePerkBoost({ badge, naturalTier, heightIn, numLevelsBoostedFromPerks: 2 }),
  }
}
