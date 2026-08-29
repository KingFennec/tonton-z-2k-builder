import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appPath = path.join(root, 'src/App.jsx')
const persistencePath = path.join(root, 'src/engine/buildPersistence.js')

function replaceOnce(text, search, replacement, label) {
  const first = text.indexOf(search)
  if (first < 0) {
    if (text.includes(replacement)) return text
    throw new Error(`V23 integration anchor not found: ${label}`)
  }

  const second = text.indexOf(search, first + search.length)
  if (second >= 0) {
    throw new Error(`V23 integration anchor is not unique: ${label}`)
  }

  return `${text.slice(0, first)}${replacement}${text.slice(first + search.length)}`
}

function patchApp() {
  let text = fs.readFileSync(appPath, 'utf8')

  text = replaceOnce(
    text,
    "import PersonalRecommendationPanel from './components/PersonalRecommendationPanel'\n",
    "import PersonalRecommendationPanel from './components/PersonalRecommendationPanel'\nimport AnimationPanel from './components/AnimationPanel'\n\nimport {\n  evaluateAnimationAvailability,\n} from './engine/animationEngine'\n",
    'App imports'
  )

  text = replaceOnce(
    text,
    "  const selectedCapBreakers =\n    {}\n",
    "  const selectedCapBreakers =\n    {}\n\n  const selectedAnimations =\n    {}\n\n  for (\n    const [groupType, animationId]\n    of Object.entries(\n      importedBuild\n        .selectedAnimations ??\n        {}\n    )\n  ) {\n    if (\n      typeof groupType !== 'string' ||\n      typeof animationId !== 'string' ||\n      !groupType ||\n      !animationId\n    ) {\n      continue\n    }\n\n    selectedAnimations[groupType] =\n      animationId\n  }\n",
    'sanitize selected animations'
  )

  text = replaceOnce(
    text,
    "    selectedCapBreakers,\n\n    personalRecommendation:\n",
    "    selectedCapBreakers,\n\n    selectedAnimations,\n\n    personalRecommendation:\n",
    'sanitized build result'
  )

  text = replaceOnce(
    text,
    "  const [\n    personalRecommendation,\n",
    "  const [\n    selectedAnimations,\n    setSelectedAnimations,\n  ] = useState(\n    () =>\n      importedBuild\n        ?.selectedAnimations ??\n      {}\n  )\n\n  const [\n    personalRecommendation,\n",
    'App selectedAnimations state'
  )

  text = replaceOnce(
    text,
    "    setSelectedCapBreakers(\n      {}\n    )\n\n    setPersonalRecommendation(\n",
    "    setSelectedCapBreakers(\n      {}\n    )\n\n    setSelectedAnimations(\n      {}\n    )\n\n    setPersonalRecommendation(\n",
    'reset selected animations'
  )

  text = replaceOnce(
    text,
    "    setSelectedCapBreakers(\n      build.selectedCapBreakers\n    )\n\n    setPersonalRecommendation(\n",
    "    setSelectedCapBreakers(\n      build.selectedCapBreakers\n    )\n\n    setSelectedAnimations(\n      build.selectedAnimations\n    )\n\n    setPersonalRecommendation(\n",
    'load selected animations'
  )

  text = replaceOnce(
    text,
    "          selectedCapBreakers,\n          personalRecommendation,\n",
    "          selectedCapBreakers,\n          selectedAnimations,\n          personalRecommendation,\n",
    'payload selected animations'
  )

  text = replaceOnce(
    text,
    "      selectedCapBreakers,\n      personalRecommendation,\n    ])\n",
    "      selectedCapBreakers,\n      selectedAnimations,\n      personalRecommendation,\n    ])\n",
    'payload memo dependencies'
  )

  const takeoverFunctionsAnchor = `  function selectTakeover(\n    disciplineId,\n    takeoverId\n  ) {`
  const animationFunctions = `  function selectAnimation(\n    groupType,\n    animationId\n  ) {\n    setSelectedAnimations(\n      (current) => {\n        const updated = {\n          ...current,\n        }\n\n        if (!animationId) {\n          delete updated[groupType]\n        } else {\n          updated[groupType] = animationId\n        }\n\n        return updated\n      }\n    )\n  }\n\n  useEffect(() => {\n    if (Object.keys(selectedAnimations).length === 0) {\n      return\n    }\n\n    let cancelled = false\n\n    import('./data/nba2k27/apk/animations.json')\n      .then((module) => {\n        if (cancelled) {\n          return\n        }\n\n        const allAnimations =\n          Array.isArray(module.default)\n            ? module.default\n            : []\n\n        const byId =\n          new Map(\n            allAnimations.map(\n              (animation) => [\n                animation.id,\n                animation,\n              ]\n            )\n          )\n\n        setSelectedAnimations(\n          (current) => {\n            let changed = false\n            const updated = {\n              ...current,\n            }\n\n            for (const [groupType, animationId] of Object.entries(current)) {\n              const animation = byId.get(animationId)\n              const correctGroup = animation?.group?.type === groupType\n              const availability = animation\n                ? evaluateAnimationAvailability(\n                    animation,\n                    {\n                      morphology,\n                      attributes: effectiveAttributes,\n                    }\n                  )\n                : null\n\n              if (!animation || !correctGroup || !availability?.available) {\n                delete updated[groupType]\n                changed = true\n              }\n            }\n\n            return changed\n              ? updated\n              : current\n          }\n        )\n      })\n      .catch(() => {\n        // La bibliothèque reste optionnelle pour la construction du build.\n      })\n\n    return () => {\n      cancelled = true\n    }\n  }, [\n    morphology,\n    effectiveAttributes,\n  ])\n\n${takeoverFunctionsAnchor}`

  text = replaceOnce(
    text,
    takeoverFunctionsAnchor,
    animationFunctions,
    'animation selection functions'
  )

  text = replaceOnce(
    text,
    "            <TakeoverPanel\n              takeoverProgress={\n",
    "            <AnimationPanel\n              morphology={\n                morphology\n              }\n              attributes={\n                effectiveAttributes\n              }\n              selectedAnimations={\n                selectedAnimations\n              }\n              onSelectAnimation={\n                selectAnimation\n              }\n            />\n\n            <TakeoverPanel\n              takeoverProgress={\n",
    'AnimationPanel render'
  )

  fs.writeFileSync(appPath, text)
}

function patchPersistence() {
  let text = fs.readFileSync(persistencePath, 'utf8')

  text = replaceOnce(
    text,
    "  selectedCapBreakers,\n  personalRecommendation = null,\n",
    "  selectedCapBreakers,\n  selectedAnimations = {},\n  personalRecommendation = null,\n",
    'persistence payload args'
  )

  text = replaceOnce(
    text,
    "  const storedCapBreakers =\n    Object.entries(\n      selectedCapBreakers ??\n        {}\n    )\n      .map(([attributeId, count]) => [\n        attributeId,\n        Math.max(0, Math.min(5, Math.trunc(Number(count) || 0))),\n      ])\n      .filter(([, count]) => count > 0)\n\n  return {\n",
    "  const storedCapBreakers =\n    Object.entries(\n      selectedCapBreakers ??\n        {}\n    )\n      .map(([attributeId, count]) => [\n        attributeId,\n        Math.max(0, Math.min(5, Math.trunc(Number(count) || 0))),\n      ])\n      .filter(([, count]) => count > 0)\n\n  const storedAnimations =\n    Object.entries(\n      selectedAnimations ??\n        {}\n    )\n      .filter(([groupType, animationId]) =>\n        typeof groupType === 'string' &&\n        typeof animationId === 'string' &&\n        groupType.length > 0 &&\n        animationId.length > 0\n      )\n\n  return {\n",
    'stored animations'
  )

  text = replaceOnce(
    text,
    "    c:\n      storedCapBreakers,\n\n    r:\n",
    "    c:\n      storedCapBreakers,\n\n    n:\n      storedAnimations,\n\n    r:\n",
    'animation payload field'
  )

  text = replaceOnce(
    text,
    "    return {\n      morphology: {\n",
    "    const selectedAnimations =\n      {}\n\n    if (\n      Array.isArray(\n        payload.n\n      )\n    ) {\n      for (const entry of payload.n) {\n        if (!Array.isArray(entry) || entry.length < 2) {\n          continue\n        }\n\n        const [groupType, animationId] = entry\n\n        if (\n          typeof groupType !== 'string' ||\n          typeof animationId !== 'string' ||\n          !groupType ||\n          !animationId\n        ) {\n          continue\n        }\n\n        selectedAnimations[groupType] = animationId\n      }\n    }\n\n    return {\n      morphology: {\n",
    'decode selected animations'
  )

  text = replaceOnce(
    text,
    "      selectedCapBreakers,\n\n      personalRecommendation:\n",
    "      selectedCapBreakers,\n\n      selectedAnimations,\n\n      personalRecommendation:\n",
    'decoded selected animations result'
  )

  fs.writeFileSync(persistencePath, text)
}

patchApp()
patchPersistence()
console.log('V23 animation integration applied.')
