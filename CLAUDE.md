# Clean POWA!

Browser game in design/preproduction. Design material lives in `Clean_POWA_Reviewer_Handoff/` (start with `01_Read_First/START_HERE.md`).

## Source of truth

- `DECISIONS.md` overrides every file in `Clean_POWA_Reviewer_Handoff/`, including the balance workbook and the CSVs in `04_Data_Tables/`. Read it before implementing any rule.
- Never edit files in `Clean_POWA_Reviewer_Handoff/`; record changes as decisions in `DECISIONS.md` instead.
- Open decisions (Dxx) not yet in `DECISIONS.md` must not be implemented by assumption; ask the owner.
- `STORY_EXPANSION_SPEC.md` is the story campaign spec (STORY-Dxx IDs, separate from repo Dxx). It never overrides `DECISIONS.md`; build only phases the owner has started, and record any rule change as a new Dxx first.
