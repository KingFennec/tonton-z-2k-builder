# NBA 2K27 Takeover progression APK integration — V7

V7 extends the exact Takeover eligibility/rank data from V6 with the native Career Takeover progression tuning extracted from NBA 2K HQ.

## Fully APK-verified progression data

Raw dataset: `src/data/nba2k27/apk/takeover_progression.json`

The serialized progression structure begins at byte offset `0x13BDBF` of the decoded `careermode_progression_tuning` data and matches the GameLib runtime layout:

- 21 cumulative XP thresholds for levels 1–21
- 3 progression speeds (`SLOW`, `MEDIUM`, `FAST`)
- 6 Takeover states (`FROZEN`, `COLD`, `NEUTRAL`, `WARM`, `HOT`, `TAKEOVER`)
- 21 level rewards
- 206 `LOCATION_CONTEXT` entries selecting the progression speed

### XP thresholds

`30, 60, 90, 120, 150, 250, 300, 350, 400, 450, 500, 575, 650, 725, 800, 900, 1000, 1100, 1200, 1300, 1400`

Level 0 applies below 30 XP. Each listed threshold starts the corresponding level; level 21 begins at 1400 XP.

### XP per highest state reached, per discipline

| Speed | Frozen | Cold | Neutral | Warm | Hot | Takeover |
|---|---:|---:|---:|---:|---:|---:|
| Slow | 0 | 0 | 0 | 1 | 2 | 3 |
| Medium | 0 | 0 | 0 | 2 | 3 | 5 |
| Fast | 0 | 0 | 0 | 3 | 6 | 9 |

GameLib sums one value for each of the five Takeover disciplines based on the highest state reached during the game.

### Progression-speed contexts

- 191 contexts = `SLOW`
- 10 contexts = `MEDIUM`
- 5 contexts = `FAST`

FAST contexts are NBA Game, Rec, Crew HQ 5v5 Ranked, Proving Grounds 5v5, and Casual Corner PvP 5v5. All 206 native context IDs/names are retained in the raw dataset.

### Level rewards

Levels 1–5 unlock Rebounding, Finishing, Playmaking, Defense, then Shooting. Level 6 grants Hydration Hero. Levels 7–21 distribute Longevity, Overdrive, and Accelerator perks across the five disciplines exactly as stored in the tuning.

## Rank `AttributeModifier`: exact value, effect not proven in NBA 2K HQ

The rank-indexed values are exact APK data:

| Rank | Value |
|---|---:|
| NONE | -6 |
| D | -3 |
| C | 0 |
| B | +3 |
| A | +6 |
| S | +6 |

However, NBA 2K HQ contains no verified gameplay callsite applying this field to a player rating/attribute. The HQ app exposes the tuning data but not the complete on-court gameplay system from the main NBA 2K title.

For that reason V7 stores `native_rank_modifier` on every Takeover, but **does not modify Builder attributes or GNR with it**. This avoids turning an exact value into an unverified gameplay rule.

## Engine helpers

`src/engine/takeoverProgressionEngine.js` provides pure helpers for:

- XP → Takeover progression level
- XP required for a level
- reward lookup by level
- location context → progression speed
- XP earned from five highest Takeover states
- native rank modifier lookup (metadata only)

## Verification

Run:

```bash
npm run verify:progression
npm run verify:apk
```
