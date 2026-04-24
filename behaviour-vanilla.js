// With ChatGPT 3.5 converted vanilla version
// Helper function to check if an element has a specific attribute
function hasAttr(element, name) {
  return element.getAttribute(name) !== null;
}

// Generator function for creating unique IDs
function Generator() {
  this.rand = Math.floor(Math.random() * 26) + Date.now();
}

Generator.prototype.getId = function () {
  return this.rand++;
};

var idGen = new Generator();

document.addEventListener("DOMContentLoaded", function () {
  // Dynamic Skip Links
  // looks for specific elements and builds a link list nav

  ["header", "nav", "form", "h1", "h2"].forEach(function (tagName) {
	document.querySelectorAll(tagName).forEach(function (element) {
	  var elementName = element.tagName.toLowerCase();
	  var getElementAriaLabel = element.getAttribute("aria-label");
	  var getElementText = element.textContent;

	  var noContent = "No label";

	  var elementAriaLabel, elementText;

	  if (hasAttr(element, "aria-label")) {
		elementAriaLabel = getElementAriaLabel;
	  } else {
		elementText = getElementText;
	  }

	  if (hasAttr(element, "id")) {
		// console.log("true");
	  } else {
		var elementUniqueId = idGen.getId();
		element.setAttribute("id", elementUniqueId);

		var navSkipLinks = document.getElementById("js-nav-skip-links");
		navSkipLinks.innerHTML +=
		  '<li><a href="#' +
		  elementUniqueId +
		  '">Go to ' +
		  (typeof elementAriaLabel !== "undefined"
			? elementAriaLabel
			: elementText != ""
			? elementText
			: noContent) +
		  " (" +
		  elementName +
		  ")" +
		  "</a></li>";
	  }
	});
  });
});
