import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const project = read('src/data/nba2k27/takeovers.json')
const apk = read('src/data/nba2k27/apk/takeover_tuning.json')
const errors = []

const stable = (v) => Array.isArray(v)
  ? `[${v.map(stable).join(',')}]`
  : v && typeof v === 'object'
    ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`
    : JSON.stringify(v)

const byId = new Map(project.takeovers.map((x) => [x.id, x]))
const realSlots = apk.slots.filter((x) => x.native_special_ability_id >= 1 && x.native_special_ability_id <= 24)
const placeholders = apk.slots.filter((x) => x.native_special_ability_id >= 25 && x.native_special_ability_id <= 29)
let requirementChecks = 0
let rankChecks = 0
const nativeIds = new Set()

if (project.takeovers.length !== 24) errors.push(`project takeover count=${project.takeovers.length}`)
if (realSlots.length !== 24) errors.push(`APK real takeover count=${realSlots.length}`)
if (placeholders.length !== 5) errors.push(`APK placeholder count=${placeholders.length}`)
if (apk.slots.length !== 30) errors.push(`APK native slot count=${apk.slots.length}`)

for (const source of realSlots) {
  const item = byId.get(source.project_id)
  if (!item) { errors.push(`missing project takeover ${source.project_id}`); continue }
  nativeIds.add(source.native_special_ability_id)

  if (item.native_special_ability_id !== source.native_special_ability_id) errors.push(`${item.id}: native id mismatch`)
  if (item.native_enum_name !== source.native_enum_name) errors.push(`${item.id}: enum name mismatch`)
  if (item.native_rank_id !== source.native_rank_id) errors.push(`${item.id}: rank id mismatch`)
  if (item.native_rank !== source.native_rank) errors.push(`${item.id}: rank mismatch`)
  if (item.requirements_status !== 'apk-verified') errors.push(`${item.id}: requirements not APK verified`)
  if (item.rank_status !== 'apk-verified') errors.push(`${item.id}: rank not APK verified`)
  if (stable(item.requirements) !== stable(source.myplayer_requirements)) errors.push(`${item.id}: MyPLAYER requirements mismatch`)
  requirementChecks++
  rankChecks++
}

for (let id = 1; id <= 24; id++) if (!nativeIds.has(id)) errors.push(`missing native takeover id ${id}`)

for (const slot of placeholders) {
  if (!slot.native_enum_name.startsWith('PLACEHOLDER_')) errors.push(`native ${slot.native_special_ability_id}: not placeholder`)
  if (stable(slot.myplayer_requirements) !== stable({ always: true })) errors.push(`${slot.native_enum_name}: unexpected MyPLAYER requirements`)
}

const rankNames = ['NONE', 'RANK_D', 'RANK_C', 'RANK_B', 'RANK_A', 'RANK_S']
for (const name of rankNames) {
  if (!(name in apk.attribute_modifier_by_rank)) errors.push(`missing AttributeModifier rank ${name}`)
}

const expectedRanks = {
  'inside-touch': 'RANK_D',
  'paint-surgeon': 'RANK_C',
  'navigator': 'RANK_B',
  'shot-artist': 'RANK_A',
  'airspace': 'RANK_S',
  'zip-code': 'RANK_S',
  'blur': 'RANK_S',
  'glue': 'RANK_S',
  'see-the-future': 'RANK_S',
}
for (const [id, rank] of Object.entries(expectedRanks)) {
  if (byId.get(id)?.native_rank !== rank) errors.push(`${id}: expected ${rank}`)
}

const defaults = project.takeovers.filter((x) => x.default)
for (const item of defaults) if (item.native_rank !== 'NONE') errors.push(`${item.id}: default takeover rank != NONE`)
if (byId.get('hydration-hero')?.native_rank !== 'NONE') errors.push('hydration-hero rank != NONE')

if (apk.validation.project_requirement_matches !== 24) errors.push('expected 24/24 previous eligibility matches')
if (apk.validation.project_requirement_differences !== 0) errors.push('expected zero previous eligibility differences')
if (requirementChecks !== 24) errors.push(`requirement checks=${requirementChecks}`)
if (rankChecks !== 24) errors.push(`rank checks=${rankChecks}`)

if (errors.length) {
  console.error('Takeover APK verification FAILED')
  errors.forEach((e) => console.error(`- ${e}`))
  process.exit(1)
}

console.log('Takeover APK verification passed.')
console.log('- 24/24 MyPLAYER Takeovers mapped to native special-ability IDs 1..24')
console.log('- 24/24 eligibility requirement trees match the APK extraction')
console.log('- 24/24 native D/C/B/A/S ranks match the APK extraction')
console.log('- 5/5 placeholder native slots are empty')
console.log('- separate NBA eligibility thresholds retained in the raw APK dataset')
