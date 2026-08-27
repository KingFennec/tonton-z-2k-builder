import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'src/data/nba2k27/apk/animations.json')
const optimizerOutputPath = path.join(root, 'src/data/nba2k27/apk/animation_optimizer_index.json')

const candidates = [
  process.argv[2],
  path.join(root, 'animations.json'),
  path.join(root, 'animation_glossary.json'),
  path.join(os.homedir(), 'Downloads', 'platform-tools', 'animations.json'),
  path.join(os.homedir(), 'Downloads', 'platform-tools', 'animation_glossary.json'),
].filter(Boolean)

const sourcePath = candidates.find((candidate) => fs.existsSync(candidate))

if (!sourcePath) {
  console.error('Animation import FAILED: no source file found.')
  console.error('Pass animations.json / animation_glossary.json as an argument, or place it in Downloads/platform-tools.')
  process.exit(1)
}

const sourceText = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '')
const source = JSON.parse(sourceText)

const ATTRIBUTE_TO_BUILDER = Object.freeze({
  Agility: 'agility',
  BallControl: 'ballHandle',
  DrivingDunk: 'drivingDunk',
  DrivingLayup: 'drivingLayup',
  PassAccuracy: 'passAccuracy',
  PostControl: 'postControl',
  ShotMidrange: 'midRangeShot',
  ShotThree: 'threePointShot',
  Speed: 'speed',
  SpeedWithBall: 'speedWithBall',
  StandingDunk: 'standingDunk',
  Vertical: 'vertical',
})

const REC_EXCLUDED_GROUP_TYPES = new Set([
  'BT_DUNKS',
  'BT_ALLEYOOP',
  'BT_PASS',
])

function normalizeEntry(tab, group, anim) {
  return {
    id: anim['Anim ID'],
    name: {
      en: anim['Anim Name']?.EN ?? '',
      fr: anim['Anim Name']?.FR ?? anim['Anim Name']?.EN ?? '',
    },
    category: {
      id: tab['Tab ID'],
      en: tab['Tab Name']?.EN ?? '',
      fr: tab['Tab Name']?.FR ?? tab['Tab Name']?.EN ?? '',
    },
    group: {
      type: group['Anim Type'],
      en: group['Group Name']?.EN ?? '',
      fr: group['Group Name']?.FR ?? group['Group Name']?.EN ?? '',
    },
    allowedSizes: anim['Allowed Sizes'],
    requirements: {
      operator: anim['Attrib Reqs Operator'] ?? 'AND',
      attributes: Array.isArray(anim['Attrib Reqs'])
        ? anim['Attrib Reqs'].filter(Boolean).map((requirement) => ({
            attribute: requirement['Attrib Type'],
            min: Number(requirement['Attrib Min']),
          }))
        : [],
    },
    prized: Boolean(anim['Is Prized']),
    seasonSpecific: Boolean(anim['Is Season Specific']),
    seasonStart: Number(anim['Season Start'] ?? 0),
    seasonEnd: Number(anim['Season End'] ?? 0),
  }
}

function normalizeAlreadyNormalizedEntry(animation) {
  return {
    ...animation,
    name: {
      en: animation?.name?.en ?? '',
      fr: animation?.name?.fr ?? animation?.name?.en ?? '',
    },
    category: typeof animation?.category === 'string'
      ? {
          id: animation.category,
          en: animation.category,
          fr: animation.category,
        }
      : {
          id: animation?.category?.id ?? '',
          en: animation?.category?.en ?? '',
          fr: animation?.category?.fr ?? animation?.category?.en ?? '',
        },
    group: animation?.group
      ? {
          type: animation.group.type ?? animation.type ?? '',
          en: animation.group.en ?? '',
          fr: animation.group.fr ?? animation.group.en ?? '',
        }
      : {
          type: animation?.type ?? '',
          en: animation?.type ?? '',
          fr: animation?.type ?? '',
        },
    requirements: {
      operator: animation?.requirements?.operator ?? 'AND',
      attributes: Array.isArray(animation?.requirements?.attributes)
        ? animation.requirements.attributes.map((requirement) => ({
            attribute: requirement.attribute,
            min: Number(requirement.min),
          }))
        : [],
    },
    prized: Boolean(animation?.prized),
    seasonSpecific: Boolean(animation?.seasonSpecific),
    seasonStart: Number(animation?.seasonStart ?? 0),
    seasonEnd: Number(animation?.seasonEnd ?? 0),
  }
}

let animations

if (Array.isArray(source)) {
  animations = source.map(normalizeAlreadyNormalizedEntry)
} else if (Array.isArray(source?.['Anim Glossary Tabs'])) {
  animations = []

  for (const tab of source['Anim Glossary Tabs']) {
    for (const group of tab['Anim Groups'] ?? []) {
      for (const anim of group.Anims ?? []) {
        animations.push(normalizeEntry(tab, group, anim))
      }
    }
  }
} else {
  throw new Error('Unsupported source format: expected normalized animations array or raw Anim Glossary Tabs object.')
}

if (animations.length !== 2914) {
  throw new Error(`Expected 2914 animations, got ${animations.length}.`)
}

const ids = new Set()
for (const animation of animations) {
  if (!animation?.id) throw new Error('Animation without id.')
  if (ids.has(animation.id)) throw new Error(`Duplicate animation id: ${animation.id}`)
  ids.add(animation.id)
}

function stableRequirements(animation) {
  return (animation.requirements?.attributes ?? [])
    .map((requirement) => {
      const attribute = ATTRIBUTE_TO_BUILDER[requirement.attribute]

      if (!attribute) {
        throw new Error(`Unknown optimizer animation attribute: ${requirement.attribute}`)
      }

      return {
        attribute,
        min: Number(requirement.min),
      }
    })
    .sort((left, right) => {
      if (left.attribute !== right.attribute) {
        return left.attribute.localeCompare(right.attribute)
      }

      return left.min - right.min
    })
}

function makeGroupKey(animation) {
  return [
    animation.category?.id ?? '',
    animation.group?.type ?? '',
    animation.group?.fr ?? '',
  ].join('|')
}

function makeSignatureKey(animation, requirements) {
  return [
    makeGroupKey(animation),
    animation.allowedSizes ?? 'ANY',
    animation.requirements?.operator ?? 'AND',
    requirements.map((requirement) => `${requirement.attribute}:${requirement.min}`).join(','),
  ].join('|')
}

function buildOptimizerIndex(entries) {
  const groupMap = new Map()
  const signatureMap = new Map()
  let excludedSeasonAnimations = 0
  let excludedRecAnimations = 0
  let eligibleAnimations = 0

  for (const animation of entries) {
    const groupKey = makeGroupKey(animation)
    const group = groupMap.get(groupKey) ?? {
      key: groupKey,
      categoryId: animation.category?.id ?? '',
      categoryFr: animation.category?.fr ?? animation.category?.en ?? '',
      groupType: animation.group?.type ?? '',
      groupFr: animation.group?.fr ?? animation.group?.en ?? '',
      sourceCount: 0,
      eligibleCount: 0,
      signatureCount: 0,
    }

    group.sourceCount += 1
    groupMap.set(groupKey, group)

    if (animation.seasonSpecific) {
      excludedSeasonAnimations += 1
      continue
    }

    if (REC_EXCLUDED_GROUP_TYPES.has(animation.group?.type)) {
      excludedRecAnimations += 1
      continue
    }

    eligibleAnimations += 1
    group.eligibleCount += 1

    const requirements = stableRequirements(animation)
    const key = makeSignatureKey(animation, requirements)
    let signature = signatureMap.get(key)

    if (!signature) {
      signature = {
        key,
        groupKey,
        categoryId: animation.category?.id ?? '',
        categoryFr: animation.category?.fr ?? animation.category?.en ?? '',
        groupType: animation.group?.type ?? '',
        groupFr: animation.group?.fr ?? animation.group?.en ?? '',
        allowedSizes: animation.allowedSizes ?? 'ANY',
        operator: animation.requirements?.operator ?? 'AND',
        requirements,
        count: 0,
        examples: [],
      }
      signatureMap.set(key, signature)
    }

    signature.count += 1

    if (signature.examples.length < 3) {
      signature.examples.push({
        id: animation.id,
        nameEn: animation.name?.en ?? '',
        nameFr: animation.name?.fr ?? animation.name?.en ?? '',
      })
    }
  }

  const signatures = [...signatureMap.values()]
    .sort((left, right) => left.key.localeCompare(right.key))

  const signatureCountsByGroup = new Map()
  for (const signature of signatures) {
    signatureCountsByGroup.set(
      signature.groupKey,
      (signatureCountsByGroup.get(signature.groupKey) ?? 0) + 1
    )
  }

  const groups = [...groupMap.values()]
    .map((group) => ({
      ...group,
      signatureCount: signatureCountsByGroup.get(group.key) ?? 0,
    }))
    .sort((left, right) => left.key.localeCompare(right.key))

  return {
    schemaVersion: 1,
    sourceAnimations: entries.length,
    eligibleAnimations,
    excludedSeasonAnimations,
    excludedRecAnimations,
    groups,
    signatures,
  }
}

const optimizerIndex = buildOptimizerIndex(animations)

fs.writeFileSync(outputPath, `${JSON.stringify(animations, null, 2)}\n`, 'utf8')
fs.writeFileSync(optimizerOutputPath, `${JSON.stringify(optimizerIndex, null, 2)}\n`, 'utf8')

console.log('Animation import passed.')
console.log(`- Source: ${sourcePath}`)
console.log(`- Output: ${outputPath}`)
console.log(`- Optimizer index: ${optimizerOutputPath}`)
console.log(`- Animations: ${animations.length}`)
console.log(`- REC/permanent optimizer animations: ${optimizerIndex.eligibleAnimations}`)
console.log(`- Optimizer signatures: ${optimizerIndex.signatures.length}`)
