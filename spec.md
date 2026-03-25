# SLR Builds

## Current State
Full-featured Russian gaming fan site (say-gg.ru clone) with dark/light theme toggle, admin panel with heroes/skills/items/branches/builds/users/chat/comments/stats tabs, profile modal with nickname and friends.

## Requested Changes (Diff)

### Add
- AdminPage: new tab "Перезапуск" — button to clear chat (via clearAllChat if exists, else navigate reload) and reload seed data
- AdminPage: new tab "Администраторы" — show registered users list, assign/revoke admin role via assignCallerUserRole(principal, UserRole)
- ProfileModal: avatar selector — grid of hero icons (from say-gg.ru imageUrl pattern) + default colored circle options; stored in localStorage keyed by `avatar_${principalText}`
- ProfileModal: clan text field — stored in localStorage keyed by `clan_${principalText}`; shown in profile header

### Modify
- ThemeContext: remove toggleTheme, always return theme='dark'; simplify
- Navbar: remove theme toggle button (Moon/Sun), remove isDark conditionals everywhere, use dark styles always
- AdminPage SIDEBAR_TABS: add 'restart' and 'admins' tabs
- ProfileModal: show avatar circle at top, add avatar picker modal, add clan field display and edit

### Remove
- Theme toggle button from Navbar
- Light theme styles (all `isDark ? ... : ...` conditionals — always use dark variant)
- Moon/Sun icons import from Navbar
- toggleTheme export from ThemeContext

## Implementation Plan
1. Simplify ThemeContext — remove toggle, always dark
2. Update Navbar — remove toggle button, remove isDark, hardcode dark styles
3. Update AdminPage — add 'restart' tab (clear chat + reload) and 'admins' tab (list users + assign role)
4. Update ProfileModal — add avatar (localStorage) and clan (localStorage) fields with edit UI
