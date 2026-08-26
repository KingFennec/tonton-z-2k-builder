# NBA 2K27 — Animation Library APK / CloudContent V11

## Source

NBA 2K HQ package:

```text
com.VisualConcepts.MyNBASherpa
```

CloudContent cache recovered from the installed app:

```text
/sdcard/Android/data/com.VisualConcepts.MyNBASherpa/files/CloudContent/animation_glossary.json
```

Version file:

```text
a038d16f-3332-401c-8708-5a63d4180f79_1.1.3
```

The normalized dataset contains **2914 unique animations** in **3 tabs / 56 groups**.

## Exact native height logic

Recovered from:

```text
CareerMode_Player_Build_Animation_Library.DoesHeightMeetRequirement
RVA 0x2AFD5A4
```

Native boundaries:

```text
195
208
```

Builder integer-inch mapping:

```text
SMALLS_ONLY         <= 6'4"  (<= 76 in)
SWINGS_ONLY         6'5"..6'9" (77..81 in)
BIGS_ONLY           >= 6'10" (>= 82 in)
SWINGS_AND_SMALLS   <= 6'9"  (<= 81 in)
BIGS_AND_SWINGS     >= 6'5"  (>= 77 in)
ANY                  all heights
```

Engine:

```text
src/engine/animationEngine.js
```

## Attribute requirements

The glossary uses only `AND` and `OR`, with 0 to 3 requirements per animation.

Mapped source attribute types:

```text
Agility        -> agility
BallControl    -> ballHandle
DrivingDunk    -> drivingDunk
DrivingLayup   -> drivingLayup
PassAccuracy   -> passAccuracy
PostControl    -> postControl
ShotMidrange   -> midRangeShot
ShotThree      -> threePointShot
Speed          -> speed
SpeedWithBall  -> speedWithBall
StandingDunk   -> standingDunk
Vertical       -> vertical
```

An empty requirement list is considered satisfied, including the native `SIG_GO_TO_SHOT_NONE` entry (`OR` + zero requirements).

## Extracted distribution

```text
Allowed Sizes
ANY                 413
BIGS_AND_SWINGS     283
BIGS_ONLY           349
SMALLS_ONLY         608
SWINGS_AND_SMALLS   611
SWINGS_ONLY         650

Requirements per animation
0                   417
1                   855
2                  1611
3                    31

Operators
AND                1776
OR                 1138

Season Specific      30
Prized                 0
```

All 30 season-specific entries use `Season Start = 1` and `Season End = 9` in glossary 1.1.3.

## Importing the complete 2914-entry dataset

The repository now accepts either:

- the raw `animation_glossary.json`; or
- the normalized `animations.json` produced during reverse engineering.

Run:

```bash
npm run import:animations
```

The importer automatically checks common locations, including:

```text
Downloads/platform-tools/animations.json
Downloads/platform-tools/animation_glossary.json
```

Or pass the path explicitly:

```bash
npm run import:animations -- "C:\path\to\animation_glossary.json"
```

Output:

```text
src/data/nba2k27/apk/animations.json
```

Then verify:

```bash
npm run verify:animations
```

The verifier checks the 2914 unique IDs, all size/operator distributions, 12 attribute types, requirement counts and season/prized flags.
