[![NPM version](https://img.shields.io/npm/v/lonesomedom.svg)](https://www.npmjs.com/package/lonesomedom)

# Lonesome dom

Generate a standalone, portable, offline capable version of any DOM.
* CSS rules are extracted & injected (only for used rules, using  [microcss])
* Images are inlined using dataURL

Use with browserify for a client side usage

# Motivation
* You need to print actual page rendering (as PDF/image)
* You know that Gecko & webkit are rendering engine, you do NOT want to write/use another custom/homemade DOM rendering engine, (see https://github.com/niklasvh/html2canvas/blob/master/src/nodecontainer.js).
* You work with simple page app / complex website, there is no "URL" to provide to a server side tool, use lonesomedom & transfert a "private/dynamic dom" without any dependency !

# API
```
  var lonesomedom = require('lonesomedom');

lonesomedom.process(anchor, function(err, simpleDom) {
  console.log(simpleDom.outerHTML);
});

```


# Todo 
* Expose ucss options
* Anti-aliasing in image inlining
* Strip inline js/scripts (?)
