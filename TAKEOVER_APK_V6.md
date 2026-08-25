# NBA 2K27 Takeover APK integration — V6

This version replaces the Builder's provisional Takeover eligibility thresholds with the exact MyPLAYER tuning extracted from the installed NBA 2K HQ APK data.

## APK-verified data

- `TAKEOVER_SPECIAL_ABILITY` native slots: 30 total
  - `0` = `NONE`
  - `1..24` = the 24 real MyPLAYER Takeover abilities used by this Builder
  - `25..29` = placeholder slots
- MyPLAYER minimum attribute requirements for all 24 real abilities
- Native requirement operators (`OR`, `AND`, `END`)
- Native Takeover rank for all 24 abilities (`D`, `C`, `B`, `A`, `S`, or `NONE`)
- A separate NBA-player requirement table is retained for research and is not used by the MyPLAYER Builder.

Raw extraction: `src/data/nba2k27/apk/takeover_tuning.json`

## Important scope note

`PLAYERDATA_TAKEOVER_TUNING` exposes rank, MyPLAYER requirements, NBA requirements, and an `AttributeModifier` rank table. No separate height or position eligibility table is present in this tuning object. The Builder therefore continues to evaluate Takeover eligibility from the exact MyPLAYER attribute-requirement tree.

Display descriptions and discipline grouping are retained from the existing project dataset; they are not relabeled as APK-extracted localization data.

## Verification

Run:

```bash
npm run verify:takeovers
npm run verify:apk
```

Expected Takeover result:

- 24/24 native IDs mapped
- 24/24 MyPLAYER eligibility trees match
- 24/24 native ranks match
- 5/5 placeholder slots empty
