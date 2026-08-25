import buildDescriptionData from '../src/data/nba2k27/apk/build_descriptions.json' with { type: 'json' }
import fixturesData from '../src/data/nba2k27/apk/build_description_fixtures.json' with { type: 'json' }
import {
  determineBuildDescription,
  getBuildDescriptionDataSummary,
} from '../src/engine/buildDescriptionEngine.js'

let failures = 0
const summary = getBuildDescriptionDataSummary()

if (summary.status !== 'apk-verified') {
  failures += 1
  console.error('Build description status is not apk-verified')
}

if (summary.descriptionCount !== 137959) {
  failures += 1
  console.error(`Description count: ${summary.descriptionCount} != 137959`)
}

if (summary.uniqueLocalizedNameCount !== 3721) {
  failures += 1
  console.error(`Localized names: ${summary.uniqueLocalizedNameCount} != 3721`)
}

if (buildDescriptionData.names_en.length !== 3721 || buildDescriptionData.names_fr.length !== 3721) {
  failures += 1
  console.error('EN/FR localization array length mismatch')
}

let checked = 0
for (const fixture of fixturesData.fixtures) {
  const actual = determineBuildDescription(fixture.attributes, fixture.position)
  checked += 1

  if (!actual.available) {
    failures += 1
    console.error(`Fixture ${checked}: description unavailable`, actual.reason)
    continue
  }

  const checks = [
    ['mask', actual.mask, fixture.mask],
    ['selectedCount', actual.selectedCount, fixture.selected_count],
    ['name_en', actual.name_en, fixture.name_en],
    ['name_fr', actual.name_fr, fixture.name_fr],
    ['selected ids', JSON.stringify(actual.selectedAttributeIds), JSON.stringify(fixture.selected_ids)],
  ]

  for (const [label, value, expected] of checks) {
    if (value !== expected) {
      failures += 1
      console.error(`Fixture ${checked} ${fixture.position} / ${label}:`, value, '!=', expected)
      break
    }
  }
}

if (failures > 0) {
  console.error(`\nBuild description verification failed: ${failures} error(s).`)
  process.exit(1)
}

console.log('Build description APK verification passed.')
console.log('- 137,959 native attribute combinations')
console.log('- 3,721 localized names EN/FR')
console.log(`- ${checked}/${checked} independent selection fixtures`) 
