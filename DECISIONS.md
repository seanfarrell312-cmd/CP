# Clean POWA! | Owner Decision Log

**This file is the highest authority for game rules.** Where a decision recorded here disagrees with anything in `Clean_POWA_Reviewer_Handoff/` (the master handoff, the original source files, the balance workbook, or the CSV data tables), **this file wins**. The handoff files are kept untouched as historical source material; they are not edited to match these decisions.

Decision IDs (Dxx) match `Clean_POWA_Reviewer_Handoff/03_Review_and_Decisions/Open_Decisions_and_Reviewer_Questions.md`. Each entry records what was decided, which source data it overrides, and a test that proves the implementation follows it.

Any Dxx not listed below is still **OPEN**: do not implement it by assumption.

## Confirmed decisions

### D01: Demo upgrade roster (confirmed 2026-10-25)
**Decision:** The demo includes all nine upgrades: Extra Scrubbers, Clip Size, WAX, Retractable Bristles, Time Manipulation, Reload Speed, Scrubbing Speed, Brush POWA Level, Brush Size.
**Overrides:** BALANCE `Upgrade definitions` column `DEMO/FULL` (and `04_Data_Tables/Upgrade_definitions.csv`), which labels every upgrade `FULL`. Treat all nine as `DEMO`. Also supersedes PENDING item 1.
**Test:** The demo upgrade screen lists exactly these nine upgrades, and the game's config agrees.

### D22: What a Wax tier purchase gives (confirmed 2026-10-25)
**Decision:** Wax tiers are repeatable charge packs, not sequential unlocks. On any upgrade screen the player may buy any pack, any number of times, as long as they can afford it: L1 = +1 charge for 5 POWA, L2 = +2 charges for 8, L3 = +3 charges for 10. Purchased charges add to the player's stock. No unlock order, no maintenance. Charges never recharge and carry over across days and maps (unchanged from RULES).
**Overrides:** The "levels are unlocked sequentially" rule (GDD/master handoff §8) does not apply to Wax. BALANCE `Upgrade Levels` WAX rows are read as pack sizes and pack prices, not levels.
**Test:** Starting with 0 charges and 30 POWA, buy L3 then L1 (cost 15, stock 4). Use 1 Wax during the day (stock 3). On the next upgrade screen buy L2 (stock 5). L3 can be bought again without any unlock step.

### D02: POWA ledger (confirmed 2026-10-25)
**Decision (owner's words, structured):**
1. Banked POWA starts at 0 at the start of the game. Day 1 is free.
2. At the end of each night, POWAIN is calculated from panel cleanliness (BALANCE `POWA conversion`) and added to Banked POWA.
3. On the upgrade/loadout screen the player spends Banked POWA to unlock upgrade tiers (one-time cost, deducted immediately) and chooses which unlocked tiers to equip.
4. The **GET SCRUBBIN!** button is the "go to next day" button. It shows the day cost = 5 POWA + maintenance of the currently selected loadout. Pressing it deducts that cost from Banked POWA and starts the next day.
5. If Banked POWA is less than the day cost, GET SCRUBBIN! is shown **red** and cannot be pressed (the player must unequip upgrades or use TRY AGAIN).
6. An unlock purchase is refused if, after paying, Banked POWA would be less than 5 + maintenance of the currently selected loadout (shows the `MUST RETAIN` message). Equipping a more expensive loadout is always allowed; it may turn GET SCRUBBIN! red.
**Overrides:** GDD/RULES/master handoff §7 wording `BANKED = POWAIN - POWAOUT` and the literal "must retain +5 POWA" purchase floor (now 5 + selected maintenance). Supersedes PENDING item 2.
**Score screen and POWAOUT display:** see D33.
**Test:** Day 1 free, scores 6 POWAIN → bank 6. Unlock Reload Speed L1 (cost 5) is refused (6 − 5 = 1 < 5). Bank 6, nothing equipped → GET SCRUBBIN! shows 5, press → bank 1. Night 2 scores 12 → bank 13. Unlock Reload L1 (5) → bank 8; equip it → day cost 7, press → bank 1. With bank 4 after a bad night, GET SCRUBBIN! is red.

### D03: Fractional POWA (confirmed 2026-10-25)
**Decision:** Banked POWA is always a whole number. Each night, sum the per-panel POWAIN values (which may include halves), then **round the night's total down** to a whole number before adding it to the bank. Per-panel conversion values (0.5, 1, 1.5, 2) are unchanged; rounding happens once per scoring event, on the total.
**Overrides:** Nothing in BALANCE `POWA conversion` changes; this fixes the conflict with RULES "Banked POWA is an integer". Supersedes PENDING item 3.
**Test:** Panels at +1, +3, +4 → 0.5 + 1.5 + 2 = 4.0 → +4. Panels at +1, +1, +1 → 1.5 → +1. A single +1 panel → 0.5 → +0. The Score screen shows the rounded POWAIN.

### D04: When recharge timers run (confirmed 2026-10-25)
**Decision:** The Scrub and Reload timers run whenever their bank is below its max. When a timer completes and the bank is still below max, the next cycle starts immediately. When the bank is full, the timer stops and resets to its full duration. Banks start full at the start of their phase (unchanged); pause freezes timers.
**Overrides:** GDD `SCRUB/SHOOT COUNTER BANK` and RULES Night wording that timers start only at 0. Supersedes PENDING item 4.
**Test:** Max 4, Scrub timer 3 s. Use 2 counters at t=0 (bank 2) → bank 3 at t=3, 4 at t=6, timer stopped. Max 1: use the counter at t=0 → bank 1 at t=3.

### D05: Counters per timer completion (confirmed 2026-10-25; superseded by D35)
**Decision:** Each completed timer adds exactly **+1** counter, never above the bank's max. Extra Scrubbers and Clip Size raise only the max.
**Overrides:** BALANCE `Upgrade definitions` wording "increases the number of counters provided when timer reaches 0". Supersedes PENDING item 5.
**Test:** Clip Size L3 (max 4). Timer completes with 0, 1 and 3 stored → 1, 2 and 4 stored.

### D06: Mud Boy forward movement (confirmed 2026-10-25)
**Decision:** Each forward action moves a Mud Boy **1 panel** toward its destination edge, every 3 seconds.
**Overrides:** ENEMY pp. 1 and 3 "forward 2 spaces/panels". Supersedes PENDING item 6.
**Test:** A Mud Boy spawning at bottom-edge P(4,9) on Map 1 is at P(4,8) after 3 s, P(4,7) after 6 s, P(4,6) after 9 s, and each of those panels gets one -1 event.

### D20: Skipped panel on a 2-panel move (resolved by D06, 2026-10-25)
**Decision:** Not applicable; Mud Boys move 1 panel, so no panel is skipped.

### D07: Mud Boy health (confirmed 2026-10-25)
**Decision:** Mud Boy HP comes from BALANCE `Mud boy Waves` column `Health counters` for the current day (3, 6 or 9).
**Overrides:** ENEMY opening sentence "Each Mud Boy has 3 health counters". Supersedes PENDING item 7.
**Test:** On a day whose table row lists 9 HP, a Mud Boy survives 8 default shots and pops on the 9th.

### D10: Forward move into an occupied panel (confirmed 2026-10-25)
**Decision:** The moving Mud Boy **pushes** the occupant forward 1 panel, then moves into the freed panel. Pushes chain: if the occupant's new panel is also occupied, that Mud Boy is pushed first (resolve from the front of the chain backward). Every panel a Mud Boy enters by a forward move or forward push gets the normal -1 dirt (Wax still protects). A Mud Boy pushed off its destination edge is treated exactly as if it reached that edge by itself (pop). Two Mud Boys never share a panel.
**Derived details (flag if wrong):** being pushed does not reset or use up the pushed Mud Boy's own 3 s action timer; a push does not cost or change HP.
**Overrides:** Fills the gap in ENEMY (only backward collision was specified). Supersedes PENDING item 10.
**Test:** Bottom→top wave on Map 1. A at P(3,5), B at P(3,6). B's action fires: A is pushed to P(3,4) (-1), B moves to P(3,5) (-1). Final state has no shared panel. With A at P(3,0) and B at P(3,1): A is pushed past the top edge and is resolved by the reach-the-edge rule; B moves to P(3,0) (-1).

### D11: Clearing the screen with waves still queued (confirmed 2026-10-25)
**Decision:** When no Mud Boys are active but waves remain queued tonight, the **next queued wave spawns immediately**; later waves keep their spacing relative to that new spawn. The night ends early only when every scheduled wave has spawned and been defeated; otherwise it ends when the 45 s Night timer reaches 0. Queued waves are never silently skipped while the timer runs.
**Overrides:** GDD/ENEMY "night ends when no enemies are active" (now: no enemies active **and** none queued). Supersedes PENDING item 11.
**Test:** Three-wave night. Kill wave 1 two seconds after it spawns → wave 2 spawns at once. Kill wave 2 → wave 3 at once. Kill wave 3 → night ends immediately, before 45 s.

### D12: Night start timing (confirmed 2026-10-25)
**Decision:** On entering night, the `HERE THEY COME!` warning shows for **2 s** with the Night clock paused. The 45 s Night clock then starts; wave 1 spawns at **t = 2 s** on the Night clock, and later waves follow every 6 s (t = 8, 14, …) unless D11 brings one forward.
**Overrides:** RULES night sequence and GDD/UI Night overview wording that the first wave spawns as the clock starts. Supersedes PENDING item 12.
**Test:** Warning 0–2 s real time, clock starts at 2 s, wave 1 at clock t=2, wave 2 at t=8, wave 3 at t=14 with no kills.

### D13: What TRY AGAIN restores (confirmed 2026-10-25)
**Decision:** TRY AGAIN restores the **map-arrival checkpoint**: the full state as it was when the player arrived at the current map (Banked POWA, unlocked tiers, equipped loadout, Wax stock, day number), with the map reset to its starting cleanliness, then shows that map's upgrade screen as it was on arrival. On Map 1 the checkpoint is the fresh game (Day 1, 0 POWA, free first day).
**Overrides:** GDD "full Day 1 reset" and "last-day rollback" wording; MAPS p. 6 "or preceding day". Adopts the RULES map-start checkpoint as canonical. Supersedes PENDING item 13.
**Test:** Arrive at Map 2 on day 14 with 20 POWA, Reload L2 and 2 Wax. Play to day 18, get stranded. TRY AGAIN → day 14, 20 POWA, Reload L2, 2 Wax, Map 2 dirty. Repeating TRY AGAIN gives the same state every time.

### D15: Victory check cadence (confirmed 2026-10-25)
**Decision:** Map victory (every panel rated +4) is checked **immediately after each Scrubby move resolves its cleaning**, and triggers at most once per map.
**Overrides:** MAPS end-of-day fallback. Supersedes PENDING item 15.
**Test:** Last panel reaches +4 with 30 s of Daylight left → victory triggers on that move, once.

### D23: Instant mid-day victory payout (confirmed 2026-10-25)
**Decision:** On victory, all clocks stop and the night is **skipped** (no Mud Boys spawn). POWAIN is credited **once** for the fully clean map (200 on Map 1, 1,250 on Map 2, per `POWA conversion`), the Score screen shows it, then the victory overlay with `NEXT MAP` (or the end-of-demo screen after Map 2).
**Overrides:** GDD usual "POWAIN at end of night" for this case only. Supersedes PENDING item 15's payout question.
**Test:** Final scrub on Map 1 → exactly one +200 credit, no night, no stale Mud Boy timers, next map's upgrade screen shows the new bank.

### D25: Spawn-panel dirt (confirmed 2026-10-25)
**Decision:** A Mud Boy applies -1 to its spawn panel's 16 tiles **immediately when it spawns** (Wax still protects), regardless of what happens to it afterward.
**Overrides:** ENEMY p. 1 "if it remains without being shot and moved backward". Matches GDD/UI.
**Test:** Spawn → shot off-map instantly → exactly one -1 dirt event, on the spawn panel.

### D08: Mud Boys per wave (confirmed 2026-10-25)
**Decision:** Each wave spawns the BALANCE `Mud boy Waves` `Mud boy count` for that day (3–6); nightly total = count × `wave count`.
**Overrides:** ENEMY p. 2 "waves of 3". Supersedes PENDING item 8.
**Test:** A day listing count 5, waves 2 spawns 10 Mud Boys in two waves of 5.

### D09: Same-wave spawn uniqueness (confirmed 2026-10-25)
**Decision:** Every Mud Boy in a wave spawns on a **different panel along the spawn edge**, chosen at random without repeats.
**Overrides:** ENEMY p. 3 "cannot share a row or column" (impossible on one edge). Supersedes PENDING item 9.
**Test:** Six Mud Boys on Map 1's 10-panel bottom edge occupy six distinct bottom-row panels.

### D16: Demo spawn edges (confirmed 2026-10-25)
**Decision:** Demo Mud Boys spawn only from the **bottom, left and right** edges (per the wave table). No top spawns, because the turret sits above the map. A top edge is a possible full-release feature only.
**Overrides:** ENEMY opening "one of four edges". Supersedes PENDING item 16.
**Test:** No demo day ever spawns a Mud Boy on the top edge.

### D21: Days 91 and later (confirmed 2026-10-25)
**Decision:** Every day after 90 uses the BALANCE `Mud boy Waves` **`>90` row**: bottom → top, 4 Mud Boys, 9 HP, 3 waves.
**Overrides:** ENEMY prose "reuse day 90 conditions" (day 90 is right → left).
**Test:** Lookup for day 90 → right→left; day 91 and day 120 → bottom→top, 4, 9 HP, 3 waves.

### D14: When the day number increments (confirmed 2026-10-25)
**Decision:** The day number increments when **GET SCRUBBIN!** is pressed and paid. Score and upgrade screens show the day just played. The night uses the wave-table row for the current day number.
**Overrides:** GDD screen sequence "after Score/Continue increments". Supersedes PENDING item 14.
**Test:** Play day 3, score, upgrade screen shows day 3, press GET SCRUBBIN! → day 4, and night 4 uses row 4. TRY AGAIN to a map checkpoint restores its day number with no skipped numbers.

### D17: Canonical timer source (confirmed 2026-10-25)
**Decision:** BALANCE `Timers` sheet (`04_Data_Tables/Timers.csv`) is the authority for default timer values (Scrub 3 s, Shoot/Reload 3 s, Daylight 70 s, Night 45 s); the game's config is generated from or kept identical to it. The missing "Timer V2" document is retired.
**Overrides:** GDD references to "timer v2". Supersedes PENDING item 17.
**Test:** One config source drives HUD, defaults and tests; changing it in one place changes all three.

### D18: Starting POWA (confirmed 2026-10-25)
**Decision:** Banked POWA starts at **0**. Day 1 starts free. The lightning's "5 POWA" is story flavour only and is never shown or credited.
**Overrides:** GDD lightning "gives 5 POWA" as a gameplay value. Consistent with D02.
**Test:** Title → START → Day 1 HUD shows 0 POWA; no charge is made to start Day 1.

### D19: Fractional tile colours (confirmed 2026-10-25)
**Decision:** Store raw tile values as decimals, clamp to [-10, +4] after each change, then **truncate toward zero** for both the tile's colour level and (for the panel average) the panel rating.
**Overrides:** GDD/UI "rounding down" wording for colours, including any negative-specific exception.
**Test:** Raw -0.5 → colour 0; -1.7 → -1; +0.5 → 0; +1.7 → +1. Panel average 0.625 → rating 0.

### D26: Counter banks at phase changes (confirmed 2026-10-25)
**Decision:** At the start of each day the Scrub bank is set to its max and the Scrub timer resets; at the start of each night the Shoot bank is set to its max and the Reload timer resets. Banks and timers not used in the current phase are inactive. A timer that would complete on the same frame its phase ends grants nothing. Pause freezes every timer, movement, spawn queue and animation.
**Overrides:** Fills the gap in GDD "banks refill at start of needed phases".
**Test:** Scrub timer at 2.9/3 s when Daylight hits 0 → no counter granted; next day starts with a full bank and a fresh 3 s timer. Bank never exceeds max.

### D27: Map 2 view (confirmed 2026-10-25)
**Decision:** Panels and sprites stay the same size on both maps. On Map 2, by day the camera follows Scrubby (clamped to the map edges); at night the view zooms out to fit the whole map so every panel and Mud Boy is visible and clickable. Map 1 fits on screen without a camera.
**Overrides:** Fills the gap in GDD/MAPS (no viewport rule). Night-time zoom is an accepted exception to "same sprite size" for clickability.
**Test:** On Map 2 Scrubby can reach P(24,24) by day with the camera following; at night a Mud Boy on any edge panel can be clicked without scrolling.

### D29: Tech stack and hosting (confirmed 2026-10-25)
**Decision:** TypeScript + **Phaser** game library, built with **Vite**. Hosted on **Azure Static Web Apps** (free tier), deployed automatically from GitHub by GitHub Actions. Balance values are loaded from config generated from / matching `04_Data_Tables/`. Game rules live in plain TypeScript separate from Phaser so they can be unit-tested deterministically.
**Overrides:** Nothing (previously undecided).
**Test:** `npm install && npm run dev` runs the game locally; a push to `main` deploys to the Static Web App; rule tests run in CI.

### D24: Demo persistence (confirmed 2026-10-25)
**Decision:** The demo keeps all state in memory only. Refreshing or closing the tab loses the run and returns to the title screen. Save/load is a full-release feature, to be designed later.
**Overrides:** Nothing (confirms RULES).
**Test:** Refresh mid-run → title screen, fresh game.

### D28: Art and audio (confirmed 2026-10-25)
**Decision:** The demo build starts with **placeholder art drawn in code** (simple shapes and the `colors.csv` palette) and **no audio**. The demo must be fully playable muted. Final sprites and music from the owner replace placeholders later; any third-party asset needs its licence recorded in the repo.
**Overrides:** Nothing (previously undecided).
**Test:** The demo runs end-to-end with no external image or sound files.

### D30: Doubled cleanliness scale for faster early POWA (confirmed 2026-10-27, from play test 1)
**Why:** In the first play test, cleaning was hard to see and reaching 5 POWA on Day 1 was too hard. Under the original numbers a single default scrub leaves a panel at rating 0 (pays nothing), so the best possible Day 1 was ~6 POWA and sloppy play earned 0.
**Decision:**
1. Tile cleanliness range is **-10 to +8** (was +4). Tiles still start at **0**. "Fully clean" is a panel rated **+8**.
2. Default **Brush POWA is 2** (was 1). Brush POWA upgrade levels double to match: L1 = 4, L2 = 6, L3 = 8 (costs and maintenance unchanged). Brush AoE and Supped UP Brush unchanged.
3. POWAIN stays **0.5 per positive panel level**: +1 = 0.5 … +8 = 4. Map 1 max = 400 per night, Map 2 max = 2,500. D03 rounding still applies.
4. ~~New 19-step palette with 0 as dark mud brown.~~ Superseded by D31.
5. Every rule that referred to "+4" now means "+8": Retractable Bristles free entry, Wax eligibility, victory (D15/D23), and the +4 clamp.
**Overrides:** RULES/MAPS tile range -10..+4; BALANCE `colors`, `POWA conversion` (extended past +4), `Upgrade Levels` Brush POWA level values (1/2/3/4 → 2/4/6/8); master handoff §2 completion totals (400/2,500 → 800/5,000 aggregate). Mud Boy damage: see D32.
**Test:** One default scrub on a fresh panel → centre tiles +2, border +1, panel rating 1, worth 0.5. A second scrub → rating 2. A 24-move Day 1 visiting a new panel each move earns 12 POWA. All 100 Map 1 panels at +8 → 400 POWAIN.

### D31: Dust vs mud palette (confirmed 2026-10-28, from play test 2)
**Why:** The owner's original colours separate the map's default dirt from the extra filth Mud Boys add. D30's dark-mud start left no visible room for Mud Boy damage. The player must notice a Mud Boy's effect immediately, and a night should leave a clear mark to deal with the next day.
**Decision:** Two colour families. **0 (fresh map) is a dull dusty grey** (`#7D7B6A`). **+1 to +8 step through sage and teal to Zima Blue** (`#5BC2E7`), each step visibly different. **-1 to -10 are mud**: warm orange-brown (`#8A5A2B`) getting darker to near-black (`#170D06`). Only Mud Boys can push tiles below 0, so any brown on the map is Mud Boy damage. Exact values live in `src/rules/config.ts`.
**Overrides:** D30 item 4; BALANCE `colors`.
**Test:** A fresh panel is grey; one scrub turns it sage/teal; a Mud Boy hit on a fresh panel turns it brown.

### D32: Mud Boy dirt scaled to the doubled range (confirmed 2026-10-28)
**Decision:** Mud Boy dirt doubles to match D30: **-2** to all 16 tiles of each panel a Mud Boy enters (spawn per D25, forward moves and forward pushes per D10); a pop applies **-4** to its panel and **-2** to each of the four cardinally adjacent panels. Wax still protects; tiles still clamp at -10.
**Overrides:** GDD/ENEMY -1 per entry and -2/-1 pop amounts.
**Test:** A Mud Boy spawning on a fresh panel leaves it at -2 (brown). A pop on a +6 panel leaves it at +2 and drops each neighbour by 2.

### D33: Score screen and where POWAOUT appears (confirmed 2026-10-29)
**Decision:** The Score screen only reports the night's result: the POWAIN earned (D03 rounded) and the Banked POWA after it is added. It has **no POWAOUT line**. POWAOUT is the day cost (5 + maintenance of the selected loadout, D02) and is shown **only as the number on the GET SCRUBBIN! button** on the upgrade screen, updating as the player changes the loadout. The number and button are **red** and the button cannot be pressed when the cost exceeds Banked POWA.
**Overrides:** GDD/RULES Score screen "POWAIN / POWAOUT / BANKED" layout. Settles the D02 "Not yet decided" item.
**Test:** Night 1 scores 12 → Score screen shows POWAIN 12, BANKED 12, no POWAOUT. Upgrade screen GET SCRUBBIN! shows 5 in green. Equip upgrades until the cost is 13 → number and button red, not pressable.

### D34: RESET PURCHASES on the upgrade screen (confirmed 2026-10-29, from play test 3)
**Decision:** The upgrade screen has a **RESET PURCHASES** button in its header, beside the DAY counter. It undoes every unlock, Wax purchase and loadout change made since the upgrade screen opened: Banked POWA, unlocked levels, equipped levels and Wax go back to how they were when the night was scored (or when TRY AGAIN restored the checkpoint). Purchases made on earlier upgrade screens are kept. The button is greyed out when there is nothing to undo. A misclick or miscalculation that turns GET SCRUBBIN! red never forces TRY AGAIN.
**Overrides:** Nothing; adds to D02.
**Test:** Bank 23 → buy Scrubbing Speed (5) and Extra Scrubbers (10) → bank 8, GET SCRUBBIN! 10 red. RESET PURCHASES → bank 23, both back to default, GET SCRUBBIN! 5 green.

### D35: Timers refill the whole bank (confirmed 2026-10-29, from play test 3)
**Decision:** When the Scrub or Reload timer completes, its bank refills **to its max** (all missing counters at once), not +1. The timer still runs only while the bank is below max (D04) and is not restarted by spending more counters while it runs. Extra Scrubbers and Clip Size therefore raise how many counters every refill gives back.
**Overrides:** D05 (+1 per completion). Matches the BALANCE `Upgrade definitions` wording "increases the number of counters provided when timer reaches 0".
**Test:** Clip Size L3 (max 4), Reload 3 s. Fire 3 shots (1 left) → after 3 s, 4 stored. Fire 1 at t=0 and 2 more at t=2 → at t=3, 4 stored.

## Still open

- Upgrade pacing: step 3 uses the BALANCE `Upgrade Levels` costs as-is (Brush POWA values per D30). Owner to judge in play testing whether upgrades max out too quickly with D30 income; a possible fix is more levels per upgrade.
- D10 derived details (push does not affect the pushed Mud Boy's timer or HP): flagged for owner review.
- Night-phase derived details (step 2 build), flagged for owner review:
  - A Mud Boy "reaches the far edge" when its forward action would take it off the map; it pops on the edge panel it is standing on (same as the D10 push-off rule).
  - Being shot and knocked back does not reset the Mud Boy's own 3 s forward timer.
  - A wave spawns only on edge panels not already occupied (Mud Boys never share a panel, D10); if fewer free panels than Mud Boys remain, the extras do not spawn.
  - Mud Boys still on the map when the Night clock hits 0 simply leave, with no pop and no dirt.
- Upgrade-screen derived details (step 3 build), flagged for owner review:
  - Buying a level also equips it; the player can click any lower unlocked level (or the free default) to dial back down.
  - The D02 `MUST RETAIN` floor (bank after paying ≥ 5 + selected maintenance) applies to Wax packs as well as unlocks.
  - BUY prices are green when the purchase would be allowed and red when it would be refused.
  - TRY AGAIN asks for confirmation before restoring the checkpoint.
  - Entering a +8 panel without Retractable Bristles still costs a Scrub counter (the panel stays at +8).
