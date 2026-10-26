# Configuration and Balance Tables

All nine tabs from the uploaded `Clean_POWA_Balance_and_Configuration_Workbook_CLEAN.xlsx` are exported here *without editing data*. Worksheet-to-file mapping:

- `Brush AoE` (`A1:D4`; 4 rows) → `Brush_AoE.csv`
- `POWA conversion` (`A1:B16`; 16 rows) → `POWA_conversion.csv`
- `Timers` (`A1:D5`; 5 rows) → `Timers.csv`
- `Upgrade definitions` (`A1:C10`; 10 rows) → `Upgrade_definitions.csv`
- `Upgrade Levels` (`A1:D51`; 51 rows) → `Upgrade_Levels.csv`
- `Mud boy Waves` (`A1:F92`; 92 rows) → `Mud_boy_Waves.csv`
- `Map definitions` (`A1:B4`; 4 rows) → `Map_definitions.csv`
- `Global defaults` (`A1:D18`; 18 rows) → `Global_defaults.csv`
- `colors` (`A1:D16`; 16 rows) → `colors.csv`

## How to interpret these files

The XLSX is the original source; CSVs are convenience exports using workbook **values**. Where headers occupy multiple sections (notably `Upgrade Levels`, `Global defaults`), preserve the section dividers and labels when parsing. `Brush AoE.csv` is a literal 4×4 multiplier matrix, not a table with a header row. `Mud_boy_Waves.csv` has a header plus days 1–90 and a `>90` row; do not infer ambiguous behavior from the final record without resolving [D21]. Empty spreadsheet cells remain blank in the CSV. Costs and labels are reproduced as-is even when a design decision remains open.

**Traceability:** the DOCX and Markdown handoff reference worksheet names. Refer to `03_Review_and_Decisions/Open_Decisions_and_Reviewer_Questions.md` before using a table cell as a definitive behavioral rule.
