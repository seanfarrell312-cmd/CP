# Clean POWA! | Independent Reviewer Handoff

**Prepared:** 25 October 2026  
**Goal:** give a new reviewer one coherent account of the game and a complete path to verify every proposed or disputed rule. **No unapproved design decisions were made to reconcile contradictory sources.**

## Recommended reading order

1. **`02_Consolidated_Spec/Clean_POWA_Master_Handoff.docx`** (or `.md`). Start here for the creative pitch, exact demo maps, full day/night loop, economy, upgrades, enemies, UI, project goals, and future ideas. All rules are marked **DEFINED**, **PROVISIONAL**, **OPEN**, or **FUTURE**.
2. **`03_Review_and_Decisions/Open_Decisions_and_Reviewer_Questions.docx`** (or `.md`). This is the actionable, prioritized list of design contradictions and missing acceptance criteria, with source locations and proposed tests.
3. **`03_Review_and_Decisions/Design_History_Rationale_and_Roadmap.docx`** (or `.md`). Explains why systems were proposed and how scope evolved over the project's discussions.
4. **`04_Data_Tables/`** for CSV copies of all nine balance workbook tabs, including 90 daily wave entries and a >90 row. These are extra reference copies: the supplied `.xlsx` remains the untouched master source.
5. **`05_Original_Source_Files/`** for all ten uploaded originals; **`06_Visual_References/`** for a convenient copy of the initial play screen image.

## Scope snapshot

- **The game:** Scrubby the cleaning robot restores muddy solar panels by day, operates a turret against Mud Boys by night, earns POWA for clean panels, and spends POWA on unlocks and the next day's operation.
- **Demo:** 2 maps: 10×10 panels / 1,600 tiles, and 25×25 panels / 10,000 tiles; 4×4 tiles per panel; targeted total experience 30–90 minutes (not validated).
- **Rules:** every raw tile ranges from -10 to +4; panels resolve by truncating average tile cleanliness toward zero; clean all panels to +4 to advance; daily recharging Scrub/Shoot tokens; 70s day, 45s night; 5 POWA minimum paid start after free first day.
- **Conspicuous open choices:** demo upgrade list, POWA transactions/fractions, recharge, Mud Boy speed/health/wave timing, Wax tier semantics, retry/checkpoints, and instant victory payout.

## Source priority and trust notes

The original documents are not internally consistent. The workbook is the only comprehensive numerical table collection, **not** automatically a policy override for narrative or control details. The PENDING issues file was written at a different point in the cleanup and contains an outdated description of the Wax demo conflict. The present handoff calls out current evidence and keeps the choice open. Earlier chat design rationale, when mentioned, is labelled historical and should not override uploaded specifications.

## Suggested instructions for a reviewer

> Please review the attached Clean POWA! package as a game-design and implementation handoff. Start with the consolidated spec and the open-decision register. Identify missing invariants, bad edge cases, balance risks and contradictions, checking any contentious claim against the source files and workbook. Do not assume an OPEN or FUTURE feature has been approved. For each actionable finding, give the specific decision needed, affected source(s), possible resolutions, and a small deterministic test. Prioritize the core two-map demo and do not rewrite the entire project unless the proposed design requires it.

## Directory map

- `01_Read_First/START_HERE.md` - this guide
- `02_Consolidated_Spec/` - main handoff (`.docx`, `.md`)
- `03_Review_and_Decisions/` - decision register and design-history review (`.docx`, `.md`)
- `04_Data_Tables/` - exact value CSV exports for all spreadsheet tabs + README
- `05_Original_Source_Files/` - untouched original attachments
- `06_Visual_References/` - visual convenience copy
- `FILE_MANIFEST_SHA256.csv` - sha256 hashes to verify completeness and integrity

**Known limits:** the ZIP contains no playable game, no finished sprite atlas, no custom source code, and no original missing `Timer V2` document; the spec acknowledges those gaps.
