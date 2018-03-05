"use strict";

const ucss      = require('microcss');
const path      = require('path');

const forEach   = require('mout/array/forEach');
const deepMixIn = require('mout/object/deepMixIn');

class LonesomeDom {

  constructor(anchor, options) {
    this.anchor   = anchor;
    this.options  = {
      inlineimages  : false,
      inlineFonts   : false,
      fontsDir      : '/fonts',
      imagesBaseDir : '/resources',
      AbsolutePath  : false
    };

    deepMixIn(this.options, options);

    this.document = anchor.ownerDocument;
  }

  $n(type, attrs) {
    var out = this.document.createElement(type);
    for(var k in attrs) {
      if(k in out && attrs[k]) {
        if(k == 'style') {
          for(var l in attrs[k]) {
            if(attrs[k][l] && typeof attrs[k][l] != 'function')
              out[k][l] = attrs[k][l];
          }
        } else
          out[k] = attrs[k];
      } else
        out.setAttribute(k, attrs[k]);
    }
    out.inject = function(parent, top) {
      parent.insertBefore(out, top ? parent.firstChild : null);
      return out;
    };

    return out;
  }

  inlineimg(anchor, lastfoo) {
    var imgs = anchor.querySelectorAll("img");
    var urls = {};

    forEach(imgs, (img) => {
      if(this.options.inlineimages) {
        var oCanvas = this.$n('canvas', {width : img.offsetWidth, height : img.offsetHeight});
        var oCtx    = oCanvas.getContext("2d");

        oCtx.drawImage(img, 0, 0, img.offsetWidth, img.offsetHeight);
        urls[img.src] = oCanvas.toDataURL();
      } else if(this.options.AbsolutePath)
        urls[img.src] = String(img.src);
    });

    imgs = lastfoo.querySelectorAll("img");
    forEach(imgs, function(img) {
      img.src = urls[img.src] || img.src;
    });
  }

  process(chain) {
    var container = this.anchor;
    var lastfoo   =  null;

    while(container != this.document && container != null) {
      var foo = this.$n(container.nodeName, {className : container.className, style : container.style});
      if(container.id)
        foo.id = container.id;
      if(container == this.anchor)
        foo.innerHTML = this.anchor.innerHTML;
      else
        lastfoo.inject(foo);

      container = container.parentNode;
      lastfoo = foo;
    }

    var head = this.$n('head').inject(lastfoo, 'top');
    this.$n('meta', {'http-equiv' : "content-type", content : 'text/html', charset : 'utf-8'}).inject(head);

    this.inlineimg(this.anchor, lastfoo);
    if(this.options.AbsolutePath)
      this.inlineCssImages(lastfoo);

    ucss(this.anchor, this.options, (err, allcss) => {
      this.$n('style', {type : "text/css", innerText : allcss }).inject(head);
      chain(null, lastfoo);
    });
  }

  inlineCssImages(lastfoo) {
    var all         = lastfoo.getElementsByTagName("*");
    var remoteMatch = new RegExp("url\\((.*)\\)");

    for(var i = 0; i < all.length; i++) {
      var rules = all[i].style;
      //console.log(rules);
      for(var j in rules) {
        if(j == 'cssText') continue;
        if(rules[j] && typeof rules[j] != 'function' && remoteMatch.test(rules[j])) {
          var imageUrl    = remoteMatch.exec(rules[j])[1].replace(new RegExp('"', 'g'), '');
          var absoluteUrl = path.join(this.options.AbsolutePath, imageUrl);
          all[i].style[j] = "url('" + absoluteUrl + "')";
        }
      }
    }

  }

}

module.exports = function(anchor, options, chain) {
  (new LonesomeDom(anchor, options)).process(chain);
};
