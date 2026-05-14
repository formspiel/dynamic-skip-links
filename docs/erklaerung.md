# Erklärdatei: Tests, Build-Pipeline und GitHub Workflows

Dieses Dokument erklärt drei Themen, die in diesem Projekt zum ersten Mal eingesetzt wurden:
automatisierte Tests, die Komprimierung von Dateien und GitHub Actions.

---

## 1. Automatisierte Tests

### Was ist ein automatisierter Test?

Statt den Code von Hand im Browser zu prüfen, schreibt man Testcode, der das automatisch
übernimmt. Der Test beschreibt, was passieren *soll* — und das Testing-Werkzeug prüft, ob
das auch wirklich so ist. Stimmt es überein: grünes Häkchen. Stimmt es nicht: roter Fehler
mit einer genauen Fehlermeldung.

Das hat zwei Vorteile:
- Man merkt sofort, wenn eine Änderung etwas kaputt macht.
- Man kann bedenkenlos umbauen («Refactoring»), weil die Tests einem sagen, ob noch alles
  funktioniert.

---

### Das Werkzeug: Jest + jsdom

**Jest** ist das Testing-Framework, das in diesem Projekt verwendet wird. Es ist für
JavaScript gemacht und wird über die Kommandozeile gestartet:

```bash
npm test
```

Jest sucht dann automatisch nach Dateien im `tests/`-Ordner und führt sie aus.

**jsdom** ist eine simulierte Browser-Umgebung. Das Modul `dynamic-skip-links.js` braucht
einen Browser — es arbeitet mit `document.body`, `querySelector`, `createElement` usw.
Ohne jsdom würde das nicht funktionieren, weil diese Dinge in Node.js nicht existieren.
jsdom täuscht einen Browser vor, sodass der Code so läuft, als ob er auf einer echten Seite
ausgeführt würde.

---

### Wie ist die Testdatei aufgebaut?

Die Testdatei liegt unter `tests/dynamic-skip-links.test.js`. Sie hat drei Schichten:

```
describe("Gruppenname", () => {        ← Gruppe (z. B. "label resolution")
  test("Was soll passieren", () => {   ← Einzelner Test
    // Vorbereitung
    // Aktion
    // Prüfung mit expect(...)
  });
});
```

`describe` fasst zusammen, was zusammengehört. `test` ist ein einzelner Prüffall.

---

### Die Hilfsfunktion `loadModule`

Das Modul ist ein sogenanntes **IIFE** (Immediately Invoked Function Expression) — es
führt sich beim Laden sofort aus, einmalig, und hinterlässt danach keine Variablen. Das
bedeutet: Man kann es nicht einfach mit Parametern aufrufen. Um es mit verschiedenen
Konfigurationen zu testen, muss man es jedes Mal neu laden.

Genau das macht `loadModule`:

```js
function loadModule(bodyHtml = "", config = {}) {
  jest.resetModules();                              // 1.
  document.body.innerHTML = bodyHtml;              // 2.
  global.window.dynamicSkipLinksConfig = config;   // 3.
  require("../src/dynamic-skip-links.js");         // 4.
}
```

**Zeile 1 — `jest.resetModules()`**
Jest merkt sich, welche Dateien schon geladen wurden (damit es sie nicht doppelt lädt).
`resetModules()` löscht dieses Gedächtnis, sodass `require()` in Zeile 4 die Datei
wirklich neu ausführt — als ob sie zum ersten Mal geladen würde.

**Zeile 2 — `document.body.innerHTML = bodyHtml`**
Setzt den HTML-Inhalt der Seite. Der Test kann also bestimmen, was auf der Seite steht —
z. B. `"<main>…</main>"` oder `"<nav aria-label='Hauptnavigation'>…</nav>"`.

**Zeile 3 — `global.window.dynamicSkipLinksConfig = config`**
Das Modul liest beim Start `window.dynamicSkipLinksConfig` aus. Hier wird die
Testkonfiguration gesetzt, z. B. `{ debug: true }` oder `{ labelPrefix: "Gehe zu" }`.

**Zeile 4 — `require("../src/dynamic-skip-links.js")`**
Lädt und führt das Modul aus. Ab jetzt hat jsdom den generierten Skip-Links-Nav im DOM.

---

### Einfacher Test — Schritt für Schritt

```js
test("injects a <nav id='skiplinks'> as first child of body", () => {
  loadModule("<main>content</main>");
  const nav = document.body.firstElementChild;
  expect(nav.tagName).toBe("NAV");
  expect(nav.id).toBe("skiplinks");
});
```

**Zeile 1 — `loadModule("<main>content</main>")`**
Das Modul wird gestartet. Im «Browser» gibt es ein `<main>`-Element. Das Modul läuft
durch und injiziert den Skip-Links-Nav ganz am Anfang von `<body>`.

**Zeile 2 — `const nav = document.body.firstElementChild`**
Holt das erste Kind-Element von `<body>` — das soll der gerade injizierte Nav sein.

**Zeile 3 — `expect(nav.tagName).toBe("NAV")`**
Prüft: Ist das Element ein `<nav>`-Tag? `expect(...)` leitet eine Prüfung ein. `.toBe(...)`
ist ein sogenannter **Matcher** — er prüft auf exakte Gleichheit. Wenn `tagName` nicht
`"NAV"` ist, bricht der Test mit einer Fehlermeldung ab.

**Zeile 4 — `expect(nav.id).toBe("skiplinks")`**
Prüft: Hat das Element die id `skiplinks`? Das ist die id, die das Modul fest vergibt.

Wenn beide `expect`-Zeilen keinen Fehler werfen, gilt der Test als bestanden.

---

### Komplexer Test — Schritt für Schritt

Dieser Test prüft, dass im Debug-Modus der Typ-Hinweis (z. B. `(nav)`) in einem
`aria-hidden`-Span steht und *nicht* im zugänglichen Text des Links:

```js
test("type tag is in an aria-hidden span in debug mode (not in accessible name)", () => {
  loadModule(`<nav aria-label="Main nav">…</nav>`, { debug: true });
  const a = getLinks()[0];
  expect(a.firstChild.textContent).toBe("Skip to Main nav");
  const typeSpan = a.querySelector('[aria-hidden="true"]');
  expect(typeSpan).not.toBeNull();
  expect(typeSpan.textContent).toBe(" (nav)");
});
```

**Zeile 1 — `loadModule(..., { debug: true })`**
Das Modul wird mit aktiviertem Debug-Modus gestartet. Die Seite hat eine Nav mit dem
`aria-label` «Main nav».

**Zeile 2 — `const a = getLinks()[0]`**
`getLinks()` ist eine Hilfsfunktion aus der Testdatei — sie liefert alle generierten
`<a>`-Elemente im Skip-Links-Nav. `[0]` holt den ersten Link.

**Zeile 3 — `expect(a.firstChild.textContent).toBe("Skip to Main nav")`**
`a.firstChild` ist der erste Kindknoten des Links — das ist ein **Textknoten** (kein
Element). Der Textknoten soll nur «Skip to Main nav» enthalten, also ohne Typ-Hinweis.

Warum ist das wichtig? Screenreader lesen den Text eines Links vor. Wenn `(nav)` direkt
im Text stünde, würden Screenreader-Nutzer «Skip to Main nav (nav)» hören — unnötiger
Lärm. Der Typ-Hinweis soll nur *visuell* sichtbar sein, nicht vorgelesen werden.

**Zeile 4 — `const typeSpan = a.querySelector('[aria-hidden="true"]')`**
Sucht innerhalb des Links nach einem Element mit `aria-hidden="true"`. Das ist der Span,
der den Typ-Hinweis enthält. `aria-hidden="true"` bedeutet: Screenreader ignorieren
dieses Element.

**Zeile 5 — `expect(typeSpan).not.toBeNull()`**
Prüft: Existiert der Span überhaupt? `.not.toBeNull()` ist das Gegenteil von
`.toBeNull()` — der Wert darf *nicht* `null` sein. Wenn kein passender Span gefunden
wird, gibt `querySelector` `null` zurück, und der Test schlägt fehl.

**Zeile 6 — `expect(typeSpan.textContent).toBe(" (nav)")`**
Prüft: Steht im Span tatsächlich ` (nav)`? Das führende Leerzeichen ist gewollt —
es sorgt für visuellen Abstand beim Typ-Hinweis.

Das Ergebnis: Screenreader hören nur «Skip to Main nav». In der visuellen Darstellung
ist zusätzlich ` (nav)` sichtbar — aber nur für Entwickler, die `debug: true` gesetzt
haben.

---

### Tests ausführen

```bash
npm test                           # alle Tests
npx jest -t "label truncation"     # nur eine Gruppe (describe-Name)
npx jest --testNamePattern "F6"    # nur Tests, die «F6» im Namen haben
```

---

## 2. Datei-Komprimierung: src/, dist/, Terser und clean-css

### Warum zwei Ordner?

```
src/   dynamic-skip-links.js    ← lesbarer Quellcode  (159 Zeilen, ~5 KB)
src/   dynamic-skip-links.css   ← lesbares CSS        (104 Zeilen, ~2 KB)

dist/  dynamic-skip-links.min.js   ← komprimiert, ~2 KB
dist/  dynamic-skip-links.min.css  ← komprimiert, ~535 Bytes
```

`src/` ist für Entwickler — lesbarer Code mit Kommentaren, Einrückung und langen
Variablennamen. `dist/` ist für die Produktion — so klein wie möglich, weil diese Dateien
von jedem Besucher der Website geladen werden müssen.

Der Unterschied in der Praxis:
- Das Original-JS ist ~5 KB. Die komprimierte Version ist ~2 KB — **58 % kleiner**.
- Das Original-CSS ist ~2 KB. Die komprimierte Version ist ~535 Bytes — **74 % kleiner**.

Man bearbeitet immer `src/` — nie `dist/`. Die `dist/`-Dateien werden automatisch
generiert.

---

### Was macht Terser mit dem JavaScript?

**Terser** ist ein JavaScript-Minifier. Er verändert den Code so, dass er weniger Zeichen
braucht, aber noch exakt dasselbe tut:

| Was Terser macht | Beispiel vorher | Beispiel nachher |
|---|---|---|
| Whitespace entfernen | `var x = 1;` | `var x=1;` |
| Kommentare entfernen | `// Deep-merge typeLabels` | *(weg)* |
| Variablennamen kürzen | `var userConfig` | `var u` |
| Zeilenumbrüche entfernen | 159 Zeilen | 1 Zeile |

Das Ergebnis ist für Menschen nicht mehr lesbar — aber der Browser führt es identisch aus.

---

### Was macht clean-css mit dem CSS?

**clean-css** macht dasselbe für CSS:

- Whitespace und Kommentare entfernen
- `0px` → `0`
- `#ffffff` → `#fff`
- Regeln zusammenfassen, wo möglich

---

### Wann wird der Build ausgeführt?

**Manuell (lokal):**
```bash
npm run build
```
Dieser Befehl ruft `node build.js` auf. Das Skript liest `src/`, schreibt nach `dist/`.
Wann nötig: nach jeder Änderung an `src/`, bevor man committet.

**Automatisch (GitHub Actions):**
Der Build läuft automatisch, wenn Änderungen an `src/`-Dateien auf den `main`-Branch
gepusht werden (mehr dazu im nächsten Abschnitt). Man muss also nach dem Merge eines
Pull Requests nicht manuell `npm run build` ausführen — GitHub erledigt das und committet
die aktualisierten `dist/`-Dateien direkt in den `main`-Branch.

**Der Ablauf in einem Jahr, wenn man es vergessen hat:**
1. `src/dynamic-skip-links.js` bearbeiten
2. `npm test` — prüfen, ob alle Tests bestehen
3. `npm run build` — `dist/`-Dateien neu generieren
4. Beide Ordner commiten und pushen
5. Alternativ: einfach nur `src/` pushen und den GitHub-Action-Workflow das Bauen lassen

---

## 3. GitHub Workflows (GitHub Actions)

### Was ist ein Workflow?

Ein GitHub Workflow ist eine automatische Aufgabe, die GitHub ausführt — z. B. beim
Pushen von Code. Die Aufgaben werden in YAML-Dateien im Ordner `.github/workflows/`
definiert. YAML ist ein einfaches Textformat für Konfigurationen (ähnlich wie eine
Einkaufsliste mit Einrückungen).

In diesem Projekt gibt es zwei Workflows:

```
.github/workflows/ci.yml      ← Tests automatisch ausführen
.github/workflows/build.yml   ← dist/-Dateien automatisch bauen
```

---

### Workflow 1: CI (Continuous Integration)

Datei: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
  pull_request:
```

`name` ist nur ein Anzeigename. `on` legt fest, wann der Workflow startet:
- `push` — bei jedem Push, auf jedem Branch
- `pull_request` — bei jedem Pull Request

Das bedeutet: Jedes Mal, wenn Code auf GitHub landet, prüft dieser Workflow automatisch,
ob alle Tests bestehen. Schlägt ein Test fehl, sieht man das sofort im Pull Request —
ein rotes Kreuz warnt einen, bevor man den Code in `main` mergt.

```yaml
jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
```

`jobs` sind die eigentlichen Aufgaben. `runs-on: ubuntu-latest` bedeutet: GitHub startet
eine frische Linux-Umgebung in der Cloud. Die Umgebung existiert nur für die Dauer des
Workflows und wird danach gelöscht.

```yaml
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

`steps` sind die einzelnen Schritte:

1. **`actions/checkout@v4`** — Holt den Code aus dem Repository in die Cloud-Umgebung.
   Ohne diesen Schritt wäre die Umgebung leer.

2. **`actions/setup-node@v4`** — Installiert Node.js (Version 20) in der Umgebung.
   `cache: "npm"` speichert die `node_modules` zwischen Ausführungen, damit es schneller
   geht.

3. **`npm ci`** — Installiert die Abhängigkeiten (Jest, jsdom usw.) aus `package-lock.json`.
   `ci` statt `install` ist strenger: Es schlägt fehl, wenn `package-lock.json` nicht
   mit `package.json` übereinstimmt. Das verhindert unerwartete Versionsunterschiede.

4. **`npm test`** — Führt alle Jest-Tests aus. Schlägt ein Test fehl, schlägt der
   gesamte Workflow fehl.

---

### Workflow 2: Build (automatisches Komprimieren)

Datei: `.github/workflows/build.yml`

```yaml
on:
  push:
    branches: [main]
    paths:
      - "src/**"
```

Dieser Workflow startet *nur*, wenn:
- der Push auf den `main`-Branch geht **und**
- mindestens eine Datei im `src/`-Ordner geändert wurde

Ohne die `paths`-Bedingung würde der Workflow bei jedem Push starten — auch wenn nur
`README.md` geändert wurde, was sinnlos wäre.

```yaml
    permissions:
      contents: write
```

Standardmäßig darf ein Workflow nur lesen. `contents: write` erlaubt ihm, Dateien in
das Repository zu schreiben — das braucht er, um die komprimierten `dist/`-Dateien
zurück zu committen.

Der letzte Schritt ist der interessanteste:

```yaml
      - name: Commit dist files
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add dist/
          git diff --staged --quiet && echo "No dist changes." && exit 0
          git commit -m "chore: build minified dist [skip ci]"
          git push
```

**Zeile 1–2:** Der Workflow konfiguriert Git mit dem Namen «github-actions[bot]» — so
erkennt man in der Commit-Historie, dass dieser Commit von einem Automaten stammt.

**Zeile 3:** Fügt alle Änderungen in `dist/` zur Staging-Area hinzu.

**Zeile 4:** Prüft, ob es überhaupt Änderungen gibt. Falls `dist/` unverändert ist
(z. B. weil nur ein Kommentar in `src/` geändert wurde), wird der Schritt übersprungen.
`exit 0` beendet den Schritt erfolgreich ohne Commit.

**Zeile 5:** Erstellt den Commit. `[skip ci]` in der Commit-Nachricht ist eine Konvention:
GitHub erkennt das und startet keinen weiteren Workflow-Durchlauf für diesen Commit —
ohne das würde der Build-Workflow sich selbst auslösen und eine Endlosschleife erzeugen.

**Zeile 6:** Pusht den Commit in den `main`-Branch.

---

### Wo sieht man Workflows auf GitHub?

1. Repository öffnen
2. Tab **«Actions»** anklicken
3. Links sieht man die Liste aller Workflows (CI, Build)
4. Rechts sieht man die letzten Ausführungen — grüner Haken = erfolgreich, rotes X = Fehler

Bei einem Fehler: auf den Durchlauf klicken → auf den fehlgeschlagenen Job klicken →
die Ausgabe jedes Schritts ausklappen. Dort steht genau, welcher Befehl fehlgeschlagen
ist und warum.

---

### Warum läuft der Build-Workflow nicht bei Pull Requests?

Bewusste Entscheidung: Der Build-Workflow ist auf `branches: [main]` und `push`
beschränkt. Er läuft nicht bei Pull Requests, weil:

1. Im Pull Request will man nur wissen, ob die Tests bestehen — nicht ob `dist/` stimmt.
2. Der Workflow würde versuchen, in einen fremden Branch zu pushen, was schief gehen kann.
3. `dist/` wird erst nach dem Merge in `main` aktualisiert — das ist der richtige Zeitpunkt.

Der CI-Workflow hingegen läuft bei *jedem* Push und jedem Pull Request, weil Tests immer
und überall sinnvoll sind.
