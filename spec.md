# SLR Builds — Большой баг-фикс

## Current State
Полнофункциональный клон say-gg.ru с бэкендом на Motoko и фронтендом React/TypeScript. Реализовано: 42 сборки, 65 героев, 99 предметов, чат, комментарии, лайки, тир-лист, друзья, профиль, онлайн-счётчик, топ сборок/авторов, админ-панель с загрузкой тест-данных.

## Requested Changes (Diff)

### Add
- Тест-данные должны грузиться автоматически при первом открытии сайта (без кнопки)
- Все данные (сборки, герои, предметы) доступны гостям без входа

### Modify
1. **backend.d.ts** — добавить отдельные seed-функции (уже сделано)
2. **OnlineCounter** — `getCallerUserProfile` должен быть `enabled: !!actor && !!identity`, иначе anonymous запросы падают с trap
3. **ChatPanel** — то же самое: `getCallerUserProfile` требует `#user` роль, не должен вызываться для гостей
4. **AdminPage** — убрать блокировку `if (!identity)` перед паролем; оставить только пароль-гейт
5. **AdminPage seed button** — исправить: у `actor!.seedSkillsAndBranches()` теперь есть правильный тип, кнопка должна работать
6. **HomePage auto-seed** — добавить `seeded.current = false` reset при смене actor чтобы retry работал
7. **BuildCard** — getBuildVotes должен работать для анонимов (enabled: !!actor && expanded без identity check)
8. **Skill names** — переименовать скиллы в русские названия: РАНА, ЗАМОРОЗКА, ЯРОСТЬ, ИСЦЕЛЕНИЕ, ЯД, ЩИТ, КРИТ, СПРАЙТ, HP, ULT, АТАКА, УКЛОНЕНИЕ, УСКОРЕНИЕ
9. **Hero names** — все 65 героев переименовать в русские имена по их аватаркам

### Remove
- Блокировка входа в AdminPage по identity (доступ только по паролю garenA11)

## Implementation Plan
1. Исправить `enabled` условия в OnlineCounter и ChatPanel для guest-пользователей
2. Убрать identity-гейт в AdminPage (только пароль-гейт)
3. Исправить отображение названий навыков на русский (убрать `/ ENGLISH` часть)
4. Исправить hero names на русские
5. Убедиться что auto-seed в HomePage корректно ретраит при ошибках
6. Убедиться что BuildCard.getBuildVotes работает для гостей
7. Пройти typecheck и build
