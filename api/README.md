# Codle API

Backend pro studenty v PHP nad databází z `database/schema.sql`. Potřebuje PHP 8.1+ s rozšířeními `pdo_mysql`, `mysqli`, `curl`, `gd`, `mbstring`, MariaDB 10.4+ nebo MySQL 8.0+ a Apache 2.4 s `mod_rewrite` a `mod_headers`. Stránky `index.html`, `editor.html`, `quiz.html` a `register.html` s ním mluví přes `js/api.js`. Bez funkčního API stránky ukážou chybovou obrazovku, žádný demo režim už není.

## Nasazení na hosting

1. **Soubory.** Nahrajte celý repozitář do kořene webu (nebo do podsložky). Složky `.git`, `.github` a `database/` web nikdy nevydá, blokuje je `.htaccess`. Pokud hosting umí nastavit kořen webu jinam, nic dalšího není potřeba.
2. **HTTPS.** Zapněte certifikát (Let's Encrypt v panelu hostingu). Kořenový `.htaccess` přesměruje HTTP na HTTPS a posílá HSTS. Když HTTPS ukončuje proxy před PHP (Cloudflare, load balancer), nastavte v konfiguraci `behind_proxy => true`.
3. **Databáze.** V panelu hostingu založte prázdnou databázi (utf8mb4) a uživatele. Pak buď přes SSH:

   ```bash
   php api/tools/setup.php        # vytvoří api/config.php s náhodným tajným klíčem
   # v api/config.php vyplňte db.host, db.name, db.user, db.pass
   php database/install.php       # tabulky + obsah do databáze z configu
   ```

   nebo bez SSH: lokálně spusťte `php database/install.php --sql > codle-install.sql` a soubor naimportujte v phpMyAdmin. `api/config.php` pak vytvořte ručně z `api/config.sample.php` (tajný klíč: aspoň 32 náhodných znaků, např. `openssl rand -hex 32`).

4. **Konfigurace** v `api/config.php` (soubor je v `.gitignore`, do gitu nepatří):
   - `app_url`: veřejná adresa s lomítkem na konci, např. `https://codle.eu/`. Z ní vznikají návratové adresy pro Google a GitHub.
   - `mail.resend_key` a `mail.from` (viz níže).
   - `oauth.google` a `oauth.github` (viz níže).
5. **Profilové fotky.** Webový server musí mít právo zapisovat do `uploads/avatars/` (`chown` na uživatele serveru a `755`, na sdíleném hostingu obvykle funguje rovnou). Složku lze přesunout přes `profile.avatar_dir` a `profile.avatar_url`.
6. **Admin.** `php admin/tools/set-password.php` (viz `admin/README.md`).
7. **Kontrola.** Otevřete web, zaregistrujte se e-mailem, zkuste přihlášení přes Google i GitHub a obnovu hesla.

**Nginx místo Apache:** nginx soubory `.htaccess` nečte. Stejná pravidla (front controller API, zákaz `database/`, interních složek a dokumentace, PHP jen pro API, admin a stránku 404) jsou v `deploy/nginx-codle.conf`. Takhle běží VM matejbroz (`/srv/matejbroz/public`, PHP-FPM pod uživatelem `matejbroz`) na adrese https://app.codle.eu/. VM nemá veřejnou IP: provoz přichází tunelem Cloudflare (`cloudflared` ve VM, `app.codle.eu` → `http://127.0.0.1:80`), HTTPS končí u Cloudflare. V `api/config.php` je proto `app_url` = `https://app.codle.eu/` a `behind_proxy` = `true`.

Aktualizace existující databáze: soubory v `database/migrations/` spusťte postupně od té, kterou ještě nemáte. Starší migrace (001 až 004) obsahují `USE codle`; pokud se databáze jmenuje jinak, ten řádek před importem smažte. Novou je `005_placement.sql` (stav „skipped“ pro rozřazovací kvíz).

## E-maily (Resend)

Ověřovací kódy, obnova hesla a upozornění o změně hesla či e-mailu odcházejí přes [Resend](https://resend.com).

- `mail.resend_key`: API klíč z Resend → API Keys (stačí oprávnění „Sending access“).
- `mail.from`: odesílatel na doméně ověřené v Resend → Domains, např. `Codle <no-reply@codle.eu>`.
- `mail.max_per_hour`: strop kódů za hodinu pro celý web (ochrana kvóty, výchozí 300).

Když Resend e-mail odmítne, API vrátí `502 mail_failed` a podrobnosti zapíše do PHP error logu.

## Přihlášení přes Google a GitHub

Návratové adresy (redirect URI) jsou `<app_url>api/auth/oauth/google/callback` a `<app_url>api/auth/oauth/github/callback`.

- **Google:** Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application. Do „Authorized redirect URIs“ vložte adresu pro Google. Na OAuth consent screen stačí rozsahy `openid`, `email`, `profile`. Client ID a secret patří do `oauth.google`.
- **GitHub:** Settings → Developer settings → OAuth Apps → New OAuth App. Homepage URL je `app_url`, Authorization callback URL je adresa pro GitHub. Client ID a vygenerovaný secret patří do `oauth.github`.

Průběh:

- Známý účet (Google / GitHub už je propojený) se rovnou přihlásí.
- Účet se stejným ověřeným e-mailem se propojí a přihlásí.
- Nový student se vrátí na `register.html?oauth=…`. Projde volbou jazyka a kvízem, krok s e-mailovým kódem přeskočí (e-mail ověřil poskytovatel) a zvolí si uživatelské jméno a heslo.
- Přihlášený student propojí další službu v Profilu → Settings → Sign-in methods.

Poskytovatel bez vyplněných klíčů tlačítko nezablokuje, jen vrátí hlášku, že přihlášení zatím není k dispozici.

## Ochrana proti robotům

Neviditelná, bez obrázků a klikání:

- Před odesláním kódu (registrace, obnova hesla) a před dokončením registrace přes Google / GitHub si prohlížeč vezme podepsanou výzvu `GET auth/challenge` a dopočítá k ní malý proof of work (SHA-256 s 16 nulovými bity, v běžném prohlížeči kolem 0,2 s). Výzva platí 2 hodiny a server odmítne starší než 3 sekundy.
- Formulář má skryté pole `website` (honeypot), které člověk nevidí a robot vyplní.
- K tomu limity: 5 kódů za hodinu na e-mail, `mail.max_per_hour` na celý web, 10 přihlášení za 15 minut.

## Rozřazovací kvíz

Kvíz při registraci má dopad na cestu. Úroveň je nejtěžší správně zodpovězená obtížnost (1 až 5). Student s úrovní L začíná jednotkou L, lekce jednotek 1 až L−1 dostanou stav `skipped`: na cestě jsou otevřené a dají se kdykoli projít za XP, jen neblokují postup. Nejméně jedna jednotka kurzu vždy zůstane k učení. Platí jen pro první zápis do kurzu při registraci.

## Endpointy

Všechny odpovědi jsou JSON. Chyba: `{"error": "kód", "message": "text"}` s odpovídajícím HTTP stavem. Požadavky kromě GET musí mít hlavičku `X-Codle: 1` (ochrana proti CSRF). Bez mod_rewrite volejte `api/index.php?r=<cesta>`.

| Metoda a cesta | K čemu |
|---|---|
| `GET session` | Přihlášený uživatel nebo `null` |
| `GET auth/courses` | Zveřejněné kurzy pro volbu jazyka |
| `GET auth/challenge` | Podepsaná výzva pro ochranu proti robotům |
| `GET auth/oauth/{google,github}/start` | Přesměruje na poskytovatele (volitelně `?course=`) |
| `GET auth/oauth/{google,github}/callback` | Návrat od poskytovatele |
| `GET auth/oauth/pending?token=` | Kdo dokončuje registraci přes Google / GitHub |
| `POST auth/login` | `{login, password}`, login je e-mail nebo uživatelské jméno |
| `POST auth/logout` | Odhlášení |
| `GET auth/username?u=` | Je jméno volné? |
| `POST auth/register/code` | `{email, challenge, nonce, website}`, pošle 6místný kód |
| `POST auth/register/verify` | `{email, code}`, vrátí `verifiedToken` (platí hodinu) |
| `POST auth/register` | `{verifiedToken nebo oauthToken (+ challenge, nonce, website), username, password, course, timezone, placement: {answers: [{questionId, answerId}], seconds}}` |
| `POST auth/password/code` | `{email, challenge, nonce, website}`, kód pro obnovu hesla |
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
| `GET lessons/{id}/quiz` | Otázky kvízu nebo zkoušky pro `quiz.html` (včetně správných odpovědí, stránka je ukazuje průběžně), nejlepší skóre, počet pokusů |
| `POST lessons/{id}/quiz` | `{answers: [{questionId, answerId}]}`, server oznámkuje; od 70 % se lekce dokončí a připíše XP |
| `GET wordle`, `POST wordle/guess`, `POST wordle/hint` | Denní Wordle |
| `GET history/cards`, `POST history/older` | Starší, nebo mladší |
| `GET history/story`, `POST history/story` | Denní historka |

## Pravidla

- **Odemykání lekcí:** dokončené lekce, lekce přeskočené kvízem a první nedokončená („Continue“) jsou otevřené, ostatní zamčené. Server zamčenou lekci neotevře.
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
- Změna hesla, uživatelského jména i e-mailu chce aktuální heslo a spadá pod limit přihlášení. Na původní adresu přijde upozornění o změně hesla a e-mailu.
- OAuth: stav (`state`) je v krátkodobé podepsané cookie, e-mail se přebírá jen ověřený (GitHub bez adres `noreply`). Tokeny poskytovatelů se neukládají.
- `.htaccess` v kořeni vynucuje HTTPS, posílá HSTS, `X-Frame-Options`, `Referrer-Policy` a blokuje `database/`, skryté soubory a dokumentaci.


## Omezení (stav k 4. 11. 2026)

- Každá lekce má obsah: úlohu v editoru (`database/seed-quests.sql`) nebo otázky kvízu (`database/seed-quiz.sql`). Lekce bez obou hlásí „This lesson isn't ready yet“. Úlohy se upravují v adminu nebo ve zdrojových souborech `database/content/`; kvízové otázky zatím jen tam.
- Kurz PHP nemá jednotky, proto je nezveřejněný a registrace ho nenabízí.
