# Databáze Codle

Návrh databáze pro MariaDB 10.4+ (verze v XAMPP) a MySQL 8.0+.

| Soubor | Obsah |
|---|---|
| `schema.sql` | Vytvoří databázi `codle`, všechny tabulky a pohledy. |
| `seed.sql` | Vývojová data: kurzy, jednotky a lekce z výukové cesty, odznak, 159 slov pro Wordle s rozpisem na 365 dní, 64 historických karet a 23 historek. Neobsahuje osobní údaje. |

## Import

V phpMyAdmin (XAMPP) otevřete záložku **Import** a nahrajte nejdřív `schema.sql`, potom `seed.sql`.

Z terminálu:

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/schema.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed.sql
```

`schema.sql` počítá s prázdnou databází. Pokud `codle` už existuje, import skončí chybou a nic nepřepíše.

## Oblasti

- **Účty:** `users`, `oauth_accounts` (Google, GitHub), `email_verifications` (6místné kódy), `sessions`, `user_settings` (nastavení editoru a efektů).
- **Obsah:** `courses`, `units`, `lessons`, `quests` + `quest_files` + `quest_objectives` (úlohy v editoru), `questions` + `question_answers` (rozřazovací a jednotkové kvízy), `badges`.
- **Postup:** `enrollments`, `placement_attempts` + `placement_answers`, `lesson_progress`, `quest_saves`, `xp_events` (každý zisk XP jako řádek), `daily_activity` (série a denní cíl), `user_badges`.
- **Procvičování:** `wordle_words`, `wordle_puzzles` (které slovo je který den), `wordle_plays`.
- **Historie:** `history_cards` a `older_younger_runs` (hra Starší, nebo mladší), `history_stories` + `history_story_options` + `history_story_answers` (Denní historka). Každá karta i historka má odkaz na zdroj.
- **Pohledy:** `v_leaderboard_weekly`, `v_user_today`, `v_wordle_stats`.

## Zásady

- Hesla, ověřovací kódy a tokeny relací se ukládají jen jako hash.
- IP adresy se neukládají.
- Smazáním uživatele se kaskádově smažou všechna jeho data (GDPR).
- Rozpis Wordle v `seed.sql` používá stejné pořadí slov jako hra v prohlížeči, takže se dny shodují. Až bude existovat API, má odpověď znát jen server.
- Počítadla v `users` (`xp_total`, `streak_*`) jsou jen zrychlení. Zdrojem pravdy jsou `xp_events` a `daily_activity`.
