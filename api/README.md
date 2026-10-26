# Codle API

Backend pro studenty v PHP nad databází z `database/schema.sql`. Běží v XAMPP (PHP 8.1+, MariaDB 10.4+, Apache s mod_rewrite). Stránky `index.html`, `editor.html` a `register.html` s ním mluví přes `js/api.js`.

Když API není dostupné (GitHub Pages, otevření souboru z disku), stránky běží jako dřív v demo režimu: data z `js/*.js`, postup v `localStorage`, ověřovací kód `111111`.

## Zprovoznění

1. V XAMPP spusťte Apache a MySQL.
2. Databáze (viz `database/README.md`). Na databázi z doby před API stačí migrace:

   ```bash
   /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/001_api.sql
   /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/002_profile.sql
   /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/seed-placement.sql
   /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/seed-quests.sql
   ```

3. Konfigurace (vytvoří `api/config.php` s náhodným tajným klíčem):

   ```bash
   /Applications/XAMPP/xamppfiles/bin/php api/tools/setup.php
   ```

4. Profilové fotky: Apache musí mít právo zapisovat do `uploads/avatars/`. V XAMPP na macOS běží Apache jako `daemon`, takže lokálně:

   ```bash
   chmod 777 uploads/avatars
   ```

   Na serveru raději `chown` na uživatele webového serveru a `755`. Složku lze přesunout přes `profile.avatar_dir` a `profile.avatar_url` v `api/config.php`.

5. Otevřete <http://localhost/Klimax/CODLE/index.html>. Bez přihlášení vás stránka pošle na registraci.

## E-maily s kódy

`mail.mode` v `api/config.php`:

- `dev` (výchozí): žádný e-mail se neposílá. API vrátí kód v odpovědi a registrace i obnova hesla ho zobrazí na stránce. Jen pro lokální vývoj.
- `mail`: kód odchází přes PHP `mail()` z adresy `mail.from`. Server musí mít funkční odesílání pošty (XAMPP na macOS ho ve výchozím stavu nemá).

Na veřejném serveru vždy `mail`.

## Endpointy

Všechny odpovědi jsou JSON. Chyba: `{"error": "kód", "message": "text"}` s odpovídajícím HTTP stavem. Požadavky kromě GET musí mít hlavičku `X-Codle: 1` (ochrana proti CSRF). Bez mod_rewrite volejte `api/index.php?r=<cesta>`.

| Metoda a cesta | K čemu |
|---|---|
| `GET session` | Přihlášený uživatel nebo `null` |
| `POST auth/login` | `{login, password}`, login je e-mail nebo uživatelské jméno |
| `POST auth/logout` | Odhlášení |
| `GET auth/username?u=` | Je jméno volné? |
| `POST auth/register/code` | `{email}`, pošle 6místný kód |
| `POST auth/register/verify` | `{email, code}`, vrátí `verifiedToken` (platí hodinu) |
| `POST auth/register` | `{verifiedToken, username, password, course, timezone, placement: {answers: [{questionId, answerId}], seconds}}` |
| `POST auth/password/code` | `{email}`, kód pro obnovu hesla |
| `POST auth/password/reset` | `{email, code, password}`, odhlásí ostatní zařízení |
| `GET placement/questions?course=` | Otázky rozřazovacího kvízu |
| `GET app` | Vše pro `index.html`: uživatel, kurzy, cesta, žebříček |
| `PATCH me` | Libovolně z `{dailyGoal, timezone, bio, profilePublic}` |
| `POST me/password` | `{current, password}`, odhlásí ostatní zařízení |
| `GET me/profile` | Vše pro záložku Profile: statistiky, heatmapa 26 týdnů, kurzy, odznaky, hry, nedávné XP, údaje o účtu |
| `GET users/profile?u=` | Profil jiného studenta (soukromý profil jen se jménem, fotkou a úrovní) |
| `POST me/avatar` | `multipart/form-data`, pole `avatar` (JPG, PNG, GIF; WebP jen když ho umí GD) |
| `DELETE me/avatar` | Zpět na gradient ze jména |
| `POST me/username` | `{username, password}` |
| `POST me/email/code` | `{email, password}`, pošle kód na novou adresu |
| `POST me/email` | `{email, code}`, dokončí změnu e-mailu |
| `GET` / `DELETE me/sessions` | Přihlášená zařízení; `DELETE` s `{id}` odhlásí jedno, bez `id` všechna ostatní |
| `GET me/export` | Všechna data účtu jako JSON (GDPR) |
| `DELETE me` | `{password}`, smaže účet se všemi daty |
| `POST me/course` | `{course}`, přepne (a případně zapíše) kurz |
| `GET` / `PUT me/settings` | Nastavení editoru |
| `GET leaderboard` | XP za posledních 7 dní |
| `GET path?course=` | Cesta kurzu se stavem lekcí |
| `GET lessons/{id}` | Úloha lekce pro editor, uložený kód, další lekce |
| `PUT lessons/{id}/save` | Automatické uložení kódu |
| `POST lessons/{id}/check` | Výsledek kontroly cílů; když prošly všechny, lekce se dokončí a připíše XP |
| `GET wordle`, `POST wordle/guess`, `POST wordle/hint` | Denní Wordle |
| `GET history/cards`, `POST history/older` | Starší, nebo mladší |
| `GET history/story`, `POST history/story` | Denní historka |

## Pravidla

- **Odemykání lekcí:** dokončené lekce a první nedokončená („Continue“) jsou otevřené, ostatní zamčené. Server zamčenou lekci neotevře.
- **XP:** lekce dává `lessons.xp_reward` (nastavuje se v adminu), jen za první dokončení. Hry: Wordle 10 XP (5 s nápovědou), správná historka 10 XP, Starší, nebo mladší 1 XP za bod, nejvýš 20 XP denně. Hodnoty jsou v `xp` v `api/config.php`.
- **Úroveň:** z úrovně L na L+1 je potřeba 100 × L XP (úroveň 2 při 100 XP, 3 při 300, 4 při 600 …).
- **Série:** den s aspoň jedním ziskem XP. Den se počítá v časovém pásmu studenta (`users.timezone`, při registraci z prohlížeče).
- **Odznaky:** odznak s `badges.unit_id` se udělí po dokončení všech lekcí jednotky.
- **Wordle:** odpověď zná jen server, prohlížeč dostává jen barvy písmen. Slovo dne je z `wordle_puzzles` podle data studenta.
- **Profil:** uživatelské jméno lze změnit jednou za 30 dní a jen s heslem; změna velikosti písmen je volná. Uvolněné jméno zůstává 90 dní rezervované pro původního majitele (`username_history`), aby se za něj nikdo nevydával. Obě lhůty jsou v `profile` v `api/config.php`. Bio má nejvýš 300 znaků, ukládá se jako prostý text bez řídicích znaků.
- **Profilové fotky:** prohlížeč nechá uživatele obrázek oříznout a pošle čtverec. Server ho přes GD vždy znovu zakóduje do JPEG 320 × 320 (zahodí EXIF včetně polohy i cokoli přibaleného k souboru) a uloží pod náhodným jménem. Stará fotka se smaže při nahrání nové, odstranění i smazání účtu. Bez fotky se v prohlížeči kreslí gradient vypočtený z uživatelského jména (`js/avatar.js`).
- **Denní historka:** naplánovaná na den (`history_stories.story_date`), jinak se nenaplánované střídají podle `id` od 13. 10. 2026.

## Bezpečnost

- `api/config.php` je v `.gitignore` a `.htaccess` blokuje přímý přístup ke konfiguraci a ke složkám `lib/`, `routes/` a `tools/`.
- Hesla jako `password_hash()`, ověřovací kódy a klíče limitů jako HMAC s tajným klíčem, relace jen jako SHA-256 tokenu v cookie `codle_session` (HttpOnly, SameSite=Lax, Secure na HTTPS).
- Limity bez IP adres (`auth_throttle`, klíčem je hash e-mailu): 10 přihlášení za 15 minut, 5 kódů za hodinu, 20 pokusů o kód za 15 minut, 5 špatných zadání na jeden kód.
- Kontroly cílů úloh běží v prohlížeči studenta, takže server výsledku věří. Hlídá jen, že lekce je odemčená a že XP přijde jednou. Skóre ze hry Starší, nebo mladší posílá prohlížeč, proto má denní strop XP.
- `uploads/avatars/.htaccess` povoluje jen soubory ve tvaru `<id>-<náhodný hex>.jpg` a vypíná v té složce PHP.
- Změna hesla, uživatelského jména i e-mailu chce aktuální heslo a spadá pod limit přihlášení. Při `mail.mode = mail` přijde na původní adresu upozornění o změně hesla a e-mailu.
- Na veřejném serveru provozujte API jen přes HTTPS.

## Omezení (stav k 23. 10. 2026)

- Obsah mají zatím jen tři lekce: JavaScript, Unit 1 (`database/seed-quests.sql`). Ostatní lekce hlásí „This lesson isn't ready yet“. Úlohy se přidávají v adminu.
- Lekce typu kvíz a závěrečná zkouška nemají v aplikaci obrazovku. Kvízové otázky (`questions` s `purpose = 'lesson'`) zatím nikdo nevytváří.
- Výsledek rozřazovacího kvízu se ukládá (`placement_attempts`, `enrollments.placement_level`), ale zatím nic neodemyká. Všichni začínají první lekcí.
- Přihlášení přes Google a GitHub není napojené.
