# Dynamic Skip Links

A small, dependency-free module that scans a page for landmarks and headings and builds a skip link list automatically, giving keyboard and assistive-technology users a fast way to jump between sections.

---

## Repository structure

```
dynamic-skip-links/
├── src/          — human-readable source files (edit these)
│   ├── dynamic-skip-links.js
│   └── dynamic-skip-links.css
├── dist/         — minified production files (auto-built by CI)
│   ├── dynamic-skip-links.min.js
│   └── dynamic-skip-links.min.css
└── tests/        — Jest test suite
```

Use the files in `dist/` in your project. The `dist/` folder is committed to the repository and is rebuilt automatically by a GitHub Actions workflow whenever `src/` files change on `main`.

---

## Integration

The module ships two files. Both are required.

| File | Purpose |
|---|---|
| `dist/dynamic-skip-links.min.js` | Scans the page and generates the skip links |
| `dist/dynamic-skip-links.min.css` | Mandatory mechanics: hides links off-screen and reveals them on focus |

### 1. Include the module files

```html
<link rel="stylesheet" href="dist/dynamic-skip-links.min.css">

<!-- before </body> -->
<script src="dist/dynamic-skip-links.min.js"></script>
```

The script injects the skip links nav automatically. No HTML snippet required.

### 2. Style the revealed links

`dynamic-skip-links.min.css` deliberately ships with no visual design. Add this to your own stylesheet and adjust to match your project:

```css
#skiplinks a:focus-visible,
#skiplinks a:active {
  padding: .5rem 1rem;
  background-color: #fff;
  border: 2px solid #000;
  text-align: center;
  text-decoration: none;
}
```

That is the complete integration.

---

## Customisation

### Visual design

The only rule you need to style is `#skiplinks a:focus-visible`. The mandatory CSS file handles the mechanical reveal (undoing the off-screen hiding); your stylesheet adds the colours, spacing, and typography on top via the normal cascade.

```css
/* example — adapt to your design system */
#skiplinks a:focus-visible,
#skiplinks a:active {
  padding: .75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  background-color: var(--color-brand);
  color: #fff;
  border: 3px solid #fff;
  border-radius: .25rem;
  text-align: center;
  text-decoration: none;
}
```

### Stacking order

If the default `z-index` conflicts with your layout, override the CSS custom property — no need to edit the module file:

```css
:root {
  --skiplinks-z-index: 500;
}
```

### Layouts with a positioned `<body>`

`#skiplinks` uses `position: absolute`, which positions it relative to the nearest positioned ancestor. On most pages `<body>` is not positioned and the skip links sit at the top of the viewport as intended. If your layout gives `<body>` a `position` value (e.g. `position: relative`), override the rule in your stylesheet to use `position: fixed` instead:

```css
#skiplinks {
  position: fixed;
}
```

This is also the right choice for pages with a sticky or fixed header where you want the skip links to always appear above the header when focused.

---

## Configuration

Override any value without editing the module file by declaring `window.dynamicSkipLinksConfig` before the script tag:

```html
<script>
  window.dynamicSkipLinksConfig = { debug: true };
</script>
<script src="dist/dynamic-skip-links.min.js"></script>
```

The available properties and their defaults:

```js
{
  // id of the <ul> that receives the generated links
  containerId: "js-nav-skip-links",

  // CSS selector for elements that become skip link targets
  selector: "header, main, nav, form, h1, h2",

  // highlight targets and warn about missing labels (never true in production)
  debug: false,

  // aria-label for the injected skip links nav landmark
  navLabel: "Skip links",

  // text prepended to every skip link
  labelPrefix: "Skip to",

  // fallback labels for landmark elements that have no aria-label
  typeLabels: {
    HEADER: "Page header",
    MAIN:   "Main content",
    NAV:    "Navigation",
    FORM:   "Form"
  },

  // last-resort label when no other label can be resolved
  noLabel: "No label",

  // enable F6 / Shift+F6 to cycle focus through landmark targets
  f6: false,

  // when true, require Ctrl+F6 instead of plain F6 (avoids browser conflicts)
  f6Modifier: false,

  // hint text rendered inside the skip links nav when f6 is enabled.
  // Appears alongside the skip link list when any link receives focus.
  // Empty string (default) = no hint rendered.
  f6Hint: ""
}
```

### Overriding individual `typeLabels`

`typeLabels` are deep-merged with the defaults, so you only need to supply the keys you want to change:

```html
<script>
  window.dynamicSkipLinksConfig = {
    typeLabels: { NAV: "Menu" }
    // HEADER, MAIN, and FORM keep their defaults
  };
</script>
```

### Translating to another language

All user-facing strings are in the config, so translation requires no changes to the module file:

```html
<script>
  window.dynamicSkipLinksConfig = {
    navLabel:    "Seitennavigation",
    labelPrefix: "Springe zu",
    typeLabels: {
      HEADER: "Seitenkopf",
      MAIN:   "Hauptinhalt",
      NAV:    "Navigation",
      FORM:   "Formular"
    },
    noLabel: "Kein Label"
  };
</script>
<script src="dist/dynamic-skip-links.min.js"></script>
```

Suggested values for common languages:

| Language | `navLabel` | `labelPrefix` | `noLabel` |
|---|---|---|---|
| English (default) | `"Skip links"` | `"Skip to"` | `"No label"` |
| German | `"Seitennavigation"` | `"Springe zu"` | `"Kein Label"` |
| French | `"Liens d'évitement"` | `"Passer à"` | `"Sans label"` |
| Italian | `"Link di navigazione"` | `"Salta a"` | `"Nessuna etichetta"` |
| Spanish | `"Saltar a"` | `"Saltar a"` | `"Sin etiqueta"` |

The `typeLabels` for each language:

| Language | `HEADER` | `MAIN` | `NAV` | `FORM` |
|---|---|---|---|---|
| German | `"Seitenkopf"` | `"Hauptinhalt"` | `"Navigation"` | `"Formular"` |
| French | `"En-tête"` | `"Contenu principal"` | `"Navigation"` | `"Formulaire"` |
| Italian | `"Intestazione"` | `"Contenuto principale"` | `"Navigazione"` | `"Modulo"` |
| Spanish | `"Encabezado"` | `"Contenido principal"` | `"Navegación"` | `"Formulario"` |

---

## F6 navigation

The module can optionally wire up the F6 key to cycle focus through landmark targets — the same elements the skip links point to. This gives power keyboard users a quick way to jump between sections without opening the skip link list.

```html
<script>
  window.dynamicSkipLinksConfig = { f6: true };
</script>
```

| Key | Action |
|---|---|
| F6 | Focus the next landmark target |
| Shift+F6 | Focus the previous landmark target |

Navigation wraps around: pressing F6 on the last target goes back to the first, and Shift+F6 on the first goes to the last.

**Why `f6` defaults to `false`**

Browsers use F6 to cycle focus between the address bar, the bookmarks toolbar, and the page. Overriding it by default would silently break that built-in shortcut. Set `f6: true` only when you have confirmed that your users do not rely on the browser's F6 behaviour — or use `f6Modifier` to require Ctrl.

### Using Ctrl+F6 instead of plain F6

Set `f6Modifier: true` to require the Ctrl key. This avoids any conflict with the browser's native F6 shortcut:

```html
<script>
  window.dynamicSkipLinksConfig = { f6: true, f6Modifier: true };
</script>
```

| Key | Action |
|---|---|
| Ctrl+F6 | Focus the next landmark target |
| Ctrl+Shift+F6 | Focus the previous landmark target |

### Informing users with `f6Hint`

When F6 is enabled, keyboard users who discover the skip links via Tab have no way of knowing that F6 shortcuts exist. The `f6Hint` option renders a small informational paragraph inside the skip links nav. It appears alongside the skip link list whenever a link is focused (using CSS `:focus-within`) and is read by screen readers.

```html
<script>
  window.dynamicSkipLinksConfig = {
    f6: true,
    f6Hint: "Press F6 / Shift+F6 to jump between sections"
  };
</script>
```

With `f6Modifier: true`, update the hint to match:

```html
<script>
  window.dynamicSkipLinksConfig = {
    f6: true,
    f6Modifier: true,
    f6Hint: "Press Ctrl+F6 / Ctrl+Shift+F6 to jump between sections"
  };
</script>
```

The hint is rendered as `<p class="dsl-f6-hint">`. No visual design is applied by the module — add your own styles after the module CSS, for example:

```css
.dsl-f6-hint {
  font-size: 0.75rem;
  color: #555;
  padding: 0.25rem 1rem 0.5rem;
  text-align: center;
}
```

**Suggested `f6Hint` translations:**

| Language | Plain F6 | Ctrl+F6 |
|---|---|---|
| English | `"Press F6 / Shift+F6 to jump between sections"` | `"Press Ctrl+F6 / Ctrl+Shift+F6 to jump between sections"` |
| German | `"F6 / Umschalt+F6 zum Springen zwischen Abschnitten"` | `"Strg+F6 / Strg+Umschalt+F6 zum Springen zwischen Abschnitten"` |
| French | `"Appuyez sur F6 / Maj+F6 pour naviguer entre les sections"` | `"Appuyez sur Ctrl+F6 / Ctrl+Maj+F6 pour naviguer entre les sections"` |
| Italian | `"Premi F6 / Maiusc+F6 per passare tra le sezioni"` | `"Premi Ctrl+F6 / Ctrl+Maiusc+F6 per passare tra le sezioni"` |
| Spanish | `"Presiona F6 / Mayús+F6 para saltar entre secciones"` | `"Presiona Ctrl+F6 / Ctrl+Mayús+F6 para saltar entre secciones"` |

---

## Debug mode

Set `config.debug = true` during development to surface labelling problems before they reach production.

**What it does:**

- Adds a visible outline to every element that becomes a skip link target
  - **Blue** — element has a valid label
  - **Orange** — label is missing; the skip link will fall back to *No label*
- Appends a visually-visible type tag (e.g. `(nav)`, `(h2)`) to each skip link. The tag is wrapped in `aria-hidden="true"` so screen readers hear only the clean label — the tag is purely for developer orientation
- Logs a `console.warn` for each missing label, naming the element by tag and id

**Example warning:**
```
dynamic-skip-links: missing label on <nav id="sl-...">. Add an aria-label attribute to provide a meaningful skip link.
```

Set `debug` back to `false` before shipping. No outlines, no warnings, zero output.

---

## How labels are resolved

Each skip link label is derived from the target element using this priority order:

1. `aria-label` attribute on the element
2. Text content of the element referenced by `aria-labelledby`
3. The element's own text content (headings only — `h1`–`h6`)
4. Type fallback from `typeLabels` (`HEADER`, `MAIN`, `NAV`, `FORM`)
5. Last resort: `noLabel`

Labels longer than 60 characters are trimmed automatically at the nearest word boundary and an ellipsis (…) is appended. Labels with no spaces are hard-cut at 60 characters.

Use `aria-label` on landmark elements (`header`, `nav`, `main`, `form`) to ensure they always produce a meaningful skip link, regardless of content.

```html
<nav aria-label="Main navigation">…</nav>
<form role="search" aria-label="Site search">…</form>
```

---

## Building locally

```bash
npm install
npm run build   # writes dist/dynamic-skip-links.min.js and dist/dynamic-skip-links.min.css
npm test        # runs the Jest test suite
```

The CI workflow (`.github/workflows/build.yml`) rebuilds `dist/` automatically on every push to `main` that touches `src/`. The GitHub Actions bot commits the updated files back to `main` with the message `chore: build minified dist [skip ci]`.

> **Branch protection note:** for the bot commit to succeed, the repository's branch protection rules must allow GitHub Actions to push directly to `main`. In your repository settings go to **Settings → Actions → General → Workflow permissions** and enable *Allow GitHub Actions to create and approve pull requests*, or add a bypass exception for the `github-actions[bot]` actor under the branch protection rule.

---

## Demo

Open `index.html` in a browser. Press `Tab` to reveal the skip link list, or press `F6` to jump between landmarks (enabled in the demo). The demo page uses an additional `demo.css` file to apply a visual design — this file is **not part of the module** and is not required in your project.
