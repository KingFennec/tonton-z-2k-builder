export const TIER_ORDER = ['bronze', 'silver', 'gold', 'hof']

function mergeRequirementLists(listA, listB) {
  const merged = listA.map((item) => ({ ...item }))

  for (const requirement of listB) {
    const existing = merged.find(
      (item) => item.attribute === requirement.attribute
    )

    if (existing) {
      existing.min = Math.max(existing.min, requirement.min)
    } else {
      merged.push({ ...requirement })
    }
  }

  return merged
}

function combineOptions(leftOptions, rightOptions) {
  const result = []

  for (const left of leftOptions) {
    for (const right of rightOptions) {
      result.push(mergeRequirementLists(left, right))
    }
  }

  return result
}

export function expandRequirements(node) {
  if (!node) {
    return [[]]
  }

  if (node.attribute) {
    return [[node]]
  }

  if (node.all) {
    return node.all.reduce(
      (options, child) =>
        combineOptions(options, expandRequirements(child)),
      [[]]
    )
  }

  if (node.any) {
    return node.any.flatMap((child) =>
      expandRequirements(child)
    )
  }

  return [[]]
}

export function getBadgeTierOptions(badge, tier) {
  const tierData = badge.tiers[tier]

  if (!tierData) {
    return []
  }

  return expandRequirements(tierData.requirements)
}

export function mergeSelectedRequirements(selectedOptions) {
  return selectedOptions.reduce(
    (result, option) =>
      mergeRequirementLists(result, option),
    []
  )
}

export function isRequirementMet(node, attributes) {
  if (!node) {
    return true
  }

  if (node.attribute) {
    const currentValue = attributes[node.attribute] ?? 25

    return currentValue >= node.min
  }

  if (node.all) {
    return node.all.every((child) =>
      isRequirementMet(child, attributes)
    )
  }

  if (node.any) {
    return node.any.some((child) =>
      isRequirementMet(child, attributes)
    )
  }

  return true
}

export function isBadgeTierUnlocked(
  badge,
  tier,
  attributes
) {
  const tierData = badge.tiers[tier]

  if (!tierData) {
    return false
  }

  return isRequirementMet(
    tierData.requirements,
    attributes
  )
}

export function getHighestUnlockedTier(
  badge,
  attributes
) {
  let highestTier = null

  for (const tier of TIER_ORDER) {
    if (isBadgeTierUnlocked(badge, tier, attributes)) {
      highestTier = tier
    }
  }

  return highestTier
}