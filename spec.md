# SLR Builds

## Current State
AdminPage.tsx has a left sidebar with 11 navigation tabs and a top header with seed + logout buttons. The seed button shows 'Подключение...' and is disabled when `actor` is null, causing UI to hang visually until the anonymous actor resolves (~1-3 seconds). The layout uses sidebar + content panel side by side.

## Requested Changes (Diff)

### Add
- Horizontal top navigation bar inside admin panel (replacing left sidebar) with tab buttons styled as classic black/gold pill or underline tabs
- Loading spinner overlay on admin content while actor is null
- `isFetching` from useActor used to show proper 'Подключение...' state as overlay, not blocking the nav

### Modify
- Replace left sidebar with horizontal scrollable top nav tabs
- Admin panel redesign: darker header, gold accent borders, classic table styles, better spacing, mobile-first
- Seed button enabled immediately, throws error inside mutationFn if actor still null
- Connection state shown as banner/badge rather than disabling the button

### Remove
- Left sidebar (aside element)
- `border-l-0` content panel style

## Implementation Plan
1. Replace SIDEBAR_TABS + aside with horizontal nav tabs row (scrollable on mobile)
2. Restyle admin panel: black bg, gold (#d4a843) borders/accents, sharp classic style buttons
3. Fix seed button: always enabled when isAuthed, check actor inside mutationFn
4. Add actor loading indicator as small status badge in header
5. Mobile: tabs wrap/scroll horizontally
