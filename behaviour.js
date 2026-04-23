/*
 * It looks like jQuery but it's Cash 💰
 * You'll find the documentation on GitHub: https://github.com/fabiospampinato/cash#readme
 *
 * Thanks to Stephan M. for helping me out with JS
 *
 */

/*
 * Helper Functions
 * - find an attribute
 */
$.fn.hasAttr = function (name) {
  return this.attr(name) !== undefined;
};

function Generator() {
  this.rand = Math.floor(Math.random() * 26) + Date.now();
}
Generator.prototype.getId = function () {
  return this.rand++;
};

var idGen = new Generator();

// Skip link function
$(function () {
  /*
   * Dynamic Skip Links
   * looks for specific elements and builts a link list nav
   */

  $("header,nav,form,h1,h2")
	.removeAttr("title")
	.attr("tabindex", "-1")
	.each(function () {
	  var elementName = $(this).get(0).tagName.toLowerCase();
	  var label = $(this).attr("aria-label") || $(this).text() || "No label";

	  if (!$(this).hasAttr("id")) {
		$(this).attr("id", idGen.getId());
	  }

	  var elementUniqueId = $(this).attr("id");
	  var $a = $("<a>").attr("href", "#" + elementUniqueId);
	  $a.text("Go to " + label + " (" + elementName + ")");
	  $("#js-nav-skip-links").append($("<li>").append($a));
	});
});
