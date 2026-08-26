import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'src/data/nba2k27/apk/animations.json')

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

let animations

if (Array.isArray(source)) {
  animations = source
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

fs.writeFileSync(outputPath, `${JSON.stringify(animations, null, 2)}\n`, 'utf8')

console.log('Animation import passed.')
console.log(`- Source: ${sourcePath}`)
console.log(`- Output: ${outputPath}`)
console.log(`- Animations: ${animations.length}`)
