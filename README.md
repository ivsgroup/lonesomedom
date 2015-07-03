# Lonesome dom

Generate a standalone, portable, offline capable version of any DOM.
* CSS rules are extracted & injected (only for used rules, using  [microcss])
* Images are inlined using dataURL

Use with browserify for a client side usage

# API


```
  var lonesomedom = require('lonesomedom');
 OR
  <script src='lonesomedom/pack.min.js'/>

var simpleDom = lonesomedom.process(anchor);
console.log(simpleDom.outerHTML);


```