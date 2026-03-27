# SLR Builds — v38 Grand Patch: Warframe Techno Redesign + Bugfix

## Current State
The app is a Russian-language Skill Legends Royale fan site with builds, heroes, skills, tier list, chat, admin panel, and profile system. Current design uses navy-blue background with gold accents. Light theme CSS exists but button was removed. Several bugs persist: LangContext `t()` calls dual-lang strings throughout, admin panel still complex, pages visually cluttered.

## Requested Changes (Diff)

### Add
- Warframe-style techno/futuristic design: pure black (#000) background, orange/gold neon accents (OKLCH orange ~0.72 0.19 40)
- Glitch animation effect on modals opening (CSS keyframes: brief horizontal clip/shift flicker)
- Neon border glow on modals and panels (orange glow)
- Corner bracket decorations on panels (HUD sci-fi style, CSS ::before/::after)
- Hexagonal dot-grid or scanline background texture (CSS, very subtle)
- Animated scanning border on key modals
- HUD-style stat labels (uppercase tracking-widest, smaller, dimmer)
- Particle-like animated glow on navbar logo
- "СИСТЕМА АКТИВНА" style status indicators
- Better build card micro-interactions with orange glow

### Modify
- index.css: Replace navy-blue OKLCH values with pure black + orange neon palette. Remove light theme block entirely.
- All pages: Reduce visual noise — fewer decorative borders on every element, more whitespace, cleaner grid
- Navbar: Slimmer, black + orange accent line at bottom, glitch logo effect
- Modals (BuildCard expanded, CreateBuild, Profile, Admin): Add glitch-open animation + neon orange border
- AdminPage: Cleaner tab navigation, better mobile layout
- ChatPanel: Cleaner bubble design with orange accents
- BuildCard: Simplified card layout — less cramped, cleaner skill chips
- HomePage: Less cluttered dashboard — top sections more card-based, cleaner grid

### Remove
- Light theme CSS variables block (already disabled, remove dead code)
- Redundant duplicate border/shadow inline styles across components
- LangContext `t(ru, en)` pattern — simplify to direct Russian strings where feasible (leave hook in place to avoid breaking imports, just use Russian-only in display)

## Implementation Plan
1. Rewrite index.css with pure black + orange/gold OKLCH palette, glitch keyframes, scanline background, corner-bracket utility classes, neon glow utilities
2. Update Navbar: slick orange-accent bottom bar, glitch logo animation on hover
3. Restyle all modals with glitch-open animation class, orange neon border
4. Simplify BuildCard: cleaner layout, HUD-style labels, orange glow on expand
5. Simplify HomePage: cleaner grid, less decorative clutter, better top-section cards
6. AdminPage: better mobile nav, cleaner panels
7. ChatPanel: cleaner bubbles, orange accents
8. Fix bugs: remove dead light-theme CSS, ensure all useQuery guards are correct, fix any console errors from dual-lang strings
9. Validate: lint + typecheck + build
