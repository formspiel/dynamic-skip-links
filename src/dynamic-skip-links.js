(function () {
  /*
   * Configuration — defaults. Override any value without editing this file by
   * declaring window.dynamicSkipLinksConfig before the script tag, e.g.:
   *
   *   <script>window.dynamicSkipLinksConfig = { debug: true };</script>
   *   <script src="dynamic-skip-links.js"></script>
   *
   * containerId   Id of the <ul> element that receives the generated links.
   * selector      CSS selector for the page elements that become link targets.
   * debug         Highlight targets and warn about missing labels in devtools.
   *               Always false in production.
   * navLabel      aria-label for the injected skip links nav landmark.
   * labelPrefix   Text prepended to every skip link label.
   * typeLabels    Fallback labels for landmark elements that have no aria-label.
   * noLabel       Last-resort label when no other label can be resolved.
   * f6            Enable F6 key to cycle through landmark targets. Default false
   *               to avoid overriding the browser's native F6 behaviour.
   * f6Modifier    Require Ctrl to be held with F6 (safer — no browser conflict).
   * f6Hint        Text shown inside the skip links nav when F6 is enabled,
   *               informing keyboard users which shortcut is available.
   *               Empty string (default) suppresses the hint entirely.
   */
  var userConfig = window.dynamicSkipLinksConfig || {};
  var config = Object.assign({
    containerId: "js-nav-skip-links",
    selector: "header, main, nav, form, h1, h2",
    debug: false,
    navLabel: "Skip links",
    labelPrefix: "Skip to",
    typeLabels: {
      HEADER: "Page header",
      MAIN:   "Main content",
      NAV:    "Navigation",
      FORM:   "Form"
    },
    noLabel: "No label",
    f6: false,
    f6Modifier: false,
    f6Hint: ""
  }, userConfig);
  // Deep-merge typeLabels so a partial override keeps unspecified defaults.
  config.typeLabels = Object.assign({
    HEADER: "Page header",
    MAIN:   "Main content",
    NAV:    "Navigation",
    FORM:   "Form"
  }, userConfig.typeLabels || {});

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function truncate(str, max) {
    if (str.length <= max) { return str; }
    return str.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function Generator() {
    this.rand = Math.floor(Math.random() * 1000000) + Date.now();
  }
  Generator.prototype.getId = function () {
    return this.rand++;
  };

  var idGen = new Generator();

  ready(function () {
    var nav = document.createElement("nav");
    nav.id = "skiplinks";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", config.navLabel);

    var container = document.createElement("ul");
    container.id = config.containerId;

    nav.appendChild(container);
    document.body.insertBefore(nav, document.body.firstChild);

    var elements = document.querySelectorAll(config.selector);
    var targets = [];

    elements.forEach(function (element) {
      if (element === nav) { return; }
      element.removeAttribute("title");
      element.setAttribute("tabindex", "-1");

      if (!element.id) {
        element.id = "sl-" + idGen.getId();
      }

      var headingTags = { H1: true, H2: true, H3: true, H4: true, H5: true, H6: true };
      var labelledById = element.getAttribute("aria-labelledby");
      var labelledByEl = labelledById && document.getElementById(labelledById);
      var explicitLabel = (
        element.getAttribute("aria-label") ||
        (labelledByEl && labelledByEl.textContent.trim()) ||
        (headingTags[element.tagName] ? element.textContent.trim() : "")
      );
      var label = truncate(explicitLabel || config.typeLabels[element.tagName] || config.noLabel, 60);

      if (config.debug) {
        var missingLabel = !explicitLabel;
        element.setAttribute("data-dsl-debug", missingLabel ? "no-label" : "ok");
        if (missingLabel) {
          console.warn(
            "dynamic-skip-links: missing label on <" +
              element.tagName.toLowerCase() +
              (element.id ? ' id="' + element.id + '"' : "") +
              ">. Add an aria-label attribute to provide a meaningful skip link."
          );
        }
      }

      var a = document.createElement("a");
      a.href = "#" + element.id;
      a.appendChild(document.createTextNode(config.labelPrefix + " " + label));
      if (config.debug) {
        var typeTag = document.createElement("span");
        typeTag.setAttribute("aria-hidden", "true");
        typeTag.textContent = " (" + element.tagName.toLowerCase() + ")";
        a.appendChild(typeTag);
      }

      var li = document.createElement("li");
      li.appendChild(a);
      container.appendChild(li);

      targets.push(element);
    });

    if (config.f6 && config.f6Hint) {
      var hint = document.createElement("p");
      hint.className = "dsl-f6-hint";
      hint.textContent = config.f6Hint;
      nav.appendChild(hint);
    }

    // F6 cycles focus through landmark targets (forward) or Shift+F6 (backward).
    // Disabled by default to avoid overriding the browser's native F6 behaviour.
    if (config.f6 && targets.length > 0) {
      document.addEventListener("keydown", function (e) {
        if (e.key !== "F6") { return; }
        if (config.f6Modifier && !e.ctrlKey) { return; }
        e.preventDefault();
        var idx = targets.indexOf(document.activeElement);
        if (e.shiftKey) {
          targets[idx <= 0 ? targets.length - 1 : idx - 1].focus();
        } else {
          targets[(idx + 1) % targets.length].focus();
        }
      });
    }
  });
})();
