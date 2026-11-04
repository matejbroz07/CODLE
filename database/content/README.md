# Obsah lekcí

Zdrojové soubory úloh a kvízových otázek. Z nich `build.php` generuje `database/seed-quests.sql` a `database/seed-quiz.sql`; ty se importují do databáze. Upravujte tyto soubory, ne vygenerované SQL.

```bash
php database/content/build.php          # přegeneruje oba seedy
php database/content/build.php --json   # navíc content.json pro ověřovač kontrol (viz níže)
```

| Složka / soubor | Obsah |
|---|---|
| `quests/<kurz>-<jednotka>.php` | Úlohy do editoru, jeden soubor na jednotku (`html-1.php` … `javascript-6.php`). Pole `slug lekce => úloha`. |
| `quiz/<kurz>.php` | Otázky kvízů jednotek a závěrečné zkoušky kurzu. Pole `slug lekce => otázky`. |
| `build.php` | Generátor. Lekce hledá podle slugu kurzu, pořadí jednotky a slugu lekce (stejné jako `seed.sql`). |
| `verify/` | Ověřovač kontrol: pustí každou úlohu v prohlížeči se startovním kódem (nesmí projít) a s řešením (musí projít). |

## Úloha

```php
'hello-html' => [
  'title' => 'Your first page',
  'desc'  => '<p>…</p>',                       // HTML, zobrazí se v panelu Quest
  'html'  => <<<'HTML' … HTML,                  // startovní kód tří záložek editoru
  'css'   => …, 'js' => …,
  'objectives' => [
    ['html', 'text cíle (HTML)', 'nápověda (HTML)', 'tělo funkce (doc) { … } – kontrola'],
  ],
  'solution' => ['html' => '…'],               // jen pro ověřovač; chybějící záložka = startovní kód
],
```

Kontrola běží v náhledu (sandboxovaný iframe) a dostane `doc` = dokument náhledu. Pomůcky: `doc.defaultView.__codleLogs` je pole textů z `console.log()`, `doc.scripts[doc.scripts.length - 1].textContent` je JavaScript studenta, `doc.querySelector("style").textContent` jeho CSS, `doc.defaultView.getComputedStyle(el)` vypočítané styly (barvy vrací jako `rgb(r, g, b)`). Kontrola může i klikat (`doc.getElementById("btn").click()`). V textech cílů a nápověd se `\n` uvnitř `<pre>` převede na nový řádek.

Globální proměnné náhledu jsou proměnné okna: v řešení nepoužívejte jména jako `top`, `name` nebo `status` pro `const`/`let` na nejvyšší úrovni, pokud je úloha nezavádí záměrně (`const top` v náhledu selže).

## Otázka

```php
'unit-1-quiz' => [
  ['Otázka?', ['odpověď A', 'B', 'C', 'D'], 1, "ukázka kódu nebo null"],   // 1 = index správné odpovědi
],
```

Obtížnost (`questions.difficulty`) doplní generátor podle jednotky (1–5); pátý prvek pole ji přepíše. Kvíz jednotky má 8 otázek, závěrečná zkouška 12; stránka kvizu (`quiz.html`) ukáže všechny v pořadí z databáze, odpovědi zamíchá. Hranice pro splnění je 70 % (`QUIZ_PASS_PERCENT` v `api/routes/learn.php`).

## Ověření kontrol

Po změně úloh spusťte `php database/content/build.php --json` a otevřete `database/content/verify/verify.html` přes Apache (ne ze souboru; stránka posílá výsledky do `save.php`, které je zapisuje do `results.txt` vedle sebe). Řádky `FAIL` ukazují, která kontrola neprošla s řešením nebo prošla už se startovním kódem. Soubory `content.json` a `verify/results.txt` jsou v `.gitignore`.
