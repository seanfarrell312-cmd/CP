# Clean POWA! | Open Decisions and Reviewer Questions

**Status:** OPEN, 25 October 2026. **Do not implement the proposed alternatives here as final rules until the project owner selects them.** The original `Clean_POWA_Remaining_Spec_Decisions.txt` had 17 issues. This register preserves those concerns, corrects source-drift where the CLEAN files now say something different, and identifies additional gaps a developer is likely to encounter. References use source shorthand explained in the consolidated handoff.

Use this response template for each item: `Decision: ___ | Rationale: ___ | Updated authoritative source / tab: ___ | Test case: ___`. **Priority P0** means required for deterministic core-loop implementation; **P1** means a significant demo rule or test; **P2** means desirable polish or full-release planning.

## Decision log

### D01 [P0] Which upgrades are included in the demo, especially WAX?
**Evidence:** GDD, “The DEMO will contain all upgrades and features including WAX and retractible bristles” (near demo scope). BALANCE `Upgrade definitions!A1:C10` labels all nine entries `FULL`; PENDING item 1 says an earlier GDD omitted Wax and the workbook marked some as `DEMO`. **Why open:** these statements cannot all be treated as current authoritative demo roster. **Decide:** explicit list of nine demo-available upgrades, whether Wax is in or out, and whether `DEMO/FULL` labels should be fixed. **Acceptance:** the UI and configuration agree on one roster.

### D02 [P0] Precisely when do POWAIN, POWAOUT, purchases and Banked POWA post?
**Evidence:** GDD, day costs and score/start flow; RULES, `POWAIN`, `POWAOUT`, `Banked POWA` and Score Phase; PENDING 2. **Why open:** prose alternates between `Banked = POWAIN - POWAOUT` and adding gross POWAIN to a prior bank, with POWAOUT charged later. **Decide:** event-by-event ledger (first-day seed, each score, unlock purchase, enabled maintenance, day-start fee, checkpoint) and score-screen terminology. **Acceptance:** work through at least three sample days and a map transition without double charging or double awarding.

### D03 [P0] Can available/banked POWA be fractional?
**Evidence:** RULES, `Banked POWA` calls it an integer; BALANCE `POWA conversion!A1:B16` pays 0.5 for +1 and 1.5 for +3; PENDING 3. **Decide:** use half-units (e.g., numeric 4.5) versus accumulated halves rounded only at a documented transaction point. **Acceptance:** +1 panel yields a deterministic bank value and cost affordance check.

### D04 [P0] When do Scrub/Shoot recharge timers run?
**Evidence:** GDD, `SCRUB/SHOOT COUNTER BANK` paragraphs suggest start only at 0; the later `Timer and counter relations` says begin whenever count falls below maximum; RULES Night also says at zero; PENDING 4. **Decide:** below-max recharge versus zero-only recharge, phase initialization, timer reset/full behavior, and pause. **Acceptance:** timed state examples for max 1 and max 4 banks.

### D05 [P0] Does counter-capacity upgrading change refill size?
**Evidence:** GDD, timers grant +1 per completion; BALANCE `Upgrade definitions` describes increased number of counters “provided when timer reaches” end, while `Upgrade Levels` names capacity as MAX; PENDING 5. **Decide:** +1 per completion with larger cap, or a level-dependent burst. **Acceptance:** upgrade level 3 timer completion at 0, 1, and 3 stored counters.

### D06 [P0] Mud Boy movement distance per 3 seconds?
**Evidence:** GDD `Mud Boys`, UI `Mud Boys` prose: forward 1 panel; ENEMY p. 1 and p. 3: forward **2** spaces/panels; PENDING 6. **Decide:** 1 or 2; separate speed from action interval. **Acceptance:** starting cell, position, and cleanliness trace over 9 seconds.

### D07 [P0] Does each Mud Boy always have 3 HP or table-scaled 3/6/9 HP?
**Evidence:** ENEMY opening “Each Mud Boy has 3 health counters”; ENEMY wave chart and BALANCE `Mud boy Waves` have 3/6/9; PENDING 7. **Decide:** authoritative HP source by day/wave. **Acceptance:** late-wave enemy survives the correct number of shots.

### D08 [P1] Does “wave of 3” override per-wave 3–6 counts?
**Evidence:** ENEMY p. 2 says “waves of 3”; ENEMY table and BALANCE `Mud boy Waves` list 3, 4, 5, or 6 Mud Boys per wave and 1–3 waves; PENDING 8. **Decide:** use explicit workbook `Mud boy count` and `wave count` or replace it with fixed triples. **Acceptance:** daily spawned total equals intended `count × waves`.

### D09 [P1] What is unique within the same spawn wave?
**Evidence:** ENEMY p. 2 “cannot spawn in the same panel”; p. 3 “cannot share a row or column”; PENDING 9. All bottom-edge spawns share a row by definition, so the second rule is impossible as written. **Decide:** distinct edge panels (most natural) versus distinct lane indices or another rule. **Acceptance:** six enemies can spawn on a 10-panel bottom edge without duplicate positions if required.

### D10 [P0] What happens when Mud Boys move forward into an occupied panel?
**Evidence:** ENEMY backward collision chain is explicit; forward collision unspecified; PENDING 10. **Decide:** overlap, block/wait, push chain, reorder, or move simultaneously; what happens at boundary. **Acceptance:** two adjacent enemies moving forward simultaneously cannot produce nondeterministic state.

### D11 [P0] Can the night end while later Mud Boy waves remain queued?
**Evidence:** GDD and ENEMY Night Phase end on no active enemies **or** timer 0; GDD also defines multiple queued 6-second-spaced waves; PENDING 11. **Decide:** all active *and pending* waves must be cleared, or defeating current active wave ends night and cancels pending. **Acceptance:** kill first wave within 2 seconds on a three-wave night and verify intended result.

### D12 [P1] First wave timing versus the night warning?
**Evidence:** GDD `Timer and counter relations` sets first wave 2 seconds after warning ends and night clock starts; RULES night sequence and GDD/UI Night overview imply immediate spawn; PENDING 12. **Decide:** warning text and duration, night-clock start and wave-one delay. **Acceptance:** timeline in seconds for warning end, t=0, wave 1, wave 2, wave 3.

### D13 [P0] What does TRY AGAIN restore?
**Evidence:** GDD says full Day 1 reset in one section and last-day rollback/current-map restart elsewhere; MAPS p. 6 says current map or preceding day; RULES later specifies Map-2 entry checkpoint including upgrades, POWA and day count; PENDING 13. **Decide:** full new-game restart, map-arrival snapshot, previous day, or user-selectable variants, and precisely what is captured. **Acceptance:** stranded on Map 2, TRY AGAIN preserves/reverts the selected fields consistently.

### D14 [P1] When does day number increment?
**Evidence:** GDD screen sequence after Score/Continue increments; RULES Upgrade phase increments after GET SCRUBBIN; PENDING 14. **Decide:** increment at score confirmation, at paid day start, or another event. **Acceptance:** correct wave row is used on restart/retry and at map transition without skipped numbers.

### D15 [P0] Victory test cadence?
**Evidence:** GDD and RULES immediate completion mid-day; MAPS allows end-of-day fallback; PENDING 15. **Decide:** evaluate after each tile update, after each panel action, or at day end. **Acceptance:** last panel reaches +4 with 30 seconds left; game advances per decision exactly once.

### D16 [P1] Which edges spawn Mud Boys in the demo?
**Evidence:** ENEMY opening “one of four edges” versus later explicit demo exclusion of top; 90-day table lists only bottom, left, right; PENDING 16. **Decide:** demo three edges based on table, and note whether future top is a requirement. **Acceptance:** no top spawn in demo if three-edge version selected.

### D17 [P1] What is the canonical source for timers?
**Evidence:** GDD mentions absent “timer v2” document; BALANCE `Timers!A1:D5` and UI last-page Timers table both specify 3/3/70/45; PENDING 17. **Decide:** designate BALANCE `Timers` sheet or a new canonical timer config as authority; retire dangling citation. **Acceptance:** one configuration source drives visuals, defaults and tests.

### D18 [P1] First-day energy grant and free start representation
**Evidence:** GDD lightning gives 5 POWA; RULES `GAME STARTING POWA` explicitly starts account with zero and bypasses paid first-day launch. **Decide:** story-only 5, real 5 then immediately spend 5, or 0 with free initialization. **Acceptance:** title→Day 1 yields specified account balance and first scoring behaves consistently.

### D19 [P1] Canonical tile color/grade evaluation for fractional and negative values
**Evidence:** RULES and MAPS use truncation toward zero; GDD/UI also use “rounding down” phrasing for colors, sometimes with a negative-specific exception. **Decide:** keep raw float, clamp, then `truncate toward zero` for tile colors and panel averages, or another exact ordering. **Acceptance:** raw tile values -0.5, -1.7, +0.5, +1.7 map to expected color levels and panel score values.

### D20 [P0 if D06 selects 2-space move] Does a 2-panel move dirty the skipped intermediate panel?
**Evidence:** ENEMY p. 3 says only panels a Mud Boy “spawn in, ... move to, ... or pop on or near” are affected, while movement is 2 panels. **Decide:** apply -1 to destination only, or every traversed panel; also define near-boundary clamping and reach-the-end pop. **Acceptance:** known 2-cell leap dirtying exactly intended tiles.

### D21 [P1] Difficulty for day 91 and beyond
**Evidence:** ENEMY prose says reuse **day 90** conditions; `Mud boy Waves!A92:F92` has a dedicated `>90` row with bottom→top while day 90 is right→left. **Decide:** reuse literal day-90 record (right, 4, 9, 3) or the dedicated >90 record (bottom, 4, 9, 3). **Acceptance:** schedule lookup for 90, 91 and 120.

### D22 [P0 if Wax is in demo] What is awarded by a Wax tier purchase?
**Evidence:** BALANCE `Upgrade Levels` Wax rows L1=1, L2=2, L3=3 charges; RULES treats Wax as repeatable consumable counters, not toggled or maintained. **Decide:** buying L2 awards 2 *new* counters, brings balance to 2, or increases reusable capacity/quantity; whether sequential unlocking applies to Wax, and whether same tier can be repurchased. **Acceptance:** sequence of 3 purchase/use/day transitions reports exact tokens.

### D23 [P0] How to settle POWAIN on instant map victory before normal night/score?
**Evidence:** RULES completion sequence says immediate map victory triggers Score with MAX POWAIN; GDD says `NEXT MAP` on victory mid-day; usual POWAIN scoring is at end of night. **Decide:** credit once immediately, skip night, show score, select map, or preserve the usual night. **Acceptance:** final scrub produces exactly one award and no stale scheduled Mud Boys.

### D24 [P2] Full-release save/load rules and demo refresh behavior
**Evidence:** RULES says demo loses state when closed, full version save and load on a chosen day. **Decide later:** browser refresh semantics, save format, checkpoint moment, version migrations; no online account is mandated. **Acceptance:** requirements explicitly distinguish demo run-only state from later persistence.

### D25 [P1] When does a newly spawned Mud Boy dirty its first panel?
**Evidence:** GDD/UI says spawn immediately applies -1; ENEMY p. 1 says it applies -1 in its initial panel **if it remains without being shot and moved backward**, then moves. **Decide:** -1 on spawn, after first 3-second interval, or only when enemy succeeds in taking its first forward action; handle enemies shot off before movement. **Acceptance:** instant spawn→immediate shot off-map produces intended number of dirt events (0 or 1).

### D26 [P1] Reload/full-bank logic across phase transitions and pause
**Evidence:** GDD says counter banks refill at start of needed phases, timers start when deficit, carryover never occurs. **Missing:** precise time state on day→night and night→next day, pausing during animation, and behavior if timer matures at phase end. **Decide:** deterministic event ordering and reset of counters/timer progress. **Acceptance:** boundary-frame test confirms no double-awarded counter and never exceeds cap.

### D27 [P2] Map 2 viewport, scaling and input mapping
**Evidence:** GDD/MAPS require same sprite/panel size and a larger 25×25 map centered on screen. No camera pan, viewport or zoom specification provided. **Decide before UI build:** fixed viewport with pan/scroll, bigger canvas, or responsive scaling, at desktop target resolution. **Acceptance:** player can access every Map 2 panel and click every Mud Boy despite larger map.

### D28 [P2] Audio, asset licensing, and optional UI content
**Evidence:** UI/GDD plan music/rhythm, Options audio sliders disabled in demo, finished art concepts are incomplete. **Decide later:** asset sources/licenses, exact animation frames, music tempo and whether audio affects gameplay timing. **Acceptance:** demo is playable muted and has no unlicensed placeholders.

### D29 [P2] Implementation architecture and Azure deployment choices
**Evidence:** project intention is web-link gameplay, Git source, low Azure cost, AI-assisted coding. No engine, framework, hosting service, estimated scale or billing cap is specified. **Decide before build:** app architecture, test runner, data config format, hosting and security rules. **Acceptance:** reproducible local startup + CI deploy, documented billing guardrails.

## Most valuable decisions to settle first

First pass **D01–D05, D06–D07, D10–D13, D15, D22–D23, D25** so the core loop and account transactions have one possible interpretation. Next settle **D08–D09, D14, D16–D21, D26** for deterministic simulation; then **D24, D27–D29** for product/platform packaging.

## Validation scenario set for reviewer/developer

1. Initial Map 1 panel cleaned once: center +1, border +0.5, panel rating truncates to 0, no POWAIN until score and effective panel reaches +1.
2. Several panels at +1/+3/+4: calculate expected 0.5+1.5+2 = 4 POWAIN, then separately verify chosen bank transaction ordering.
3. One panel at maximum +4, Wax applied, Mud Boy traverses and pops nearby: wax remains +4/pink, all other affected unprotected tiles reduce/clamp correctly.
4. No Scrub counters, moving onto a clean +4 panel with Retractable Bristles: no cost; moving into dirty panel: denied until recharge.
5. Knock back enemy from edge: no pop or cleanliness effect; show `SPLAT!` text and resolve enemy list.
6. Two Mud Boys chain push into occupied cells and edge: only directly shot enemy loses HP; all resulting placements deterministic.
7. Clear first wave on a night with three waves queued: night-end result matches D11; later waves are neither duplicated nor silently discarded unless intended.
8. Trigger mid-day map completion; check one-time POWAIN award and next-map upgrades/day state.
9. Buy an upgrade, disable it, keep unlock, pay no maintenance for disabled tier; lowering equipped level to earlier tier uses that tier's maintenance cost only.
10. Reach insufficient POWA on Map 2 then TRY AGAIN: exact rollback state matches D13; repeatable without resource duplication.

## Source drift and accuracy caution

The **PENDING** document is itself an older issue log, not a source of current mechanic truth. Its item 1 claims “GDD excludes WAX” / “workbook marks WAX DEMO,” but the **currently included CLEAN GDD** says “including WAX” and the **currently included CLEAN workbook** labels every upgrade `FULL`. This handoff deliberately records that mismatch instead of repeating the obsolete claim as a verified contradiction. Recheck every item against current attached files before changing production code.
