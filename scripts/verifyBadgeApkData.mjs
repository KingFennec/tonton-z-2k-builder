import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const project = read('src/data/nba2k27/badges.json')
const apk = read('src/data/nba2k27/apk/badge_requirements.json')
const heights = read('src/data/nba2k27/apk/badge_height_restrictions.json')
const tiers = ['bronze', 'silver', 'gold', 'hof']
const errors = []
const stable = (v) => Array.isArray(v)
  ? `[${v.map(stable).join(',')}]`
  : v && typeof v === 'object'
    ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`
    : JSON.stringify(v)
const byId = new Map(project.badges.map((b) => [b.id, b]))
const heightById = new Map(heights.badges.map((b) => [b.project_id, b]))
const nativeIds = new Set()
let checked = 0
let heightChecked = 0
let emptyLevel5 = 0

if (project.badges.length !== 53) errors.push(`project badge count=${project.badges.length}`)
if (apk.badges.length !== 53) errors.push(`APK badge count=${apk.badges.length}`)
if (heights.badges.length !== 53) errors.push(`APK height badge count=${heights.badges.length}`)
if (heights.rows.length !== 31) errors.push(`APK height row count=${heights.rows.length}`)

for (const source of apk.badges) {
  const badge = byId.get(source.project_id)
  const height = heightById.get(source.project_id)
  if (!badge) { errors.push(`missing ${source.project_id}`); continue }
  if (!height) { errors.push(`missing height ${source.project_id}`); continue }
  nativeIds.add(source.native_badge_id)
  if (badge.native_badge_id !== source.native_badge_id) errors.push(`${badge.id}: native id mismatch`)
  if (badge.native_icon_name !== source.native_icon_name) errors.push(`${badge.id}: icon mismatch`)
  if (badge.native_category_id !== source.native_category_id) errors.push(`${badge.id}: category id mismatch`)
  if (badge.requirements_status !== 'apk-verified') errors.push(`${badge.id}: requirements not marked APK verified`)
  if (badge.height_status !== 'apk-verified') errors.push(`${badge.id}: height not marked APK verified`)
  if (badge.height_source !== 'apk') errors.push(`${badge.id}: height source != apk`)
  if (stable(badge.height) !== stable(height.effective_myplayer_height_restriction_in)) {
    errors.push(`${badge.id}: effective height restriction mismatch`)
  }
  if (stable(badge.native_height_range_in) !== stable(height.native_height_range_in)) {
    errors.push(`${badge.id}: native height range mismatch`)
  }
  heightChecked++

  for (const tier of tiers) {
    if (stable(badge.tiers[tier].requirements) !== stable(source.tiers[tier].requirements)) {
      errors.push(`${badge.id}/${tier}: requirements mismatch`)
    }
    if (badge.tiers[tier].source !== 'apk') errors.push(`${badge.id}/${tier}: source != apk`)
    checked++
  }
  if (source.native_level_5_direct_requirements === null) emptyLevel5++
  else errors.push(`${badge.id}: native level 5 direct requirement is populated`)
}
for (let id = 17; id <= 69; id++) if (!nativeIds.has(id)) errors.push(`missing native badge id ${id}`)

const allowanceValues = new Set(
  heights.rows.flatMap((row) => row.allowance_bytes_native_ids_17_69)
)
if (stable([...allowanceValues].sort((a, b) => a - b)) !== stable([0, 5])) {
  errors.push(`unexpected height allowance values=${[...allowanceValues].join(',')}`)
}
if (heights.validation.effective_height_restrictions_matching_v4_research !== 53) {
  errors.push('expected 53/53 V4 height restriction matches')
}
if (heights.validation.effective_height_restriction_differences !== 0) {
  errors.push('expected 0 V4 height restriction differences')
}

const expectedHeightCases = {
  'mini-marksman': { min: null, max: 76 },
  'rise-up': { min: 77, max: null },
  'layup-mixmaster': { min: null, max: 84 },
  'paint-prodigy': { min: 75, max: null },
  'post-spin-catalyst': { min: 73, max: null },
  'challenger': { min: null, max: 83 },
}
for (const [id, expected] of Object.entries(expectedHeightCases)) {
  if (stable(byId.get(id)?.height) !== stable(expected)) {
    errors.push(`${id}: known height case mismatch`)
  }
}

const unpluckable = byId.get('unpluckable')
const expected = { any: [{ attribute: 'postControl', min: 100 }, { attribute: 'ballHandle', min: 97 }] }
if (stable(unpluckable?.tiers?.hof?.requirements) !== stable(expected)) errors.push('Unpluckable HOF exact APK OR branch missing')

if (checked !== 212) errors.push(`tier checks=${checked}`)
if (heightChecked !== 53) errors.push(`height checks=${heightChecked}`)
if (emptyLevel5 !== 53) errors.push(`empty native level-5 slots=${emptyLevel5}`)
if (apk.validation.semantic_matches_against_v3_dataset !== 211) errors.push('expected 211/212 semantic V3 matches')

if (errors.length) {
  console.error('Badge APK verification FAILED')
  errors.forEach((e) => console.error(`- ${e}`))
  process.exit(1)
}
console.log('Badge APK verification passed.')
console.log('- 53/53 badges mapped to native IDs 17..69')
console.log('- 212/212 Bronze/Silver/Gold/HOF requirement tiers match the APK extraction')
console.log('- 53/53 badge height restrictions match the APK extraction')
console.log('- 31/31 native height rows decoded from careermode_progression_tuning')
console.log('- 211/212 previous V3 requirement tiers were already semantically identical')
console.log('- 53/53 previous V4 effective height restrictions were already identical')
console.log('- 53/53 direct native level-5 attribute-requirement slots are empty')
