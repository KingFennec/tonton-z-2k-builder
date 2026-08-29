const STORAGE_KEY =
  'tonton-z-2k-builder.current-build.v1'

const LIBRARY_KEY =
  'tonton-z-2k-builder.saved-builds.v1'

const BUILD_VERSION = 1

function bytesToBinary(
  bytes
) {
  let binary = ''

  const chunkSize =
    0x8000

  for (
    let index = 0;
    index <
    bytes.length;
    index += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        index,
        Math.min(
          index +
            chunkSize,
          bytes.length
        )
      )

    binary +=
      String.fromCharCode(
        ...chunk
      )
  }

  return binary
}

function binaryToBytes(
  binary
) {
  const bytes =
    new Uint8Array(
      binary.length
    )

  for (
    let index = 0;
    index <
    binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index
      )
  }

  return bytes
}

function encodeBase64Url(
  text
) {
  const bytes =
    new TextEncoder()
      .encode(text)

  const binary =
    bytesToBinary(
      bytes
    )

  return btoa(binary)
    .replace(
      /\+/g,
      '-'
    )
    .replace(
      /\//g,
      '_'
    )
    .replace(
      /=+$/g,
      ''
    )
}

function decodeBase64Url(
  encoded
) {
  let base64 =
    encoded
      .replace(
        /-/g,
        '+'
      )
      .replace(
        /_/g,
        '/'
      )

  while (
    base64.length %
      4 !==
    0
  ) {
    base64 += '='
  }

  const binary =
    atob(base64)

  const bytes =
    binaryToBytes(
      binary
    )

  return new TextDecoder()
    .decode(bytes)
}

function normalizeMorphologyValue(
  value
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null
  }

  const number =
    Number(value)

  return Number.isFinite(
    number
  )
    ? number
    : null
}

function createId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return globalThis
      .crypto
      .randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function cleanBuildName(
  name
) {
  return String(
    name ?? ''
  )
    .trim()
    .replace(
      /\s+/g,
      ' '
    )
    .slice(
      0,
      60
    )
}

function readLibrary() {
  try {
    const raw =
      localStorage.getItem(
        LIBRARY_KEY
      )

    if (!raw) {
      return []
    }

    const parsed =
      JSON.parse(raw)

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return []
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id ===
            'string' &&
          typeof item.name ===
            'string' &&
          typeof item.encoded ===
            'string'
      )
      .map(
        (item) => ({
          id:
            item.id,

          name:
            item.name,

          encoded:
            item.encoded,

          createdAt:
            Number(
              item.createdAt
            ) || 0,

          updatedAt:
            Number(
              item.updatedAt
            ) || 0,
        })
      )
      .sort(
        (a, b) =>
          b.updatedAt -
          a.updatedAt
      )
  } catch {
    return []
  }
}

function writeLibrary(
  builds
) {
  try {
    localStorage.setItem(
      LIBRARY_KEY,
      JSON.stringify(
        builds
      )
    )

    return true
  } catch {
    return false
  }
}

function getUniqueCopyName(
  originalName,
  builds
) {
  const existingNames =
    new Set(
      builds.map(
        (build) =>
          build.name
            .trim()
            .toLowerCase()
      )
    )

  const baseName =
    `${originalName} — copie`

  if (
    !existingNames.has(
      baseName.toLowerCase()
    )
  ) {
    return baseName
  }

  let number = 2

  while (
    existingNames.has(
      `${baseName} ${number}`
        .toLowerCase()
    )
  ) {
    number += 1
  }

  return `${baseName} ${number}`
}

export function createBuildPayload({
  morphology,
  manualAttributes,
  selectedBadges,
  selectedTakeovers,
  selectedCapBreakers,
  selectedAnimations = {},
  personalRecommendation = null,
  attributes,
}) {
  const storedAttributes =
    {}

  for (
    const attribute
    of attributes
  ) {
    const value =
      Number(
        manualAttributes?.[
          attribute.id
        ] ??
          attribute.min
      )

    /*
     * On ne stocke que les
     * attributs différents
     * de leur minimum.
     */
    if (
      value !==
      attribute.min
    ) {
      storedAttributes[
        attribute.id
      ] = value
    }
  }

  const storedBadges =
    Object.entries(
      selectedBadges ??
        {}
    ).map(
      ([
        badgeId,
        selection,
      ]) => [
        badgeId,
        selection.tier,
        selection.optionIndex ??
          null,
      ]
    )

  const storedTakeovers =
    Object.entries(
      selectedTakeovers ??
        {}
    )

  const storedCapBreakers =
    Object.entries(
      selectedCapBreakers ??
        {}
    )
      .map(([attributeId, count]) => [
        attributeId,
        Math.max(0, Math.min(5, Math.trunc(Number(count) || 0))),
      ])
      .filter(([, count]) => count > 0)

  const storedAnimations =
    Object.entries(
      selectedAnimations ??
        {}
    )
      .filter(([groupType, animationId]) =>
        typeof groupType === 'string' &&
        typeof animationId === 'string' &&
        groupType.length > 0 &&
        animationId.length > 0
      )

  return {
    v:
      BUILD_VERSION,

    m: {
      p:
        morphology
          ?.position ??
        '',

      h:
        normalizeMorphologyValue(
          morphology?.height
        ),

      w:
        normalizeMorphologyValue(
          morphology?.weight
        ),

      s:
        normalizeMorphologyValue(
          morphology
            ?.wingspan
        ),
    },

    a:
      storedAttributes,

    b:
      storedBadges,

    t:
      storedTakeovers,

    c:
      storedCapBreakers,

    n:
      storedAnimations,

    r:
      personalRecommendation && typeof personalRecommendation === 'object'
        ? personalRecommendation
        : null,
  }
}

export function encodeBuildPayload(
  payload
) {
  try {
    return encodeBase64Url(
      JSON.stringify(
        payload
      )
    )
  } catch {
    return null
  }
}

export function decodeBuildPayload(
  encoded,
  attributes
) {
  try {
    if (!encoded) {
      return null
    }

    const json =
      decodeBase64Url(
        encoded
      )

    const payload =
      JSON.parse(json)

    if (
      !payload ||
      payload.v !==
        BUILD_VERSION
    ) {
      return null
    }

    const manualAttributes =
      Object.fromEntries(
        attributes.map(
          (attribute) => [
            attribute.id,
            attribute.min,
          ]
        )
      )

    for (
      const attribute
      of attributes
    ) {
      const storedValue =
        payload.a?.[
          attribute.id
        ]

      if (
        storedValue ===
          undefined ||
        storedValue ===
          null
      ) {
        continue
      }

      const numericValue =
        Number(
          storedValue
        )

      if (
        !Number.isFinite(
          numericValue
        )
      ) {
        continue
      }

      manualAttributes[
        attribute.id
      ] =
        Math.min(
          attribute.max,
          Math.max(
            attribute.min,
            numericValue
          )
        )
    }

    const selectedBadges =
      {}

    if (
      Array.isArray(
        payload.b
      )
    ) {
      for (
        const entry
        of payload.b
      ) {
        if (
          !Array.isArray(
            entry
          ) ||
          entry.length <
            2
        ) {
          continue
        }

        const [
          badgeId,
          tier,
          optionIndex,
        ] = entry

        if (
          typeof badgeId !==
            'string' ||
          typeof tier !==
            'string'
        ) {
          continue
        }

        selectedBadges[
          badgeId
        ] = {
          tier,

          optionIndex:
            Number.isInteger(
              optionIndex
            )
              ? optionIndex
              : null,
        }
      }
    }

    const selectedTakeovers =
      {}

    if (
      Array.isArray(
        payload.t
      )
    ) {
      for (
        const entry
        of payload.t
      ) {
        if (
          !Array.isArray(
            entry
          ) ||
          entry.length <
            2
        ) {
          continue
        }

        const [
          disciplineId,
          takeoverId,
        ] = entry

        if (
          typeof disciplineId !==
            'string' ||
          typeof takeoverId !==
            'string'
        ) {
          continue
        }

        selectedTakeovers[
          disciplineId
        ] =
          takeoverId
      }
    }

    const selectedCapBreakers =
      {}

    if (
      Array.isArray(
        payload.c
      )
    ) {
      for (
        const entry
        of payload.c
      ) {
        if (
          !Array.isArray(
            entry
          ) ||
          entry.length < 2
        ) {
          continue
        }

        const [
          attributeId,
          rawCount,
        ] = entry

        const count =
          Math.trunc(
            Number(rawCount)
          )

        if (
          typeof attributeId !==
            'string' ||
          !Number.isFinite(
            count
          ) ||
          count <= 0
        ) {
          continue
        }

        selectedCapBreakers[
          attributeId
        ] =
          Math.min(5, count)
      }
    }

    const selectedAnimations =
      {}

    if (
      Array.isArray(
        payload.n
      )
    ) {
      for (const entry of payload.n) {
        if (!Array.isArray(entry) || entry.length < 2) {
          continue
        }

        const [groupType, animationId] = entry

        if (
          typeof groupType !== 'string' ||
          typeof animationId !== 'string' ||
          !groupType ||
          !animationId
        ) {
          continue
        }

        selectedAnimations[groupType] = animationId
      }
    }

    return {
      morphology: {
        position:
          typeof payload.m?.p ===
          'string'
            ? payload.m.p
            : '',

        height:
          payload.m?.h ??
          '',

        weight:
          payload.m?.w ??
          '',

        wingspan:
          payload.m?.s ??
          '',
      },

      manualAttributes,

      selectedBadges,

      selectedTakeovers,

      selectedCapBreakers,

      selectedAnimations,

      personalRecommendation:
        payload.r && typeof payload.r === 'object'
          ? payload.r
          : null,
    }
  } catch {
    return null
  }
}

export function saveCurrentBuild(
  encoded
) {
  if (!encoded) {
    return false
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      encoded
    )

    return true
  } catch {
    return false
  }
}

export function loadCurrentBuild(
  attributes
) {
  try {
    const encoded =
      localStorage.getItem(
        STORAGE_KEY
      )

    return decodeBuildPayload(
      encoded,
      attributes
    )
  } catch {
    return null
  }
}

export function clearCurrentBuild() {
  try {
    localStorage.removeItem(
      STORAGE_KEY
    )

    return true
  } catch {
    return false
  }
}

export function loadBuildFromUrl(
  attributes
) {
  try {
    const url =
      new URL(
        window.location.href
      )

    const encoded =
      url.searchParams.get(
        'build'
      )

    if (!encoded) {
      return null
    }

    return decodeBuildPayload(
      encoded,
      attributes
    )
  } catch {
    return null
  }
}

export function clearBuildFromUrl() {
  try {
    const url =
      new URL(
        window.location.href
      )

    if (
      !url.searchParams.has(
        'build'
      )
    ) {
      return
    }

    url.searchParams.delete(
      'build'
    )

    window.history.replaceState(
      {},
      '',
      url.toString()
    )
  } catch {
    // Rien à faire.
  }
}

export function createShareUrl(
  encoded
) {
  if (!encoded) {
    return null
  }

  try {
    const url =
      new URL(
        window.location.href
      )

    url.searchParams.set(
      'build',
      encoded
    )

    return url.toString()
  } catch {
    return null
  }
}

/*
 * =========================================================
 * BIBLIOTHÈQUE DE BUILDS
 * =========================================================
 */

export function loadSavedBuildLibrary() {
  return readLibrary()
}

export function saveNamedBuild(
  name,
  encoded
) {
  const cleanName =
    cleanBuildName(
      name
    )

  if (
    !cleanName ||
    !encoded
  ) {
    return null
  }

  const builds =
    readLibrary()

  const now =
    Date.now()

  const build = {
    id:
      createId(),

    name:
      cleanName,

    encoded,

    createdAt:
      now,

    updatedAt:
      now,
  }

  const updated = [
    build,
    ...builds,
  ]

  if (
    !writeLibrary(
      updated
    )
  ) {
    return null
  }

  return build
}

export function deleteNamedBuild(
  buildId
) {
  const builds =
    readLibrary()

  const updated =
    builds.filter(
      (build) =>
        build.id !==
        buildId
    )

  if (
    updated.length ===
    builds.length
  ) {
    return false
  }

  return writeLibrary(
    updated
  )
}

export function duplicateNamedBuild(
  buildId
) {
  const builds =
    readLibrary()

  const original =
    builds.find(
      (build) =>
        build.id ===
        buildId
    )

  if (!original) {
    return null
  }

  const now =
    Date.now()

  const duplicate = {
    id:
      createId(),

    name:
      getUniqueCopyName(
        original.name,
        builds
      ),

    encoded:
      original.encoded,

    createdAt:
      now,

    updatedAt:
      now,
  }

  if (
    !writeLibrary([
      duplicate,
      ...builds,
    ])
  ) {
    return null
  }

  return duplicate
}