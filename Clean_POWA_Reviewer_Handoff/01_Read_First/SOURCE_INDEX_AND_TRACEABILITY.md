# Source Index & Traceability

The following files are copied byte-for-byte from the ten original project attachments. All paths below begin at `05_Original_Source_Files/` unless shown otherwise. See the SHA-256 manifest for integrity. Text in the master synthesis uses short source names GDD, RULES, ENEMY, MAPS, UI, BALANCE, and PENDING.

| Source | What it contributes | Most relevant open decisions |
|---|---|---|
| `Clean_POWA_Demo_Game_Design_Specification_CLEAN.txt` (GDD) | narrative, demo/full scope, start/gameplay flow, movement, timers and banks, upgrade transaction, map victory, Mud Boys, screen text | D01–D06, D11–D16, D18–D19, D23, D25–D26 |
| `Clean_POWA_Rules_and_Formula_Specification_CLEAN.txt` (RULES) | cleanliness/color palette, brush footprint, panel rating and POWA conversion, score/bank, Wax, cost, retry/saves | D02–D04, D13, D18–D19, D22–D25 |
| `Clean_POWA_Enemy_and_Turret_Specification_CLEAN.docx` (ENEMY) | Mud Boy spawn/HP/advance/knockback/pop, edge detection, collision, turret aim, full 90-day wave chart | D06–D12, D16, D20–D21, D25 |
| `Clean_POWA_Maps_and_Coordinates_Specification_CLEAN.docx` (MAPS) | 10×10 and 25×25 grids, 4×4 tiles, panel/tile addresses, win criteria, map completion, retries | D13, D15, D19, D27 |
| `Clean_POWA_UI_Assets_and_Technical_Build_Specifications_CLEAN.docx` (UI) | UI flow, day/night presentation, header concept image, timer table, pause/retry controls | D02, D06, D12–D15, D17, D25, D27–D28 |
| `Clean_POWA_Balance_and_Configuration_Workbook_CLEAN.xlsx` (BALANCE) | official numeric tables across **Brush AoE, POWA conversion, Timers, Upgrade definitions, Upgrade Levels, Mud boy Waves, Map definitions, Global defaults, colors** | D01, D03–D09, D17, D21–D22 |
| `Clean_POWA_Remaining_Spec_Decisions.txt` (PENDING) | 17 previously logged, intentionally unresolved conflicts; some text is now out of sync with current CLEAN documents | D01–D17 |
| `Clean_POWA_Coordinate_Grid_Generation_CLEAN.txt` | verified 40×40 tile addressing for Map 1; end cell `P(9,9)T(39,39)` | no open coordinate question |
| `Coordinate Grid Generation.txt` | prior grid-generation notes and references to coordinate exports | no open coordinate question |
| `Inirtial play screen concept.png` | early visual sketch of top bar, grid, margin colors and robot marker | D27–D28 |

**Extra copies:** the image is also provided in `06_Visual_References/Initial_play_screen_concept.png`; the balance workbook tabs are also exported without changes under `04_Data_Tables/`.

**Source freshness caveat:** There is no declaration that a document's `CLEAN` suffix confers behavioral precedence. It primarily means typo cleanup. The consolidated master flags contradictions rather than attempting to reconcile them by timestamp or filename. The PENDING register's item 1 appears stale relative to the exact attached GDD and workbook; the newly written open-decision register describes their *current* disagreement.
