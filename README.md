# Dynamic Skip Links
Provide better Skip link to make your applications (and complex websites) more accessible

With this repository I wanna share a **prototype** of how I see Skip links that provide value to users who rely on it and value for people for pro-users.

## What are Skip Links?
tbd

## Features
It's dynamic! Choose a type of content you want to create a TOC from
Labels! Make sure a label is visible. Labels are crucial for people who rely on assistive tech

## Let's talk about F6
tbd for v2

## Who is using it
I guess I'm not the only one with this idea. Please share your implementations of Skip links

## How to use it

If you want to play around with the prototype in your implementation do:

Integrate this snippet into your HTML:
```
<nav class="nav-skip-links-wrapper" id="skiplinks" aria-label="Skip links">
  <ul id="js-nav-skip-links"></ul>
</nav>
``` 
add the JavaScript to your project
```
<script src="behaviour.js"></script>
```

## Open topics
- [ ] #1
- [ ] Debug mode: Provide optional visible feedback if a label is missing
- [ ] Consider font-color: color-contrast()[^1]
- [ ] provide better (aria) labels for the skip links
- [ ] look for support to make it "right"; VanillaJS, performant code, ...
- [ ] iOS 15: VoiceOver doesn't read the aria label of the skip link nav landmark


[^1] see https://css-tricks.com/exploring-color-contrast-for-the-first-time/
