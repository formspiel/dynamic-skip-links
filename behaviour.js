(function () {
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
    var container = document.getElementById("js-nav-skip-links");

    if (!container) {
      console.warn(
        "dynamic-skip-links: no #js-nav-skip-links element found. " +
          "Add <ul id=\"js-nav-skip-links\"></ul> to your page."
      );
      return;
    }

    var skipNav = container.closest("nav") || container.parentElement;
    var elements = document.querySelectorAll("header, main, nav, form, h1, h2");

    elements.forEach(function (element) {
      if (element === skipNav) { return; }
      element.removeAttribute("title");
      element.setAttribute("tabindex", "-1");

      if (!element.id) {
        element.id = "sl-" + idGen.getId();
      }

      var headingTags = { H1: true, H2: true, H3: true, H4: true, H5: true, H6: true };
      var labelledById = element.getAttribute("aria-labelledby");
      var labelledByEl = labelledById && document.getElementById(labelledById);
      var label = (
        element.getAttribute("aria-label") ||
        (labelledByEl && labelledByEl.textContent.trim()) ||
        (headingTags[element.tagName] ? element.textContent.trim() : "") ||
        "No label"
      ).slice(0, 60);

      var a = document.createElement("a");
      a.href = "#" + element.id;
      a.textContent =
        "Go to " + label + " (" + element.tagName.toLowerCase() + ")";

      var li = document.createElement("li");
      li.appendChild(a);
      container.appendChild(li);
    });
  });
})();
