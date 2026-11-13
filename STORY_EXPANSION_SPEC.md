# CLEAN POWA! | STORY CAMPAIGN EXPANSION SPECIFICATION

**Version:** 1.0 — 12 November 2026  
**Status:** Implementation-ready for Phase 1; staged design contract for later content  
**Primary audience:** Claude Code, game designer, and playtesters  
**Relationship:** Additive companion to the existing playable *Clean POWA!* build, **not a replacement game design document**

> **STOP-AND-PRESERVE RULE.** The repository's `DECISIONS.md` is the final authority for *existing* mechanics and supersedes all archived handoff documents. The supplied **Clean POWA! Game Design Doc — Current Build** describes the live D01–D52 implementation as of 12 November 2026. This supplement introduces approved story decisions and proposed future features. It does not authorize modifying an existing D01–D52 behavior unless the change is called out explicitly, accepted by the owner, and recorded as a new repository decision. If the repo differs from the supplied snapshot, inspect the repo and stop on the discrepancy rather than guessing.

## 1. What Claude Code is being asked to do

**Immediate scope (Phase 1 only):** Add the new intro, green-terminal dialogue, first-day and first-night step-through tutorials, and two post-victory supervisor transitions. Make the existing two-map gameplay and upgrade/scoring systems operate identically. Add a clean progression seam for the later story campaign, but **do not fabricate Maps 3–6 or replace the current demo end screen yet**.

**Future scope (design, not a single build instruction):** Extend the forward campaign from two to six playable maps; then replay the six settings in reverse as Grubby, swapping cleaning for spreading filth and hostile Mud Boys for corporate Scrubber bots. Maps 3–6, the reversal, and endings are authorized as *direction*, not complete specifications. Each is gated by missing art, map configuration, balance values, or explicit choices.

### 1.1 Source-of-truth and decision ID namespaces

1. `DECISIONS.md` in the actual repo (D01–D52 and later decisions) — authoritative for all implemented systems.
2. **Current Build** PDF dated 12 Nov 2026 — a snapshot describing those rules; consult repository source if changed.
3. **Author's updated Story Decision Checklist** — authoritative for story direction and specifically accepted new behavior; IDs referred to here as `STORY-D01`–`STORY-D24` to avoid collisions with repo D01–D52.
4. `Pasted markdown.md` and `Clean_POWA_Story_Expansion_GDD_DRAFT.md` — creative/script source where not amended by the updated checklist.
5. Older `Clean_POWA_*_CLEAN` specs/workbook — **historical handoff only**. Do not copy their superseded +4 cap, five-POWA day charge, maintenance fees, timer refill behavior, or older enemy rules back into the live game.

Interpretation tags in this file: **LOCKED-BUILD** = current implementation, preserve; **APPROVED-STORY** = owner-approved extension; **PROPOSED** = design/technical recommendation needing approval or used only behind a developer prototype flag; **TBD-BLOCKED** = missing definition, no production implementation; **COMPATIBILITY EXCEPTION** = a deliberate later-stage difference that must receive a new repo decision before release. A checked checkbox is **not** sufficient if its written choice still says TBD.

### 1.2 Safeguards

- Do not rewrite the game loop, replace scoring functions, rename the existing Panel/Tile concepts, or change the first two maps' geometry, stat values, enemy rules, upgrades, or camera as a side effect of storytelling.
- Story dialog/cutscenes must **pause simulation** during playback: day/night clocks, counters/recharges, movement, spawns, projectile actions, queued waves and score/upgrade input. Resume without drifting or spawning multiple waves.
- Narrative event IDs and completion awards must fire **once per intended game state**, not once per re-render or button press.
- Keep current no-save behavior (`BUILD-D24`): narrative flags/checkpoints are in memory for the current browser run unless the owner later approves persistent saves. Don't silently add `localStorage`, cloud saves or cross-session achievements.
- Preserve the existing 1280 × 720 layout, 96 px top HUD, and Map 2 follow/zoom camera. Place dialogues outside HUD-obscuring click regions and make them legible at 720p.
- When a newer scene requires a different transition (e.g., Map 3 light-up instead of fencing), implement it **per-stage**. Never change the Map 1/2 fence and one-time payout flow globally.

## 2. Compatibility contract: settled current rules

| System | LOCKED-BUILD rule | Implication for the expansion |
|---|---|---|
| Map 1 | 10×10 Panels, 4×4 Tiles each; all tiles start 0 | Keep unchanged; display title **Power Panel 1** only |
| Map 2 | 25×25 Panels, 4×4 Tiles each; base −4 with six fixed −10 patches | Keep exact existing patch positions and camera; display **Power Panel 2** |
| Cleanliness | Each Tile decimal-clamped **−10…+8**; Panel = truncation toward 0 of mean of 16 Tiles; victory at **+8 in every eligible Panel** | Never use old +4 cap or +4 wax threshold in new maps |
| Brush | Initial Brush POWA 2; center 2×2 gets +2, outer 12 get +1; larger brush can reach all 16 evenly | S03/S04 expansions reuse baseline application unless an approved mask or new upgrade changes specific tiles |
| Movement | One WASD press per Panel, counter spent on valid scrubbing move; full bank replenishes when recharge timer completes; timer only runs below full | No continuous-key movement or partial refills introduced |
| Time | Day 70 s (modifiable by existing Time Manipulation); Night 45 s; base Scrub recharge 2.5 s; Shoot recharge 3 s | Story freezes must not consume these timers |
| COMBO | Existing 10-POWA upgrade (`BUILD-D49/D51/D52`); eligible SCRUB! streak steps reduce recharge 5% each, up to 40%; SLIP! preserves streak | New story overlay does not reset COMBO unexpectedly; new S04/reverse behavior requires explicit mapping |
| WAX | Space on **unwaxed +8 Panel** consumes one charge; Waxed Panels cannot change cleanliness; moving onto them is free | S04 mandatory Wax uses this exact rule; BLOOD and reverse Wax counterplay need distinct decisions |
| POWA-IN | Positive Panel rating gives 0.5 × rating; round down **the total once** at score; full Map 1 pays 400, Map 2 pays 2500 | Stage completion award may be presented differently, but must use live score routine exactly once |
| Banking | Starts at 0; days cost **0**; no maintenance/equip toggles; upgrades are one-time purchases, highest purchased level always active | Ignore old talk of spending 5 POWA for each day, enabling upgrades or maintenance charges |
| Upgrade locks | Existing Map 1 top counter/speed levels remain locked until Map 2; costs and Combo as implemented | Keep original Map 1/2 unlock schedule, including existing WAX and Big Mud Boy logic |
| Night | Small Mud Boys: 1 Panel per 3 s; 3/6/9 HP from table; dirty entered Panels by −2; pop −4 center, −2 orthogonal neighbors; push back one Panel; spawn only bottom/left/right | These rules also apply to established small Mud Boys in later stages unless specifically extended |
| Big Mud Boys | Already implemented in Map 2: 2×2 footprint; double small HP; no knockback; jump 2 Panels per 3 s; pop covers occupied 4 + 8 side neighbors | Reuse existing behavior in S03 if enabled; don't re-implement or weaken them |
| Wave start | `HERE THEY COME!` 2 s, paused; night t=2 s first spawn; 6 s between later waves; early clear pulls queued next wave forward | First-night story tutorial comes **before** warning and must not duplicate or replace those timings |
| Victory | After each scrub: `SPOTLESS!` -> 2 s perimeter fence -> score once, night skipped -> stage completion | Preserve Map 1/2 exactly; only subsequent stages can choose other presentation |
| Retry | TRY AGAIN confirms, restores **map-arrival checkpoint** of map, POWA, upgrade levels, Wax and day number; day increments on successful GET SCRUBBIN! | Adding a cinematic must not increment days twice or corrupt retry checkpoint |
| Save/art/audio | No save persistence; code-drawn placeholders; **no audio implemented yet** | Any sound requests are optional new assets/features, not existing working sound |

**Specific existing Map 2 dirt patches (preserve):** 4×3 at P(3,4); 5×4 at P(15,2); 5×5 at P(9,11); 4×4 at P(19,13); 5×4 at P(2,18); 3×3 at P(14,20). `BUILD-D43`.

**Current first-night card:** Map 1 Night 1 already has a paused `NIGHT TIME!` / `GOT IT` tutorial (`BUILD-D38`). Phase 1 must **extend or replace the contents of this same gate**, not stack another modal over it and accidentally run the phase twice.

## 3. Campaign identity, stage list and run flow

**APPROVED-STORY (`STORY-D01`, `STORY-D03`):** Six distinct settings are played forward as Scrubby and revisited in reverse as Grubby. Use `stageId` in code; `Panel` continues to mean a 4×4-Tile grid cell. **Power Panel 1 / Power Panel 2** are only stage titles.

| Forward ID / Map # | Display label | Setting | Core new play | Completion / story beat | Readiness |
|---|---|---|---|---|---|
| `S01` / 1 | Power Panel 1 | Current 10×10 solar array | Existing loop; new intro/tutorial overlays | Existing fence, single 400 award; supervisor transition | **Phase 1** |
| `S02` / 2 | Power Panel 2 | Current 25×25 array | Existing loop; extra supervisor context | Existing fence, single 2,500 award; office-access mission | **Phase 1** |
| `S03` / 3 | Emergency Panels | Segmented exterior grids outside dark office | Clean-to-unlock paths, small and Big Mud Boys, Powerful Shots | `SPOTLESS!`; facility lights and logo reveal; yellow intrusion; promotion | **Needs supplied map image/config** |
| `S04` / 4 | Office / Foyer (working) | Kinetic indoor POWA floors | Wall-edge cleaning, mandatory Wax, BLOOD/Peroxide, fast triangular Mud Boys, preset circuit endpoints | All required floors and circuits complete; hidden door opens; yellow + green messages | **Needs layout + numbers** |
| `S05` / 5 | Subterranean Facility (working) | Larger interior | Build on S04 mechanics; stronger loadout; environmental warnings | Final room, `SPOTLESS!`, collapse/fall; yellow warning | **Concept only** |
| `S06` / 6 | Mud Caves (working) | Cave maze/revelation | Reveal floor direction marks; Mud Boys gather; faction choice | `SCRUB` bad ending or `GRUB` transformation | **Concept only** |

**Reverse map IDs (`R06`→`R01`, provisional convention):** The same *six map settings* are reused in reverse order (approved). The exact playable function of the **reverse cave (`R06`)** is not yet defined; don't quietly reduce this to five reverse maps. The older suggestion listing only S05–S01 as return stages is incomplete relative to `STORY-D01`. Until an approved reverse stage grid exists, treat all reverse map IDs as navigation/configuration placeholders.

**Full-campaign progression concept:**

```text
Title
 -> 3-panel emergency-power comic -> green boot conversation
 -> S01 tutorial day -> first-night tutorial -> existing day/night/score/upgrade loop
 -> S01 existing Spotless/fence/payout -> green supervisor interlude
 -> S02 existing gameplay -> Spotless/fence/payout -> green supervisor interlude
 -> S03 gated emergency exterior -> lights reveal -> yellow message -> green promotion
 -> S04 interior office + BLOOD/Wax/circuits -> yellow + green message
 -> S05 subterranean rooms -> collapse -> yellow warning
 -> S06 cave / Mud Momma reveal -> [SCRUB / GRUB]
                      SCRUB -> comedic bad ending + return to choice
                      GRUB  -> Grubby transformation -> R06 ... R01
                              -> shutdown and final ending [TBD]
```

**Demo compatibility:** The live build currently ends with `THANK YOU FOR PLAYING!` after S02. **Phase 1 must preserve that playable two-map exit.** Later, when S03 is ready, a distinct approved story-campaign transition replaces or branches around that terminal screen; retain an accessible demo/test endpoint during development (e.g., a developer-only build configuration). No new user-facing game-mode menu is authorized by this decision alone.

## 4. Narrative presentation system (APPROVED-STORY)

### 4.1 Four UI/presentation modes

1. **Opening comic** (`intro.emergencyComic`): three illustrated panels on black. (1) Mud ball adhered to a broken dark monitor/wall; (2) slime drop separates and falls with a **SHLOOP** cue; (3) drop hits a lever with a **CLUNK** cue. Flash `Emergency POWA Active` a few times, then fade to black. **Replaces** earlier lightning-strike intro. This is story only: there is *no five-POWA start fee or implied free five-POWA deposit*. If no audio assets exist, show temporary visual captions rather than adding unapproved dependencies.
2. **Green corporate terminal** (`terminal.green`): black background, green typewriter text, single text entry per advance. Used for supervisor boot, S01/S02 outro and post-intrusion reassurances. Keep the supervisor chatty, friendly, and progressively unsettling.
3. **On-map tutorial** (`tutorial.modal`): advance with **NEXT**; final page says **GOT IT**. It blocks gameplay input and freezes simulation. Day 1 starts only after a *valid first move*, not merely closing tutorial. First-night tutorial finishes before the **existing** 2 s HERE THEY COME! warning and wave t=2 s spawn.
4. **Yellow intrusion** (`terminal.yellow`): glitch to black, larger centered yellow text, one entry per advance, anonymous source until Mud Momma is revealed after S06. Glitch away into green terminal. Do **not** label the yellow speaker `Mud Momma` on-screen before reveal, in subtitles, or asset filenames exposed in UI.

**Confirmed interaction (`STORY-D04`):** Click once while line is typing = instantly reveal that line. Click again = move to next line. Skip only for previously viewed scenes. Pause all gameplay time for narrative modals/cinematics. Make each scene's visited/finished flag **run-local** because saves are not in the current build. Avoid *auto-complete* when the same pointer click both finishes a line and advances it. All menus and cutscenes must prevent stray WASD/Space/E/click interactions from reaching underlying game controls.

**Replay (`STORY-D05`):** Show onboarding day/night tutorials on a new game, not a map-arrival TRY AGAIN. Keep any existing retry and day progression counts. Earlier warnings and helper text must not trigger twice.

### 4.2 Opening-to-Day 1 event chain (Phase 1)

1. TITLE `START` → `intro.emergencyComic` (not the legacy lightning illustration).
2. Comic finish → `intro.emergencyText` flashing `Emergency POWA Active` → black/green `intro.supervisorBoot` script (Appendix A).
3. `intro.supervisorBoot` finishes → load unchanged S01 at P(0,0), with the 70 s clock idle → show `S01.dayTutorial` (five pages).
4. `GOT IT` → modal closes; S01 is visible. First **valid** WASD move triggers Day 1 clock under the existing rules. Boundary presses have no effect.
5. On Day 1 end → hide player/show turret as existing → show `S01.nightTutorial` (seven pages) using the *existing paused first-night card mechanism*.
6. `GOT IT` → existing `HERE THEY COME!` warning for 2 s (clock paused), then current 45 s night starts and first wave spawns at t=2 s. Every queued wave rule remains in force.
7. Night → score → upgrade loop unchanged.

**Initial economy consistency:** The 5 POWA from the former lightning story was only an obsolete narrative explanation. Starting Banked POWA remains **0** (`BUILD-D18`), and the **GET SCRUBBIN!** button remains free (`BUILD-D40`). Do not add +5 to the bank and do not bring back POWAOUT to the score screen (`BUILD-D33`).

### 4.3 Stage 1 and 2 narrative transitions (Phase 1)

**S01:** existing final scrub → `SPOTLESS!` → fence-building animation → *existing* score and 400-POWA payout once → keep current `MAP 1 COMPLETE!` behavior → insert `S01.supervisorOutro` **before** loading Map 2. On continue, load existing Map 2 upgrade screen, carry POWA/upgrades/Wax/day, preserve Map 2 arrival checkpoint and day-local wave table. Stage label may change from “Map 1” to “Power Panel 1” **for display only**. Do not alter the existing map-complete action count.

**S02:** existing final scrub → `SPOTLESS!` → fence → *existing* one-time 2,500-POWA payout → `S02.supervisorOutro` after the score, before terminal screen. **For Phase 1 only**, preserve `THANK YOU FOR PLAYING!` after that supervisor scene; later activate S03 transition when its approved configuration is built. No extra payout, day increment or upgrade screen purely for watching a cutscene.

**Potential existing outro sequence detail:** The current build describes the victory fence/score/map-complete flow, but no actual code has been inspected here. Claude must locate the live transition points and insert narration after the award, not assume screen names, class names, or event signatures from this spec.

### 4.4 Environmental story and atmosphere

Later maps show mud/blood phrases in world space, often unveiled by room illumination: `WHY?`, `NEED MORE POWA`, and later `Sing the song of the Mud!`. Keep the established cartoon 2D style, with progressively darker overlays, glitches, pauses and selective blood. The existing no-audio placeholder build stays valid; SHLOOP, CLUNK, music interruption, electronic glitches and bad-ending wet splat are **future asset requirements** (`STORY-D23`), not proof an audio subsystem exists today.

## 5. Stage-specific expansion contracts

### 5.1 S03: Emergency Panels (APPROVED-STORY direction; geometry TBD-BLOCKED)

**Setting:** A smaller, segmented exterior array with walkable cleaning zones and locked routes to subsequent segments. A facility building remains dark in the **lower-right area** during gameplay. Designer will provide a separate Map 3 layout image (`STORY-D10` still says TBD).

**Mechanics:**

- Area gating: fully clean specified sector(s), then unlock corresponding path(s). Reuse Panel/Tile positions; store `walkable`, `zoneId`, `doorOrGate`, and `unlockPrerequisites` as map data. No invented dimensions or path sequence.
- Enemies: Small Mud Boys use current baseline; Big Mud Boys from S02 can appear here. Existing Big type remains 2×2, double HP and unknockable. S03 wave numbers and stage-relative day schedule **TBD**; the old Map 1 wave chart is not a new S03 chart.
- **Powerful Shots** can be bought in this stage (`STORY-D12`). It increases damage per turret shot and **does not** change the current knockback distance; Big Mud Boys remain resistant to knockback. Levels, costs, damage values and unlock timing must be approved before production.
- End condition: reach the required **+8 Panel rating** on all designated cleanable playable Panels; gate predicates must also be satisfied. No need to clean wall voids/outside the playable mask.

**End-of-stage scene (`STORY-D13`):**

1. Final clean move triggers **SPOTLESS!**; freeze gameplay and apply the valid map-complete payout **once** using the existing award routine. Do not trigger a night phase.
2. **Do not use S01/S02's fence animation.** Several defensive turrets emerge around the facility; building lights switch on in sequence. Reveal the Clean POWA Co. logo **left to right**, followed by doors, windows and walkway with visibly oozing mud/blood. Hold for a beat.
3. Cheery music stops *if audio has been added*; brief glitch; `S03.yellowFirst` displays `Why?`, `Why did you wake up?`, `...`, `It doesn't matter.`, `We know your weakness.`
4. Glitch to `S03.greenPromotion`, which awards Scrubby the **Janitorial Technician** title and sends him inside.
5. **Skip the immediate post-S03 upgrade screen while cinematics are playing**. Whether S04 first appears on an upgrade screen after the promotion (required for newly purchasable upgrades) or opens via a special loadout screen is **TBD-BLOCKED**. The Map 3 payout must not disappear just because a score **display** was skipped.

**Visual direction:** Corporate lights progressively reveal the same object already present on the map rather than hard-cutting to a different location. Mud and blood remain readable at 1280×720. Actual sequence durations, view framing, audio, sprite art and Map 3 layout not supplied.

### 5.2 S04: Office / Foyer (partially APPROVED-STORY; numeric config TBD)

**Setting:** A connected indoor maze of accessible floor Panels, rooms, doors, hallways, wall edges, pre-laid wiring, office fixtures, and stained surfaces. Big Mud Boys **cannot enter**; Small and **triangular Fast Mud Boys** arrive via designated windows/doors. Preserve established enemy collision/damage rules for Small types; S04 enemy wave counts/HP/times need new tables.

**POWA at entry (`STORY-D08`, COMPATIBILITY EXCEPTION):** Already purchased upgrades persist and remain always active. Banked POWA is deliberately reset or replaced at the S04 boundary; the author accepted an **explicit startup grant** to avoid a soft lock. **Grant amount and exact resulting bank are missing. Do not hard-code 0, +5, or an arbitrary rescue amount.** Completed exterior panels continue producing POWA **in lore only**, with no passive-income mechanic. Unspent Wax charges retain their existing inventory behavior unless the owner specifies an exception. POWA earned in S04 carries to S05. Future S04 transition policy must receive a new repo decision because S01→S02 currently carries bank without reset.

**Indoor features:**

1. **Corner Cleaning upgrade** (`STORY-D14`). On a Panel adjacent to an interior wall, the specifically described **three inner Tiles touching that wall** do not receive Brush POWA from ordinary cleaning until the upgrade is owned. Other tiles still receive the normal brush pattern. The precise three tile indices on each wall orientation and the rule at two-wall corners must be supplied in map data / an approved diagram; do **not** substitute all four edge tiles or change the brush globally. Walls are impassable.
2. **Mandatory Wax** (`STORY-D15`). All designated **accessible floor Panels** must be cleaned to +8 and waxed. Non-walkable wall voids, inaccessible Panels and decorative objects do not count. WAX still requires +8, uses charge packs at live prices, and is impervious to Mud Boy dirt. Wax feasibility and how much POWA is earnable must be validated with simulation or playtest before stage approval.
3. **Pre-laid power cables and Mr. Handy** (`STORY-D16`). Wiring is **already present in the floor** and appears when those floor Panels are cleaned. No player-drawn cable trail, custom routing, branching, or auto-follow path. With the Mr. Handy upgrade, stand at one approved endpoint and press **E**, then reach its paired receiving endpoint and press **E** to connect. Completed pairs open doors **in sequence**, enabling later rooms; the last room's final connections open the exit. The puzzle is discovery + endpoint connection rather than cable drawing. Exact endpoint coordinates, wax requirements for enabling a connection, costs, cancelling a half-complete connection and duplicate-use behavior are **TBD**; show clear visual feedback.
4. **BLOOD and Peroxide Spritz** (`STORY-D09`). `stainType: blood` is a **separate overlay/state**, not an automatic alteration to the numerical −10…+8 clamp. Its initial Tile cleanliness, when it becomes red, how Peroxide is activated/purchased, and whether cleaning is blocked until treatment are **TBD-BLOCKED**. The original raw note's “floor of −5 to all tiles” is **not an approved new formula**. Do not overwrite the existing mud-brown gradient or generic Tile numeric values. Prototype with a visual overlay behind a flag until the actual unlock rules are decided.
5. **Fast Mud Boys** (`STORY-D11`, partially approved). They are **triangular** and have a **shorter move interval** than Small Mud Boys. Their precise interval, HP-by-wave, spawn schedule and pop rules must be in an S04 wave table. The raw note's “twice as fast” suggests a 1.5 s interval as a **PROPOSED playtest starting value**, not a final approved stat. Reuse the current Small Mud Boy hit/knockback behaviors where not changed by the new archetype.
6. **Room reveal messaging.** Blood/mud writing `WHY?` and `NEED MORE POWA`; put at authored fixed locations; do not randomly generate them.

**Completion:** Every required playable floor Panel is +8 **and waxed**, every required cable pair connected, and the final door actually opened. Completion checks occur after gameplay mutations/connection events and must not prematurely fire from the legacy `allPanelsAtMax` test. Display `SPOTLESS!` only after *all* approved conditions are met; maintain single payout. Then `S04.yellowSecond` and `S04.greenAfterSignalLoss` play, and the subterranean entrance becomes available.

### 5.3 S05: Subterranean Facility (concept locked; stage design TBD)

Larger interior than S04 with its previously introduced approved systems, continuing POWA from S04 so Scrubby should feel powerful rather than reset. Rooms light up when cleaned, exposing pleadings and warnings in blood/mud, including an optional `Sing the song of the Mud!` phrase. Clear rooms to reach a final chamber; on legitimate completion, trigger `SPOTLESS!`, open/drop a false exit and fall into a deep cavity. Yellow voice: **“We warned you.”** (`STORY-D17`). Exact geometry, enemies, door sequence, collision effects and event timing are not specified; use placeholders for planning only.

### 5.4 S06: Mud Caves / choice (concept locked; stage design TBD)

Dark cave of filthy walls/floors. Scrubbing selected spots reveals **directional arrows** that guide Scrubby toward masses of Mud Boys and the speaker. Exact maze vs linear-horror balance is not settled. The yellow voice is revealed to be **Mud Mama / Mud Mommy** after this stage's culmination (not earlier; naming is not yet normalized). The Mud Boys reveal Clean POWA Co.'s takeover and the threat of a **colossal Scrubby** that would wipe life from the surface.

At the faction decision, show the literal choice buttons **`SCRUB`** and **`GRUB`** (`STORY-D17`):

- **SCRUB:** Bad ending; giant Mud Boy crushes Scrubby with a deliberately silly wet noise. Award one **run-local** bad-ending unlock/achievement record. Offer **Return to Choice** and **Main Menu**. Don't persist the achievement across page refresh while the base game has no saves (`BUILD-D24`). Name/achievement platform require approval.
- **GRUB:** Mud Momma kisses Scrubby, transforms him into **Grubby, Champion of the Mud Boys**, and the second campaign begins. Mark branch state in memory *after* choice confirmation. Introduce the reversed play carefully; exact tutorial/script/assets and final ending are pending.

`STORY-D17` mentions that the revelation *could* be pushed to a Map 7 depending on pacing, but `STORY-D01` explicitly approved **six forward maps**. Therefore **do not add a seventh forward map without a new owner decision**.

### 5.5 Grubby reverse campaign: `R06` to `R01` (design direction; not ready for full implementation)

**Narrative:** Grubby becomes an ally of the Mud Boys and retraces the facility, shutting down the chain that will activate Clean POWA Co.'s giant robot. The player sees the same environment and systems from the other side, with changes to palette, enemies, floor-state goals and some puzzles.

| Area | APPROVED-STORY reversal | Missing for production |
|---|---|---|
| Movement | Grubby subtracts the **same brush coverage and per-Tile magnitudes** that Scrubby adds, instead of cleaning; clamp remains at −10 | Input/phase timing and how starting reverse-stage floors are seeded |
| Special action | Wax action is **replaced by a pop-like filth burst**, upgradable to dirty more panels | Button, area of effect, charges, price, unlock levels, how it affects protected Wax |
| Enemy | From **Map 7 onward**, hostile **Scrubber bots** replace hostile Mud Boys; use the existing wave/movement/HP/knockback architecture | Their exact HP, cleansing effects, per-stage wave tables, footprints and spawn edges |
| Turret | Same remote-access turret system can be controlled by Scrubby/Grubby; protagonist retains maintenance override authorization | Why/how the turret accepts Grubby's new targets, one or two script lines; skin and UX |
| POWA | More filth produces more resource; build a separate reverse-income calculation using same accounting infrastructure | Exact conversion table, rounding, caps, starting balance and migration of purchased upgrades |
| Stages | Revisit all six settings in **reverse stage order**, using goal-based sabotage plus filth targets instead of simply filling huge Map 2 to −10 | Specific `R06` role, locks, goals, wax stripping and end-of-game event |
| Phases | Original notes suggest **night movement/filthing and day turret/defense**; user approved that turret mechanics still work in a reversed cycle | Whether to actually swap clock labels and day/night order, how Day 1 works after transformation, timer and spawn parity |
| Feedback | Movement word becomes **`SPLAT!`**, with dirtier visual language | How COMBO/SLIP!/ICK! are remapped; additional copy and sounds |

**Important distinction:** Exact mirroring of Scrubby's brush means e.g., Brush POWA 2 would produce −2 on the center 2×2 and −1 on the outer 12; the current −10 floor clamps changes. This is the approved directional mirror of **cleaning**, not approval of a reverse POWA *formula*. Currency per negative Panel must be signed or mapped separately; `0.5×abs(negative panel rating)` would be a **prototype candidate only** and is not an approved balance value.

**Existing Wax conflict (TBD-BLOCKED):** The currently implemented Waxed Panel is immune to **all** cleanliness changes. Grubby must eventually be able to sabotage the existing waxed floors, but the owner has not defined the stripping/unsealing action. Do **not** quietly make Wax ineffective or directly overwrite `waxed` Tiles. Likewise, don't reset persistent purchases, refund POWA, or re-enable maintenance/equip costs without the reverse migration decision.

**Current no-save vs branch achievement conflict:** `STORY-D22` accepted choice checkpoint + one-time unlock while `BUILD-D24` says refreshing loses progress. Until a new saving decision, checkpoint and achievement may be **once per active run only**. Cross-browser or across-refresh achievements require explicit approval and new infrastructure.

## 6. Proposed extension architecture (nonbinding design recommendation)

Implement a **small additive orchestration layer**, not a rewrite of Phaser scenes:

- `CampaignStageRegistry`: `stageId`, `campaignFaction`, `displayName`, geometry config reference, available mechanics, requested end behavior, trigger conditions.
- `NarrativeDirector`: event queue (`eventId`, `trigger`, `presentationMode`, `lines`, `seenPolicy`, `onComplete`), input interception, paused clock/simulation integration.
- `StageTransitionDirector`: listens to existing single-award victory signal, runs the appropriate scene chain, then calls the current map transition. Guarantees `scoreAwardApplied=true` once; a scene should never call the currency adder twice.
- `Environment/RoomGates` for S03 onward only: walkable masks, wall edges, sectors, door prerequisites, visual reveals, fixed spawn portals and wire endpoints. Do not introduce passable wall Panels merely to fit the current regular grid.
- `EnemyArchetypes` uses existing Small/Big source logic; new Fast/Scrubber modes are config-driven extensions and use explicit wave tables.
- `ScoringStrategy` / `FactionRules`: existing Scrubby scoring remains untouched, new Grubby scoring is separate and activated only in reverse mode.
- `DebugStageSelect` in dev builds only: inspect story and future stage transitions without replaying long maps. It must not expose story spoilers in public.

**Suggested stage config schema for later maps (structure only, *not* populated data):**

```ts
type StageId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' |
               'R06' | 'R05' | 'R04' | 'R03' | 'R02' | 'R01';

type ExpansionStageConfig = {
  stageId: StageId;
  displayName: string;
  originalMapReference?: string; // S01/S02 reuse implementation
  mapLayoutReference?: string;   // S03-S06 awaiting author image/layout
  faction: 'scrubby' | 'grubby';
  walkablePanels?: unknown;      // pending mask representation
  zoneGates?: unknown;           // pending approved coordinates
  scriptedEvents?: string[];
  requiredObjectives?: string[]; // concrete predicates defined per stage
  enemyWaveTableRef?: string;    // new table needed for S03 onwards
  victoryPresentation?: 'existingFence' | 'facilityReveal' | 'interiorExit' | 'narrativeChoice' | 'sabotage';
};
```

**Data contract recommendations (PROPOSED):** Use stable IDs for each room/door/zone/cable endpoint and narrative event; only serialize runtime state when the saving strategy is approved. Keep `Panel` coordinates from the current map implementation rather than renumbering the grid. Store `blood` as a separate overlay, `waxed` as the current immutable protection state, and story readiness flags in a namespace that cannot affect existing scoring directly.

## 7. Build phases, gates and acceptance tests

### Phase 1 — **BUILD NEXT**: story shell without gameplay changes (`STORY-D24`)

- [ ] Inspect actual `DECISIONS.md`, Phaser scene structure, title/start flow, current Map 1 Night 1 onboarding, victory handler and Map 2 finish handler. Record discrepancies before making changes.
- [ ] Implement reusable comic/cinematic screen, green terminal, on-map multi-page tutorial and yellow terminal presentation as isolated UI components. Yellow mode may remain unreachable until S03.
- [ ] Load intro/slime comic and green boot script before Map 1. No legacy lightning graphic and no 5-POWA grant.
- [ ] Insert the five Day 1 tutorial messages, with first-move trigger intact.
- [ ] Merge the seven Night 1 messages into existing paused `NIGHT TIME!` gate, then current warning/wave scheduling.
- [ ] Insert supervisor terminal after S01 fence + score/payout and before S02 load.
- [ ] Insert supervisor terminal after S02 fence + score/payout, preserving the current Thank You screen as the temporary endpoint.
- [ ] Retain one-time scoring, map arrival checkpoint, global day number behavior, Map 2 wave reset, 96 px HUD and full Combo functionality.
- [ ] Provide a dev-only skip for *previously viewed* dialogue and tests for the click-to-finish/click-to-advance behavior; no permanent saves.
- [ ] Add tests for timers frozen while dialogs are active and no phantom movement/shot input behind overlays.

**Phase 1 exit acceptance:** With story features on, player can run the unchanged two-map game start-to-finish; Map 1 still pays 400 on a full clean, Map 2 pays 2,500, both only once; no unintended change in first-night wave timing, existing upgrades, map dirt, counter recharge, Combo, or try-again. `STORY-D24` author priority satisfied.

### Phase 2 — S03 vertical slice; blocked until Map 3 layout available

- [ ] Receive designer's Map 3 image and translate to panel mask/sector/gate coordinates.
- [ ] Define Powerful Shots pricing/levels/damage and S03 small/Big wave table.
- [ ] Prototype one small gated segment in isolation, including unlock feedback.
- [ ] Build S03 target scene with dark lower-right building, reveal sequence, first yellow intrusion, and green promotion.
- [ ] Confirm where stage-completion score is credited and where the first S04 upgrade purchase occurs; keep any skipped screen purely presentational.
- [ ] Preserve S01/S02 fence effects as stage-specific; no modification of original victory path.

### Phase 3 — S04 single-room mechanics prototype; blocked on numeric definitions

- [ ] Supply S04 room/wall diagram and exact three blocked Tile indices for each wall orientation/corner.
- [ ] Define Corner Cleaning, Peroxide Spritz, Mr. Handy unlock/costs; confirm whether Peroxide auto-applies or uses a key.
- [ ] Define BLOOD overlay/reveal/clean preconditions, and initial dirt/stain values while preserving −10…+8.
- [ ] Configure pre-laid wire reveal, E at each endpoint, sequential door gates; no player-drawn wires.
- [ ] Define S04 startup grant/reset value and no-softlock budget model, retaining owned upgrades.
- [ ] Define Fast archetype and S04 spawn table, including window/door portals.
- [ ] Playtest whether mandatory Wax economy is viable; do not lock the stage without sufficient POWA earning path.

### Phase 4 — S05/S06 and branching story; requires authored maps

- [ ] Layout/room/door/fall design for S05; decide environmental messages and scripted reveal.
- [ ] Layout and pacing for S06, including arrow-cleaning puzzle and moment Mud Momma is shown.
- [ ] Complete branching script for SCRUB/GRUB, run-local choice checkpoint and choice confirmation.
- [ ] Test bad-ending return-to-choice, no duplicated achievement triggers or score awards.

### Phase 5 — one Grubby reverse vertical slice, then entire reverse route

- [ ] Lock exact reverse phase order and R06 purpose without dropping the sixth revisit.
- [ ] Lock pop-like ability AoE, cost/controls/upgrades and wax-counterplay treatment.
- [ ] Lock Scrubber bot archetypes, wave tables and positive cleaning footprint.
- [ ] Lock reverse POWA formula, current-upgrade conversion, beginning currency, and COMBO/feedback mapping.
- [ ] Define objective-based sabotage targets and success condition for each of R06…R01.
- [ ] Prototype one small reverse map before building the complete return journey and ending.

### Test matrix: regression suite (minimum)

| Area | Invariant test |
|---|---|
| Story pause | Freeze/restart timers, Mud Boy movement and queued wave spawn across scene open/close and browser tab focus |
| Click/type | One click completes typing; next click advances; last dialog call completes once |
| HUD | No modal swallowing pause/resume forever or covering HUD with unintended pointer events |
| Economy | Start bank 0; no 5-POWA charge; one POWA-IN award; no maintenance or activation toggles |
| Cleaning | Tile clamp −10…+8; correct Brush 2 pattern; +8 victory and Wax; current Combo response |
| Original enemies | Small and Big HP, dirt/pop AoE, forward collision, knockback, bottom/left/right spawn, waves |
| Stage transition | Map1→Map2 bank/inventory/day carried; Map2 arrival checkpoint; Map2 day-count wave table |
| Retry | No repeated onboarding unless full new game; TRY AGAIN remains map-arrival rollback |
| S03–S06 gates | Locked paths remain locked, walls don't count as floor, stage can't win before all objectives |
| Reverse | Existing Scrubby scoring unaffected; Grubby dirt scoring isolated; Wax cannot silently lose immunity |

## 8. Open decisions, real blockers and contradictions prevented

**These are not hidden assumptions.** Each line names an unresolved detail or a superficially conflicting requirement, with the chosen safe handling and what is needed next.

| ID | Issue | Current safe handling | Owner / asset needed |
|---|---|---|---|
| `OPEN-01` | Map 3 grid, zone masks, gates, enemy routes (`STORY-D10` was checked but explicitly says **TBD**) | **Block full S03 build**; prototype generic one-zone only | Map 3 image plus coordinate grid |
| `OPEN-02` | 6-map return vs older 5-return-stage recommendation | Keep all **R06–R01** as provisional IDs; don't silently omit cave revisit | Reverse map 6 role and objectives |
| `OPEN-03` | S04 Banked POWA reset vs no day cost and existing carry-over | Keep original S01/S02 economy; S04-only new decision; startup amount **unset** | Exact reset/grant; S04 opening screen |
| `OPEN-04` | Later stage WAX and cleanliness formerly referred to +4 | Apply current +8 everywhere; add new rule only on approval | No extra decision for conversion |
| `OPEN-05` | Old WAX cannot be scrubbed vs Grubby spreading filth on old floors | Do not disable protection; require explicit unwax/sabotage mechanic | Wax counterplay spec |
| `OPEN-06` | “BLOOD floor −5” vs current −10…+8 values (`STORY-D09`) | Separate `blood` stain overlay; no numeric penalty without approval | Exact stain/Peroxide activation |
| `OPEN-07` | “3 internal wall-touching tiles” unspecified at corners | Respect 3 as author intent, do not change to 4 edge tiles | Four orientation masks + two-wall logic |
| `OPEN-08` | Original cables were player-drawn; author now says pre-laid | **Use only pre-laid, floor-revealed, paired endpoints** | Endpoint/wax gating and coordinates |
| `OPEN-09` | “Powerful Shots damage only” without cost/levels | Keep damage=1 until approved new data row | Upgrade table |
| `OPEN-10` | Fast triangular enemies have interval shorter than 3 s, but no stats | Do not treat 1.5 s as final; define S04 wave config | Fast archetype + spawn table |
| `OPEN-11` | Current Big Mud Boys only Map 2; story adds them S03 | Reuse existing type in S03 only if configured, not a global change | S03 wave rules |
| `OPEN-12` | S03 wants Spotless + cutscene, skipping score screen; build always scores/fences | Stage-specific presentation; payout once internally, **no fence S03 only** | S03 award/next-menu sequencing |
| `OPEN-13` | `STORY-D22` one-time achievement/branch checkpoint vs current no saves | Runtime-only achievement & checkpoint; no persistent unlock | New save decision only if desired |
| `OPEN-14` | Map 7 corporate Scrubber bots vs six-stage forward route | Interpret Map 7 as first reverse stage; no Mud Boys as hostile thereafter | Exact reverse enemy wave tables |
| `OPEN-15` | Reverse night cleaning vs day shooting requires changed clock order | Not fixed by “mirror brush”; separate reverse phase rule | Clock labels, start ordering, timers |
| `OPEN-16` | Historical old upgrade setup says maintenance/toggles and cost-to-start | Ignore archived handoff; keep D37/D40 | None; regression tests |
| `OPEN-17` | Stage 4 all-floor mandatory Wax with high total charge cost | Model affordability; ensure no unwinnable soft lock | S04 size, balance and income |
| `OPEN-18` | `STORY-D24` checkbox blank but author wrote first task | Treat explicit written instruction as Phase 1 approval; leave full campaign later | No additional decision for Phase 1 |
| `OPEN-19` | Audio cues requested but existing build is silent | Text/visual placeholders first; implement audio only by new decision | SFX/music assets and playback policy |
| `OPEN-20` | `STORY-D17` suggests a possible Map 7 cave reveal despite six forward maps approved | Follow six-map plan; no seventh stage without explicit change | Only if narrative structure revised |

**Decision checklist status summary:** `STORY-D01–D09`, `D12–D16`, `D18–D23` generally have author directions but several are *partial*; `D10` map is TBD despite a tick, `D11` has a written partial decision despite no tick, and `D24` defines Phase 1 despite no tick. The old grouped `B-01…B-06` are reported already fixed in the current build; do not reopen them from older docs. Treat remaining numerical/map choices as open rather than automatically adopting defaults from the earlier draft.

## 9. Claude Code implementation brief (copy/paste prompt)

> You are extending a working Clean POWA! repository. **Read `DECISIONS.md` first**; it is the authority for existing D01–D52 rules and supersedes archived handoff documents. Read the supplied *Clean POWA! Game Design Doc — Current Build* and this `Clean_POWA_Expansion_Spec_Current_Build_Compatible.md` next. Use STORY-Dxx labels to distinguish story author decisions from repo Dxx.
>
> **Implement Phase 1 only.** Add three-panel slime/lever intro, green terminal boot messages, the five-page Map 1 first-day tutorial, seven-page Map 1 first-night tutorial folded into the existing NIGHT TIME! gate, and green terminal supervisor scenes after the existing Map 1 and Map 2 complete sequences. Apply `Power Panel 1` and `Power Panel 2` only as player-facing stage labels. Implement reusable data-driven scene/message UI and a stage transition seam, but **do not build or guess Maps 3–6** yet. Keep Map 2's Thank You endpoint as a temporary conclusion.
>
> Maintain current `−10…+8` tiles, +8 WAX and win checks, starting Banked POWA 0, free day starts, no maintenance/equip toggles, all existing upgrade prices/unlocks, COMBO, original Mud Boy/Big Mud Boy rules, phase timers and wave scheduling, Map 1/2 dirt and camera, single victory award, retry checkpoints and run-only no-save state. Pause gameplay while dialogs are visible; a click during typing completes the current line; a second click advances it. The Night 1 tutorial must end before the current 2 s warning, and wave 1 still spawns at night t=2 s.
>
> Inspect the code and report affected files before changes. Preserve tests and add regression tests covering dialog pause/replay, first-night onboarding, 400/2,500 single payouts, upgrade/currency parity and Map 1→Map 2 carry-over. Record any proposed override of a repo Dxx behavior as a **new decision requiring owner approval**; don't commit a silent rule change. Finish by summarizing exact files modified, tests run, deviations/limitations and Phase 2 prerequisites.

## Appendix A. Authored narrative script, ready for dialogue data

The following is light copyediting of the author's earlier narrative text. It is **not** a new invented script. Display the snippets as separate entries (one click per entry). Use these stable IDs in content files, and adjust wording only when explicitly approved.

## INTRO-BOOT — green terminal, after emergency-power comic

1. **INTRO-BOOT-01:** “Hello?”
2. **INTRO-BOOT-02:** “Scrubby? Do you read me?”
3. **INTRO-BOOT-03:** “Oh wow! It's working! Your signal is coming in clear.”
4. **INTRO-BOOT-04:** “We haven't heard anything from this site in some time. Good to see that your systems are up and running.”
5. **INTRO-BOOT-05:** “*Running facility diagnostics*...”
6. **INTRO-BOOT-06:** “Huh...”
7. **INTRO-BOOT-07:** “It looks like the facility is pretty low on POWA. But that's why we have you! :)”
8. **INTRO-BOOT-08:** “We'll deploy your unit onto the first Power Panel and get you started.”

## S01-DAY — on-map tutorial, first day only

1. **S01-DAY-01:** “Deployment to Power Panel 1 was successful! Looks like the problem is all that FILTH built up on the power cells.”
2. **S01-DAY-02:** “Use the W A S D keys to move around the Power Panel and scrub off the grime.”
3. **S01-DAY-03:** “It may take a few repeated scrubs to completely clean off each cell, so don't be afraid to scrub in a circle for a bit.”
4. **S01-DAY-04:** “Once you have enough POWA banked, you can purchase advanced systems to help speed along the process. We even have some WAX in store you can deploy to help keep the Power Panel clean.”
5. **S01-DAY-05:** “We'll reach out at the end of the day to check back in. Good luck!”

## S01-NIGHT — on-map tutorial, first night only

1. **S01-NIGHT-01:** “Great job scrubbing! We are detecting POWA flowing into the on-site systems.”
2. **S01-NIGHT-02:** “Our scans are detecting some local fauna approaching Power Panel 1. Probably just some Mud Boys. This planet is lousy with them.”
3. **S01-NIGHT-03:** “They're relatively harmless, but have a nasty habit of spreading FILTH wherever they go. That's where you come in. :)”
4. **S01-NIGHT-04:** “Use the mouse to click on any Mud Boys that get on the Power Panel to give them a little push with our patented SCRUB TURRET. If you hit them quickly enough, they will tumble right off. The more stubborn ones may need a bit more pressure to deal with.”
5. **S01-NIGHT-05:** “Don't worry about hurting them. They're just Mud Boys. They don't feel a thing.”
6. **S01-NIGHT-06:** “Deal with them quickly or you'll be stuck cleaning this Power Panel forever. You'll see what I mean.”
7. **S01-NIGHT-07:** “Good luck!”

After **Got it**, retain the existing “HERE THEY COME!” warning (exact case/timing depends on baseline decisions).

## S01-COMPLETE — green terminal, after Spotless

1. “You did it! Power Panel 1 is completely clean.”
2. “You probably saw already, but the Power Panel's clean state enabled the perimeter defense to activate.”
3. “That should keep the Mud Boys out for good. I wonder how they got lowered in the first place?”
4. “We're sending you to Power Panel 2 now. It's the main POWA supply for the whole Facility.”
5. “It's a bit bigger than the last one, so make sure to use your Banked POWA to improve your loadout.”
6. “We're still reading a lot of Mud Boy activity out there, so stay alert.”

## S02-COMPLETE — green terminal, after Spotless

1. “Fantastic job, Scrubby! We are seeing the Facility's primary systems back online!”
2. “It's good to see POWA flowing again. Hard to believe you've been offline for so long.”
3. “We still aren't getting any readings from within the Facility, so I guess that's where we are sending you next. :)”
4. “Don't worry about maintaining Power Panels 1 and 2. The perimeter fences should keep them safe and POWA flowing.”
5. “Despite all the POWA we're gathering, we will still need a little more to access the Facility.”
6. “There's a main office complex nearby that appears to be in lockdown. It has some Emergency Panels set up that we can use to trigger the Disarm Protocols to access the interior.”
7. “All you've got to do is use your loadout to clean the Emergency Panels and we'll have full access again!”
8. “The Emergency Panels have fewer power cells than you'd expect, but there's a trick to cleaning them you'll have to decipher once you're there.”
9. “Stay alert for Mud Boys. If all goes well, there might even be a promotion in it for you.”

## S03-YELLOW — first intrusion after bloody facility reveal

1. “Why?”
2. “Why did you wake up?”
3. “...”
4. “It doesn't matter.”
5. “We know your weakness.”

## S03-PROMOTION — green terminal, after first intrusion

1. “Scrubby? You still there?”
2. “It looks like the connection dropped for a second.”
3. “I've got good news! After reviewing your performance cleaning the exterior Power Panels, we've decided to promote you to Janitorial Technician!”
4. “Your first task will be to clean up the main foyer and work areas of the office complex to restore power to the internal diagnostic systems.”
5. “You'll need some slightly specialized equipment to get this done. Thankfully, all you need to do is SCRUB some of the kinetic POWA Panels inside the office so that the external POWA system can transfer POWA internally.”
6. “How intuitive is that? Our bosses sure are dynamite engineers.”
7. “Well, don't let me keep you, Scrubby. Congrats on that promotion! I'll be in touch.”

## S04 environmental text — visible in specific rooms

- “WHY?”
- “NEED MORE POWA”

## S04-YELLOW — second intrusion after office door opens

1. “You don't seem like the others.”
2. “...”
3. “Do you even know what they were doing here?”
4. “Please.”
5. “Don't make us hurt you.”

## S04-SUPERVISOR — green terminal, after second intrusion

1. “Did we lose you again, Scrubby?”
2. “These signal drops are getting longer.”
3. “If this keeps up, it'll be just like last time.”
4. “But that's not something you need to worry about, little buddy!”
5. “Great job cleaning up the office. It looks like the subterranean levels have opened up now.”
6. “Still no signal from the Facility, though. There's probably something down there blocking the transmission.”
7. “I think I know just the bot for the job! Get in there and make us proud, Scrubby!”

## S05 environment and final warning

- Environmental text example: “Sing the song of the Mud!”
- **S05-YELLOW-01:** “We warned you.”

## S06 revelation and choice — script not yet written

**Story requirements only:** the Mud Boys say they are the native inhabitants; Clean POWA Co. is invading; the facility threatens their planet; other Scrubby bots were destroyed; a colossal Scrubby will erase surface life if activated. They offer a choice: ally with the Mud Boys or be destroyed. **No specific lines, branch-button text, or precise sequence have been supplied.** See D-17 and D-22.

## Transformation and reverse campaign — script not yet written

**Story requirements only:** Mud Momma kisses Scrubby, names the new filth-generating character **Grubby, Champion of the Mud Boys**, and sends Grubby backward to sabotage the reactivation. UI action text should feature **“SPLAT!”**. The supervisor's reaction, Mud Momma's voice, and the final ending script remain TBD.

---



---

## Appendix B. Change-control crosswalk

| Expansion area | STORY decision(s) | Baseline implementation decisions at risk | Rule for Claude |
|---|---|---|---|
| Intro and tutorials | D02, D04, D05, D06, D24 | BUILD-D18, D24, D38, D12, D40 | Story-only, no currency or timer rewrite |
| Existing stage display + outro | D01, D03, D04, D13 | BUILD-D23, D48, D13, D14, D43, D44 | Existing fence, payouts, checkpoints stay |
| Map 3 completion reveal | D10, D11, D12, D13 | BUILD-D15, D23, D45, D50 | Stage-specific new conditions and presentation |
| Office/circuits/BLOOD | D08, D09, D14, D15, D16 | BUILD-D19, D22, D30, D31, D37, D40 | Add map-scoped fixtures/masks, never global cap changes |
| New enemy families | D11, D12, D18 | BUILD-D06–D12, D16, D25, D32, D44, D45, D50 | Extend archetypes using authored wave rows |
| Reverse campaign | D01, D17–D22 | BUILD-D18, D19, D22, D24, D30, D33, D37, D40 | New faction policies, no overwrite of Scrubby mode |
| Art, audio and completion | D13, D22, D23 | BUILD-D28, D29 | Optional assets/overlays, preserve working placeholders |

## Appendix C. Document coverage notes

- **Current Build PDF**, pp. 1–6: rules and current user interface; pp. 7–10: D01–D52 decision index; pp. 11–14: open implementation details, test history, and collision-check guidance.
- **Updated Story Decision Checklist**, pp. 1–8: accepted or partially specified STORY decisions; pp. 9–10: baseline issue groups reported resolved in the live build; p. 11: outdated summary table still says TBD, so the written choices in D01–D24 prevail.
- **Original Story Expansion Draft**, Appendix A and supplied raw story notes: script and story reveals. Older mechanical baselines in that draft have been replaced here by the current build.
