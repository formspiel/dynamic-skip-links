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

    var elements = document.querySelectorAll("header, nav, form, h1, h2");

    elements.forEach(function (element) {
      element.removeAttribute("title");
      element.setAttribute("tabindex", "-1");

      if (!element.id) {
        element.id = idGen.getId();
      }

      var label = (
        element.getAttribute("aria-label") ||
        element.textContent.trim() ||
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
