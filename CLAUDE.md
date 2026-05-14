# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                          # run all 63 Jest tests
npx jest -t "label truncation"    # run a single describe block by name
npx jest --testNamePattern "F6"   # run tests matching a string
npm run build                     # minify src/ → dist/ (terser + clean-css)
```

Always run `npm test` before committing. The CI workflow (`.github/workflows/ci.yml`) runs tests on every push. The build workflow (`.github/workflows/build.yml`) rebuilds `dist/` automatically when `src/` changes on `main` and commits back via the GitHub Actions bot.

## Repository layout

```
src/    — human-readable source (edit these)
dist/   — minified production files (committed; auto-rebuilt by CI)
tests/  — Jest + jsdom test suite
build.js — Node script: reads src/, writes dist/
```

The root-level `dynamic-skip-links.js` and `dynamic-skip-links.css` are stale copies that pre-date the `src/` reorganisation. Ignore them; they will be deleted.

## Module architecture

`src/dynamic-skip-links.js` is a single self-executing IIFE with no runtime dependencies. It runs once on page load.

**Execution flow:**
1. Merge `window.dynamicSkipLinksConfig` over defaults with `Object.assign`. Then rebuild `config.typeLabels` in a separate step — this is intentional: a plain shallow merge would discard unset defaults, so typeLabels always needs a two-step merge.
2. `ready(fn)` defers the rest until `DOMContentLoaded` (or runs immediately if the DOM is already ready).
3. Inject `<nav id="skiplinks" role="navigation" aria-label="…">` as the very first child of `<body>`. The `role="navigation"` duplicate is required for iOS 15 VoiceOver, which ignores `aria-label` on `<nav>` without it.
4. `querySelectorAll(config.selector)` collects targets. The injected nav is excluded by identity check (`element === nav`).
5. For each target: strip `title`, add `tabindex="-1"` (makes it programmatically focusable without adding a tab stop), assign a generated `sl-<n>` id if none exists, resolve a label, build a `<li><a>` and append it to the container.
6. If `config.f6` is enabled, attach a single `keydown` listener to `document` that cycles focus through the collected `targets[]` array.

**Label resolution priority** (highest → lowest):
1. `aria-label` attribute
2. `textContent` of element referenced by `aria-labelledby`
3. Element's own `textContent` — headings only (`H1`–`H6`)
4. `config.typeLabels[element.tagName]` — keyed by uppercase tag name
5. `config.noLabel`

Labels are passed through `truncate(str, 60)` which word-wraps at the last space before position 60, appending `…`. No-space strings are hard-cut.

**Debug mode** (`config.debug: true`): sets `data-dsl-debug="ok"|"no-label"` on each target; fires `console.warn` for missing labels; appends a `<span aria-hidden="true"> (nav)</span>` type tag to each link. The `aria-hidden` is required — putting the tag in the link's text node would violate WCAG 2.5.3 (Label in Name) and break voice-control software.

## Test patterns

Tests live in `tests/dynamic-skip-links.test.js`. The module is an IIFE, so each test uses `jest.resetModules()` + `require()` to re-execute it fresh:

```js
function loadModule(bodyHtml = "", config = {}) {
  jest.resetModules();
  document.body.innerHTML = bodyHtml;
  global.window.dynamicSkipLinksConfig = config;
  require("../src/dynamic-skip-links.js");
}
```

Key helpers: `getLinks()` queries `#js-nav-skip-links a`; `getLinkTexts()` and `getLinkHrefs()` map over them; `pressKey(key, options)` dispatches a `KeyboardEvent` on `document`.

**Pitfall:** `document.querySelector("nav")` returns the injected `<nav id="skiplinks">` (first in DOM), not content navs. Use `document.getElementById("resources")` or add explicit ids in test HTML when you need a specific content element.

## CSS architecture

`src/dynamic-skip-links.css` contains only mechanical rules — no colours, spacing, or typography. Integrators add visual design in their own stylesheet.

- Links are visually hidden with `clip-path: inset(50%)` (better than `clip` for modern browsers).
- Revealed on `:focus-visible` and `:active` by undoing every hiding rule.
- Debug indicators use `box-shadow: inset` (not `outline`) so nested elements such as `<nav>` inside `<main>` remain visually distinct.
- `--skiplinks-z-index` CSS custom property controls stacking without editing the file.
- `position: absolute` on `#skiplinks` — integrators can override to `position: fixed` for sticky-header layouts.
- `.dsl-f6-hint` is hidden with the same `clip-path` technique as the links, but revealed via `#skiplinks:focus-within` (not `:focus-visible`) so it appears alongside whichever skip link is active. Only rendered when `f6: true` and `f6Hint` is non-empty.

## Config system

All user-facing strings live in `window.dynamicSkipLinksConfig`. No translation requires editing the module. `typeLabels` is deep-merged (two-step) so partial overrides keep unspecified defaults. Config is read once at IIFE execution time.

## Branch protection

`main` is protected and does not accept direct pushes. Use `mcp__github__push_files` to update `main`, then sync locally: `git fetch origin main && git reset --hard origin/main`.
