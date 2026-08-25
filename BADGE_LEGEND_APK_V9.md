# NBA 2K27 Badge Legend / perk boost — APK V9

Source: `BADGES_GetMaxLevel` in `libcsharplib_mobile_CLEAN_OPT.so` plus the badge tables in `careermode_progression_tuning`.

Verified native behavior:

- direct Builder attribute thresholds populate Bronze, Silver, Gold and Hall of Fame;
- the serialized direct requirement slot for native level 5 is empty for all 53 play badges;
- `BADGES_GetMaxLevel` receives `numLevelsBoostedFromPerks` explicitly;
- after computing a natural badge level, GameLib adds those perk levels one by one;
- the result cannot exceed the per-height/per-badge native maximum;
- native level 5 is `LEGEND`.

Builder integration policy:

- natural badge eligibility remains driven by the 212 APK-verified Bronze→HOF thresholds;
- Legend is available through the generic native perk boost projection (`Max+1`, `Max+2`);
- the Builder does **not** automatically assign perk levels from a Build Specialization because NBA 2K HQ does not expose a verified specialization→perk mapping.

This keeps the native Legend math without inventing the missing source of `numLevelsBoostedFromPerks`.
