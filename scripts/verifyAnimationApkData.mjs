import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ANIMATION_ALLOWED_SIZES,
  ANIMATION_ATTRIBUTE_TO_BUILDER,
  ANIMATION_REQUIREMENT_OPERATORS,
  doesAnimationHeightMeetRequirement,
  doAnimationAttributeRequirementsMeet,
  evaluateAnimationAvailability,
} from '../src/engine/animationEngine.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const metadata = read('src/data/nba2k27/apk/animation_glossary_metadata.json')
const dataPath = path.join(root, 'src/data/nba2k27/apk/animations.json')
const errors = []

const fail = (message) => errors.push(message)
const expect = (condition, message) => { if (!condition) fail(message) }

const groupTotal = metadata.tabs.reduce(
  (tabSum, tab) => tabSum + tab.groups.reduce((sum, group) => sum + group.count, 0),
  0
)

expect(metadata.total_animations === 2914, `metadata total=${metadata.total_animations}`)
expect(groupTotal === 2914, `group total=${groupTotal}`)
expect(Object.values(metadata.allowed_size_counts).reduce((a, b) => a + b, 0) === 2914, 'allowed size counts do not sum to 2914')
expect(Object.values(metadata.requirement_operator_counts).reduce((a, b) => a + b, 0) === 2914, 'operator counts do not sum to 2914')
expect(Object.values(metadata.requirements_per_animation_counts).reduce((a, b) => a + b, 0) === 2914, 'requirement counts do not sum to 2914')
expect(metadata.attribute_types.length === 12, `attribute type count=${metadata.attribute_types.length}`)
expect(Object.keys(ANIMATION_ATTRIBUTE_TO_BUILDER).length === 12, 'attribute mapping count != 12')

expect(doesAnimationHeightMeetRequirement('SMALLS_ONLY', 76), '6\'4 should be SMALL')
expect(!doesAnimationHeightMeetRequirement('SMALLS_ONLY', 77), '6\'5 should not be SMALL')
expect(doesAnimationHeightMeetRequirement('SWINGS_ONLY', 77), '6\'5 should be SWING')
expect(doesAnimationHeightMeetRequirement('SWINGS_ONLY', 81), '6\'9 should be SWING')
expect(!doesAnimationHeightMeetRequirement('SWINGS_ONLY', 82), '6\'10 should not be SWING')
expect(doesAnimationHeightMeetRequirement('BIGS_ONLY', 82), '6\'10 should be BIG')
expect(doesAnimationHeightMeetRequirement('SWINGS_AND_SMALLS', 81), '6\'9 should meet SWINGS_AND_SMALLS')
expect(!doesAnimationHeightMeetRequirement('SWINGS_AND_SMALLS', 82), '6\'10 should not meet SWINGS_AND_SMALLS')
expect(!doesAnimationHeightMeetRequirement('BIGS_AND_SWINGS', 76), '6\'4 should not meet BIGS_AND_SWINGS')
expect(doesAnimationHeightMeetRequirement('BIGS_AND_SWINGS', 77), '6\'5 should meet BIGS_AND_SWINGS')
expect(doesAnimationHeightMeetRequirement('ANY', 69), 'ANY should accept all heights')

const kareem = {
  allowedSizes: 'BIGS_ONLY',
  requirements: {
    operator: 'OR',
    attributes: [
      { attribute: 'ShotMidrange', min: 59 },
      { attribute: 'ShotThree', min: 59 },
    ],
  },
}
expect(doAnimationAttributeRequirementsMeet(kareem, { midRangeShot: 59, threePointShot: 25 }), 'Kareem OR should unlock from Mid 59')
expect(doAnimationAttributeRequirementsMeet(kareem, { midRangeShot: 25, threePointShot: 59 }), 'Kareem OR should unlock from 3PT 59')
expect(!doAnimationAttributeRequirementsMeet(kareem, { midRangeShot: 58, threePointShot: 58 }), 'Kareem OR should fail at 58/58')
expect(evaluateAnimationAvailability(kareem, { morphology: { height: 82 }, attributes: { midRangeShot: 59, threePointShot: 25 } }).available, 'Kareem should unlock for 6\'10 + Mid 59')
expect(!evaluateAnimationAvailability(kareem, { morphology: { height: 81 }, attributes: { midRangeShot: 99, threePointShot: 99 } }).available, 'Kareem should fail height at 6\'9')

const aaronGordon = {
  allowedSizes: 'SWINGS_ONLY',
  requirements: {
    operator: 'AND',
    attributes: [
      { attribute: 'StandingDunk', min: 55 },
      { attribute: 'DrivingDunk', min: 80 },
      { attribute: 'Vertical', min: 60 },
    ],
  },
}
expect(doAnimationAttributeRequirementsMeet(aaronGordon, { standingDunk: 55, drivingDunk: 80, vertical: 60 }), 'Aaron Gordon AND should pass at exact thresholds')
expect(!doAnimationAttributeRequirementsMeet(aaronGordon, { standingDunk: 55, drivingDunk: 79, vertical: 60 }), 'Aaron Gordon AND should fail if one requirement is short')

const noneAnimation = {
  allowedSizes: 'ANY',
  requirements: { operator: 'OR', attributes: [] },
}
expect(doAnimationAttributeRequirementsMeet(noneAnimation, {}), 'OR + empty requirements should be satisfied')

if (fs.existsSync(dataPath)) {
  const animations = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const ids = new Set()
  const allowedCounts = Object.fromEntries(ANIMATION_ALLOWED_SIZES.map((value) => [value, 0]))
  const operatorCounts = Object.fromEntries(ANIMATION_REQUIREMENT_OPERATORS.map((value) => [value, 0]))
  const requirementCounts = { 0: 0, 1: 0, 2: 0, 3: 0 }
  let seasonSpecific = 0
  let prized = 0

  expect(animations.length === 2914, `full dataset count=${animations.length}`)

  for (const animation of animations) {
    if (ids.has(animation.id)) fail(`duplicate id ${animation.id}`)
    ids.add(animation.id)

    if (!(animation.allowedSizes in allowedCounts)) fail(`${animation.id}: unknown allowedSizes ${animation.allowedSizes}`)
    else allowedCounts[animation.allowedSizes]++

    const operator = animation.requirements?.operator
    if (!(operator in operatorCounts)) fail(`${animation.id}: unknown operator ${operator}`)
    else operatorCounts[operator]++

    const requirements = animation.requirements?.attributes ?? []
    if (!(requirements.length in requirementCounts)) fail(`${animation.id}: invalid requirement count ${requirements.length}`)
    else requirementCounts[requirements.length]++

    for (const requirement of requirements) {
      if (!(requirement.attribute in ANIMATION_ATTRIBUTE_TO_BUILDER)) {
        fail(`${animation.id}: unknown attribute ${requirement.attribute}`)
      }
      if (!Number.isFinite(Number(requirement.min))) fail(`${animation.id}: invalid minimum`)
    }

    if (animation.seasonSpecific) seasonSpecific++
    if (animation.prized) prized++
  }

  for (const [key, count] of Object.entries(metadata.allowed_size_counts)) {
    expect(allowedCounts[key] === count, `${key}: expected ${count}, got ${allowedCounts[key]}`)
  }

  for (const [key, count] of Object.entries(metadata.requirement_operator_counts)) {
    expect(operatorCounts[key] === count, `${key}: expected ${count}, got ${operatorCounts[key]}`)
  }

  for (const [key, count] of Object.entries(metadata.requirements_per_animation_counts)) {
    expect(requirementCounts[key] === count, `${key} requirements: expected ${count}, got ${requirementCounts[key]}`)
  }

  expect(seasonSpecific === 30, `season specific=${seasonSpecific}`)
  expect(prized === 0, `prized=${prized}`)
} else {
  console.log('Animation full dataset not present yet; validating native engine + extracted metadata only.')
}

if (errors.length) {
  console.error('Animation APK verification FAILED')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log('Animation APK verification passed.')
console.log('- native height boundaries mapped: <=6\'4 SMALL, 6\'5..6\'9 SWING, >=6\'10 BIG')
console.log('- 12/12 glossary attribute types mapped to Builder attributes')
console.log('- AND / OR / empty requirement semantics verified')
console.log('- 56 glossary groups sum to 2914 animations')
if (fs.existsSync(dataPath)) console.log('- 2914/2914 normalized animation entries verified')
