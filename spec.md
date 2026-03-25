# SLR Builds

## Current State
Full-stack clone of say-gg.ru. Admin panel exists with password gate (garenA11). Test data loading uses 4-step process (skills → heroes → items → builds), but `seedItems` (99 items) and `seedBuilds` (42 builds) still exceed ICP instruction limits in one call. All data is publicly readable via anonymous actor.

## Requested Changes (Diff)

### Add
- `seedItemsA()` — items 1–50
- `seedItemsB()` — items 51–99
- `seedBuildsA()` — builds 1–21
- `seedBuildsB()` — builds 22–42
- 6-step progress UI in AdminPage seed button
- Redesigned AdminPage with sidebar navigation (left panel) + content area
- Guest access badge/indicator showing all content is publicly available

### Modify
- `seedItems` renamed to `seedItemsA` in backend, d.ts, backend.ts, did files
- `seedBuilds` renamed to `seedBuildsA` in all files
- AdminPage seed mutation: now 6 steps with 800ms delays between each
- AdminPage layout: redesigned with left sidebar tabs instead of horizontal scrolling tabs
- Seed button shows detailed step progress (Шаг N/6: ...)

### Remove
- Old `seedItems()` and `seedBuilds()` single-call functions (replaced)

## Implementation Plan
1. ✅ Backend: split seed functions (done)
2. ✅ Update backend.d.ts, backend.ts, did files (done)
3. Frontend: redesign AdminPage
   - Left sidebar with icon + label for each tab
   - Seed button in header shows 6-step progress
   - All panels remain functionally identical
   - Guests see all heroes/items/builds/skills without login
4. Validate build
