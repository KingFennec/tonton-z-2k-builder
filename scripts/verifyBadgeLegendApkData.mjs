import assert from 'node:assert/strict'
import badgesData from '../src/data/nba2k27/badges.json' with { type: 'json' }
import rules from '../src/data/nba2k27/apk/badge_legend_rules.json' with { type: 'json' }
import {
  applyNativeBadgePerkBoost,
  getBadgeNativeMaxLevelForHeight,
  nativeBadgeLevelToTier,
  tierToNativeBadgeLevel,
} from '../src/engine/badgeLegendEngine.js'

assert.equal(rules.native_function.export, 'BADGES_GetMaxLevel')
assert.equal(rules.native_function.boost_parameter, 'numLevelsBoostedFromPerks')
assert.equal(nativeBadgeLevelToTier(5), 'legend')
assert.equal(tierToNativeBadgeLevel('hof'), 4)

let checked = 0
for (const badge of badgesData.badges) {
  const min = badge.native_height_range_in?.min ?? 69
  const max = badge.native_height_range_in?.max ?? 88
  const allowedHeight = Math.max(69, Math.min(88, min, max))

  if (allowedHeight >= min && allowedHeight <= max) {
    assert.equal(getBadgeNativeMaxLevelForHeight(badge, allowedHeight), 5)
    const hofPlusOne = applyNativeBadgePerkBoost({
      badge,
      naturalTier: 'hof',
      numLevelsBoostedFromPerks: 1,
      heightIn: allowedHeight,
    })
    assert.equal(hofPlusOne.finalLevel, 5)
    assert.equal(hofPlusOne.finalTier, 'legend')

    const goldPlusTwo = applyNativeBadgePerkBoost({
      badge,
      naturalTier: 'gold',
      numLevelsBoostedFromPerks: 2,
      heightIn: allowedHeight,
    })
    assert.equal(goldPlusTwo.finalLevel, 5)
    checked += 1
  }
}

const sample = badgesData.badges.find((badge) => badge.native_height_range_in?.max != null)
if (sample) {
  const tooTall = sample.native_height_range_in.max + 1
  assert.equal(getBadgeNativeMaxLevelForHeight(sample, tooTall), 0)
  const blocked = applyNativeBadgePerkBoost({
    badge: sample,
    naturalTier: 'hof',
    numLevelsBoostedFromPerks: 2,
    heightIn: tooTall,
  })
  assert.equal(blocked.finalLevel, 0)
}

console.log('Badge Legend / perk APK verification passed.')
console.log(`- ${checked}/${badgesData.badges.length} badge perk projections checked at an allowed height`)
console.log('- HOF +1 -> Legend and Gold +2 -> Legend under the native perk-level post-processing rule')
console.log('- Build Specialization / Max+ assignment deliberately remains unassigned because HQ does not expose a verified mapping')
