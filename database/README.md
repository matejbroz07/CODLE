# Databáze Codle

Návrh databáze pro MariaDB 10.4+ (verze v XAMPP) a MySQL 8.0+.

| Soubor | Obsah |
|---|---|
| `schema.sql` | Vytvoří databázi `codle`, všechny tabulky a pohledy. |
| `seed.sql` | Vývojová data: kurzy HTML, CSS a JavaScript po šesti jednotkách (stejná osnova jako `js/curriculum.js`), 9 odznaků, 159 slov pro Wordle s rozpisem na 365 dní, 64 historických karet a 23 historek. Neobsahuje osobní údaje. |
| `seed-placement.sql` | 200 otázek rozřazovacího kvízu (HTML, CSS, JavaScript, PHP, 10 na každou obtížnost). Stejná banka jako offline záloha v `js/register.js`. |
| `seed-quests.sql` | Úlohy do editoru pro všech 79 běžných lekcí HTML, CSS a JavaScriptu. Generuje se z `content/quests/` (viz `content/README.md`). |
| `seed-quiz.sql` | 156 otázek kvízů jednotek a závěrečných zkoušek (8 na kvíz, 12 na zkoušku). Generuje se z `content/quiz/`. |
| `content/` | Zdrojové soubory úloh a otázek a generátor `build.php`, ze kterého `seed-quests.sql` a `seed-quiz.sql` vznikají. Postup v `content/README.md`. |
| `migrations/001_api.sql` | Úpravy pro API na databázi vytvořené před 23. 10. 2026: tabulka `auth_throttle` a klíč odpovědí na Denní historku. `schema.sql` je už obsahuje. |
| `migrations/002_profile.sql` | Záložka Profile, pro databázi vytvořenou před 26. 10. 2026: bio, profilová fotka, viditelnost profilu a data změn v `users`, tabulka `username_history`. `schema.sql` je už obsahuje. |
| `migrations/003_courses.sql` | Kurzy HTML, CSS a JavaScript po šesti jednotkách a odstranění Pythonu, pro databázi naplněnou před 27. 10. 2026. `seed.sql` je už obsahuje. Spouští se jen jednou. |
| `migrations/003_mascot.sql` | Záložka Curly v profilu, pro databázi vytvořenou před 2. 11. 2026: sloupec `mascot` v `user_settings` (vzhled a chování maskota jako JSON). `schema.sql` ho už obsahuje. Bez migrace API funguje dál, vzhled se jen neukládá k účtu. |

## Import

V phpMyAdmin (XAMPP) otevřete záložku **Import** a nahrajte v tomto pořadí `schema.sql`, `seed.sql`, `seed-placement.sql`, `seed-quests.sql`, `seed-quiz.sql`.

Z terminálu:

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/schema.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed-placement.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed-quests.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed-quiz.sql
```

`schema.sql` počítá s prázdnou databází. Pokud `codle` už existuje, import skončí chybou a nic nepřepíše. Existující databázi doplníte migracemi ze složky `migrations/` (postup v `api/README.md`). `seed-placement.sql` při opakovaném importu přidá otázky podruhé; `seed-quests.sql` a `seed-quiz.sql` úlohy a otázky svých lekcí nahradí, takže se dají importovat opakovaně.

## Oblasti

- **Účty:** `users` (včetně bia, profilové fotky a viditelnosti profilu), `username_history` (dřívější jména), `oauth_accounts` (Google, GitHub), `email_verifications` (6místné kódy), `sessions`, `user_settings` (nastavení editoru, efektů a maskota Curlyho), `auth_throttle` (limity pokusů o přihlášení a kódy).
- **Obsah:** `courses`, `units`, `lessons`, `quests` + `quest_files` + `quest_objectives` (úlohy v editoru), `questions` + `question_answers` (rozřazovací a jednotkové kvízy), `badges`.
- **Postup:** `enrollments`, `placement_attempts` + `placement_answers`, `lesson_progress`, `quest_saves`, `xp_events` (každý zisk XP jako řádek), `daily_activity` (série a denní cíl), `user_badges`.
- **Procvičování:** `wordle_words`, `wordle_puzzles` (které slovo je který den), `wordle_plays`.
- **Historie:** `history_cards` a `older_younger_runs` (hra Starší, nebo mladší), `history_stories` + `history_story_options` + `history_story_answers` (Denní historka, jedna odpověď na studenta a den). Každá karta i historka má odkaz na zdroj.
- **Pohledy:** `v_leaderboard_weekly`, `v_user_today`, `v_wordle_stats`.

## Administrace a API

Obsah (kurzy, lekce, úlohy v editoru) a plán Wordle se spravují v `admin/` (postup v `admin/README.md`). Aplikace pro studenty čte a zapisuje přes `api/` (postup v `api/README.md`).

## Zásady

- Hesla, ověřovací kódy a tokeny relací se ukládají jen jako hash.
- IP adresy se neukládají.
- Smazáním uživatele se kaskádově smažou všechna jeho data (GDPR). Soubor profilové fotky maže API.
- Profilové fotky leží v `uploads/avatars/` (mimo git), v databázi je jen název souboru.
- Rozpis Wordle v `seed.sql` používá stejné pořadí slov jako offline demo v prohlížeči, takže se dny shodují. S API zná odpověď jen server.
- Počítadla v `users` (`xp_total`, `streak_*`) jsou jen zrychlení. Zdrojem pravdy jsou `xp_events` a `daily_activity`.
