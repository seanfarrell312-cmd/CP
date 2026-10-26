# CLEAN POWA! | Consolidated Game Design & Mechanics Handoff

**Review edition:** 25 October 2026  
**Project stage:** design/preproduction; intended as a specification for a low-cost browser-hosted, AI-assisted implementation, not a declaration that a playable build exists.  
**Scope:** the two-map demo, with full-release aspirations explicitly separated.  
**Primary source of truth:** the original uploaded project specifications and associated balance workbook included under `05_Original_Source_Files/`. In case of disagreement, do NOT treat this synthesis as an authorized resolution. Consult `03_Review_and_Decisions/Open_Decisions_and_Reviewer_Questions.md`.

## How to read this document

- **DEFINED** = documented in a source and not known to be contested at the stated level of specificity. It does not mean implemented, balanced, or playtested.
- **PROVISIONAL** = design intent is apparent, but a disputed detail or acceptance criterion needs sign-off.
- **OPEN [Dxx]** = a conflicting requirement, omitted rule, or unresolved choice. Track it in the separate decision register; no choice has been silently made.
- **FUTURE** = explicitly mentioned as a possibility or full-release intention, not a demo requirement.
- **REVIEWER INFERENCE** = a recommendation or implication derived from the text, not a confirmed designer decision.

Source shorthand: **GDD** = `Clean_POWA_Demo_Game_Design_Specification_CLEAN.txt`; **RULES** = `Clean_POWA_Rules_and_Formula_Specification_CLEAN.txt`; **ENEMY** = `Clean_POWA_Enemy_and_Turret_Specification_CLEAN.docx`; **MAPS** = `Clean_POWA_Maps_and_Coordinates_Specification_CLEAN.docx`; **UI** = `Clean_POWA_UI_Assets_and_Technical_Build_Specifications_CLEAN.docx`; **BALANCE** = `Clean_POWA_Balance_and_Configuration_Workbook_CLEAN.xlsx`; **PENDING** = `Clean_POWA_Remaining_Spec_Decisions.txt`. Source section names and worksheet names appear throughout.

## 1. Game identity and creative intent

**DEFINED:** *Clean POWA!* (title-screen credit: *a game by seanologues*) is a cute-but-slightly-spooky game combining cleaning, defense, and incremental progression. The player is **Scrubby**, a small automated cleaning robot working for the POWA corporation at an elevated solar-panel power plant. Scrubby removes mud to uncover/restore solar panels and generate **POWA**, the game's energy currency. At night, mischievous-looking mud creatures, **Mud Boys**, attack the array, muddying it again. The player moves and scrubs by day, operates a turret by night, earns POWA from the cleaned panels, and buys upgrades to withstand escalating threats. Time efficiency and movement rhythm are central to the loop. [GDD: Game Start Story Synopsis, Game Sequence; RULES: POWA terminology]

**Creative tone:** soft, cartoony, readable, colorful; a little eerie during the night defense phase rather than relentless horror. Clean tiles progressively shift from nearly black mud browns toward blue. Source art concepts include a short/stubby robot with scrubbing poses; a turret with a squashing/recoiling firing frame; and bouncing, drooling, mud-ball goblins with glowing yellow eyes, wide black mouths, no arms or legs. These art ideas came from project concept work; the source picture is illustrative, not a final sprite atlas. See `06_Visual_References/` and the design-history document.

**Narrative framing:** Lightning activates the dormant POWA plant and powers Scrubby for the initial day (equivalent in story to 5 POWA). The first playable demo bypasses the intro comic, while a later full version is planned to show that lightning-strike comic before gameplay. **OPEN [D18]:** gameplay account begins at zero versus story grant of 5, so implementation must preserve the intended one-time free first-day startup without accidentally giving the player spendable 5 POWA unless confirmed. [GDD: Story, Title flow; RULES: Game Starting POWA]

## 2. Scope, maps, and long-term design

**DEFINED DEMO:** exactly two maps, core day/night combat, scoring, and progression. *Map 1* has 10 × 10 panels (100 panels) and 40 × 40 tiles (1,600 tiles). *Map 2* has 25 × 25 panels (625 panels) and 100 × 100 tiles (10,000 tiles). Every panel always consists of a 4 × 4 tile grid (16 tiles). Each demo tile starts at cleanliness 0, and each tile may range from -10 to +4. Maps display at consistent panel/player scale so Map 2 feels physically larger rather than merely miniaturizing its cells. Each map's grid is centered within the gameplay area. [GDD: Map 2, map definitions; MAPS: pp. 1–2; BALANCE: Map definitions]

**DEFINED COMPLETION:** fully clean means **every panel's evaluated cleanliness is +4**, equivalently aggregate cleanliness 400 on Map 1 or 2,500 on Map 2. Only positive cleanliness contributes to income; complete Map 1 can produce at most **200 POWAIN** per cycle, Map 2 at most **1,250 POWAIN**, per the conversion table. The demo ends after Map 2. Upgrade unlocks and day-count progression generally persist between maps; Map 2 begins dirty and lowers immediate earning potential. [MAPS: completion requirements; RULES: Map cleanliness Total; GDD: Screen Sequence]

**FUTURE:** a full release may expand to four maps (not committed). Tentative Map 3 is plus-shaped; Map 4 more rounded. An older progression sentence generically references Map 5, but multiple later statements set four as the aspiration. Demo playtime target is **roughly 30–90 minutes** across both maps, dependent on upgrades and playstyle; individual-map duration and full-release duration are undefined. A later full release could add more heavily soiled pockets on Map 2, a new-day redeployment purchase, extra sprite animations, introductory/ending comics, audio/volume options, save/load, optional early end of day, and possibly a fourth spawn edge with revised turret presentation. Future enemy archetypes (faster/weaker and slower/non-knockback) are exploratory, not in the demo or initial full-version roster. [GDD: demo/full scope, future notes; ENEMY: turret and enemy future notes]

**OPEN [D01]:** demo upgrade roster conflicts across sources, especially Wax. The latest GDD text says the demo contains *all* upgrades including Wax, while the BALANCE `Upgrade definitions` sheet currently marks every upgrade `FULL`; the older PENDING checklist describes yet another version. Do not treat any subset as established until this is reconciled.

## 3. Map addressing and data model

**DEFINED:** the panel index uses `P(panelColumn,panelRow)` and the tile index uses **global** `T(tileColumn,tileRow)`, both zero-based and numbered left to right, top to bottom. The label for Map 1's lower-right tile is `P(9,9)T(39,39)`; for Map 2 it is `P(24,24)T(99,99)`. Tile and panel coordinates always have two axes. `T(99)` alone is not the last 2-D coordinate. For a tile `(tx,ty)`, the containing panel is `P(floor(tx/4), floor(ty/4))`. Within a panel, local tile offsets are `(tx % 4, ty % 4)`. [MAPS: grid examples; `Clean_POWA_Coordinate_Grid_Generation_CLEAN.txt`; `Coordinate Grid Generation.txt`]

**Runtime entities (proposed representation, not a prescribed code structure):** Map has dimensions, cells, and an initial snapshot; each Panel has an address, derived cleanliness, and waxed status; each Tile stores raw cleanliness (fractional allowed) and display state; player stores panel location, brush attributes, resources and purchased/equipped upgrades; Mud Boy stores its panel location, spawn edge, movement vector, HP, forward-action timer, and status; phase state includes time remaining, active/queued waves, day index, score, and checkpoint if provided.

**DEFINED:** panel cleanliness is **truncation toward zero** of the mean of its 16 raw tile cleanliness values. For example, `12 × 0.5 + 4 × 1 = 10`; `10 / 16 = 0.625` becomes panel cleanliness `0`. `1.7→1`, `0.5→0`, `-0.5→0`, and `-1.7→-1`. Raw tile values can be fractional, even though the visible color maps to an integer level. Only tile color is drawn; panel cleanliness is used as a derived measure for scoring and victory. All raw tile cleanliness is clamped to [-10, +4]. [RULES: Panel and tile cleanliness, color rules; MAPS: pp. 1–2]

**DEFINED:** negative tile changes do not propagate automatically. Tiles not affected by a specific player/enemy action keep their last value; weather/automatic passive decay is not specified. **OPEN [D19]:** exact ordering of truncation for tile colors versus raw-value clamping should be captured as an acceptance test, especially around -0.5, and victory should be evaluated using panel values, not inferred visually.

**DEFINED:** Out-of-bounds Mud Boy knockback checks proposed destination coordinates against the valid map panel bounds *before* moving. No invisible border panels or dummy tiles are necessary. An out-of-bounds result defeats the Mud Boy without applying further cleanliness effects. A visual `SPLAT!` can appear just outside the array. [ENEMY: Out-of-bounds rule] This is an intentionally resolved prior consideration, not an open design question.

## 4. Cleanliness, brush application, and color

**DEFINED:** performing an ordinary move to an adjacent panel consumes one Scrub counter and applies the player's equipped Brush POWA to **that destination panel**, not the origin. With default Brush Size, the central 2 × 2 tiles gain `Brush POWA × 1.0`; the surrounding 12 tiles gain `Brush POWA × 0.5`. With the single `Supped UP Brush` upgrade, all 16 tiles gain `Brush POWA × 1.0`. Effects accumulate across repeated visits, clamped at +4. The initial occupied panel is not cleaned automatically just for starting there. [RULES: Brush application; BALANCE: Brush AoE, Upgrade Levels; GDD: Movement]

**Example:** default Brush POWA 1 on a fresh panel adds +1 to four middle tiles and +0.5 to twelve outer tiles, producing panel average `10/16 = 0.625`, hence panel rating **0** until it is scrubbed further. The partial tile blues still show visible improvement. This distinction drives the intended movement/rhythm tension.

**DEFINED:** a +4 panel is not scrubbed again on ordinary entry. With **Retractable Bristles**, entering a panel *already rated +4* is free and allowed even at zero Scrub counters; the panel is checked before attempting to charge the token. Waxed panels also cost zero Scrub counters to enter, irrespective of whether Retractable Bristles is equipped. In either case, no new cleanliness is applied. [GDD: Player control, pre-move check; RULES: Waxed panel]

**DEFINED Wax behavior, subject to scope [D01]:** Wax is purchased as consumable tokens during the upgrade phase (no recharge timer). The player presses Space while occupying an unwaxed panel rated +4. Successful use consumes 1 token; all its tiles become pink, +4 is retained, and no later player entry, Mud Boy passage, or Mud Boy pop can change that panel's cleanliness. Failed Wax attempts have no effect or cost. Unspent Wax tokens persist across days/maps. Wax is not an on/off maintained upgrade. [RULES: WAX; GDD: player Space controls; BALANCE: WAX Upgrade Levels]

**Color mapping:** Tile display uses the current evaluated cleanliness grade on the fifteen-level palette -10 to +4, with a separate pink wax overlay/appearance at +4. Representative values: -10 `#22140C` (very dark brown), -5 `#6F4D2A`, 0 `#529182`, +2 `#56AAB5`, +4 `#5BC2E7` (Zima Blue). The full 15-step palette is reproduced in `04_Data_Tables/colors.csv` and BALANCE `colors`. [RULES: cleanliness color chart]

## 5. Player controls and day phase

**DEFINED:** During the day, use **W/A/S/D** for one orthogonal panel at a time: W up, A left, S down, D right. These are **press-once inputs**, not auto-repeat while held. Invalid edge moves do nothing and spend no tokens; moves requiring Scrub counters fail if none are available unless the +4/free-movement exception applies. Space attempts Wax. At night, WASD/Space are not used for Scrubby movement; the player uses a mouse to click targets. [GDD: Movement, Day controls; RULES: GAME SEQUENCE]

**DEFINED:** Day 1 begins with Scrubby placed on `P(0,0)` at default stats. Pressing W or A at the corner does not start the timer, while the first valid movement (S or D) does. A valid Wax application can also start a waiting day timer, though Wax cannot usually be owned on Day 1. The standard Daylight duration is **70 seconds**; it was increased to allow extra moves while keeping rhythm/efficiency meaningful. Subsequent days have a 3-second `READY` / `SET` / `SCRUB!` countdown, with one phrase per second. At the end of that countdown, daylight and input become active together. The player cannot voluntarily end a demo day early. [GDD: timers and sequence; UI: first-day intent; BALANCE: Timers]

**DEFINED:** The Scrub counter bank is full at start of its relevant phase; default maximum 1. Default Scrub recharge is **3.0 s** per token and an upgraded bank cannot exceed its equipped maximum. Each timer completion is described as adding **one** Scrub token. The Shoot counter bank follows the corresponding rule at night, with a 3.0 s default timer and maximum 1. Unused phase tokens do not carry into later phases. **OPEN [D04/D05]:** exact timer trigger (at zero vs any deficit) and whether capacity upgrades also change grant size. Do not implement one by assumption. [GDD: Timer and counter relations; BALANCE: Timers and definitions]

**DEFINED:** Once Daylight reaches zero, Scrubby disappears, its last occupied panel is stored, and the turret appears above the map. On a purchased subsequent day, the player redeploys to the last saved panel (unless entering a new map, which starts at the top-left). [GDD: Night, deployment; UI: sequence]

## 6. Night phase, turret, and Mud Boys

**DEFINED:** On transition to night, the UI becomes darker; Scrubby is hidden; a turret appears in the margin between the HUD and the map's top edge; an `Incoming Mud Boys!` / `HERE THEY COME!` warning is displayed. Base **Night** duration is **45 seconds**. Night ends on timeout, or when enemies are cleared under an unsettled queued-wave condition **[D11]**. [GDD, RULES, UI: Night flow; BALANCE: Timers]

**DEFINED:** Each enemy spawn edge/destination depends on the global day counter and BALANCE `Mud boy Waves` table. For the documented demo, the day schedule cycles **bottom→top, left→right, right→left**. The turret is placed above the array, so the demo design specifically excludes top-side spawns; an early opening sentence describes all four edges, creating **[D16]**. Each wave may have 3 to 6 Mud Boys in the schedule; multiple waves and stronger enemies arrive later. This is a *table-driven* 90-day progression with subsequent behavior in dispute [D07, D08, D21]. [ENEMY: Wave chart and demo spawn edges; BALANCE: Mud boy Waves]

**DEFINED:** a Mud Boy has a spawn panel, HP, and travel direction. Entering a panel during **forward** movement applies -1 cleanliness to the affected panel's 16 tiles, subject to Wax protection. **OPEN [D25]:** sources disagree whether an enemy dirties its spawn panel immediately, or only if it remains long enough to move forward. Enemy pop at HP zero applies -2 to the current panel's tiles and -1 to tiles in the four cardinally adjacent panels (valid neighbors only; Wax blocks change). Reaching the far edge triggers an ordinary pop. Backward movement from shots does not dirty panels. **OPEN [D06]:** enemy forward travel per 3-second action is described as both **one panel** (GDD/UI) and **two panels** (ENEMY); if it is two, intermediate tile effects must be specified [D20]. **OPEN [D07]:** the opening prose says 3 HP each while the schedule lists 3/6/9 HP. [GDD: Mud Boys; ENEMY: basic enemy, movement and chart]

**DEFINED:** clicking a Mud Boy with a Shoot token applies damage immediately (default -1 HP), then pushes it **one panel back toward its spawning edge** if it survives. Reducing HP to zero pops it instead. If the backward destination would be out of map bounds, it is eliminated with no pop, no tile effect, and optionally `SPLAT!` in the outer margin. Turret recoil and flash are visual only: shots resolve without waiting for animation; firing animation can queue. All map panels are in range. Clicking at zero ammo does nothing. [ENEMY: Movement and Turret decisions]

**DEFINED:** when a knockback destination is occupied by another Mud Boy, the occupant also gets pushed backward by one, without losing health unless it falls out of bounds. Turret faces right when entering night, turns toward the selected target's half of the map, and retains its prior direction for center-column shots on odd-width Map 2. **OPEN [D10]:** ordinary *forward* collision, enemy overlapping and chained rear pushes require a deterministic rule. **OPEN [D09]:** same-wave row/column uniqueness language conflicts with edge spawn geometry and should be restated as uniqueness of spawn *panel* or other desired condition. [ENEMY: turret, overlap and same-wave spawning]

**PROVISIONAL timings:** Mud Boys act every 3 seconds. Subsequent waves are separated by 6 seconds. GDD specifies the first wave **2 seconds after** the warning ends, but RULES and portions of GDD/UI state it arrives as the timer starts; **[D12]** needs resolution. **OPEN [D11]:** killing the only active wave while more are queued should not silently skip them unless the designer explicitly wants this. [GDD: wave timing; RULES: night intro]

**Wave table notes:** actual per-day values for **days 1–90 and >90** are in `04_Data_Tables/Mud_boy_Waves.csv`. Avoid trying to reconstruct them only from prose. Some prose calls every wave a group of three, but this conflicts with the table's 3/4/5/6 per wave. In days 91+, the Enemy prose says to reuse day 90, yet the explicit `>90` spreadsheet row is bottom→top, differing from day 90 right→left; **[D21]** needs clarification.

## 7. POWA economy, scoring, and purchase rules

**DEFINED:** a panel contributes POWAIN once per scoring event, depending on its integer cleanliness rating: `max(0, panelCleanliness) × 0.5`. Thus +1 = 0.5 POWA, +2 = 1, +3 = 1.5, +4 = 2, and any rating <=0 = 0. Sum contributions from all panels to get **POWAIN**; do not award merely for each movement. POWA is represented on the HUD as energy/currency. **Important:** half-unit payouts are present in the official table, but one paragraph defines Banked POWA as an integer **[D03]**. [RULES: POWAIN, example; BALANCE: POWA conversion]

**DEFINED:** Every non-free day requires at least **5 POWA** to activate Scrubby; equipped upgrades contribute additional *maintenance* to **POWAOUT** for that new day. Upgrade levels cost a one-time unlock fee separately from day-start maintenance, and unlocked upgrades persist across days and maps, even if disabled or dialed down. Players choose the enabled level before each subsequent day. The screen reflects what is affordable, with a red/green cost indicator. Purchases must not drive available POWA below the day-start minimum 5, displaying `MUST RETAIN +5 POWA` on an invalid purchase. Maintenance is assessed on enabled/equipped upgrades, not all unlocked levels. [GDD: Upgrade levels, purchase rules; RULES: Upgrade/Next level]

**OPEN [D02]:** the precise accounting order and whether `BANKED POWA = prior bank + POWAIN - charged purchases - selected POWAOUT` versus something else, and when each posting is made. Scoring screens separately show POWAIN/POWAOUT/BANKED but it is unclear whether POWAOUT refers to the previous or *next* day. **REVIEWER INFERENCE:** formalize transactions and checkpoint state as a ledger; no new formula is imposed here. [GDD: Game flow; RULES: POWAIN/POWAOUT and scoring]

## 8. Upgrades, purchase costs, and maintenance

**DEFINED system-level intent:** Levels are unlocked sequentially, kept permanently for the game session, and can be enabled/disabled or set to an already unlocked lower tier to trade capabilities for daily startup cost. Each level's listed **purchase cost is a one-time cost for that level**, not the sum of all lower tiers; the maintenance amount at the *equipped tier* similarly replaces, rather than adds to, lower-tier maintenance. Wax is consumable and is not charged recurring maintenance. The BALANCE workbook is the numerical configuration reference for upgrade values, but upgrade presence in demo is **[D01]**. [GDD: Upgrade progression; BALANCE: Upgrade Levels]

| Upgrade (BALANCE) | Default | Unlocked levels: effect / one-time cost / daily maintenance (POWA) |
|---|---|---|
| Extra Scrubbers | max 1 | L1 max 2 / 10 / 3; L2 max 3 / 15 / 6; L3 max 4 / 20 / 9 |
| Clip Size | max 1 | L1 max 2 / 10 / 3; L2 max 3 / 15 / 6; L3 max 4 / 20 / 9 |
| WAX | 0 tokens | L1 1 charge / 5 / 0; L2 2 charges / 8 / 0; L3 3 charges / 10 / 0 **[D22]** |
| Retractable Bristles | disabled | L1 enabled / 15 / 10 |
| Time Manipulation | 70 s day | L1 80 s / 15 / 5; L2 90 s / 30 / 10; L3 100 s / 45 / 15 |
| Reload Speed | 3.0 s shot timer | L1 2.5 s / 5 / 2; L2 2.0 s / 10 / 4; L3 1.5 s / 15 / 6; L4 1.0 s / 20 / 8 |
| Scrubbing Speed | 3.0 s scrub timer | L1 2.5 s / 5 / 2; L2 2.0 s / 10 / 4; L3 1.5 s / 15 / 6; L4 1.0 s / 20 / 8 |
| Brush POWA Level | strength 1 | L1 strength 2 / 10 / 3; L2 strength 3 / 15 / 5; L3 strength 4 / 20 / 10 |
| Brush Size | default center-heavy AoE | `Supped UP` all-tiles-equal / 15 / 5 |

**OPEN [D22]:** Wax workbook levels look like a counter count awarded at each purchase, while RULES describes purchasable consumable Wax charges. Clarify whether buying L2 creates two *additional* charges, sets bank to two, or establishes purchase quantity. Likewise, distinguish permanent unlock from per-day purchase. The full source rows are transcribed without reinterpretation in `04_Data_Tables/Upgrade_Levels.csv`.

## 9. Game flow and screen sequence

**DEFINED intended path:** `Title → Day 1 → Night 1 → Score → Upgrade / Next Day → READY / SET / SCRUB! → Day N → Night N → Score → Upgrade...`, interrupted by Map Victory or an unaffordable day.

1. **Title:** display `Clean POWA!`, credit `a game by seanologues`, `START`, `OPTIONS` (disabled in demo).
2. **First day:** START directly enters Map 1; Scrubby begins at top-left with full default banks; first valid move begins time. No initial upgrade purchase is required or available in this startup path.
3. **Day HUD:** scrub and shoot banks/timers, displayed current expected POWAIN, day number, phase timer, pause; map below. UI uses light blue for scrub, red for reload, orange for Daylight and purple for Night.
4. **Night:** robot disappears, turret is shown, warning displays, enemies travel across the array, mouse clicks fire.
5. **Score:** panel contributions are evaluated; show POWAIN, POWAOUT and BANKED POWA with CONTINUE. A short `GOOD JOB!` message is described in RULES.
6. **Upgrade:** show POWA, unlocked and purchasable tiers, sliders/toggles, recurring maintenance, `GET SCRUBBIN!` with cost, `TRY AGAIN`. Purchases consume POWA. Successful day startup posts the cost and returns to gameplay; new day countdown precedes action.
7. **Map victory:** when every panel reaches +4, pause clocks and show congratulatory overlay, then `NEXT MAP`. Start next map on its upgrade screen with accumulated power and purchases preserved, but map cleanliness reset. Demo Map 2 ends at final `Thank you for playing!`/`you have completed the game!` with Play Again / return to title.
8. **Pause:** overlay `PAUSED` with RESUME, OPTIONS (disabled demo), EXIT. All timers, pending movement, spawn queues, and shot animations freeze and resume accurately. EXIT resets to title with a fresh Day 1 session.

**OPEN [D13]:** TRY AGAIN is described as a full Day 1 restart, current-map-start checkpoint restore, or previous-day rollback. The RULES later gives the more detailed map-start checkpoint proposal (Map 2 retains prior map unlocks and day count at Map 2 entry), but this is **not** declared canonical. **OPEN [D14]:** day counter increments on Score/CONTINUE in one section, and on successful purchase of the next day in another. **OPEN [D15]:** victory checks are real-time in GDD versus after-day fallback in MAPS. **OPEN [D23]:** what scoring/transition occurs on an *instantaneous* mid-day map victory, before the normal Night/Score? [GDD: screen flow; RULES: GAME FLOW and FAILURE; MAPS: victory]

## 10. Presentation, artwork, and user experience

**DEFINED:** Map is centered under a fixed HUD/top bar, with green/outdoor margins and a border around the solar-panel surface in the concept image. A robot marker moves panel-to-panel with scrubbing animation. The tile microgrid visibly changes colors, revealing clean patches. The first concept art is supplied as `06_Visual_References/Initial_play_screen_concept.png`; it is **conceptual**, not pixel-accurate geometry or approved final UI. User-facing labels include `Scrubber`, `Reload`, `Daylight`, `Night`, `POWA`, `DAY`, `GET SCRUBBIN!`, and pop-up messages. [UI: initial play screen concept, timer table; GDD: UI sequence]

**DEFINED:** Turret rotates/faces left or right based on selected target, recoil and flash do not block hit registration, Mud Boys are click targets across the entire map, and `SPLAT!` appears on knock-off. Future cosmetic upgrades include a comical edge-fall animation and a `WOO!`/`YAY!` toast when a panel reaches +4 (not in demo). There is an intended musical/rhythmic quality, but no final tempo, track, asset license, or synchronization rule is supplied. [ENEMY: turret decisions; GDD: panel polish; UI: Day cycle]

**FUTURE art wishes from earlier project discussions:** Scrubby animation states (neutral plus directional/scrubbing variants), stylized turret neutral/firing states, Mud Boy neutral/open-mouth states, optional GIF/sprite sheets. Original finished art assets are not all present in the supplied source file set; this handoff includes only the image that was actually uploaded.

## 11. Engineering intentions, interfaces, and constraints

**DEFINED project goal:** deliver a desktop-browser-accessible computer game through a web link, with minimal ongoing Azure hosting cost and source kept under Git for affordable, reversible iterative changes. Development is intended to be assisted by Codex/Claude-style prompt coding, so a clear, deterministic spec and config-driven tuning are valued. **NOT DECIDED:** language/framework/engine, rendering technology, input on mobile, Azure service/SKU, authentication, analytics, deployment pipeline, persistence mechanism, resolution/zoom/scrolling for the larger Map 2, license model, and hosting budget ceiling. These should not be invented in an implementation handoff. [Project conversation history; GDD: demo vs full]

**Data-driven aspiration:** numbers for brush shapes, per-panel score conversion, timers, upgrade effects/costs, day wave schedules, and colors reside in BALANCE tabs and should be treated as an editable config source. The 90-day wave schedule and upgrade values are also included as UTF-8 CSV files for code ingestion. A mapping design of tile state + panel derived state was discussed to support immediate scoring/victory, not prescribed as a mandatory database schema. [GDD: data tracking; BALANCE workbook]

**State/persistence:** demo runs in-memory; progress is lost when the page closes (the RULES source calls this out). Full release may offer save/load of a chosen day. Purchases, day index, remaining POWA, carried Wax tokens, and map arrival checkpoint should survive **within the demo play session** when progressing between maps. **OPEN [D24]:** exact refresh/restart behavior, browser tab loss, and format of a full-release save are not specified beyond the broad intent. [RULES: FAILURE and persistence]

## 12. Limits and design safety rails

- **Game world:** panel and tile coordinates are always bounded by the active map; nothing occupies dummy off-map grid cells. Map 1 and 2 sizes are specified; no additional map is a demo requirement.
- **Cleanliness:** never below -10 or above +4 on a tile; fractional raw values allowed; panel rating is a derived truncated average; waxed panels immune to all cleanliness events.
- **Costs:** POWA is not allowed negative; startup is at least 5 on purchased days; additional enabled maintenance is charged; upgrades remain unlocked even if switched off.
- **Input:** keyboard movement is cardinal and keypress-triggered; movement cannot pass map edge; shoot is click-to-target, full-map range; no free shooting without counters.
- **Time:** day 70 s, night 45 s, base Scrub and Reload 3 s, wave spacing 6 s where specified, pause stops everything; remaining timing conflicts appear in [D04/D06/D12].
- **Progression:** day number continues across maps; enemy difficulty follows global day number and wave table; gameplay can be stuck by low POWA rather than by an ordinary health/death meter.
- **Demo scope:** no working options menu, no optional early day end, no demo save/load after closing, no extra enemy types.

## 13. Readiness, dependencies, and reviewer guidance

**Important:** This is a consolidated *design handoff*, not executable code. Where two provided sources disagree, this file intentionally documents the shared mechanic and points at an open decision. A developer should not build conflicting details based only on the prettiest sentence or the newest file name.

**Recommended first review pass:** resolve the economy transaction order [D02/D03], recharge logic [D04/D05], enemy movement/health/spawn completion [D06–D12/D21], Wax and demo scope [D01/D22], and retry/checkpoint/victory flow [D13–D15/D23]. Then run a small deterministic, spreadsheet-backed Day 1 simulation to confirm players can earn 5 POWA without perfect play. **REVIEWER INFERENCE:** use the remaining questions register as decisions to get signed off before implementation, rather than changing every source iteratively.

**Navigation:** `03_Review_and_Decisions/Open_Decisions_and_Reviewer_Questions.md` for ranked open questions; `03_Review_and_Decisions/Design_History_Rationale_and_Roadmap.md` for how the ideas changed; `04_Data_Tables/` for every worksheet transcribed as CSV; `05_Original_Source_Files/` for complete untouched project documentation and the uploaded workbook; `06_Visual_References/` for the original concept image.

## 14. Minimal executable acceptance scenarios

These scenarios summarize the first tests a reviewer can use to tell whether a prototype implements the documented pieces of the game rather than only depicting them. Conflicting details must use the finally selected answer from the decision log.

1. **Default brush:** On a fresh panel with 16 tiles at 0, one default Brush POWA 1 move makes four central tiles 1 and twelve surrounding tiles 0.5. The raw average is 0.625, displayed panel grade 0. A second identical pass raises the raw average to 1.25 and displayed panel grade 1, producing 0.5 POWAIN at score.
2. **Fractional score:** Three un-waxed panels evaluated at +1, +3 and +4 produce `0.5 + 1.5 + 2 = 4 POWAIN` before any selected purchase or maintenance posting; negative and zero-rated panels add zero. Check how this credit changes BANKED using [D02/D03].
3. **Bounds:** From `P(0,0)`, W and A do not move, do not consume a Scrub token and do not start Day 1; S moves to `P(0,1)` and cleans its 4 × 4 tiles. Enemy knockback outside map bounds defeats the enemy with no virtual tile updates.
4. **Wax and clean travel:** Scrubby applies Wax on an eligible +4 panel; its tiles become pink and do not change after direct traversal or adjacent Mud Boy pop. Returning to it costs no Scrub token. Entering a non-waxed +4 panel is free only when Retractable Bristles is enabled.
5. **Shot sequence:** A selected Mud Boy loses 1 HP immediately; if it survives, it is pushed backward one panel. If HP reaches zero, it pops instead. If a surviving enemy is pushed beyond its spawn edge, it disappears with `SPLAT!` and no pop effect.
6. **Progression:** Purchasing a higher upgrade tier consumes its one-time cost; equipping it affects the next purchased day; disabling it preserves the unlock but removes its recurring maintenance. Completing Map 1 carries the purchased levels and global day progression into dirty Map 2.
7. **Night scheduling and victory:** Pause freezes enemy clocks and queued waves. Killing all current enemies does not accidentally end the phase contrary to [D11]. Reaching +4 on the final panel triggers the selected victory cadence and credits at most one terminal scoring event [D15/D23].

**End-of-handoff boundary:** Any behavior not present above, in the original inputs, or in an explicitly resolved decision record remains unspecified. A reviewer is invited to propose a change, but that proposal should be distinguished from established design when preparing the implementation prompt.
