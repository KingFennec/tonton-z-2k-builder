import buildDescriptionData from '../data/nba2k27/apk/build_descriptions.json' with { type: 'json' }

const POSITION_INDEX = new Map(
  buildDescriptionData.positions.map((position, index) => [position, index])
)

const ATTRIBUTE_ORDER = buildDescriptionData.attribute_order
const INTERNAL_ATTRIBUTE_IDS = buildDescriptionData.internal_attribute_ids
const CATEGORY_BY_INTERNAL = buildDescriptionData.category_by_internal
const THRESHOLDS = buildDescriptionData.thresholds_by_attribute
const PRIORITY = buildDescriptionData.tie_break_priority_by_position
const FREE_THROW_INDEX = buildDescriptionData.free_throw_attribute_index

let decodedKeys = null
let decodedNameRows = null

function decodeBase64Bytes(value) {
  const decoder = globalThis.atob

  if (typeof decoder !== 'function') {
    throw new Error('Base64 decoding is not available in this runtime.')
  }

  const binary = decoder(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function getKeys() {
  if (decodedKeys) {
    return decodedKeys
  }

  const bytes = decodeBase64Bytes(buildDescriptionData.keys_base64)
  decodedKeys = new Uint32Array(bytes.length / 4)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  for (let index = 0; index < decodedKeys.length; index += 1) {
    decodedKeys[index] = view.getUint32(index * 4, true)
  }

  return decodedKeys
}

function getNameRows() {
  if (decodedNameRows) {
    return decodedNameRows
  }

  const bytes = decodeBase64Bytes(buildDescriptionData.name_rows_base64)
  decodedNameRows = new Uint16Array(bytes.length / 2)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  for (let index = 0; index < decodedNameRows.length; index += 1) {
    decodedNameRows[index] = view.getUint16(index * 2, true)
  }

  return decodedNameRows
}

function getCategoryForBuilderAttribute(builderIndex) {
  return CATEGORY_BY_INTERNAL[INTERNAL_ATTRIBUTE_IDS[builderIndex]]
}

function buildRecords(values, thresholds) {
  const records = []
  let count = 0

  for (let index = 0; index < ATTRIBUTE_ORDER.length; index += 1) {
    if (index === FREE_THROW_INDEX) {
      continue
    }

    const delta = values[index] - thresholds[index]
    if (delta >= 0) {
      count += 1
    }

    records.push({
      index,
      value: values[index],
      threshold: thresholds[index],
      delta,
    })
  }

  records.sort((a, b) => b.delta - a.delta)
  return { records, count }
}

function helper(values, records, currentCount, thresholds, adjustPhysical) {
  const step = currentCount <= 7 ? -1 : 1

  for (let index = 0; index < ATTRIBUTE_ORDER.length; index += 1) {
    const isPhysical = getCategoryForBuilderAttribute(index) === 6
    if (isPhysical === Boolean(adjustPhysical)) {
      thresholds[index] += step
    }
  }

  const rebuilt = buildRecords(values, thresholds)
  records.splice(0, records.length, ...rebuilt.records)

  if (currentCount < 8 || rebuilt.count > 6) {
    return rebuilt.count
  }

  records.sort((a, b) => {
    const aPhysical = getCategoryForBuilderAttribute(a.index) === 6
    const bPhysical = getCategoryForBuilderAttribute(b.index) === 6
    const aAdjusted = aPhysical === Boolean(adjustPhysical)
    const bAdjusted = bPhysical === Boolean(adjustPhysical)

    if (aAdjusted !== bAdjusted) {
      return Number(aAdjusted) - Number(bAdjusted)
    }
    if (a.value !== b.value) {
      return a.value - b.value
    }
    return b.threshold - a.threshold
  })

  let count = rebuilt.count
  let index = 0

  while (index < records.length) {
    const record = records[index]
    const isPhysical = getCategoryForBuilderAttribute(record.index) === 6
    const isAdjusted = isPhysical === Boolean(adjustPhysical)

    if (isAdjusted && record.delta === -1) {
      const tiedValue = record.value
      const tiedThreshold = record.threshold
      let cursor = index

      while (cursor < records.length) {
        const candidate = records[cursor]
        const candidatePhysical = getCategoryForBuilderAttribute(candidate.index) === 6
        const candidateAdjusted = candidatePhysical === Boolean(adjustPhysical)

        if (
          !candidateAdjusted ||
          candidate.delta !== -1 ||
          candidate.value !== tiedValue ||
          candidate.threshold !== tiedThreshold
        ) {
          break
        }

        candidate.delta = 0
        count += 1
        cursor += 1
      }

      index = cursor
    } else {
      index += 1
    }

    if (count > 6) {
      break
    }
  }

  return count
}

export function selectBuildDescriptionAttributes(attributes, positionId) {
  const positionIndex = POSITION_INDEX.get(positionId)
  if (positionIndex === undefined) {
    return { available: false, reason: 'missing-position' }
  }

  const values = ATTRIBUTE_ORDER.map((id) => {
    const raw = Number(attributes?.[id])
    return Number.isFinite(raw) ? raw : 25
  })

  const thresholds = THRESHOLDS.map((row) => row[positionIndex])
  let { records, count } = buildRecords(values, thresholds)
  const initialCount = count
  let currentCount = count

  if (count >= 8) {
    let toggle = 1
    let finished = false
    let guard = 0

    while (!finished && guard < 100) {
      guard += 1
      currentCount = helper(values, records, currentCount, thresholds, true)
      toggle ^= 1

      if (currentCount < 8 || toggle === 1) {
        if (currentCount >= 8) {
          currentCount = helper(values, records, currentCount, thresholds, false)
          if (currentCount > 7) {
            continue
          }
        }
        finished = true
      }
    }
  } else if (count <= 2) {
    let target = 3
    let countdown = 1
    let guard = 0

    while (guard < 100) {
      guard += 1

      if (currentCount <= 2) {
        currentCount = helper(values, records, currentCount, thresholds, false)
        if (currentCount <= 2) {
          currentCount = helper(values, records, currentCount, thresholds, false)
          if (currentCount <= 2) {
            currentCount = helper(values, records, currentCount, thresholds, false)
            if (currentCount < 3) {
              currentCount = helper(values, records, currentCount, thresholds, true)
            }
          }
        }
      }

      const equal = countdown === 0
      countdown -= 1
      if (equal) {
        target -= 1
      }

      if (currentCount >= target) {
        break
      }
    }
  }

  records.sort((a, b) => {
    if (a.delta !== b.delta) {
      return b.delta - a.delta
    }
    return PRIORITY[positionIndex][a.index] - PRIORITY[positionIndex][b.index]
  })

  if (currentCount <= 2) {
    const temporary = initialCount > 3 ? initialCount : 3
    currentCount = temporary < 7 ? temporary : 7
  }

  if (currentCount > 7) {
    return {
      available: false,
      reason: 'native-selection-out-of-range',
      initialCount,
      selectedCount: currentCount,
    }
  }

  const selected = records.slice(0, currentCount).map((record) => record.index)
  let mask = 0

  for (const index of selected) {
    // Free Throw (index 7) is excluded from the 20-bit native mask.
    const bit = index <= 6 ? index : index - 1
    mask |= (1 << bit)
  }

  return {
    available: true,
    positionIndex,
    selectedAttributeIndexes: selected,
    selectedAttributeIds: selected.map((index) => ATTRIBUTE_ORDER[index]),
    selectedCount: currentCount,
    initialCount,
    mask: mask >>> 0,
  }
}

function findMaskIndex(mask) {
  const keys = getKeys()
  let low = 0
  let high = keys.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (keys[middle] < mask) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  return low < keys.length && keys[low] === mask ? low : -1
}

export function determineBuildDescription(attributes, positionId) {
  const selection = selectBuildDescriptionAttributes(attributes, positionId)
  if (!selection.available) {
    return selection
  }

  const rowIndex = findMaskIndex(selection.mask)
  if (rowIndex < 0) {
    return {
      ...selection,
      available: false,
      reason: 'description-mask-not-found',
    }
  }

  const rows = getNameRows()
  const localizedNameIndex = rows[rowIndex * 5 + selection.positionIndex]
  const nameEn = buildDescriptionData.names_en[localizedNameIndex]
  const nameFr = buildDescriptionData.names_fr[localizedNameIndex]

  return {
    ...selection,
    available: true,
    rowIndex,
    localizedNameIndex,
    name_en: nameEn,
    name_fr: nameFr,
    status: buildDescriptionData.status,
    source: buildDescriptionData.source.native_function,
  }
}

export function getBuildDescriptionDataSummary() {
  return {
    status: buildDescriptionData.status,
    descriptionCount: buildDescriptionData.description_count,
    uniqueLocalizedNameCount: buildDescriptionData.unique_localized_name_count,
    positions: buildDescriptionData.positions,
  }
}
