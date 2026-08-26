import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getAttributeCategoryHeader,
  getAttributeCategoryIcon,
  getBadgeIcon,
  getBodyTypeImage,
  getBrandingAsset,
  getBuilderUiAsset,
  getTakeoverDisciplineIcon,
  getTakeoverIcon,
} from '../src/data/nba2k27/assetResolver.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const publicRoot = path.join(root, 'public')

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(root, relativePath), 'utf8')
  )
}

function assertPublicAsset(url, label) {
  if (!url) {
    throw new Error(`${label}: resolver returned no asset URL`)
  }

  const filePath = path.join(publicRoot, url.replace(/^\//, ''))

  if (!fs.existsSync(filePath)) {
    throw new Error(`${label}: missing ${url}`)
  }
}

const badges = readJson('src/data/nba2k27/badges.json').badges
const takeovers = readJson('src/data/nba2k27/takeovers.json').takeovers

for (const badge of badges) {
  assertPublicAsset(getBadgeIcon(badge), `badge ${badge.id}`)
}

for (const takeover of takeovers) {
  assertPublicAsset(
    getTakeoverIcon(takeover, 'color'),
    `takeover ${takeover.id} color`
  )
  assertPublicAsset(
    getTakeoverIcon(takeover, 'grey'),
    `takeover ${takeover.id} grey`
  )
}

for (const discipline of [
  'shooting',
  'finishing',
  'playmaking',
  'defense',
  'rebounding',
  'universal',
]) {
  assertPublicAsset(
    getTakeoverDisciplineIcon(discipline),
    `discipline ${discipline}`
  )
}



for (const category of [
  'finishing',
  'shooting',
  'playmaking',
  'defense',
  'rebounding',
  'physicals',
]) {
  assertPublicAsset(
    getAttributeCategoryIcon(category),
    `attribute category ${category}`
  )
  assertPublicAsset(
    getAttributeCategoryIcon(category, 'grey'),
    `attribute category ${category} grey`
  )
  assertPublicAsset(
    getAttributeCategoryHeader(category),
    `attribute header ${category}`
  )
}

for (const bodyType of [
  'balanced',
  'firm',
  'burly',
  'slender',
  'toned',
  'large',
  'stocky',
  'buff',
  'broad',
  'slim',
  'shredded',
]) {
  assertPublicAsset(
    getBodyTypeImage(bodyType),
    `body type ${bodyType}`
  )
}

for (const fileName of [
  'NBA2k27_logo_white.png',
  'NBA2k27_logo_bw.png',
  'icon_playerbuilder_filled.png',
  'logo_mycareer_builder_goatbuilds.png',
  'logo_mycareer_builder_signatureblueprints.png',
  'logo_mynba2k_horizontal.png',
  'logo_myplayer_builder_nba_horizontal.png',
  'logo_wnba_official.png',
  'nbalogo.png',
]) {
  assertPublicAsset(
    getBrandingAsset(fileName),
    `branding ${fileName}`
  )
}


for (const category of [
  'finishing',
  'shooting',
  'playmaking',
  'defense',
  'rebounding',
  'physicals',
]) {
  assertPublicAsset(
    getBuilderUiAsset('cap-breakers', category),
    `cap breaker UI ${category}`
  )
}

for (const name of [
  'attributeBoxBg',
  'attributeBoxBorder',
  'totalBoxBorder',
  'rowDots',
]) {
  assertPublicAsset(
    getBuilderUiAsset('cap-breakers', name),
    `cap breaker UI ${name}`
  )
}

for (const name of [
  'sliderHandle',
  'ovrHandle',
  'lockedPattern',
  'minus',
  'plus',
  'buttonOutline',
  'buttonFilled',
]) {
  assertPublicAsset(
    getBuilderUiAsset('controls', name),
    `builder control ${name}`
  )
}

for (const name of ['wave', 'scale']) {
  assertPublicAsset(
    getBuilderUiAsset('decoration', name),
    `builder decoration ${name}`
  )
}

console.log('Visual APK asset verification passed.')
console.log(`- ${badges.length}/${badges.length} builder badges have official icons`)
console.log(`- ${takeovers.length}/${takeovers.length} Takeovers resolve color + grey icons`)
console.log('- 6/6 Takeover discipline headers resolve official icons')
console.log('- 12/12 attribute category icons + 6/6 headers resolve official assets')
console.log('- 11/11 body type references resolve official assets')
console.log('- 9/9 branding assets resolve official assets')
console.log('- 10/10 Cap Breaker UI textures + 7 controls + 2 decorations resolve official assets')
