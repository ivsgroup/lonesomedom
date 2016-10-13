const Class   = require('uclass');
const ucss    = require('microcss');
const forEach = require('mout/array/forEach');

module.exports = function(anchor, options, chain) {
  (new LonesomeDom(anchor, options)).process(chain);
}

const LonesomeDom = new Class({

  Implements : [
    require('uclass/options')
  ],

  anchor     : null,

  // same options as ucss
  options : {
    inlineimages  : false,
    inlineFonts   : false,
    fontsDir      : '/fonts',
    imagesBaseDir : '/resources',
    AbsolutePath  : false
  },

  initialize : function(anchor, options) {
    this.anchor   = anchor;
    this.setOptions(options);
    this.document = anchor.ownerDocument;
  },

  $n : function(type, attrs) {
    var out = this.document.createElement(type);
    for(var k in attrs) {
        if(k in out)
          out[k] = attrs[k];
        else
          out.setAttribute(k, attrs[k]);
    }
    out.inject = function(parent, top){
      parent.insertBefore(out, top ? parent.firstChild : null);
      return out;
    }
    return out;
  },

  inlineimg : function(anchor, lastfoo) {
    var self = this, imgs = anchor.querySelectorAll("img");

    var urls = {};
    forEach(imgs, function(img){
      if (self.options.inlineimages) {
        var oCanvas = self.$n('canvas', {width : img.offsetWidth, height: img.offsetHeight }), oCtx = oCanvas.getContext("2d");
        oCtx.drawImage(img, 0, 0, img.offsetWidth, img.offsetHeight );
        urls[img.src] = oCanvas.toDataURL();
      } else if (self.options.AbsolutePath) {
        urls[img.src] = String(img.src);
      }
    });

    imgs = lastfoo.querySelectorAll("img");
    forEach(imgs, function(img) {
      img.src = urls[img.src] || img.src;
    });

  },

  process : function (chain) {
    var output = null, container = this.anchor, lastfoo =  null, self = this;


    while(container != this.document && container != null){
      var foo = self.$n(container.nodeName, { className: container.className, 'style' : container.style});
      if(container.id) foo.id = container.id;
      if(container == this.anchor)
        foo.innerHTML = this.anchor.innerHTML;
      else {
        lastfoo.inject(foo);
      }
      container = container.parentNode;

      lastfoo = foo;
    }

    var head = self.$n('head').inject(lastfoo, 'top');
    self.$n('meta', {'http-equiv': "content-type", content: 'text/html', charset: 'utf-8'}).inject(head);

    self.inlineimg(this.anchor, lastfoo);

    var allcss = ucss(this.anchor, this.options, function(err, allcss) {
      self.$n('style', {type: "text/css", innerText: allcss }).inject(head);
      chain(null, lastfoo);
    });
    
  }
});
