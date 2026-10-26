# Codle admin

Administrace obsahu v PHP nad databází z `database/schema.sql`. Běží v XAMPP (PHP 8.1+, MariaDB 10.4+).

| Stránka | K čemu |
|---|---|
| **Přehled** | Je zítřejší Wordle připravené? Na kolik dní dopředu je plán? Kolik lekcí ještě nemá úlohu? |
| **Kurzy a lekce** | Zakládání a úpravy kurzů, jednotek a lekcí, řazení šipkami, zveřejnění kurzu. |
| **Lekce** | Nastavení lekce, statistiky lekce a editor úlohy: zadání, startovní kód HTML/CSS/JS a cíle s kontrolním JS. Test cílů spustí kontroly v sandboxu nad startovním kódem i nad vaším testovacím řešením. |
| **Statistiky** | Pro každou lekci kurzu: kolik studentů začalo a dokončilo, úspěšnost, Ø pokusů, Ø doba, kde studenti stojí. Lekce s nejnižší úspěšností (aspoň 5 studentů) je označená jako nejtěžší. |
| **Wordle** | Příprava zítřka a dalších dnů (výběr slova s návrhem, nové slovo, nápověda), doplnění chybějících dnů, banka slov, výsledky. Dnešek a minulé dny jsou zamčené. |

## Zprovoznění

1. V XAMPP spusťte Apache a MySQL a naimportujte databázi (viz `database/README.md`).
2. Nastavte heslo (zároveň se vytvoří `admin/config.php` ze vzoru):

   ```bash
   /Applications/XAMPP/xamppfiles/bin/php admin/tools/set-password.php
   ```

3. V `admin/config.php` zkontrolujte přihlášení k databázi (výchozí `root` bez hesla na `127.0.0.1:3306`).
4. Otevřete <http://localhost/Klimax/CODLE/admin/>.

Heslo změníte stejným příkazem. Změna hesla odhlásí všechny otevřené relace.

## Jazyk a vzhled

- Rozhraní je anglicky, přepínač **EN / CS** v navbaru přepne do češtiny (volba se pamatuje v cookie).
- V kódu jsou texty anglicky v `__('…')`, české překlady jsou v `lib/lang/cs.php` (klíčem je anglický text). Chybějící překlad se zobrazí anglicky.
- Vzhled používá `css/base.css` a `js/perf.js` z aplikace (Liquid Glass, lite režim pro slabší zařízení), vlastní styly jsou v `assets/admin.css`.

## Bezpečnost

- `admin/config.php` je v `.gitignore`. Obsahuje jen hash hesla, ne heslo.
- Config můžete mít i mimo web root: cestu nastavte v proměnné prostředí `CODLE_ADMIN_CONFIG`.
- `.htaccess` blokuje přímý přístup ke `config.php`, `lib/` a `tools/`.
- Všechny formuláře mají CSRF token. Po 10 chybných přihlášeních za 15 minut se přihlašování na 15 minut zablokuje. IP adresy se neukládají.
- Po 2 hodinách nečinnosti admin odhlásí.
- GitHub Pages umí jen statické soubory, proto je `admin/` vyřazený z publikace v `_config.yml`. Na veřejném serveru provozujte admin jen přes HTTPS.

## Omezení (stav k 23. 10. 2026)

- Aplikace čte obsah z databáze přes `api/` (viz `api/README.md`): cestu kurzu, úlohy v editoru a plán Wordle. Statistiky a výsledky Wordle se plní z toho, co studenti v aplikaci dělají.
- Kontrolní JS cíle vidí v `doc.defaultView.__codleLogs` texty vypsané přes `console.log()`, v editoru i v testu cílů v adminu.
- Kvízové otázky (`questions`, `question_answers`) admin zatím neupravuje.
- Postup studentů v úloze se pamatuje podle pořadí cílů. Přeházení cílů u úlohy, kterou už někdo řeší, mu splněné cíle posune.
