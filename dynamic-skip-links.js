(function () {
  /*
   * Configuration — defaults. Override any value without editing this file by
   * declaring window.dynamicSkipLinksConfig before the script tag, e.g.:
   *
   *   <script>window.dynamicSkipLinksConfig = { debug: true };</script>
   *   <script src="dynamic-skip-links.js"></script>
   *
   * containerId  Id of the <ul> element that receives the generated links.
   * selector     CSS selector for the page elements that become link targets.
   * debug        Highlight targets and warn about missing labels in devtools.
   *              Always false in production.
   */
  var config = Object.assign({
    containerId: "js-nav-skip-links",
    selector: "header, main, nav, form, h1, h2",
    debug: false
  }, window.dynamicSkipLinksConfig || {});

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function Generator() {
    this.rand = Math.floor(Math.random() * 26) + Date.now();
  }
  Generator.prototype.getId = function () {
    return this.rand++;
  };

  var idGen = new Generator();

  ready(function () {
    var container = document.getElementById(config.containerId);

    if (!container) {
      console.warn(
        "dynamic-skip-links: no #" + config.containerId + " element found. " +
          "Add <ul id=\"" + config.containerId + "\"></ul> to your page."
      );
      return;
    }

    var skipNav = container.closest("nav") || container.parentElement;
    var elements = document.querySelectorAll(config.selector);

    elements.forEach(function (element) {
      if (element === skipNav) { return; }
      element.removeAttribute("title");
      element.setAttribute("tabindex", "-1");

      if (!element.id) {
        element.id = "sl-" + idGen.getId();
      }

      var headingTags = { H1: true, H2: true, H3: true, H4: true, H5: true, H6: true };
      var typeLabels = { HEADER: "Page header", MAIN: "Main content", NAV: "Navigation", FORM: "Form" };
      var labelledById = element.getAttribute("aria-labelledby");
      var labelledByEl = labelledById && document.getElementById(labelledById);
      var explicitLabel = (
        element.getAttribute("aria-label") ||
        (labelledByEl && labelledByEl.textContent.trim()) ||
        (headingTags[element.tagName] ? element.textContent.trim() : "")
      );
      var label = (explicitLabel || typeLabels[element.tagName] || "No label").slice(0, 60);

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
      a.textContent = config.debug
        ? "Go to " + label + " (" + element.tagName.toLowerCase() + ")"
        : "Go to " + label;

      var li = document.createElement("li");
      li.appendChild(a);
      container.appendChild(li);
    });
  });
})();
