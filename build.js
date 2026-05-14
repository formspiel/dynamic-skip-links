#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { minify } = require("terser");
const CleanCSS = require("clean-css");

async function main() {
  fs.mkdirSync("dist", { recursive: true });

  const jsSource = fs.readFileSync("src/dynamic-skip-links.js", "utf8");
  const jsResult = await minify(jsSource, { compress: true, mangle: true });
  fs.writeFileSync("dist/dynamic-skip-links.min.js", jsResult.code);
  console.log("built  dist/dynamic-skip-links.min.js");

  const cssSource = fs.readFileSync("src/dynamic-skip-links.css", "utf8");
  const cssResult = new CleanCSS({ level: 2 }).minify(cssSource);
  if (cssResult.errors.length) { throw new Error(cssResult.errors.join("\n")); }
  fs.writeFileSync("dist/dynamic-skip-links.min.css", cssResult.styles);
  console.log("built  dist/dynamic-skip-links.min.css");
}

main().catch(function (err) { console.error(err); process.exit(1); });
