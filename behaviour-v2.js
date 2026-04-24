

var shortcut = {
  // (A) SET SHORTCUT KEYS TO LISTEN TO
  listen: null,
  set: function (listen) {
	// (A1) KEY SEQUENCE + FUNCTION TO RUN
	shortcut.listen = listen;

	// (A2) KEY PRESS LISTENERS
	window.addEventListener("keydown", (evt) => {
	  shortcut.track(evt.key.toLowerCase(), true);
	});
	window.addEventListener("keyup", (evt) => {
	  shortcut.track(evt.key.toLowerCase(), false);
	});
  },

  // (B) KEY PRESS SEQUENCE TRACKER
  sequence: [],
  track: function (key, direction) {
	// (B1) PREVENT AUTO CLEANING
	if (shortcut.junk != null) {
	  clearTimeout(shortcut.junk);
	}

	// (B2) KEY DOWN
	if (direction) {
	  if (!shortcut.sequence.includes(key)) {
		shortcut.sequence.push(key);
	  }
	}

	// (B3) KEY UP
	else {
	  let idx = shortcut.sequence.indexOf(key);
	  if (idx != -1) {
		shortcut.sequence.splice(idx, 1);
	  }
	}

	// (B4) HIT SHORTCUT?
	if (shortcut.sequence.length != 0) {
	  let seq = shortcut.sequence.join("-");
	  if (shortcut.listen[seq]) {
		shortcut.sequence = [];
		shortcut.listen[seq]();
	  }

	  // (B5) PREVENT "STUCK SEQUENCE" WHEN USER LEAVES PAGE
	  // E.G. OPEN NEW TAB WHILE IN MIDDLE OF KEY PRESS SEQUENCE
	  else {
		shortcut.junk = setTimeout(shortcut.clean, 600);
	  }
	}
  },

  // (C) AUTO CLEANUP
  junk: null,
  clean: function () {
	shortcut.junk = null;
	shortcut.sequence = [];
  }
};

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

//  https://stackoverflow.com/questions/26203453/jquery-generate-unique-ids
function Generator() {}
Generator.prototype.rand = Math.floor(Math.random() * 26) + Date.now();
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
	  var getElementAriaLabel = $(this).attr("aria-label");
	  var getElementText = $(this).text();

	  var noContent = "No label";

	  if ($(this).hasAttr("aria-label")) {
		var elementAriaLabel = getElementAriaLabel;
	  } else {
		var elementText = getElementText;
	  }

	  if ($(this).hasAttr("id")) {
		// console.log("true");
	  } else {
		var elementUniqueId = idGen.getId();

		$(this).attr("id", elementUniqueId);
		$("#js-nav-skip-links").append(
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
			"</a></li>"
		);
	  }
	});
});

// keyboard function
window.addEventListener("DOMContentLoaded", function () {
  shortcut.set({
	"control-shift-l": function () {
	  alert("Hi there!");
	},
	//"control-m": function () {
	F6: function () {
	  document.getElementById("skiplinks").focus();
	},
	"?": function () {
	  document.getElementById("skiplinks").focus();
	}
  });
});

