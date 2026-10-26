# Clean POWA! | Design History, Intentions and Roadmap

**Review edition: 25 October 2026.** This is a qualitative history of decisions and why they matter. Prior conversations are summarized as historical intention, not quoted as immutable requirements. Where source documents disagree, the decision register controls the **OPEN** status.

## The core concept

The original pitch was a small cleaning robot working on a muddy expanse over solar cells. **Daytime work** cleans panels and enables energy production. **Nighttime defense** fights creatures that muddy the array. POWA fuels both the next day's operation and long-term upgrades. This was pitched as a blend of cozy progression/incremental growth, tower-defense tactics, and a light horror texture. The design evolved away from an open-ended survival sandbox toward a tightly defined day/night cycle, discrete panels, visible cleanliness, and a clear completion goal: clean the whole array.

## Why panels contain smaller tiles

A single square per movement step would make the map look binary (muddy or clean). The chosen system stores 16 independently colored tiles inside each traversable panel. A default scrubbing pass hits the center four tiles at full strength and the outer twelve at half strength. That creates partial cleanup, encourages revisiting panels and creates visual gradients, while the player still moves in easy-to-understand panel-sized steps. Panels aggregate tile values through truncation toward zero to drive energy earnings and level completion. Grid coordinate generation was separately tested with Map 1's endpoint `P(9,9)T(39,39)`; the later 25×25 map inherits the same 4×4 logic.

## How the day length changed

An early concept risked teaching players an overly strict movement rhythm that required nearly perfect timing before the music and animation existed to communicate it. The daylight phase was revised/expressed as **70 seconds** to allow roughly two extra scrub actions and a more forgiving start. The wider intent remains that Scrubby's actions have an efficient, almost musical tempo. The exact level-one viability should be playtested with real input latency, timer implementation, and POWA math, not assumed.

## Why the next day has an energy cost

The **5 POWA** activation requirement reframes the game from only filling an energy meter into choosing whether to spend a scarce operating budget on improvements. Upgrade unlocks are permanent within a run; stronger equipped upgrades incur a *daily* maintenance cost, so the player can turn expensive abilities off or equip lower previously purchased tiers. This creates deliberate trade-offs: cleaning more quickly, enlarging ammo/scrub capacity or defending more effectively may help income, but the build must remain sustainable. The lightning-strike story provides the initial free wake-up and explains why startup energy is necessary. The exact ledger sequence is not fully settled [D02/D18].

## Why Wax and Retractable Bristles were introduced

Scrubbing an already clean panel should eventually stop wasting effort. **Retractable Bristles** turns +4 panels into traversable routes that don't spend scrub resources. **Wax** is a protective consumable for a fully clean panel, preventing Mud Boys from reversing progress, and even without Bristles a waxed panel is a free traversal panel. Together these mechanics support a long-term progression from fragile clean patches to permanent safe corridors. Wax's demo presence and tier-purchase interpretation remain unresolved [D01/D22].

## Why night defense uses a single top-of-screen turret

Click-to-shoot is simple to understand and makes night feel different from the WASD cleaning phase. A top-margin turret naturally aims left or right, with recoil as an animation, while shooting instantly resolves damage and knockback. The original thought of spawns on all four edges conflicted with the illusion of shooting an enemy *toward* the turret. Later demo notes restrict spawns to bottom, left and right, reserving top spawns for a potential future perspective/camera solution. The full-map firing range avoids aiming and occlusion constraints for the first demo. The turret has no specified grid coordinate or projectile collision physics requirement.

## Why knocking Mud Boys off-map matters

Mud Boys can either burst and damage the solar array, or be pushed backward off the platform without a dirty pop. The original question was whether to add an invisible ring of dummy panels for off-map detection. The later Enemy specification explicitly resolves this by **checking the destination coordinate against valid map bounds** before movement. No invisible tile state is required. The `SPLAT!` margin text supplies a cheap cartoon payoff in the demo; a later full version could animate an edge fall.

## How enemy difficulty grows

The escalation is driven by a separate day-indexed table rather than a single fixed enemy group. The day count intentionally does **not reset** on advancing to the larger map; a player carries upgrades *and* the pressure of later wave schedule rows into Map 2. The schedule cycles enemy approach direction, raises enemies per wave, adds multiple waves, and increases enemy HP values for later periods. This motivates early upgrading rather than solving each map independently. This system is well defined in data but still has several prose/data disagreements [D06–D12/D21/D25].

## Scope discipline: demo first, expand later

The intended initial result is a **two-map demo** with a 30–90 minute aggregate playtime target. The first map teaches the mechanics; the second map tests whether those choices scale to a larger challenge. Later map concepts: Map 3 with a plus-shaped layout, Map 4 with a rounder layout, and perhaps more environmental variety. Additional ideas include full story comics, ending messages about CLEAN POWA, animation/audio polish, optional starting-position purchases, saving/loading, a user-controlled early end-of-day, and alternative enemy variants. These should be **backlog ideas**, not demo acceptance criteria. The initial full version was not intended to add additional enemy archetypes unless the design changes.

## How the art direction emerged

The player robot, turret and Mud Boy designs aim for soft, expressive shapes rather than realism. Scrubby should read from above at small scale and visibly scrub; the turret has a calm/firing-pose pair, with squash/recoil and flash; Mud Boys are playful but uneasy, with dripping mud and glowing yellow eyes. The separate initial-play-screen concept demonstrates the HUD placement, earthy margins, grid, robot marker and gradual color cleanup. It is a reference image, not a final render. Assets described in project discussions do not automatically exist as usable sprite files; only included originals in the ZIP should be treated as delivered assets.

## Project and tooling intention

The project owner intends to build the game with substantial AI coding assistance (Codex or Claude style), store changes under Git, run it through a browser link and keep Azure operating cost very low. Much of the planning effort went into resolving contradictions *before* generating a large build prompt. Documentation expanded into multiple source files, a spreadsheet of balancing tables and Obsidian-style task tracking, then CLEAN copies were created to remove minor editorial noise while preserving unresolved game-design conflicts. The current handoff is meant to let an independent reviewer challenge the mechanics and offer a focused set of design decisions, rather than spawning another patchwork rewrite.

## Suggested roadmap after review (recommendation, not requirement)

**Checkpoint 1: resolve core invariants.** Sign off the P0 decisions, particularly economy ledger, recharge semantics, enemy movement, queued wave behavior, Wax purchases, checkpoints and victory scoring.

**Checkpoint 2: build a tiny mechanical prototype.** No final art required. Implement one 4×4 panel/tile brush pass, a 10×10 map, one day timer, POWA scoring, and one Mud Boy with knockback. Make events deterministic and log them.

**Checkpoint 3: implement data-driven demo loop.** Import the complete workbook tables into typed config, validate every day row and upgrade level, and add phase transitions, scoring, retry and map checkpoints.

**Checkpoint 4: run a balance/playability review.** Test Day 1 without perfect play; inspect whether 5 POWA is attainable, upgrade maintenance is survivable, Wax trivializes the game or provides the intended benefit, and late waves remain defeatable within 45 seconds.

**Checkpoint 5: add art and deploy.** Implement the concept UI and phase effects, add only owned/licensed assets, version the repo, choose a low-cost browser host and create an easily repeatable deployment. Save/load, extra map shapes and new monsters follow only after the two-map experience is sound.

## Reviewer brief

Focus less on stylistic nitpicks and more on whether the loop is **coherent, fun, intelligible to a first-time player, testable in code, and financially self-sustaining in POWA**. The desired output of review is a list of concrete decisions, revised acceptance tests and a prioritized build slice. Please label suggested changes explicitly rather than presenting them as already approved.
