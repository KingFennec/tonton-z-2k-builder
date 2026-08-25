import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const progression = read('src/data/nba2k27/apk/takeover_progression.json')
const takeovers = read('src/data/nba2k27/takeovers.json')
const errors = []

const expectedThresholds = [30,60,90,120,150,250,300,350,400,450,500,575,650,725,800,900,1000,1100,1200,1300,1400]
const actualThresholds = progression.level_progression.xp_thresholds.map((x) => x.total_xp_required)
if (JSON.stringify(actualThresholds) !== JSON.stringify(expectedThresholds)) errors.push('21 XP thresholds mismatch')
if (progression.level_progression.max_level !== 21) errors.push('max level != 21')

const matrix = progression.xp_per_highest_state.matrix_by_speed
const expectedMatrix = {
  SLOW: [0,0,0,1,2,3],
  MEDIUM: [0,0,0,2,3,5],
  FAST: [0,0,0,3,6,9],
}
const states = progression.xp_per_highest_state.state_order
for (const [speed, expected] of Object.entries(expectedMatrix)) {
  const actual = states.map((state) => matrix[speed][state])
  if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${speed} XP matrix mismatch`)
}

const expectedRewards = [
  ['DISCIPLINE_UNLOCKED','REBOUNDING'],
  ['DISCIPLINE_UNLOCKED','FINISHING'],
  ['DISCIPLINE_UNLOCKED','PLAYMAKING'],
  ['DISCIPLINE_UNLOCKED','DEFENSE'],
  ['DISCIPLINE_UNLOCKED','SHOOTING'],
  ['HYDRATION_HERO','NONE'],
  ['LONGEVITY_PERK','REBOUNDING'],
  ['OVERDRIVE_PERK','PLAYMAKING'],
  ['ACCELERATOR_PERK','DEFENSE'],
  ['OVERDRIVE_PERK','FINISHING'],
  ['LONGEVITY_PERK','PLAYMAKING'],
  ['ACCELERATOR_PERK','REBOUNDING'],
  ['OVERDRIVE_PERK','SHOOTING'],
  ['ACCELERATOR_PERK','FINISHING'],
  ['LONGEVITY_PERK','DEFENSE'],
  ['OVERDRIVE_PERK','DEFENSE'],
  ['LONGEVITY_PERK','SHOOTING'],
  ['ACCELERATOR_PERK','PLAYMAKING'],
  ['OVERDRIVE_PERK','REBOUNDING'],
  ['LONGEVITY_PERK','FINISHING'],
  ['ACCELERATOR_PERK','SHOOTING'],
]
if (progression.level_rewards.length !== 21) errors.push(`reward count=${progression.level_rewards.length}`)
for (let i=0;i<expectedRewards.length;i++) {
  const r=progression.level_rewards[i]
  const [type,discipline]=expectedRewards[i]
  if (r.level !== i+1 || r.reward_type !== type || r.discipline !== discipline) errors.push(`level ${i+1} reward mismatch`)
}

const locations = progression.location_context_progression_speeds
if (locations.length !== 206) errors.push(`location count=${locations.length}`)
const counts = locations.reduce((acc,x) => { acc[x.progression_speed]=(acc[x.progression_speed]||0)+1; return acc }, {})
if (counts.SLOW !== 191 || counts.MEDIUM !== 10 || counts.FAST !== 5) errors.push(`speed counts mismatch ${JSON.stringify(counts)}`)
const expectedNonSlow = new Map([
  [2,'FAST'],[4,'FAST'],[6,'MEDIUM'],[7,'FAST'],[12,'MEDIUM'],[13,'MEDIUM'],[14,'MEDIUM'],
  [38,'MEDIUM'],[39,'FAST'],[40,'MEDIUM'],[48,'MEDIUM'],[51,'MEDIUM'],[182,'MEDIUM'],[183,'MEDIUM'],[184,'FAST'],
])
for (const loc of locations) {
  const expected = expectedNonSlow.get(loc.location_context_id) ?? 'SLOW'
  if (loc.progression_speed !== expected) errors.push(`location ${loc.location_context_id} ${loc.location_context}: ${loc.progression_speed} != ${expected}`)
}
if (locations[2]?.location_context !== 'NBA_GAME') errors.push('location 2 name mismatch')
if (locations[4]?.location_context !== 'REC') errors.push('location 4 name mismatch')
if (locations[185]?.location_context !== 'BUILDER_TEST_GAME') errors.push('location 185 name mismatch')

const expectedModifiers = { NONE:-6, RANK_D:-3, RANK_C:0, RANK_B:3, RANK_A:6, RANK_S:6 }
for (const [rank,value] of Object.entries(expectedModifiers)) {
  if (progression.rank_attribute_modifier.values[rank] !== value) errors.push(`${rank} modifier mismatch`)
}
if (progression.rank_attribute_modifier.gameplay_effect_status !== 'unverified-in-hq') errors.push('modifier effect must remain unverified-in-hq')
for (const takeover of takeovers.takeovers) {
  const expected = expectedModifiers[takeover.native_rank]
  if (takeover.native_rank_modifier !== expected) errors.push(`${takeover.id}: native rank modifier mismatch`)
  if (takeover.rank_modifier_effect_status !== 'unverified-in-hq-not-applied') errors.push(`${takeover.id}: modifier effect status mismatch`)
}

if (errors.length) {
  console.error('Takeover progression APK verification FAILED')
  errors.forEach((e) => console.error(`- ${e}`))
  process.exit(1)
}
console.log('Takeover progression APK verification passed.')
console.log('- 21/21 XP level thresholds match the extracted tuning')
console.log('- 3/3 progression-speed rows x 6/6 Takeover states match')
console.log('- 21/21 level rewards match')
console.log('- 206/206 location contexts mapped (191 slow, 10 medium, 5 fast)')
console.log('- rank AttributeModifier values preserved but deliberately not applied without a verified HQ gameplay callsite')
