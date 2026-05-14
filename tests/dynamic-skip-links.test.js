/**
 * Tests for dynamic-skip-links.js
 *
 * Each test resets the module and DOM so the IIFE re-runs with a clean slate.
 * The module reads window.dynamicSkipLinksConfig at execution time, so config
 * must be set before require().
 */

"use strict";

function loadModule(bodyHtml = "", config = {}) {
  jest.resetModules();
  document.body.innerHTML = bodyHtml;
  global.window.dynamicSkipLinksConfig = config;
  require("../dynamic-skip-links.js");
}

function getLinks() {
  return Array.from(document.querySelectorAll("#js-nav-skip-links a"));
}

function getLinkTexts() {
  return getLinks().map((a) => a.textContent);
}

function getLinkHrefs() {
  return getLinks().map((a) => a.getAttribute("href"));
}

afterEach(() => {
  delete global.window.dynamicSkipLinksConfig;
  document.body.innerHTML = "";
});

// ─── Nav injection ────────────────────────────────────────────────────────────

describe("nav injection", () => {
  test("injects a <nav id='skiplinks'> as first child of body", () => {
    loadModule("<main>content</main>");
    const nav = document.body.firstElementChild;
    expect(nav.tagName).toBe("NAV");
    expect(nav.id).toBe("skiplinks");
  });

  test("injected nav has role=navigation for VoiceOver compatibility", () => {
    loadModule("<main>content</main>");
    const nav = document.getElementById("skiplinks");
    expect(nav.getAttribute("role")).toBe("navigation");
  });

  test("injected nav has aria-label matching config.navLabel default", () => {
    loadModule("<main>content</main>");
    const nav = document.getElementById("skiplinks");
    expect(nav.getAttribute("aria-label")).toBe("Skip links");
  });

  test("injected nav has aria-label from custom navLabel", () => {
    loadModule("<main>content</main>", { navLabel: "Schnellnavigation" });
    const nav = document.getElementById("skiplinks");
    expect(nav.getAttribute("aria-label")).toBe("Schnellnavigation");
  });

  test("container <ul> has id from config.containerId default", () => {
    loadModule("<main>content</main>");
    expect(document.getElementById("js-nav-skip-links")).not.toBeNull();
  });

  test("container <ul> has id from custom containerId", () => {
    loadModule("<main>content</main>", { containerId: "my-skip-links" });
    expect(document.getElementById("my-skip-links")).not.toBeNull();
  });

  test("injected nav is not itself processed as a skip link target", () => {
    loadModule("<nav aria-label='Site nav'>…</nav>");
    const texts = getLinkTexts();
    expect(texts.every((t) => !t.includes("Skip links"))).toBe(true);
    expect(texts.every((t) => !t.includes("Schnellnavigation"))).toBe(true);
  });
});

// ─── Label resolution ─────────────────────────────────────────────────────────

describe("label resolution", () => {
  test("uses aria-label attribute (highest priority)", () => {
    loadModule(`<header aria-label="Site header"></header>`);
    expect(getLinkTexts()).toEqual(["Skip to Site header"]);
  });

  test("uses text content of aria-labelledby target", () => {
    loadModule(`
      <span id="nav-heading">Main navigation</span>
      <nav aria-labelledby="nav-heading"></nav>
    `);
    expect(getLinkTexts()).toEqual(["Skip to Main navigation"]);
  });

  test("aria-label takes precedence over aria-labelledby", () => {
    loadModule(`
      <span id="nav-heading">labelledby text</span>
      <nav aria-label="Direct label" aria-labelledby="nav-heading"></nav>
    `);
    expect(getLinkTexts()).toEqual(["Skip to Direct label"]);
  });

  test("uses heading text content for h1", () => {
    loadModule("<h1>Page Title</h1>");
    expect(getLinkTexts()).toEqual(["Skip to Page Title"]);
  });

  test("uses heading text content for h2", () => {
    loadModule("<h2>Section Name</h2>");
    expect(getLinkTexts()).toEqual(["Skip to Section Name"]);
  });

  test("falls back to typeLabel NAV when nav has no label", () => {
    loadModule("<nav>…</nav>");
    expect(getLinkTexts()).toEqual(["Skip to Navigation"]);
  });

  test("falls back to typeLabel HEADER when header has no label", () => {
    loadModule("<header>…</header>");
    expect(getLinkTexts()).toEqual(["Skip to Page header"]);
  });

  test("falls back to typeLabel MAIN when main has no label", () => {
    loadModule("<main>…</main>");
    expect(getLinkTexts()).toEqual(["Skip to Main content"]);
  });

  test("falls back to typeLabel FORM when form has no label", () => {
    loadModule("<form>…</form>");
    expect(getLinkTexts()).toEqual(["Skip to Form"]);
  });

  test("falls back to noLabel as last resort for unknown element types", () => {
    // <section> has no entry in typeLabels; noLabel is the final fallback
    loadModule("<section>…</section>", { selector: "section", noLabel: "Unlabelled" });
    expect(getLinkTexts()).toEqual(["Skip to Unlabelled"]);
  });

  test("uses custom noLabel string", () => {
    loadModule("<section>…</section>", { selector: "section", noLabel: "Kein Label" });
    expect(getLinkTexts()).toEqual(["Skip to Kein Label"]);
  });

  test("uses custom typeLabels for a single key", () => {
    loadModule("<nav>…</nav>", { typeLabels: { NAV: "Navigation (Deutsch)" } });
    expect(getLinkTexts()).toEqual(["Skip to Navigation (Deutsch)"]);
  });

  test("typeLabels partial override keeps unspecified defaults", () => {
    // Only NAV is overridden; HEADER should still use its default
    loadModule(
      `<header>…</header><nav>…</nav>`,
      { typeLabels: { NAV: "Menu" } }
    );
    expect(getLinkTexts()).toEqual(["Skip to Page header", "Skip to Menu"]);
  });

  test("does not use heading text for non-heading elements", () => {
    loadModule(`<nav>Some text inside</nav>`);
    // Must not read inner text; should fall back to typeLabel
    expect(getLinkTexts()).toEqual(["Skip to Navigation"]);
  });
});

// ─── Label truncation ─────────────────────────────────────────────────────────

describe("label truncation", () => {
  test("labels shorter than 60 chars are kept as-is", () => {
    loadModule(`<h1>Short</h1>`);
    expect(getLinkTexts()[0]).toBe("Skip to Short");
  });

  test("labels exactly 60 chars are not trimmed and have no ellipsis", () => {
    const exactText = "B".repeat(60);
    loadModule(`<h1>${exactText}</h1>`);
    expect(getLinkTexts()[0]).toBe("Skip to " + "B".repeat(60));
  });

  test("labels over 60 chars with no spaces get hard-cut at 60 with ellipsis", () => {
    const longText = "A".repeat(70);
    loadModule(`<h1>${longText}</h1>`);
    expect(getLinkTexts()[0]).toBe("Skip to " + "A".repeat(60) + "…");
  });

  test("labels over 60 chars with spaces are truncated at word boundary with ellipsis", () => {
    // 63 chars: slice(0,60) ends mid-word "words" → truncates before it
    const text = "The quick brown fox jumps over the lazy dog and some more words";
    loadModule(`<h1>${text}</h1>`);
    expect(getLinkTexts()[0]).toBe("Skip to The quick brown fox jumps over the lazy dog and some more…");
  });
});

// ─── ID handling ──────────────────────────────────────────────────────────────

describe("ID handling", () => {
  test("generates an sl- prefixed id when element has no id", () => {
    loadModule("<main>…</main>");
    const main = document.querySelector("main");
    expect(main.id).toMatch(/^sl-\d+$/);
  });

  test("preserves a pre-existing id", () => {
    loadModule(`<nav id="resources" aria-label="Resource links">…</nav>`);
    const nav = document.getElementById("resources");
    expect(nav.id).toBe("resources");
  });

  test("skip link href points to the element's id", () => {
    loadModule(`<nav id="resources" aria-label="Resource links">…</nav>`);
    expect(getLinkHrefs()).toEqual(["#resources"]);
  });

  test("skip link href for generated id starts with #sl-", () => {
    loadModule("<main>…</main>");
    const main = document.querySelector("main");
    expect(getLinkHrefs()[0]).toBe("#" + main.id);
  });
});

// ─── DOM modifications ────────────────────────────────────────────────────────

describe("DOM modifications", () => {
  test("adds tabindex=-1 to every matched element", () => {
    loadModule("<header>…</header><main>…</main><nav id='content-nav'>…</nav>");
    ["header", "main", "#content-nav"].forEach((sel) => {
      expect(document.querySelector(sel).getAttribute("tabindex")).toBe("-1");
    });
  });

  test("removes title attribute from matched elements", () => {
    loadModule(`<nav title="Wrong approach">…</nav>`);
    const nav = document.querySelector("nav");
    expect(nav.hasAttribute("title")).toBe(false);
  });

  test("does not add tabindex to unmatched elements", () => {
    loadModule(`<section>…</section>`);
    const section = document.querySelector("section");
    expect(section.hasAttribute("tabindex")).toBe(false);
  });
});

// ─── Link text ────────────────────────────────────────────────────────────────

describe("link text", () => {
  test("prefix defaults to 'Skip to'", () => {
    loadModule("<main>…</main>");
    expect(getLinkTexts()[0]).toMatch(/^Skip to /);
  });

  test("uses custom labelPrefix", () => {
    loadModule("<main>…</main>", { labelPrefix: "Gehe zu" });
    expect(getLinkTexts()[0]).toMatch(/^Gehe zu /);
  });

  test("link text is prefix + label when debug is off", () => {
    loadModule(`<nav aria-label="Main nav">…</nav>`);
    expect(getLinkTexts()[0]).toBe("Skip to Main nav");
  });

  test("does not append tag name suffix when debug is off", () => {
    loadModule("<nav>…</nav>");
    expect(getLinkTexts()[0]).not.toContain("(nav)");
  });
});

// ─── Debug mode ───────────────────────────────────────────────────────────────

describe("debug mode", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  test("labelled element gets data-dsl-debug='ok'", () => {
    loadModule(`<nav id="site-nav" aria-label="Main nav">…</nav>`, { debug: true });
    expect(document.getElementById("site-nav").getAttribute("data-dsl-debug")).toBe("ok");
  });

  test("unlabelled landmark gets data-dsl-debug='no-label'", () => {
    loadModule(`<nav id="unlabelled-nav">…</nav>`, { debug: true });
    expect(document.getElementById("unlabelled-nav").getAttribute("data-dsl-debug")).toBe("no-label");
  });

  test("heading with text gets data-dsl-debug='ok'", () => {
    loadModule("<h1>Page title</h1>", { debug: true });
    const h1 = document.querySelector("h1");
    expect(h1.getAttribute("data-dsl-debug")).toBe("ok");
  });

  test("console.warn fired for unlabelled element", () => {
    loadModule("<nav>…</nav>", { debug: true });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.mock.calls[0][0]).toMatch(/dynamic-skip-links:/);
    expect(console.warn.mock.calls[0][0]).toMatch(/<nav/);
  });

  test("console.warn not fired for labelled element", () => {
    loadModule(`<nav aria-label="Site nav">…</nav>`, { debug: true });
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("console.warn includes element id when present", () => {
    loadModule(`<nav id="primary-nav">…</nav>`, { debug: true });
    expect(console.warn.mock.calls[0][0]).toMatch(/id="primary-nav"/);
  });

  test("type tag is in an aria-hidden span in debug mode (not in accessible name)", () => {
    loadModule(`<nav aria-label="Main nav">…</nav>`, { debug: true });
    const a = getLinks()[0];
    // Screen readers see only the text node — no tag suffix
    expect(a.firstChild.textContent).toBe("Skip to Main nav");
    // Visual display: type tag present in aria-hidden span
    const typeSpan = a.querySelector('[aria-hidden="true"]');
    expect(typeSpan).not.toBeNull();
    expect(typeSpan.textContent).toBe(" (nav)");
  });

  test("type tag for headings is aria-hidden in debug mode", () => {
    loadModule("<h1>Page Title</h1>", { debug: true });
    const a = getLinks()[0];
    expect(a.firstChild.textContent).toBe("Skip to Page Title");
    expect(a.querySelector('[aria-hidden="true"]').textContent).toBe(" (h1)");
  });

  test("no data-dsl-debug attribute when debug is off", () => {
    loadModule(`<nav aria-label="Main nav">…</nav>`);
    const nav = document.querySelector("nav");
    expect(nav.hasAttribute("data-dsl-debug")).toBe(false);
  });

  test("no console.warn when debug is off", () => {
    loadModule("<nav>…</nav>");
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("warn message advises adding aria-label", () => {
    loadModule("<nav>…</nav>", { debug: true });
    expect(console.warn.mock.calls[0][0]).toMatch(/aria-label/);
  });
});

// ─── Multiple elements ────────────────────────────────────────────────────────

describe("multiple elements", () => {
  test("generates one link per matched element", () => {
    loadModule(`
      <header aria-label="Site header">…</header>
      <main aria-label="Main content">…</main>
      <nav aria-label="Primary nav">…</nav>
    `);
    expect(getLinks()).toHaveLength(3);
  });

  test("links appear in DOM order", () => {
    loadModule(`
      <header aria-label="Alpha">…</header>
      <main aria-label="Beta">…</main>
      <nav aria-label="Gamma">…</nav>
    `);
    expect(getLinkTexts()).toEqual([
      "Skip to Alpha",
      "Skip to Beta",
      "Skip to Gamma",
    ]);
  });

  test("each generated id is unique", () => {
    loadModule(`
      <main>…</main>
      <nav>…</nav>
      <form>…</form>
    `);
    const ids = Array.from(document.querySelectorAll("main, nav, form")).map(
      (el) => el.id
    );
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── Custom selector ──────────────────────────────────────────────────────────

describe("custom selector", () => {
  test("custom selector overrides default", () => {
    loadModule(
      `<header aria-label="Site header">…</header>
       <section aria-label="A section">…</section>`,
      { selector: "section" }
    );
    const texts = getLinkTexts();
    expect(texts).toHaveLength(1);
    expect(texts[0]).toBe("Skip to A section");
  });

  test("elements not matched by selector are ignored", () => {
    loadModule(`<main aria-label="Main">…</main>`, { selector: "nav" });
    expect(getLinks()).toHaveLength(0);
  });
});

// ─── Full config localisation ─────────────────────────────────────────────────

describe("full localisation via config", () => {
  test("all strings can be replaced for German", () => {
    loadModule(`<nav>…</nav><main aria-label="Hauptinhalt">…</main>`, {
      navLabel: "Seitennavigation",
      labelPrefix: "Gehe zu",
      typeLabels: {
        NAV:  "Navigation",
        MAIN: "Hauptinhalt",
      },
      noLabel: "Kein Label",
    });
    const nav = document.getElementById("skiplinks");
    expect(nav.getAttribute("aria-label")).toBe("Seitennavigation");
    expect(getLinkTexts()).toEqual([
      "Gehe zu Navigation",
      "Gehe zu Hauptinhalt",
    ]);
  });
});
