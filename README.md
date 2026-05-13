# Dynamic Skip Links

A small, dependency-free module that scans a page for landmarks and headings and builds a skip link list automatically, giving keyboard and assistive-technology users a fast way to jump between sections.

---

## Integration

The module ships two files. Both are required.

| File | Purpose |
|---|---|
| `dynamic-skip-links.js` | Scans the page and generates the skip links |
| `dynamic-skip-links.css` | Mandatory mechanics: hides links off-screen and reveals them on focus |

### 1. Include the module files

```html
<link rel="stylesheet" href="dynamic-skip-links.css">

<!-- before </body> -->
<script src="dynamic-skip-links.js"></script>
```

### 2. Add the HTML snippet

Place this as the **first element inside `<body>`**:

```html
<nav id="skiplinks" aria-label="Skip links">
  <ul id="js-nav-skip-links"></ul>
</nav>
```

### 3. Style the revealed links

`dynamic-skip-links.css` deliberately ships with no visual design. Add this to your own stylesheet and adjust to match your project:

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

The only rule you need to style is `#skiplinks a:focus-visible`. The mandatory `dynamic-skip-links.css` handles the mechanical reveal (undoing the off-screen hiding); your stylesheet adds the colours, spacing, and typography on top via the normal cascade.

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

---

## Configuration

Two values at the top of `dynamic-skip-links.js` can be changed if the default IDs conflict with your project:

```js
var config = {
  // id of the <ul> that receives the generated links
  containerId: "js-nav-skip-links",

  // CSS selector for elements that become skip link targets
  selector: "header, main, nav, form, h1, h2"
};
```

---

## How labels are resolved

Each skip link label is derived from the target element using this priority order:

1. `aria-label` attribute on the element
2. Text content of the element referenced by `aria-labelledby`
3. The element's own text content (headings only — `h1`–`h6`)
4. Fallback: *No label*

Labels longer than 60 characters are trimmed automatically.

Use `aria-label` on landmark elements (`header`, `nav`, `main`, `form`) to ensure they always produce a meaningful skip link, regardless of content.

```html
<nav aria-label="Main navigation">…</nav>
<form role="search" aria-label="Site search">…</form>
```

---

## Demo

Open `index.html` in a browser. Press `Tab` to reveal the skip link list. The demo page uses an additional `demo.css` file to apply a visual design — this file is **not part of the module** and is not required in your project.
