import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import attributesData from './data/nba2k27/attributes.json'
import badgesData from './data/nba2k27/badges.json'
import positionsData from './data/nba2k27/positions.json'
import bodyCapsData from './data/nba2k27/bodyCaps.json'
import takeoversData from './data/nba2k27/takeovers.json'

import {
  getBadgeTranslation,
} from './data/nba2k27/badgeTranslations'

import {
  getBadgeTierOptions,
  isBadgeTierUnlocked,
  mergeSelectedRequirements,
} from './engine/badgeEngine'

import {
  getCompatiblePositions,
  getHeightOptions,
  getPositionById,
  getSelectedBadgeMorphologyLimits,
  getWeightRangeForPositions,
  getWingspanRangeForPositions,
  inchesToHeight,
  isBadgeMorphologyCompatibleWithBuild,
  isPositionCompatibleWithConstraints,
  isValueInRange,
} from './engine/morphologyEngine'

import {
  getBodyCaps,
  isBadgeTierPossible,
  isRequirementOptionPossible,
} from './engine/bodyCapEngine'

import {
  getTakeoverProgress,
} from './engine/takeoverEngine'

import {
  solveAttributeDependencies,
} from './engine/attributeDependencyEngine'

import {
  clearBuildFromUrl,
  clearCurrentBuild,
  createBuildPayload,
  createShareUrl,
  encodeBuildPayload,
  loadBuildFromUrl,
  loadCurrentBuild,
  saveCurrentBuild,
} from './engine/buildPersistence'

import BuildLibrary from './components/BuildLibrary'

import './App.css'

const tiers = [
  {
    id: 'bronze',
    label: 'Bronze',
  },
  {
    id: 'silver',
    label: 'Argent',
  },
  {
    id: 'gold',
    label: 'Or',
  },
  {
    id: 'hof',
    label: 'Hall of Fame',
  },
]

const categories = [
  {
    id: 'finishing',
    label: 'Finition',
  },
  {
    id: 'shooting',
    label: 'Tir',
  },
  {
    id: 'playmaking',
    label: 'Organisation',
  },
  {
    id: 'defense',
    label: 'Défense',
  },
  {
    id: 'rebounding',
    label: 'Rebonds',
  },
  {
    id: 'physicals',
    label: 'Qualités physiques',
  },
]

const takeoverDisciplines = [
  {
    id: 'shooting',
    label: 'Tir',
  },
  {
    id: 'finishing',
    label: 'Finition',
  },
  {
    id: 'playmaking',
    label: 'Organisation',
  },
  {
    id: 'defense',
    label: 'Défense',
  },
  {
    id: 'rebounding',
    label: 'Rebonds',
  },
  {
    id: 'universal',
    label: 'Universel',
  },
]

const playableTakeoverDisciplines =
  takeoverDisciplines.filter(
    (discipline) =>
      discipline.id !==
      'universal'
  )

const leftCategoryIds = [
  'finishing',
  'shooting',
  'playmaking',
]

const rightCategoryIds = [
  'defense',
  'rebounding',
  'physicals',
]

/*
 * Pour l'instant, on utilise
 * également les règles provisoires.
 *
 * Elles permettent de reproduire
 * les 7 relevés "research" que
 * nous avons validés.
 *
 * Elles restent identifiées comme
 * provisoires dans les données.
 */
const INCLUDE_PROVISIONAL_DEPENDENCIES =
  true

const initialManualAttributes =
  Object.fromEntries(
    attributesData.attributes.map(
      (attribute) => [
        attribute.id,
        attribute.min,
      ]
    )
  )

const allHeightOptions =
  getHeightOptions()

const validBadgeIds =
  new Set(
    badgesData.badges.map(
      (badge) =>
        badge.id
    )
  )

const validTakeovers =
  new Map(
    takeoversData.takeovers.map(
      (takeover) => [
        takeover.id,
        takeover,
      ]
    )
  )

const validPositionIds =
  new Set(
    positionsData.positions.map(
      (position) =>
        position.id
    )
  )

const validTierIds =
  new Set(
    tiers.map(
      (tier) =>
        tier.id
    )
  )

const validTakeoverDisciplines =
  new Set(
    playableTakeoverDisciplines.map(
      (discipline) =>
        discipline.id
    )
  )

function sanitizeImportedBuild(
  importedBuild
) {
  if (!importedBuild) {
    return null
  }

  const selectedBadges =
    {}

  for (
    const [
      badgeId,
      selection,
    ]
    of Object.entries(
      importedBuild
        .selectedBadges ??
        {}
    )
  ) {
    if (
      !validBadgeIds.has(
        badgeId
      ) ||
      !validTierIds.has(
        selection?.tier
      )
    ) {
      continue
    }

    selectedBadges[
      badgeId
    ] = {
      tier:
        selection.tier,

      optionIndex:
        Number.isInteger(
          selection.optionIndex
        )
          ? selection.optionIndex
          : null,
    }
  }

  const selectedTakeovers =
    {}

  for (
    const [
      disciplineId,
      takeoverId,
    ]
    of Object.entries(
      importedBuild
        .selectedTakeovers ??
        {}
    )
  ) {
    if (
      !validTakeoverDisciplines.has(
        disciplineId
      )
    ) {
      continue
    }

    const takeover =
      validTakeovers.get(
        takeoverId
      )

    if (!takeover) {
      continue
    }

    if (
      takeover.discipline !==
        disciplineId &&
      takeover.discipline !==
        'universal'
    ) {
      continue
    }

    selectedTakeovers[
      disciplineId
    ] =
      takeoverId
  }

  const importedPosition =
    importedBuild
      .morphology
      ?.position ??
    ''

  return {
    morphology: {
      position:
        validPositionIds.has(
          importedPosition
        )
          ? importedPosition
          : '',

      height:
        importedBuild
          .morphology
          ?.height ??
        '',

      weight:
        importedBuild
          .morphology
          ?.weight ??
        '',

      wingspan:
        importedBuild
          .morphology
          ?.wingspan ??
        '',
    },

    manualAttributes: {
      ...initialManualAttributes,

      ...importedBuild
        .manualAttributes,
    },

    selectedBadges,

    selectedTakeovers,
  }
}

function getInitialBuild() {
  const fromUrl =
    sanitizeImportedBuild(
      loadBuildFromUrl(
        attributesData.attributes
      )
    )

  if (fromUrl) {
    return {
      build:
        fromUrl,

      source:
        'url',
    }
  }

  const fromStorage =
    sanitizeImportedBuild(
      loadCurrentBuild(
        attributesData.attributes
      )
    )

  if (fromStorage) {
    return {
      build:
        fromStorage,

      source:
        'local',
    }
  }

  return {
    build:
      null,

    source:
      null,
  }
}

function getAttribute(
  attributeId
) {
  return attributesData.attributes.find(
    (attribute) =>
      attribute.id ===
      attributeId
  )
}

function getAttributeName(
  attributeId
) {
  const attribute =
    getAttribute(
      attributeId
    )

  return (
    attribute?.name_fr ??
    attribute?.name_en ??
    attributeId
  )
}

function getTierLabel(
  tierId
) {
  return (
    tiers.find(
      (tier) =>
        tier.id ===
        tierId
    )?.label ??
    'Aucun'
  )
}

function getTierClass(
  tierId
) {
  if (!tierId) {
    return ''
  }

  return `tier-${tierId}`
}

function getSliderPercent(
  value
) {
  const min = 25
  const max = 99

  const safeValue =
    Math.min(
      max,
      Math.max(
        min,
        value
      )
    )

  return (
    (
      safeValue -
      min
    ) /
    (
      max -
      min
    )
  ) * 100
}

function formatRange(
  field,
  range
) {
  if (
    !range ||
    (
      range.min === null &&
      range.max === null
    )
  ) {
    return null
  }

  const formatValue = (
    value
  ) => {
    if (
      field ===
        'height' ||
      field ===
        'wingspan'
    ) {
      return inchesToHeight(
        value
      )
    }

    return `${value} lbs`
  }

  if (
    range.min !== null &&
    range.max !== null
  ) {
    if (
      range.min ===
      range.max
    ) {
      return formatValue(
        range.min
      )
    }

    return `${formatValue(
      range.min
    )} – ${formatValue(
      range.max
    )}`
  }

  if (
    range.min !== null
  ) {
    return `≥ ${formatValue(
      range.min
    )}`
  }

  return `≤ ${formatValue(
    range.max
  )}`
}

function createDependencyRequestedAttributes(
  manualValues,
  badgeMinimums
) {
  const result = {}

  for (
    const attribute
    of attributesData.attributes
  ) {
    const manualValue =
      Number(
        manualValues?.[
          attribute.id
        ] ??
          attribute.min
      )

    const badgeMinimum =
      Number(
        badgeMinimums?.[
          attribute.id
        ] ??
          attribute.min
      )

    result[
      attribute.id
    ] =
      Math.max(
        attribute.min,
        manualValue,
        badgeMinimum
      )
  }

  return result
}

function getCapConflictKey(
  conflict
) {
  return [
    conflict.type,
    conflict.ruleId ??
      '',
    conflict.source ??
      '',
    conflict.target ??
      '',
    conflict.required ??
      '',
    conflict.cap ??
      '',
  ].join('|')
}

async function copyText(
  text
) {
  if (
    navigator.clipboard
      ?.writeText
  ) {
    try {
      await navigator
        .clipboard
        .writeText(
          text
        )

      return true
    } catch {
      // Fallback.
    }
  }

  try {
    const textarea =
      document.createElement(
        'textarea'
      )

    textarea.value =
      text

    textarea.style.position =
      'fixed'

    textarea.style.opacity =
      '0'

    document.body.appendChild(
      textarea
    )

    textarea.focus()
    textarea.select()

    const copied =
      document.execCommand(
        'copy'
      )

    document.body.removeChild(
      textarea
    )

    return copied
  } catch {
    return false
  }
}

function MorphologySlider({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
  onClear,
}) {
  const available =
    min !== null &&
    min !== undefined &&
    max !== null &&
    max !== undefined &&
    min <= max

  const defined =
    value !== '' &&
    value !== null &&
    value !== undefined

  const sliderValue =
    available
      ? defined
        ? Math.min(
            max,
            Math.max(
              min,
              Number(value)
            )
          )
        : min
      : 0

  const canDecrease =
    available &&
    defined &&
    Number(value) > min

  const canIncrease =
    available &&
    (
      !defined ||
      Number(value) < max
    )

  function decrease() {
    if (!canDecrease) {
      return
    }

    onChange(
      Math.max(
        min,
        Number(value) -
          step
      )
    )
  }

  function increase() {
    if (!available) {
      return
    }

    if (!defined) {
      onChange(min)

      return
    }

    if (!canIncrease) {
      return
    }

    onChange(
      Math.min(
        max,
        Number(value) +
          step
      )
    )
  }

  return (
    <article className="morphology-card">
      <div className="morphology-card-heading">
        <label>
          {label}
        </label>

        <button
          type="button"
          className={[
            'morphology-current-value',

            defined
              ? 'is-defined'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={
            !defined
          }
          title={
            defined
              ? 'Cliquer pour remettre sur Non défini'
              : undefined
          }
          onClick={
            onClear
          }
        >
          {defined
            ? formatValue(
                value
              )
            : 'Non défini'}
        </button>
      </div>

      <div className="morphology-slider-control">
        <button
          type="button"
          className="morphology-step-button"
          disabled={
            !canDecrease
          }
          onClick={
            decrease
          }
        >
          −
        </button>

        <span className="morphology-range-bound morphology-range-min">
          {available
            ? formatValue(
                min
              )
            : '—'}
        </span>

        <div
          className={[
            'morphology-range-slider',

            !defined
              ? 'is-undefined'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            type="range"
            min={
              available
                ? min
                : 0
            }
            max={
              available
                ? max
                : 1
            }
            step={
              step
            }
            value={
              sliderValue
            }
            disabled={
              !available
            }
            aria-label={
              label
            }
            onChange={(
              event
            ) =>
              onChange(
                Number(
                  event.target
                    .value
                )
              )
            }
          />
        </div>

        <span className="morphology-range-bound morphology-range-max">
          {available
            ? formatValue(
                max
              )
            : '—'}
        </span>

        <button
          type="button"
          className="morphology-step-button"
          disabled={
            !canIncrease
          }
          onClick={
            increase
          }
        >
          +
        </button>
      </div>
    </article>
  )
}

function AttributeCategory({
  category,
  effectiveAttributes,
  manualAttributes,
  requiredByAttribute,
  dependencyInfoByAttribute,
  activeCaps,
  capImpactByAttribute,
  blockedWarnings,
  onChangeAttribute,
}) {
  const categoryAttributes =
    attributesData.attributes.filter(
      (attribute) =>
        attribute.category ===
        category.id
    )

  return (
    <article
      className={`attribute-panel category-${category.id}`}
    >
      <div className="attribute-panel-header">
        <h3>
          {category.label}
        </h3>

        <div className="category-indicator">
          <span />
        </div>
      </div>

      <div className="attribute-panel-body">
        {categoryAttributes.map(
          (attribute) => {
            const value =
              effectiveAttributes[
                attribute.id
              ]

            const manualValue =
              manualAttributes[
                attribute.id
              ]

            const badgeMinimum =
              requiredByAttribute[
                attribute.id
              ] ??
              attribute.min

            const dependencyInfo =
              dependencyInfoByAttribute[
                attribute.id
              ] ?? {
                minimum:
                  attribute.min,

                linkedMinimum:
                  attribute.min,

                sources: [],
              }

            const linkedMinimum =
              dependencyInfo
                .linkedMinimum ??
              attribute.min

            const minimumAllowed =
              Math.max(
                attribute.min,
                badgeMinimum,
                dependencyInfo
                  .minimum ??
                  attribute.min
              )

            const cap =
              activeCaps?.[
                attribute.id
              ] ??
              attribute.max

            const capImpact =
              capImpactByAttribute?.[
                attribute.id
              ] ??
              0

            const valuePercent =
              getSliderPercent(
                value
              )

            const capPercent =
              getSliderPercent(
                cap
              )

            const badgePercent =
              getSliderPercent(
                badgeMinimum
              )

            const canTryDecrease =
              value >
              minimumAllowed

            const canIncrease =
              value < cap

            const badgeControlled =
              badgeMinimum >
              manualValue

            const dependencyControlled =
              linkedMinimum >
              Math.max(
                manualValue,
                badgeMinimum
              )

            const imposed =
              badgeControlled ||
              dependencyControlled

            const warning =
              blockedWarnings[
                attribute.id
              ]

            const infoParts = []

            if (
              badgeControlled
            ) {
              infoParts.push(
                `badge min. ${badgeMinimum}`
              )
            }

            if (
              dependencyControlled
            ) {
              infoParts.push(
                `lié min. ${linkedMinimum}`
              )
            }

            return (
              <div
                className="attribute-item"
                key={
                  attribute.id
                }
              >
                <div
                  className={[
                    'attribute-row',

                    value >
                    attribute.min
                      ? 'is-active'
                      : '',

                    imposed
                      ? 'badge-controlled'
                      : '',

                    warning
                      ? 'has-warning'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className="attribute-step-button"
                    disabled={
                      !canTryDecrease
                    }
                    onClick={() =>
                      onChangeAttribute(
                        attribute,
                        value - 1,
                        badgeMinimum,
                        minimumAllowed,
                        cap
                      )
                    }
                  >
                    −
                  </button>

                  <div className="attribute-name">
                    <div className="attribute-name-line">
                      <strong>
                        {attribute.name_fr ??
                          attribute.name_en}
                      </strong>

                      {capImpact !==
                        0 && (
                        <span
                          className={[
                            'attribute-cap-impact',

                            capImpact >
                            0
                              ? 'attribute-cap-impact-positive'
                              : 'attribute-cap-impact-negative',
                          ].join(' ')}
                        >
                          {capImpact >
                          0
                            ? '+'
                            : ''}

                          {
                            capImpact
                          }
                        </span>
                      )}
                    </div>

                    <span className="attribute-english-name">
                      {
                        attribute.name_en
                      }

                      {infoParts.length >
                        0
                        ? ` • ${infoParts.join(
                            ' • '
                          )}`
                        : ''}
                    </span>
                  </div>

                  <div className="attribute-slider">
                    <div
                      className="slider-visual"
                      style={{
                        '--value-pct':
                          `${valuePercent}%`,

                        '--cap-pct':
                          `${capPercent}%`,
                      }}
                    />

                    {badgeMinimum >
                      attribute.min &&
                      badgeMinimum <=
                        cap && (
                        <span
                          className="slider-marker badge-marker"
                          style={{
                            left:
                              `${badgePercent}%`,
                          }}
                        />
                      )}

                    {cap <
                      attribute.max && (
                      <span
                        className="slider-marker cap-marker"
                        style={{
                          left:
                            `${capPercent}%`,
                        }}
                      />
                    )}

                    <input
                      type="range"
                      min={
                        attribute.min
                      }
                      max={
                        attribute.max
                      }
                      value={
                        value
                      }
                      aria-label={
                        attribute.name_fr ??
                        attribute.name_en
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeAttribute(
                          attribute,
                          Number(
                            event.target
                              .value
                          ),
                          badgeMinimum,
                          minimumAllowed,
                          cap
                        )
                      }
                    />
                  </div>

                  <div className="attribute-value">
                    <strong>
                      {value}
                    </strong>

                    <span>
                      /{cap}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="attribute-step-button"
                    disabled={
                      !canIncrease
                    }
                    onClick={() =>
                      onChangeAttribute(
                        attribute,
                        value + 1,
                        badgeMinimum,
                        minimumAllowed,
                        cap
                      )
                    }
                  >
                    +
                  </button>
                </div>

                {warning && (
                  <div className="attribute-block-warning">
                    {warning}
                  </div>
                )}
              </div>
            )
          }
        )}
      </div>
    </article>
  )
}

function BadgeDetails({
  badge,
  selection,
  unlockedTier,
  activeCaps,
  isTierAvailable,
  onSelectTier,
  onRemoveBadge,
  onSelectOption,
}) {
  const translation =
    getBadgeTranslation(
      badge
    )

  const selectedTier =
    selection?.tier ??
    null

  const allOptions =
    selection
      ? getBadgeTierOptions(
          badge,
          selection.tier
        )
      : []

  const selectedOption =
    selection &&
    selection.optionIndex !==
      null
      ? allOptions[
          selection.optionIndex
        ]
      : allOptions.length ===
        1
        ? allOptions[0]
        : null

  return (
    <div className="badge-details">
      <div className="badge-details-heading">
        <div>
          <h4>
            {
              translation.name_fr
            }
          </h4>

          <span className="badge-english-name">
            {
              badge.name_en
            }
          </span>
        </div>

        {selection ? (
          <span>
            Sélectionné :{' '}

            <strong
              className={
                getTierClass(
                  selectedTier
                )
              }
            >
              {
                getTierLabel(
                  selectedTier
                )
              }
            </strong>
          </span>
        ) : unlockedTier ? (
          <span>
            Débloqué :{' '}

            <strong
              className={
                getTierClass(
                  unlockedTier
                )
              }
            >
              {
                getTierLabel(
                  unlockedTier
                )
              }
            </strong>
          </span>
        ) : null}
      </div>

      <p className="badge-details-description">
        {
          translation.description_fr
        }
      </p>

      <div className="badge-level-picker">
        {tiers.map(
          (tier) => {
            const possible =
              isTierAvailable(
                badge,
                tier.id
              )

            const active =
              selectedTier ===
                tier.id ||
              (
                !selection &&
                unlockedTier ===
                  tier.id
              )

            return (
              <button
                type="button"
                key={
                  tier.id
                }
                disabled={
                  !possible
                }
                className={[
                  getTierClass(
                    tier.id
                  ),

                  active
                    ? 'active-level'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() =>
                  onSelectTier(
                    badge.id,
                    tier.id
                  )
                }
              >
                {
                  tier.label
                }
              </button>
            )
          }
        )}
      </div>

      {selection &&
        allOptions.length >
          1 && (
          <div className="badge-option-picker">
            <strong>
              Choisir l’attribut :
            </strong>

            {allOptions.map(
              (
                option,
                index
              ) => {
                const possible =
                  isRequirementOptionPossible(
                    option,
                    activeCaps
                  )

                return (
                  <label
                    key={
                      index
                    }
                    className={
                      !possible
                        ? 'option-impossible'
                        : ''
                    }
                  >
                    <input
                      type="radio"
                      disabled={
                        !possible
                      }
                      checked={
                        selection.optionIndex ===
                        index
                      }
                      name={`${badge.id}-option`}
                      onChange={() =>
                        onSelectOption(
                          badge.id,
                          index
                        )
                      }
                    />

                    <span>
                      {option
                        .map(
                          (
                            requirement
                          ) => {
                            const attribute =
                              getAttribute(
                                requirement.attribute
                              )

                            return `${attribute.name_fr ?? attribute.name_en} ${requirement.min}`
                          }
                        )
                        .join(
                          ' + '
                        )}
                    </span>
                  </label>
                )
              }
            )}
          </div>
        )}

      {selection &&
        selectedOption && (
          <div className="badge-minimums">
            <span>
              Minimum requis
            </span>

            <div>
              {selectedOption.map(
                (
                  requirement
                ) => {
                  const attribute =
                    getAttribute(
                      requirement.attribute
                    )

                  return (
                    <strong
                      key={
                        requirement.attribute
                      }
                    >
                      {attribute.name_fr ??
                        attribute.name_en}{' '}

                      {
                        requirement.min
                      }
                    </strong>
                  )
                }
              )}
            </div>
          </div>
        )}

      {selection && (
        <button
          type="button"
          className="remove-badge-button"
          onClick={() =>
            onRemoveBadge(
              badge.id
            )
          }
        >
          Retirer ce badge
        </button>
      )}
    </div>
  )
}

function BadgeSidebar({
  selectedBadges,
  activeCaps,
  openBadgeId,
  onOpenBadge,
  onSelectTier,
  onRemoveBadge,
  onSelectOption,
  onResetBuild,
  getUnlockedTier,
  isTierAvailable,
}) {
  return (
    <aside className="badges-sidebar">
      <div className="sidebar-heading">
        <h2>
          Badges
        </h2>

        <p>
          Survole un badge pour voir sa description.
        </p>
      </div>

      <div className="badge-browser-grid">
        {categories.map(
          (category) => {
            const categoryBadges =
              badgesData.badges.filter(
                (badge) =>
                  badge.category ===
                  category.id
              )

            const openedBadge =
              categoryBadges.find(
                (badge) =>
                  badge.id ===
                  openBadgeId
              )

            return (
              <article
                className={`badge-category category-${category.id}`}
                key={
                  category.id
                }
              >
                <div className="badge-category-header">
                  <h3>
                    {
                      category.label
                    }
                  </h3>
                </div>

                <div className="badge-chip-list">
                  {categoryBadges.map(
                    (badge) => {
                      const translation =
                        getBadgeTranslation(
                          badge
                        )

                      const selection =
                        selectedBadges[
                          badge.id
                        ]

                      const unlockedTier =
                        getUnlockedTier(
                          badge
                        )

                      const activeTier =
                        selection?.tier ??
                        unlockedTier

                      const isOpen =
                        openBadgeId ===
                        badge.id

                      const badgeAvailable =
                        tiers.some(
                          (tier) =>
                            isTierAvailable(
                              badge,
                              tier.id
                            )
                        )

                      return (
                        <button
                          type="button"
                          key={
                            badge.id
                          }
                          aria-disabled={
                            !badgeAvailable
                          }
                          className={[
                            'badge-chip',

                            activeTier
                              ? `badge-chip-${activeTier}`
                              : '',

                            isOpen
                              ? 'badge-chip-open'
                              : '',

                            !badgeAvailable
                              ? 'badge-chip-impossible'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => {
                            if (
                              !badgeAvailable
                            ) {
                              return
                            }

                            onOpenBadge(
                              isOpen
                                ? null
                                : badge.id
                            )
                          }}
                        >
                          <span className="badge-chip-label">
                            {
                              translation.name_fr
                            }
                          </span>

                          <span
                            className="badge-tooltip"
                            role="tooltip"
                          >
                            <strong>
                              {
                                translation.name_fr
                              }
                            </strong>

                            <small>
                              {
                                badge.name_en
                              }
                            </small>

                            <span>
                              {
                                translation.description_fr
                              }
                            </span>

                            {!badgeAvailable && (
                              <span className="badge-tooltip-unavailable">
                                Indisponible avec la configuration actuelle.
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    }
                  )}
                </div>

                {openedBadge && (
                  <BadgeDetails
                    badge={
                      openedBadge
                    }
                    selection={
                      selectedBadges[
                        openedBadge.id
                      ]
                    }
                    unlockedTier={
                      getUnlockedTier(
                        openedBadge
                      )
                    }
                    activeCaps={
                      activeCaps
                    }
                    isTierAvailable={
                      isTierAvailable
                    }
                    onSelectTier={
                      onSelectTier
                    }
                    onRemoveBadge={
                      onRemoveBadge
                    }
                    onSelectOption={
                      onSelectOption
                    }
                  />
                )}
              </article>
            )
          }
        )}
      </div>

      <button
        type="button"
        className="sidebar-reset-button"
        onClick={
          onResetBuild
        }
      >
        Réinitialiser le build
      </button>
    </aside>
  )
}

function TakeoverPanel({
  takeoverProgress,
  selectedTakeovers,
  onSelectTakeover,
}) {
  return (
    <section className="takeovers-section">
      <div className="takeovers-heading">
        <div>
          <div className="takeovers-title-line">
            <h2>
              Takeovers
            </h2>

            <span className="takeover-provisional-label">
              Community Day · provisoire
            </span>
          </div>

          <p>
            Une capacité peut être équipée par discipline parmi celles débloquées.
          </p>
        </div>

        <div className="takeover-legend">
          <span>
            <i className="takeover-legend-unlocked" />
            Débloqué
          </span>

          <span>
            <i className="takeover-legend-selected" />
            Équipé
          </span>

          <span>
            <i className="takeover-legend-near" />
            Proche
          </span>

          <span>
            <i className="takeover-legend-impossible" />
            Impossible
          </span>
        </div>
      </div>

      <div className="takeover-disciplines">
        {takeoverDisciplines.map(
          (discipline) => {
            const disciplineTakeovers =
              takeoverProgress.filter(
                ({
                  takeover,
                }) =>
                  takeover.discipline ===
                  discipline.id
              )

            const selectedId =
              selectedTakeovers[
                discipline.id
              ] ??
              null

            const selectedTakeover =
              selectedId
                ? takeoversData.takeovers.find(
                    (takeover) =>
                      takeover.id ===
                      selectedId
                  )
                : null

            const hydrationAssigned =
              playableTakeoverDisciplines.filter(
                (
                  targetDiscipline
                ) =>
                  selectedTakeovers[
                    targetDiscipline.id
                  ] ===
                  'hydration-hero'
              )

            return (
              <article
                key={
                  discipline.id
                }
                className={`takeover-discipline takeover-${discipline.id}`}
              >
                <div className="takeover-discipline-header">
                  <h3>
                    {
                      discipline.label
                    }
                  </h3>

                  {discipline.id !==
                    'universal' &&
                    selectedTakeover && (
                      <span className="takeover-equipped-label">
                        ✓{' '}
                        {
                          selectedTakeover.name_en
                        }
                      </span>
                    )}
                </div>

                <div className="takeover-chip-list">
                  {disciplineTakeovers.map(
                    ({
                      takeover,
                      state,
                    }) => {
                      const unlocked =
                        state.status ===
                        'unlocked'

                      const nearUnlock =
                        state.status ===
                          'locked' &&
                        Number.isFinite(
                          state.totalDelta
                        ) &&
                        state.totalDelta <=
                          5

                      const visualState =
                        unlocked
                          ? 'unlocked'
                          : state.status ===
                              'impossible'
                            ? 'impossible'
                            : nearUnlock
                              ? 'near'
                              : 'locked'

                      const isSelected =
                        discipline.id ===
                        'universal'
                          ? hydrationAssigned.length >
                            0
                          : selectedId ===
                            takeover.id

                      return (
                        <div
                          key={
                            takeover.id
                          }
                          className="takeover-chip-wrapper"
                        >
                          <button
                            type="button"
                            aria-disabled={
                              !unlocked ||
                              discipline.id ===
                                'universal'
                            }
                            className={[
                              'takeover-chip',

                              `takeover-state-${visualState}`,

                              unlocked &&
                              discipline.id !==
                                'universal'
                                ? 'takeover-chip-clickable'
                                : '',

                              isSelected
                                ? 'takeover-chip-selected'
                                : '',

                              takeover.default
                                ? 'takeover-default'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => {
                              if (
                                !unlocked ||
                                discipline.id ===
                                  'universal'
                              ) {
                                return
                              }

                              onSelectTakeover(
                                discipline.id,
                                takeover.id
                              )
                            }}
                          >
                            <div className="takeover-chip-main">
                              <strong>
                                {
                                  takeover.name_en
                                }
                              </strong>

                              {takeover.default && (
                                <span className="takeover-default-label">
                                  Par défaut
                                </span>
                              )}

                              {isSelected &&
                                discipline.id !==
                                  'universal' && (
                                  <span className="takeover-selected-check">
                                    ✓
                                  </span>
                                )}

                              {visualState ===
                                'near' && (
                                <span className="takeover-delta">
                                  +
                                  {
                                    state.totalDelta
                                  }
                                </span>
                              )}
                            </div>

                            <div
                              className="takeover-tooltip"
                              role="tooltip"
                            >
                              <strong>
                                {
                                  takeover.name_en
                                }
                              </strong>

                              <span className="takeover-tooltip-status">
                                {isSelected &&
                                discipline.id !==
                                  'universal'
                                  ? 'Équipé'
                                  : state.status ===
                                      'unlocked'
                                    ? 'Débloqué'
                                    : state.status ===
                                        'impossible'
                                      ? 'Impossible avec cette morphologie'
                                      : nearUnlock
                                        ? `Proche du déblocage : ${state.totalDelta} point${state.totalDelta > 1 ? 's' : ''} à ajouter`
                                        : 'Non débloqué'}
                              </span>

                              <p>
                                {
                                  takeover.description_fr
                                }
                              </p>

                              {state.missing.length >
                                0 && (
                                <div className="takeover-missing">
                                  <span>
                                    Attributs requis
                                  </span>

                                  {state.missing.map(
                                    (
                                      missing,
                                      index
                                    ) => (
                                      <div
                                        key={`${missing.attribute}-${index}`}
                                        className={
                                          missing.impossible
                                            ? 'takeover-missing-impossible'
                                            : ''
                                        }
                                      >
                                        <strong>
                                          {getAttributeName(
                                            missing.attribute
                                          )}
                                        </strong>

                                        <span>
                                          {
                                            missing.current
                                          }

                                          {' → '}

                                          {
                                            missing.required
                                          }

                                          {!missing.impossible &&
                                            missing.delta >
                                              0 && (
                                              <>
                                                {' '}
                                                (+
                                                {
                                                  missing.delta
                                                }
                                                )
                                              </>
                                            )}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </button>

                          {discipline.id ===
                            'universal' &&
                            unlocked && (
                              <div className="universal-assignment">
                                <span>
                                  Équiper dans :
                                </span>

                                <div>
                                  {playableTakeoverDisciplines.map(
                                    (
                                      targetDiscipline
                                    ) => {
                                      const assigned =
                                        selectedTakeovers[
                                          targetDiscipline.id
                                        ] ===
                                        takeover.id

                                      return (
                                        <button
                                          type="button"
                                          key={
                                            targetDiscipline.id
                                          }
                                          className={
                                            assigned
                                              ? 'universal-assignment-active'
                                              : ''
                                          }
                                          onClick={() =>
                                            onSelectTakeover(
                                              targetDiscipline.id,
                                              takeover.id
                                            )
                                          }
                                        >
                                          {
                                            targetDiscipline.label
                                          }
                                        </button>
                                      )
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )
                    }
                  )}
                </div>
              </article>
            )
          }
        )}
      </div>
    </section>
  )
}

function App() {
  const [
    initialBuildState,
  ] = useState(
    getInitialBuild
  )

  const importedBuild =
    initialBuildState.build

  const [
    selectedBadges,
    setSelectedBadges,
  ] = useState(
    () =>
      importedBuild
        ?.selectedBadges ??
      {}
  )

  const [
    selectedTakeovers,
    setSelectedTakeovers,
  ] = useState(
    () =>
      importedBuild
        ?.selectedTakeovers ??
      {}
  )

  /*
   * IMPORTANT :
   *
   * manualAttributes ne représente
   * QUE ce que l'utilisateur a
   * réellement choisi.
   *
   * Les valeurs liées ne sont
   * jamais écrites ici.
   */
  const [
    manualAttributes,
    setManualAttributes,
  ] = useState(
    () =>
      importedBuild
        ?.manualAttributes ??
      initialManualAttributes
  )

  const [
    openBadgeId,
    setOpenBadgeId,
  ] = useState(null)

  const [
    blockedWarnings,
    setBlockedWarnings,
  ] = useState({})

  const [
    morphology,
    setMorphology,
  ] = useState(
    () =>
      importedBuild
        ?.morphology ??
      {
        position: '',
        height: '',
        weight: '',
        wingspan: '',
      }
  )

  const [
    shareStatus,
    setShareStatus,
  ] = useState(
    initialBuildState.source ===
      'url'
      ? 'Build chargé depuis le lien'
      : initialBuildState.source ===
          'local'
        ? 'Build local restauré'
        : ''
  )

  useEffect(() => {
    if (
      initialBuildState.source ===
      'url'
    ) {
      clearBuildFromUrl()
    }
  }, [])

  const bodyCapResult =
    useMemo(
      () =>
        getBodyCaps(
          bodyCapsData,
          morphology
        ),
      [
        morphology,
      ]
    )

  const activeCaps =
    bodyCapResult.available
      ? bodyCapResult.caps
      : null

  const selectedBadgeMorphologyLimits =
    useMemo(
      () =>
        getSelectedBadgeMorphologyLimits(
          badgesData.badges,
          selectedBadges
        ),
      [
        selectedBadges,
      ]
    )

  const selectedPosition =
    useMemo(
      () =>
        getPositionById(
          positionsData.positions,
          morphology.position
        ),
      [
        morphology.position,
      ]
    )

  function getFieldCompatiblePositions(
    ignoredField
  ) {
    const morphologyWithoutField = {
      ...morphology,

      [ignoredField]:
        '',
    }

    const positions =
      getCompatiblePositions(
        positionsData.positions,
        morphologyWithoutField,
        selectedBadgeMorphologyLimits
      )

    if (
      selectedPosition
    ) {
      return positions.filter(
        (position) =>
          position.id ===
          selectedPosition.id
      )
    }

    return positions
  }

  const positionsForHeightRange =
    useMemo(
      () =>
        getFieldCompatiblePositions(
          'height'
        ),
      [
        morphology.position,
        morphology.weight,
        morphology.wingspan,
        selectedBadgeMorphologyLimits,
      ]
    )

  const positionsForWeightRange =
    useMemo(
      () =>
        getFieldCompatiblePositions(
          'weight'
        ),
      [
        morphology.position,
        morphology.height,
        morphology.wingspan,
        selectedBadgeMorphologyLimits,
      ]
    )

  const positionsForWingspanRange =
    useMemo(
      () =>
        getFieldCompatiblePositions(
          'wingspan'
        ),
      [
        morphology.position,
        morphology.height,
        morphology.weight,
        selectedBadgeMorphologyLimits,
      ]
    )

  const availableHeightOptions =
    useMemo(() => {
      if (
        positionsForHeightRange.length ===
        0
      ) {
        return []
      }

      return allHeightOptions.filter(
        (height) => {
          if (
            !isValueInRange(
              height,
              selectedBadgeMorphologyLimits.height
            )
          ) {
            return false
          }

          return positionsForHeightRange.some(
            (position) =>
              isValueInRange(
                height,
                position.height
              )
          )
        }
      )
    }, [
      positionsForHeightRange,
      selectedBadgeMorphologyLimits,
    ])

  const heightRange =
    useMemo(
      () => ({
        min:
          availableHeightOptions.length >
          0
            ? availableHeightOptions[0]
            : null,

        max:
          availableHeightOptions.length >
          0
            ? availableHeightOptions[
                availableHeightOptions.length -
                  1
              ]
            : null,
      }),
      [
        availableHeightOptions,
      ]
    )

  const weightRange =
    useMemo(
      () =>
        positionsForWeightRange.length >
        0
          ? getWeightRangeForPositions(
              positionsForWeightRange,
              selectedBadgeMorphologyLimits.weight
            )
          : {
              min: null,
              max: null,
            },
      [
        positionsForWeightRange,
        selectedBadgeMorphologyLimits,
      ]
    )

  const wingspanRange =
    useMemo(
      () =>
        positionsForWingspanRange.length >
        0
          ? getWingspanRangeForPositions(
              positionsForWingspanRange,
              selectedBadgeMorphologyLimits.wingspan
            )
          : {
              min: null,
              max: null,
            },
      [
        positionsForWingspanRange,
        selectedBadgeMorphologyLimits,
      ]
    )

  const compatiblePositions =
    useMemo(
      () =>
        getCompatiblePositions(
          positionsData.positions,
          morphology,
          selectedBadgeMorphologyLimits
        ),
      [
        morphology,
        selectedBadgeMorphologyLimits,
      ]
    )

  /*
   * =====================================================
   * BADGES → MINIMUMS
   * =====================================================
   */

  const requiredAttributes =
    useMemo(() => {
      const chosenOptions =
        []

      for (
        const badge
        of badgesData.badges
      ) {
        const selection =
          selectedBadges[
            badge.id
          ]

        if (!selection) {
          continue
        }

        const options =
          getBadgeTierOptions(
            badge,
            selection.tier
          )

        if (
          options.length >
            1 &&
          selection.optionIndex ===
            null
        ) {
          continue
        }

        const selectedOption =
          options[
            selection.optionIndex ??
              0
          ]

        if (
          !selectedOption
        ) {
          continue
        }

        if (
          !isRequirementOptionPossible(
            selectedOption,
            activeCaps
          )
        ) {
          continue
        }

        chosenOptions.push(
          selectedOption
        )
      }

      return (
        mergeSelectedRequirements(
          chosenOptions
        )
      )
    }, [
      selectedBadges,
      activeCaps,
    ])

  const requiredByAttribute =
    useMemo(
      () =>
        Object.fromEntries(
          requiredAttributes.map(
            (
              requirement
            ) => [
              requirement.attribute,
              requirement.min,
            ]
          )
        ),
      [
        requiredAttributes,
      ]
    )

  /*
   * =====================================================
   * ATTRIBUTS DEMANDÉS
   *
   * On fusionne :
   * - valeur manuelle
   * - minimum imposé par badges
   *
   * Puis le moteur 2K calcule
   * les valeurs liées.
   * =====================================================
   */

  const dependencyRequestedAttributes =
    useMemo(
      () =>
        createDependencyRequestedAttributes(
          manualAttributes,
          requiredByAttribute
        ),
      [
        manualAttributes,
        requiredByAttribute,
      ]
    )

  const dependencyResult =
    useMemo(
      () =>
        solveAttributeDependencies({
          requestedAttributes:
            dependencyRequestedAttributes,

          caps:
            activeCaps ??
            {},

          includeProvisional:
            INCLUDE_PROVISIONAL_DEPENDENCIES,
        }),
      [
        dependencyRequestedAttributes,
        activeCaps,
      ]
    )

  /*
   * Valeurs réellement affichées.
   *
   * C'est désormais le résultat
   * complet du solveur récursif.
   */
  const effectiveAttributes =
    dependencyResult.values

  /*
   * =====================================================
   * MINIMUM EXTERNE PAR ATTRIBUT
   *
   * Pour savoir jusqu'où un curseur
   * peut descendre, on recalcule
   * le build en retirant uniquement
   * la valeur MANUELLE de cet
   * attribut.
   *
   * Exemple :
   *
   * SWB69 impose BH64.
   *
   * Si BH vaut 64 uniquement à
   * cause de SWB, le minimum externe
   * de BH sera 64.
   *
   * Mais si on baisse ensuite SWB,
   * BH pourra redescendre.
   *
   * Cela évite les "valeurs collées".
   * =====================================================
   */

  const dependencyInfoByAttribute =
    useMemo(() => {
      const result = {}

      for (
        const attribute
        of attributesData.attributes
      ) {
        const manualWithoutTarget = {
          ...manualAttributes,

          [attribute.id]:
            attribute.min,
        }

        const requestedWithoutTarget =
          createDependencyRequestedAttributes(
            manualWithoutTarget,
            requiredByAttribute
          )

        const solvedWithoutTarget =
          solveAttributeDependencies({
            requestedAttributes:
              requestedWithoutTarget,

            caps:
              activeCaps ??
              {},

            includeProvisional:
              INCLUDE_PROVISIONAL_DEPENDENCIES,
          })

        const badgeMinimum =
          requiredByAttribute[
            attribute.id
          ] ??
          attribute.min

        const linkedMinimum =
          solvedWithoutTarget
            .requiredMinimums[
              attribute.id
            ] ??
          attribute.min

        const minimum =
          Math.max(
            attribute.min,
            badgeMinimum,
            solvedWithoutTarget
              .values[
                attribute.id
              ] ??
              attribute.min
          )

        result[
          attribute.id
        ] = {
          minimum,

          badgeMinimum,

          linkedMinimum,

          sources:
            solvedWithoutTarget
              .activeContributorsByAttribute[
                attribute.id
              ] ??
            [],
        }
      }

      return result
    }, [
      manualAttributes,
      requiredByAttribute,
      activeCaps,
    ])

  /*
   * =====================================================
   * CAPS MORPHOLOGIQUES — IMPACT VISUEL
   * =====================================================
   */

  const neutralMorphology =
    useMemo(() => {
      if (
        morphology.height === '' ||
        weightRange.min === null ||
        weightRange.max === null ||
        wingspanRange.min === null ||
        wingspanRange.max === null
      ) {
        return null
      }

      return {
        ...morphology,

        weight:
          Math.round(
            (
              weightRange.min +
              weightRange.max
            ) /
              2
          ),

        wingspan:
          Math.round(
            (
              wingspanRange.min +
              wingspanRange.max
            ) /
              2
          ),
      }
    }, [
      morphology.position,
      morphology.height,
      weightRange.min,
      weightRange.max,
      wingspanRange.min,
      wingspanRange.max,
    ])

  const neutralBodyCapResult =
    useMemo(
      () =>
        neutralMorphology
          ? getBodyCaps(
              bodyCapsData,
              neutralMorphology
            )
          : null,
      [
        neutralMorphology,
      ]
    )

  const capImpactByAttribute =
    useMemo(() => {
      if (
        !activeCaps ||
        !neutralBodyCapResult
          ?.available
      ) {
        return {}
      }

      const impacts = {}

      for (
        const attribute
        of attributesData.attributes
      ) {
        const currentCap =
          activeCaps[
            attribute.id
          ]

        const neutralCap =
          neutralBodyCapResult
            .caps[
              attribute.id
            ]

        if (
          currentCap ===
            undefined ||
          neutralCap ===
            undefined
        ) {
          impacts[
            attribute.id
          ] = 0

          continue
        }

        impacts[
          attribute.id
        ] =
          currentCap -
          neutralCap
      }

      return impacts
    }, [
      activeCaps,
      neutralBodyCapResult,
    ])

  /*
   * =====================================================
   * BADGES — BLOQUEURS
   * =====================================================
   */

  const badgeBlockersByAttribute =
    useMemo(() => {
      const result = {}

      for (
        const badge
        of badgesData.badges
      ) {
        const selection =
          selectedBadges[
            badge.id
          ]

        if (!selection) {
          continue
        }

        const options =
          getBadgeTierOptions(
            badge,
            selection.tier
          )

        const selectedOption =
          selection.optionIndex !==
          null
            ? options[
                selection.optionIndex
              ]
            : options.length ===
              1
              ? options[0]
              : null

        if (
          !selectedOption
        ) {
          continue
        }

        for (
          const requirement
          of selectedOption
        ) {
          const finalMinimum =
            requiredByAttribute[
              requirement.attribute
            ]

          if (
            requirement.min !==
            finalMinimum
          ) {
            continue
          }

          if (
            !result[
              requirement.attribute
            ]
          ) {
            result[
              requirement.attribute
            ] = []
          }

          const translation =
            getBadgeTranslation(
              badge
            )

          result[
            requirement.attribute
          ].push({
            badgeId:
              badge.id,

            name:
              translation.name_fr,

            tier:
              selection.tier,

            minimum:
              requirement.min,
          })
        }
      }

      return result
    }, [
      selectedBadges,
      requiredByAttribute,
    ])

  /*
   * =====================================================
   * TAKEOVERS
   * =====================================================
   */

  const takeoverProgress =
    useMemo(
      () =>
        getTakeoverProgress(
          takeoversData.takeovers,
          effectiveAttributes,
          activeCaps
        ),
      [
        effectiveAttributes,
        activeCaps,
      ]
    )

  /*
   * =====================================================
   * BADGES — DISPONIBILITÉ
   * =====================================================
   */

  function isTierAvailableWithSelections(
    badge,
    tier,
    selections
  ) {
    const attributePossible =
      isBadgeTierPossible(
        badge,
        tier,
        activeCaps,
        getBadgeTierOptions,
        morphology.height
      )

    if (
      !attributePossible
    ) {
      return false
    }

    const otherLimits =
      getSelectedBadgeMorphologyLimits(
        badgesData.badges,
        selections,
        badge.id
      )

    return (
      isBadgeMorphologyCompatibleWithBuild(
        badge,
        tier,
        morphology,
        selectedPosition,
        otherLimits
      )
    )
  }

  function isTierAvailable(
    badge,
    tier
  ) {
    return (
      isTierAvailableWithSelections(
        badge,
        tier,
        selectedBadges
      )
    )
  }

  /*
   * =====================================================
   * MORPHOLOGIE
   * =====================================================
   */

  function selectPosition(
    positionId
  ) {
    const position =
      getPositionById(
        positionsData.positions,
        positionId
      )

    if (!position) {
      return
    }

    if (
      !isPositionCompatibleWithConstraints(
        position,
        morphology,
        selectedBadgeMorphologyLimits
      )
    ) {
      return
    }

    setMorphology(
      (current) => ({
        ...current,

        position:
          current.position ===
          positionId
            ? ''
            : positionId,
      })
    )
  }

  function changeMorphology(
    field,
    value
  ) {
    setMorphology(
      (current) => ({
        ...current,

        [field]:
          value === ''
            ? ''
            : Number(
                value
              ),
      })
    )
  }

  function clearMorphologyField(
    field
  ) {
    changeMorphology(
      field,
      ''
    )
  }

  /*
   * =====================================================
   * RESET
   * =====================================================
   */

  function resetBuild() {
    setSelectedBadges(
      {}
    )

    setSelectedTakeovers(
      {}
    )

    setManualAttributes(
      initialManualAttributes
    )

    setOpenBadgeId(
      null
    )

    setBlockedWarnings(
      {}
    )

    setMorphology({
      position: '',
      height: '',
      weight: '',
      wingspan: '',
    })

    clearCurrentBuild()

    setShareStatus(
      'Build réinitialisé'
    )
  }

  /*
   * =====================================================
   * CHARGEMENT D'UN BUILD
   * =====================================================
   */

  function loadNamedBuild(
    imported,
    name
  ) {
    const build =
      sanitizeImportedBuild(
        imported
      )

    if (!build) {
      setShareStatus(
        'Impossible de charger ce build'
      )

      return
    }

    setSelectedBadges(
      build.selectedBadges
    )

    setSelectedTakeovers(
      build.selectedTakeovers
    )

    setManualAttributes(
      build.manualAttributes
    )

    setMorphology(
      build.morphology
    )

    setOpenBadgeId(
      null
    )

    setBlockedWarnings(
      {}
    )

    clearBuildFromUrl()

    setShareStatus(
      `Build « ${name} » chargé`
    )
  }

  /*
   * =====================================================
   * SAUVEGARDE
   * =====================================================
   */

  const encodedCurrentBuild =
    useMemo(() => {
      const payload =
        createBuildPayload({
          morphology,
          manualAttributes,
          selectedBadges,
          selectedTakeovers,

          attributes:
            attributesData.attributes,
        })

      return (
        encodeBuildPayload(
          payload
        )
      )
    }, [
      morphology,
      manualAttributes,
      selectedBadges,
      selectedTakeovers,
    ])

  useEffect(() => {
    if (
      encodedCurrentBuild
    ) {
      saveCurrentBuild(
        encodedCurrentBuild
      )
    }
  }, [
    encodedCurrentBuild,
  ])

  async function copyBuildLink() {
    const url =
      createShareUrl(
        encodedCurrentBuild
      )

    if (!url) {
      setShareStatus(
        'Impossible de créer le lien'
      )

      return
    }

    const copied =
      await copyText(
        url
      )

    setShareStatus(
      copied
        ? 'Lien du build copié'
        : 'Impossible de copier le lien'
    )
  }

  function clearLocalSave() {
    clearCurrentBuild()

    setShareStatus(
      'Sauvegarde locale effacée'
    )
  }

  /*
   * =====================================================
   * AJUSTEMENT AUTO MORPHOLOGIE
   * =====================================================
   */

  useEffect(() => {
    setMorphology(
      (current) => {
        const updated = {
          ...current,
        }

        let changed =
          false

        if (
          current.height !== '' &&
          availableHeightOptions.length >
            0 &&
          !availableHeightOptions.includes(
            Number(
              current.height
            )
          )
        ) {
          const currentHeight =
            Number(
              current.height
            )

          const closestHeight =
            [
              ...availableHeightOptions,
            ].sort(
              (a, b) =>
                Math.abs(
                  a -
                    currentHeight
                ) -
                Math.abs(
                  b -
                    currentHeight
                )
            )[0]

          updated.height =
            closestHeight

          changed =
            true
        }

        if (
          current.weight !== '' &&
          weightRange.min !==
            null &&
          weightRange.max !==
            null
        ) {
          const safeWeight =
            Math.min(
              weightRange.max,
              Math.max(
                weightRange.min,
                Number(
                  current.weight
                )
              )
            )

          if (
            safeWeight !==
            Number(
              current.weight
            )
          ) {
            updated.weight =
              safeWeight

            changed =
              true
          }
        }

        if (
          current.wingspan !== '' &&
          wingspanRange.min !==
            null &&
          wingspanRange.max !==
            null
        ) {
          const safeWingspan =
            Math.min(
              wingspanRange.max,
              Math.max(
                wingspanRange.min,
                Number(
                  current.wingspan
                )
              )
            )

          if (
            safeWingspan !==
            Number(
              current.wingspan
            )
          ) {
            updated.wingspan =
              safeWingspan

            changed =
              true
          }
        }

        return changed
          ? updated
          : current
      }
    )
  }, [
    availableHeightOptions,
    weightRange.min,
    weightRange.max,
    wingspanRange.min,
    wingspanRange.max,
  ])

  /*
   * Efface les avertissements
   * lorsqu'un badge ou une
   * morphologie change.
   */
  useEffect(() => {
    setBlockedWarnings(
      {}
    )
  }, [
    selectedBadges,
    morphology,
  ])

  /*
   * Une valeur MANUELLE ne peut
   * jamais dépasser le cap
   * morphologique.
   */
  useEffect(() => {
    if (!activeCaps) {
      return
    }

    setManualAttributes(
      (current) => {
        let changed =
          false

        const updated = {
          ...current,
        }

        for (
          const attribute
          of attributesData.attributes
        ) {
          const cap =
            activeCaps[
              attribute.id
            ] ??
            attribute.max

          if (
            updated[
              attribute.id
            ] > cap
          ) {
            updated[
              attribute.id
            ] = cap

            changed =
              true
          }
        }

        return changed
          ? updated
          : current
      }
    )
  }, [
    activeCaps,
  ])

  /*
   * =====================================================
   * VALIDATION DES BADGES APRÈS CHANGEMENT MORPHOLOGIQUE
   * =====================================================
   */

  useEffect(() => {
    setSelectedBadges(
      (current) => {
        const updated = {
          ...current,
        }

        let changed =
          false

        for (
          const [
            badgeId,
            selection,
          ]
          of Object.entries(
            current
          )
        ) {
          const badge =
            badgesData.badges.find(
              (item) =>
                item.id ===
                badgeId
            )

          if (!badge) {
            delete updated[
              badgeId
            ]

            changed =
              true

            continue
          }

          const tierPossible =
            isTierAvailableWithSelections(
              badge,
              selection.tier,
              current
            )

          if (
            !tierPossible
          ) {
            delete updated[
              badgeId
            ]

            changed =
              true

            continue
          }

          const options =
            getBadgeTierOptions(
              badge,
              selection.tier
            )

          if (
            selection.optionIndex !==
            null
          ) {
            const chosenOption =
              options[
                selection.optionIndex
              ]

            const optionStillPossible =
              chosenOption &&
              isRequirementOptionPossible(
                chosenOption,
                activeCaps
              )

            if (
              !optionStillPossible
            ) {
              const possibleIndexes =
                options
                  .map(
                    (
                      option,
                      index
                    ) => ({
                      option,
                      index,
                    })
                  )
                  .filter(
                    ({
                      option,
                    }) =>
                      isRequirementOptionPossible(
                        option,
                        activeCaps
                      )
                  )
                  .map(
                    ({
                      index,
                    }) =>
                      index
                  )

              updated[
                badgeId
              ] = {
                ...selection,

                optionIndex:
                  possibleIndexes.length ===
                  1
                    ? possibleIndexes[0]
                    : null,
              }

              changed =
                true
            }
          }
        }

        return changed
          ? updated
          : current
      }
    )
  }, [
    activeCaps,
    morphology,
    selectedPosition,
  ])

  /*
   * =====================================================
   * BADGES
   * =====================================================
   */

  function selectTier(
    badgeId,
    tier
  ) {
    const badge =
      badgesData.badges.find(
        (item) =>
          item.id ===
          badgeId
      )

    if (!badge) {
      return
    }

    if (
      !isTierAvailable(
        badge,
        tier
      )
    ) {
      return
    }

    const allOptions =
      getBadgeTierOptions(
        badge,
        tier
      )

    const possibleIndexes =
      allOptions
        .map(
          (
            option,
            index
          ) => ({
            option,
            index,
          })
        )
        .filter(
          ({
            option,
          }) =>
            isRequirementOptionPossible(
              option,
              activeCaps
            )
        )
        .map(
          ({
            index,
          }) =>
            index
        )

    const optionIndex =
      possibleIndexes.length ===
      1
        ? possibleIndexes[0]
        : null

    setSelectedBadges(
      (current) => ({
        ...current,

        [badgeId]: {
          tier,
          optionIndex,
        },
      })
    )

    if (
      optionIndex !==
      null
    ) {
      setOpenBadgeId(
        null
      )
    }
  }

  function removeBadge(
    badgeId
  ) {
    setSelectedBadges(
      (current) => {
        const updated = {
          ...current,
        }

        delete updated[
          badgeId
        ]

        return updated
      }
    )

    setOpenBadgeId(
      null
    )
  }

  function selectOption(
    badgeId,
    optionIndex
  ) {
    setSelectedBadges(
      (current) => ({
        ...current,

        [badgeId]: {
          ...current[
            badgeId
          ],

          optionIndex,
        },
      })
    )

    setOpenBadgeId(
      null
    )
  }

  /*
   * =====================================================
   * TAKEOVERS
   * =====================================================
   */

  useEffect(() => {
    const progressById =
      Object.fromEntries(
        takeoverProgress.map(
          ({
            takeover,
            state,
          }) => [
            takeover.id,
            state,
          ]
        )
      )

    setSelectedTakeovers(
      (current) => {
        const updated = {
          ...current,
        }

        let changed =
          false

        for (
          const [
            disciplineId,
            takeoverId,
          ]
          of Object.entries(
            current
          )
        ) {
          const state =
            progressById[
              takeoverId
            ]

          if (
            !state ||
            state.status !==
              'unlocked'
          ) {
            delete updated[
              disciplineId
            ]

            changed =
              true
          }
        }

        return changed
          ? updated
          : current
      }
    )
  }, [
    takeoverProgress,
  ])

  function selectTakeover(
    disciplineId,
    takeoverId
  ) {
    const progress =
      takeoverProgress.find(
        ({
          takeover,
        }) =>
          takeover.id ===
          takeoverId
      )

    if (
      !progress ||
      progress.state.status !==
        'unlocked'
    ) {
      return
    }

    setSelectedTakeovers(
      (current) => {
        if (
          current[
            disciplineId
          ] ===
          takeoverId
        ) {
          const updated = {
            ...current,
          }

          delete updated[
            disciplineId
          ]

          return updated
        }

        return {
          ...current,

          [disciplineId]:
            takeoverId,
        }
      }
    )
  }

  /*
   * =====================================================
   * MODIFICATION D'UN ATTRIBUT
   * =====================================================
   */

  function changeAttribute(
    attribute,
    requestedValue,
    badgeMinimum,
    minimumAllowed,
    cap
  ) {
    const requested =
      Number(
        requestedValue
      )

    const safeValue =
      Math.min(
        cap,
        Math.max(
          attribute.min,
          requested
        )
      )

    /*
     * Empêche de descendre sous
     * le minimum actuellement
     * imposé par :
     *
     * - un badge
     * - un autre attribut
     */
    if (
      safeValue <
      minimumAllowed
    ) {
      const reasons = []

      const blockers =
        badgeBlockersByAttribute[
          attribute.id
        ] ??
        []

      if (
        badgeMinimum >=
          minimumAllowed &&
        blockers.length >
          0
      ) {
        reasons.push(
          blockers
            .map(
              (
                blocker
              ) =>
                `${blocker.name} (${getTierLabel(
                  blocker.tier
                )})`
            )
            .join(', ')
        )
      }

      const dependencyInfo =
        dependencyInfoByAttribute[
          attribute.id
        ]

      const linkedSources =
        dependencyInfo
          ?.sources ??
        []

      if (
        dependencyInfo
          ?.linkedMinimum >=
          minimumAllowed &&
        linkedSources.length >
          0
      ) {
        const sourceNames =
          [
            ...new Set(
              linkedSources.map(
                (
                  contribution
                ) =>
                  getAttributeName(
                    contribution.source
                  )
              )
            ),
          ]

        reasons.push(
          `attribut lié : ${sourceNames.join(
            ', '
          )}`
        )
      }

      const reasonText =
        reasons.length >
        0
          ? reasons.join(
              ' • '
            )
          : 'une dépendance du build'

      setBlockedWarnings(
        (current) => ({
          ...current,

          [attribute.id]:
            `Impossible de descendre sous ${minimumAllowed} : ${reasonText} impose ce minimum.`,
        })
      )

      return
    }

    /*
     * Avant d'accepter une hausse,
     * on simule le futur build.
     *
     * Si cette hausse crée une
     * NOUVELLE dépendance qui
     * dépasse un cap morphologique,
     * on bloque la modification.
     */
    const candidateManual = {
      ...manualAttributes,

      [attribute.id]:
        safeValue,
    }

    const candidateRequested =
      createDependencyRequestedAttributes(
        candidateManual,
        requiredByAttribute
      )

    const candidateResult =
      solveAttributeDependencies({
        requestedAttributes:
          candidateRequested,

        caps:
          activeCaps ??
          {},

        includeProvisional:
          INCLUDE_PROVISIONAL_DEPENDENCIES,
      })

    const existingConflictKeys =
      new Set(
        dependencyResult
          .capConflicts
          .map(
            getCapConflictKey
          )
      )

    const newConflicts =
      candidateResult
        .capConflicts
        .filter(
          (conflict) =>
            !existingConflictKeys.has(
              getCapConflictKey(
                conflict
              )
            )
        )

    if (
      newConflicts.length >
      0
    ) {
      const conflict =
        newConflicts[0]

      const sourceName =
        getAttributeName(
          conflict.source
        )

      const targetName =
        getAttributeName(
          conflict.target
        )

      setBlockedWarnings(
        (current) => ({
          ...current,

          [attribute.id]:
            `${sourceName} ${conflict.sourceValue ?? safeValue} imposerait ${targetName} ${conflict.required}, mais son cap morphologique est ${conflict.cap}.`,
        })
      )

      return
    }

    setBlockedWarnings(
      (current) => {
        if (
          !current[
            attribute.id
          ]
        ) {
          return current
        }

        const updated = {
          ...current,
        }

        delete updated[
          attribute.id
        ]

        return updated
      }
    )

    /*
     * On ne mémorise que la
     * volonté directe du joueur.
     *
     * Les attributs liés restent
     * entièrement calculés.
     */
    setManualAttributes(
      (current) => ({
        ...current,

        [attribute.id]:
          safeValue,
      })
    )
  }

  /*
   * =====================================================
   * BADGES DÉBLOQUÉS
   * =====================================================
   */

  function getUnlockedTier(
    badge
  ) {
    let highestTier =
      null

    for (
      const tier
      of tiers
    ) {
      if (
        !isTierAvailable(
          badge,
          tier.id
        )
      ) {
        continue
      }

      if (
        isBadgeTierUnlocked(
          badge,
          tier.id,
          effectiveAttributes
        )
      ) {
        highestTier =
          tier.id
      }
    }

    return highestTier
  }

  const leftCategories =
    categories.filter(
      (category) =>
        leftCategoryIds.includes(
          category.id
        )
    )

  const rightCategories =
    categories.filter(
      (category) =>
        rightCategoryIds.includes(
          category.id
        )
    )

  const activeMorphologyRestrictionText =
    useMemo(() => {
      const parts = []

      const labels = {
        height:
          'Taille',

        weight:
          'Poids',

        wingspan:
          'Envergure',
      }

      for (
        const field
        of [
          'height',
          'weight',
          'wingspan',
        ]
      ) {
        const range =
          selectedBadgeMorphologyLimits[
            field
          ]

        const rangeText =
          formatRange(
            field,
            range
          )

        if (!rangeText) {
          continue
        }

        const badgeNames =
          [
            ...new Set(
              selectedBadgeMorphologyLimits
                .sources[
                  field
                ]
                .map(
                  (
                    source
                  ) => {
                    const badge =
                      badgesData.badges.find(
                        (
                          item
                        ) =>
                          item.id ===
                          source.badgeId
                      )

                    if (!badge) {
                      return null
                    }

                    return (
                      getBadgeTranslation(
                        badge
                      ).name_fr
                    )
                  }
                )
                .filter(
                  Boolean
                )
            ),
          ]

        parts.push(
          `${labels[field]} : ${rangeText}${
            badgeNames.length >
            0
              ? ` (${badgeNames.join(
                  ', '
                )})`
              : ''
          }`
        )
      }

      return parts.join(
        ' • '
      )
    }, [
      selectedBadgeMorphologyLimits,
    ])

  function getCapStatusText() {
    if (
      !bodyCapResult.available
    ) {
      return 'Définis la taille, le poids et l’envergure pour calculer les caps morphologiques.'
    }

    if (
      bodyCapResult.quality ===
      'exact'
    ) {
      return 'Caps morphologiques : relevé exact'
    }

    if (
      bodyCapResult.estimationType ===
      'extrapolated'
    ) {
      return 'Caps morphologiques : estimation extrapolée'
    }

    if (
      bodyCapResult.estimationType ===
      'interpolated'
    ) {
      return 'Caps morphologiques : estimation interpolée'
    }

    return 'Caps morphologiques : estimation'
  }

  function getCapStatusClass() {
    if (
      !bodyCapResult.available
    ) {
      return ''
    }

    if (
      bodyCapResult.quality ===
      'exact'
    ) {
      return 'cap-exact'
    }

    if (
      bodyCapResult.estimationType ===
      'extrapolated'
    ) {
      return 'cap-extrapolated'
    }

    return 'cap-estimated'
  }

  return (
    <main className="app">
      <header className="header">
        <span>
          NBA 2K27
        </span>

        <h1>
          Tonton-Z 2K Builder
        </h1>

        <p>
          Construis ton joueur depuis sa morphologie,
          ses badges ou ses attributs.
        </p>

        <div className="build-share-toolbar">
          <div className="build-save-state">
            <span className="build-save-dot" />

            <div>
              <strong>
                Sauvegarde automatique
              </strong>

              <span>
                Le build reste enregistré sur cet appareil.
              </span>
            </div>
          </div>

          <div className="build-share-actions">
            <button
              type="button"
              className="build-share-button build-share-primary"
              onClick={
                copyBuildLink
              }
            >
              Copier le lien du build
            </button>

            <BuildLibrary
              encodedCurrentBuild={
                encodedCurrentBuild
              }
              attributes={
                attributesData.attributes
              }
              onLoadBuild={
                loadNamedBuild
              }
            />

            <button
              type="button"
              className="build-share-button"
              onClick={
                clearLocalSave
              }
            >
              Effacer la sauvegarde locale
            </button>
          </div>

          {shareStatus && (
            <span className="build-share-status">
              {
                shareStatus
              }
            </span>
          )}
        </div>
      </header>

      <section className="morphology-section">
        <div className="morphology-section-heading">
          <h2>
            Morphologie
          </h2>

          <div className="morphology-compatibility-info">
            <strong>
              {morphology.height
                ? `Postes compatibles avec ${inchesToHeight(
                    morphology.height
                  )}`
                : activeMorphologyRestrictionText
                  ? 'Postes compatibles avec les badges sélectionnés'
                  : 'Choisir un poste'}
            </strong>

            <span>
              Les plages Taille / Poids / Envergure s’adaptent automatiquement.
            </span>
          </div>
        </div>

        <div className="morphology-main-grid">
          {positionsData.positions.map(
            (
              position,
              index
            ) => {
              const compatible =
                compatiblePositions.some(
                  (item) =>
                    item.id ===
                    position.id
                )

              const selected =
                morphology.position ===
                position.id

              return (
                <button
                  type="button"
                  key={
                    position.id
                  }
                  disabled={
                    !compatible
                  }
                  className={[
                    'position-selector',
                    `position-slot-${index + 1}`,

                    compatible
                      ? 'compatible'
                      : 'incompatible',

                    selected
                      ? 'selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() =>
                    selectPosition(
                      position.id
                    )
                  }
                >
                  <span className="position-abbr">
                    {
                      position.abbr_fr
                    }
                  </span>

                  <div className="position-info">
                    <strong>
                      {
                        position.name_en
                      }
                    </strong>

                    <small>
                      {inchesToHeight(
                        position
                          .height.min
                      )}

                      {' – '}

                      {inchesToHeight(
                        position
                          .height.max
                      )}
                    </small>
                  </div>
                </button>
              )
            }
          )}

          <div className="morphology-height-card">
            <MorphologySlider
              label="Taille"
              value={
                morphology.height
              }
              min={
                heightRange.min
              }
              max={
                heightRange.max
              }
              formatValue={
                inchesToHeight
              }
              onChange={(
                value
              ) =>
                changeMorphology(
                  'height',
                  value
                )
              }
              onClear={() =>
                clearMorphologyField(
                  'height'
                )
              }
            />
          </div>

          <div className="morphology-weight-card">
            <MorphologySlider
              label="Poids"
              value={
                morphology.weight
              }
              min={
                weightRange.min
              }
              max={
                weightRange.max
              }
              formatValue={(
                value
              ) =>
                `${value} lbs`
              }
              onChange={(
                value
              ) =>
                changeMorphology(
                  'weight',
                  value
                )
              }
              onClear={() =>
                clearMorphologyField(
                  'weight'
                )
              }
            />
          </div>

          <div className="morphology-wingspan-card">
            <MorphologySlider
              label="Envergure"
              value={
                morphology.wingspan
              }
              min={
                wingspanRange.min
              }
              max={
                wingspanRange.max
              }
              formatValue={
                inchesToHeight
              }
              onChange={(
                value
              ) =>
                changeMorphology(
                  'wingspan',
                  value
                )
              }
              onClear={() =>
                clearMorphologyField(
                  'wingspan'
                )
              }
            />
          </div>

          <div className="morphology-reset-card">
            <span className="morphology-reset-icon">
              ↺
            </span>

            <strong>
              Réinitialiser
            </strong>

            <span>
              le build
            </span>

            <button
              type="button"
              onClick={
                resetBuild
              }
              aria-label="Réinitialiser le build"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="cap-status">
          <span
            className={
              getCapStatusClass()
            }
          >
            {
              getCapStatusText()
            }
          </span>

          {activeMorphologyRestrictionText && (
            <span className="badge-morphology-restrictions">
              Restrictions badges :{' '}
              {
                activeMorphologyRestrictionText
              }
            </span>
          )}
        </div>
      </section>

      <section className="builder-section">
        <div className="builder-workspace">
          <BadgeSidebar
            selectedBadges={
              selectedBadges
            }
            activeCaps={
              activeCaps
            }
            openBadgeId={
              openBadgeId
            }
            onOpenBadge={
              setOpenBadgeId
            }
            onSelectTier={
              selectTier
            }
            onRemoveBadge={
              removeBadge
            }
            onSelectOption={
              selectOption
            }
            onResetBuild={
              resetBuild
            }
            getUnlockedTier={
              getUnlockedTier
            }
            isTierAvailable={
              isTierAvailable
            }
          />

          <div className="attributes-main">
            <div className="attributes-heading">
              <h2>
                Attributs
              </h2>

              <p>
                Les attributs liés montent automatiquement.
                Le second nombre correspond au cap maximum autorisé.
                Modèle de dépendances vérifié sur le profil MJ 6'7" / 215 lbs / 6'10".
              </p>
            </div>

            <div className="attributes-builder">
              <div className="attribute-column">
                {leftCategories.map(
                  (category) => (
                    <AttributeCategory
                      key={
                        category.id
                      }
                      category={
                        category
                      }
                      effectiveAttributes={
                        effectiveAttributes
                      }
                      manualAttributes={
                        manualAttributes
                      }
                      requiredByAttribute={
                        requiredByAttribute
                      }
                      dependencyInfoByAttribute={
                        dependencyInfoByAttribute
                      }
                      activeCaps={
                        activeCaps
                      }
                      capImpactByAttribute={
                        capImpactByAttribute
                      }
                      blockedWarnings={
                        blockedWarnings
                      }
                      onChangeAttribute={
                        changeAttribute
                      }
                    />
                  )
                )}
              </div>

              <div className="attribute-column">
                {rightCategories.map(
                  (category) => (
                    <AttributeCategory
                      key={
                        category.id
                      }
                      category={
                        category
                      }
                      effectiveAttributes={
                        effectiveAttributes
                      }
                      manualAttributes={
                        manualAttributes
                      }
                      requiredByAttribute={
                        requiredByAttribute
                      }
                      dependencyInfoByAttribute={
                        dependencyInfoByAttribute
                      }
                      activeCaps={
                        activeCaps
                      }
                      capImpactByAttribute={
                        capImpactByAttribute
                      }
                      blockedWarnings={
                        blockedWarnings
                      }
                      onChangeAttribute={
                        changeAttribute
                      }
                    />
                  )
                )}
              </div>
            </div>

            <TakeoverPanel
              takeoverProgress={
                takeoverProgress
              }
              selectedTakeovers={
                selectedTakeovers
              }
              onSelectTakeover={
                selectTakeover
              }
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default App