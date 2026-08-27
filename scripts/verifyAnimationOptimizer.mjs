import {
  createAnimationOptimizationContext,
  getAnimationBuildScore,
  getAnimationGroupRelevance,
  getAnimationOptimizerStatus,
  getAnimationPotentialScore,
  getAnimationStepImpact,
  getAnimationTargetCeiling,
  getAnimationUnlocksBetween,
} from '../src/engine/animationOptimizerEngine.js'

const errors = []
const expect = (condition, message) => {
  if (!condition) errors.push(message)
}

const fixture = {
  schemaVersion: 1,
  sourceAnimations: 2914,
  eligibleAnimations: 7,
  excludedSeasonAnimations: 30,
  excludedRecAnimations: 0,
  groups: [],
  signatures: [
    {
      key: 'playmaking|dribble-style|small',
      groupKey: 'PLAYMAKING_MOVES|DRIBBLE_STYLE|Style de dribbles',
      categoryId: 'PLAYMAKING_MOVES',
      categoryFr: 'Playmaking',
      groupType: 'DRIBBLE_STYLE',
      groupFr: 'Style de dribbles',
      allowedSizes: 'SMALLS_ONLY',
      operator: 'AND',
      requirements: [
        { attribute: 'ballHandle', min: 85 },
        { attribute: 'speedWithBall', min: 75 },
      ],
      count: 2,
      examples: [{ id: 'DRIBBLE_TEST', nameFr: 'Dribble Test' }],
    },
    {
      key: 'dunks|contact|swing',
      groupKey: 'DUNKS|CONTACT_DUNKS|Dunks à 2 pieds en mouvement - Dunks en contact',
      categoryId: 'DUNKS',
      categoryFr: 'Dunks',
      groupType: 'CONTACT_DUNKS',
      groupFr: 'Dunks à 2 pieds en mouvement - Dunks en contact',
      allowedSizes: 'SWINGS_ONLY',
      operator: 'AND',
      requirements: [
        { attribute: 'drivingDunk', min: 80 },
        { attribute: 'standingDunk', min: 55 },
        { attribute: 'vertical', min: 60 },
      ],
      count: 1,
      examples: [{ id: 'CONTACT_TEST', nameFr: 'Contact Test' }],
    },
    {
      key: 'passing|style|any',
      groupKey: 'PLAYMAKING_MOVES|PASS_STYLE|Style de passes',
      categoryId: 'PLAYMAKING_MOVES',
      categoryFr: 'Playmaking',
      groupType: 'PASS_STYLE',
      groupFr: 'Style de passes',
      allowedSizes: 'ANY',
      operator: 'AND',
      requirements: [{ attribute: 'passAccuracy', min: 80 }],
      count: 2,
      examples: [{ id: 'PASS_TEST', nameFr: 'Passe Test' }],
    },
    {
      key: 'shooting|jumper|big',
      groupKey: 'SCORING_MOVES|SHOT_JUMPER|Tir en suspension',
      categoryId: 'SCORING_MOVES',
      categoryFr: 'Scoring',
      groupType: 'SHOT_JUMPER',
      groupFr: 'Tir en suspension',
      allowedSizes: 'BIGS_ONLY',
      operator: 'OR',
      requirements: [
        { attribute: 'midRangeShot', min: 59 },
        { attribute: 'threePointShot', min: 59 },
      ],
      count: 2,
      examples: [{ id: 'JUMPER_TEST', nameFr: 'Jumper Test' }],
    },
  ],
}

const creatorProfile = {
  answers: {
    offensePrimary: 'primary_creator',
    offenseSecondary: 'closeout',
    defensePrimary: 'on_ball_defense',
    priorities: ['dribbling', 'passing', 'shooting'],
  },
  weights: {
    ballHandle: 3,
    speedWithBall: 2.8,
    passAccuracy: 2.5,
    threePointShot: 2.2,
    midRangeShot: 1.6,
    drivingDunk: 1,
    standingDunk: 0.4,
    vertical: 0.8,
  },
}

const slasherProfile = {
  answers: {
    offensePrimary: 'cuts',
    offenseSecondary: 'closeout',
    defensePrimary: 'switch_defense',
    priorities: ['dunk', 'speed'],
  },
  weights: {
    drivingDunk: 3,
    standingDunk: 1.4,
    vertical: 2.2,
    speed: 2,
    agility: 1.5,
  },
}

const status = getAnimationOptimizerStatus(fixture)
expect(status.enabled, 'fixture optimizer should be enabled')
expect(status.sourceAnimations === 2914, 'fixture source count should be 2914')

const dribbleSignature = fixture.signatures[0]
expect(
  getAnimationGroupRelevance(dribbleSignature, creatorProfile) > 1,
  'dribble style should be highly relevant for a primary creator'
)
const creatorDribbleRelevance = getAnimationGroupRelevance(
  dribbleSignature,
  creatorProfile
)
const slasherDribbleRelevance = getAnimationGroupRelevance(
  dribbleSignature,
  slasherProfile
)
expect(
  slasherDribbleRelevance < creatorDribbleRelevance * 0.65,
  'dribble style should be materially less relevant for a cuts/slasher profile'
)

const smallMorphology = { position: 'PG', height: 76, weight: 205, wingspan: 76 }
const swingMorphology = { position: 'SG', height: 77, weight: 220, wingspan: 81 }
const bigMorphology = { position: 'C', height: 84, weight: 242, wingspan: 88 }
const maxCaps = {
  ballHandle: 99,
  speedWithBall: 99,
  passAccuracy: 99,
  drivingDunk: 99,
  standingDunk: 99,
  vertical: 99,
  midRangeShot: 99,
  threePointShot: 99,
}

const creatorSmallPotential = getAnimationPotentialScore(
  creatorProfile,
  smallMorphology,
  maxCaps,
  fixture
)
const creatorBigPotential = getAnimationPotentialScore(
  creatorProfile,
  bigMorphology,
  maxCaps,
  fixture
)
expect(
  creatorSmallPotential > creatorBigPotential,
  'creator should value SMALL dribble access more than BIG-only jumper access'
)

const creatorContext = createAnimationOptimizationContext(
  creatorProfile,
  smallMorphology,
  maxCaps,
  fixture
)
const beforeCreator = {
  ballHandle: 84,
  speedWithBall: 75,
  passAccuracy: 79,
  threePointShot: 80,
  midRangeShot: 70,
}
const afterHandle = { ...beforeCreator, ballHandle: 85 }
const handleImpact = getAnimationStepImpact(
  creatorContext,
  beforeCreator,
  afterHandle,
  'ballHandle'
)
expect(handleImpact.unlockScore > 0, '84 -> 85 Ball Handle should unlock relevant dribble signature')
expect(handleImpact.unlocked.some((signature) => signature.key === dribbleSignature.key), 'dribble signature should be reported as unlocked')

const handleDropImpact = getAnimationStepImpact(
  creatorContext,
  afterHandle,
  beforeCreator,
  'ballHandle'
)
expect(handleDropImpact.lossScore > 0, '85 -> 84 Ball Handle should be protected as an animation loss')

const passTarget = getAnimationTargetCeiling(
  creatorContext,
  'passAccuracy',
  77,
  90,
  { maxDistance: 6 }
)
expect(passTarget?.threshold === 80, 'Pass Accuracy should target exact animation threshold 80')

const slasherContext = createAnimationOptimizationContext(
  slasherProfile,
  swingMorphology,
  maxCaps,
  fixture
)
const beforeContact = {
  drivingDunk: 79,
  standingDunk: 55,
  vertical: 60,
}
const afterContact = { ...beforeContact, drivingDunk: 80 }
const contactImpact = getAnimationStepImpact(
  slasherContext,
  beforeContact,
  afterContact,
  'drivingDunk'
)
expect(contactImpact.unlockScore > 0, '79 -> 80 Driving Dunk should unlock the contact signature')
expect(contactImpact.unlocked.some((signature) => signature.groupType === 'CONTACT_DUNKS'), 'contact dunk should be surfaced')

const beforeBuild = {
  morphology: smallMorphology,
  attributes: beforeCreator,
}
const afterBuild = {
  morphology: smallMorphology,
  attributes: {
    ...afterHandle,
    passAccuracy: 80,
  },
}
const unlocks = getAnimationUnlocksBetween(
  creatorProfile,
  beforeBuild,
  afterBuild,
  { limit: 5, data: fixture }
)
expect(unlocks.length >= 2, 'creator changes should report both dribble and pass unlocks')

const scoreBefore = getAnimationBuildScore(creatorProfile, beforeBuild, fixture)
const scoreAfter = getAnimationBuildScore(creatorProfile, afterBuild, fixture)
expect(scoreAfter > scoreBefore, 'animation build score should improve after exact threshold unlocks')

if (errors.length) {
  console.error('Animation optimizer verification FAILED')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log('Animation optimizer verification passed.')
console.log('- role-aware group relevance verified')
console.log('- SMALL / SWING / BIG morphology influence verified')
console.log('- exact AND / OR threshold unlocks verified')
console.log('- threshold-loss protection verified')
console.log('- next animation threshold targeting verified')
