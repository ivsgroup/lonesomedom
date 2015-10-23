(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Class = require('uclass');
var ucss  = require('microcss');
var forEach = require('mout/array/forEach');

module.exports = function(anchor, chain){
  (new LonesomeDom(anchor)).process(chain);
}

var LonesomeDom = new Class({
  anchor     : null,

  initialize : function(anchor){
    this.anchor   = anchor;
    this.document = anchor.ownerDocument;
  },

  $n : function(type, attrs){
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

  inlineimg : function(anchor, lastfoo){
    var self = this, imgs = anchor.querySelectorAll("img");

    var urls = {};
    forEach(imgs, function(img){
      var oCanvas = self.$n('canvas', {width : img.offsetWidth, height: img.offsetHeight }), oCtx = oCanvas.getContext("2d");
      oCtx.drawImage(img, 0, 0, img.offsetWidth, img.offsetHeight );
      urls[img.src] = oCanvas.toDataURL();
    });

    imgs = lastfoo.querySelectorAll("img");
    forEach(imgs, function(img){
      img.src= urls[img.src];
    });

  },

  process : function (chain){
    var output = null, container = this.anchor, lastfoo =  null, self = this;


    while(container != this.document){ 
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
    var allcss = ucss(this.anchor, {inlineFonts : false, fontsDir : 'fonts' }, function(err, allcss) {
      self.$n('style', {type: "text/css", innerText: allcss }).inject(head);
      chain(null, lastfoo);
    });
    
  }
});


},{"microcss":3,"mout/array/forEach":4,"uclass":18}],2:[function(require,module,exports){
// Stolen from http://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
module.exports = function(str) {
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "", i = 0, len = str.length, c1, c2, c3;
  while (i < len) {
    c1 = str.charCodeAt(i++) & 0xff;
    if (i == len) {
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt((c1 & 0x3) << 4);
      out += "==";
      break;
    }
    c2 = str.charCodeAt(i++);
    if (i == len) {
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt((c2 & 0xF) << 2);
      out += "=";
      break;
    }
    c3 = str.charCodeAt(i++);
    out += CHARS.charAt(c1 >> 2);
    out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
    out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
    out += CHARS.charAt(c3 & 0x3F);
  }
  return out;
};

},{}],3:[function(require,module,exports){
var Class        = require('uclass');
var base64encode = require('ubase64/encode');
var forEach      = require('mout/array/foreach');

//var url          = require('url'); //this works as expected
var url = {
  parseDir : function(url){
    console.log(url);
    var foo = /https?:\/\/[^\/]+(\/[^?#]+)/;
    if(!foo.test(url))
      return url;
    var path = foo.exec(url)[1];
    return path.substr(path.lastIndexOf('/'));
  }
}



  //anchor [,options] ,chain
module.exports = function(anchor, options, chain){
  var args = [].slice.call(arguments);
  anchor  = args.shift();
  chain   = args.pop();
  options = args.pop()

  return (new uCSS(anchor, options)).process(chain);
}



var uCSS = new Class({
  Implements : [
    require('uclass/options'),
  ],
  pseudosRegex : (function(){
    var ignoredPseudos = [
          /* link */
          ':link', ':visited',
          /* user action */
          ':hover', ':active', ':focus',
          /* UI element states */
          ':enabled', ':disabled', ':checked', ':indeterminate',
          /* pseudo elements */
           '::first-line', '::first-letter', '::selection', '::before', '::after',
          /* pseudo classes */
          ':target',
          /* CSS2 pseudo elements */
          ':before', ':after'
        ];
    return new RegExp("([^,: ])(?:"+ignoredPseudos.join('|')+")", 'g');
  }()),
  
  anchor     : null,
  parentPath : null,

  options    : {
         //inline fonts using dataURI
      inlineFonts : true,
        //when not inlining fonts, assume all fonts are available in fontsDir
      fontsDir    : '/fonts/',
  },

  initialize : function(anchor, options) {
    this.anchor   = anchor;
    this.setOptions(options);
    console.log(this.options);

      //auto references document & window for portability
    this.document = anchor.ownerDocument;
    this.window   = this.document.defaultView;

    var container = anchor;
    this.parentPath = [anchor];

    while(container != this.document.documentElement)
      this.parentPath.push(container = container.parentNode);

    this.parentPath.reverse();
  },

  getBinary: function (url) {
    var XMLHttpRequest = this.window.XMLHttpRequest;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.send(null);
    return xhr.responseText;
  },


  process  : function(chain){
    var out = [], self = this;

    forEach(this.document.styleSheets, function(style, index) {
      if (!style.rules) return;

      forEach(style.rules, function(rule) {
        out = out.concat(self.recss(rule));
      });
    });

    chain(null, out.join(''));
  },

  recss:function(rule) {
    var out = [], self = this;

    var remoteMatch = new RegExp("url\\((.*)\\)");

    if(rule instanceof this.window.CSSFontFaceRule) {
      var src = rule.style.src, outFace = rule.cssText;

      if(remoteMatch.test(src)) {
        var fontPath, fontUrl = remoteMatch.exec(src)[1];
        if(self.options.inlineFonts) {
          var base64EncodedFont = base64encode(this.getBinary(fontUrl));
          fontPath = "url('data:application/font-ttf;base64, " + base64EncodedFont + "')";
        } else {
          fontPath = "url('"+ self.options.fontsDir + url.parseDir(fontUrl) + "')";
        }
        outFace = outFace.replace(remoteMatch, fontPath);
      }

      out.push(outFace);
      return out;
    }

    if(rule instanceof this.window.CSSMediaRule) {
      out.push("@media " + rule.media.mediaText + "{ ");
      forEach(rule.cssRules, function(rule) {
        out = out.concat(self.recss(rule));
      });
      out.push("}");
    }

    if(!rule.selectorText)
      return out;

    var selector = rule.selectorText.replace(this.pseudosRegex, '$1');

    var elements = this.document.querySelectorAll(selector);

    var matched = false;
    for(var i= 0; i< elements.length; i++) {
      var parent = elements.item(i), hi = this.parentPath.indexOf(parent);
      if(hi != -1 &&  hi < 2) //html, body only, this behavior can be optionnal
        parent = this.anchor;

      while(parent != this.document.documentElement && parent != this.anchor)
        parent = parent.parentNode; 

      if(parent == this.anchor) {
        out.push(rule.cssText);
        break;
      }
    }
    return out;

  },

});

},{"mout/array/foreach":5,"ubase64/encode":2,"uclass":18,"uclass/options":17}],4:[function(require,module,exports){


    /**
     * Array forEach
     */
    function forEach(arr, callback, thisObj) {
        if (arr == null) {
            return;
        }
        var i = -1,
            len = arr.length;
        while (++i < len) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if ( callback.call(thisObj, arr[i], i, arr) === false ) {
                break;
            }
        }
    }

    module.exports = forEach;



},{}],5:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],6:[function(require,module,exports){
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');
var mixIn = require('../object/mixIn');

    /**
     * Clone native types.
     */
    function clone(val){
        switch (kindOf(val)) {
            case 'Object':
                return cloneObject(val);
            case 'Array':
                return cloneArray(val);
            case 'RegExp':
                return cloneRegExp(val);
            case 'Date':
                return cloneDate(val);
            default:
                return val;
        }
    }

    function cloneObject(source) {
        if (isPlainObject(source)) {
            return mixIn({}, source);
        } else {
            return source;
        }
    }

    function cloneRegExp(r) {
        var flags = '';
        flags += r.multiline ? 'm' : '';
        flags += r.global ? 'g' : '';
        flags += r.ignoreCase ? 'i' : '';
        return new RegExp(r.source, flags);
    }

    function cloneDate(date) {
        return new Date(+date);
    }

    function cloneArray(arr) {
        return arr.slice();
    }

    module.exports = clone;



},{"../object/mixIn":16,"./isPlainObject":10,"./kindOf":11}],7:[function(require,module,exports){
var clone = require('./clone');
var forOwn = require('../object/forOwn');
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');

    /**
     * Recursively clone native types.
     */
    function deepClone(val, instanceClone) {
        switch ( kindOf(val) ) {
            case 'Object':
                return cloneObject(val, instanceClone);
            case 'Array':
                return cloneArray(val, instanceClone);
            default:
                return clone(val);
        }
    }

    function cloneObject(source, instanceClone) {
        if (isPlainObject(source)) {
            var out = {};
            forOwn(source, function(val, key) {
                this[key] = deepClone(val, instanceClone);
            }, out);
            return out;
        } else if (instanceClone) {
            return instanceClone(source);
        } else {
            return source;
        }
    }

    function cloneArray(arr, instanceClone) {
        var out = [],
            i = -1,
            n = arr.length,
            val;
        while (++i < n) {
            out[i] = deepClone(arr[i], instanceClone);
        }
        return out;
    }

    module.exports = deepClone;




},{"../object/forOwn":13,"./clone":6,"./isPlainObject":10,"./kindOf":11}],8:[function(require,module,exports){
var kindOf = require('./kindOf');
    /**
     * Check if value is from a specific "kind".
     */
    function isKind(val, kind){
        return kindOf(val) === kind;
    }
    module.exports = isKind;


},{"./kindOf":11}],9:[function(require,module,exports){
var isKind = require('./isKind');
    /**
     */
    function isObject(val) {
        return isKind(val, 'Object');
    }
    module.exports = isObject;


},{"./isKind":8}],10:[function(require,module,exports){


    /**
     * Checks if the value is created by the `Object` constructor.
     */
    function isPlainObject(value) {
        return (!!value && typeof value === 'object' &&
            value.constructor === Object);
    }

    module.exports = isPlainObject;



},{}],11:[function(require,module,exports){


    var _rKind = /^\[object (.*)\]$/,
        _toString = Object.prototype.toString,
        UNDEF;

    /**
     * Gets the "kind" of value. (e.g. "String", "Number", etc)
     */
    function kindOf(val) {
        if (val === null) {
            return 'Null';
        } else if (val === UNDEF) {
            return 'Undefined';
        } else {
            return _rKind.exec( _toString.call(val) )[1];
        }
    }
    module.exports = kindOf;


},{}],12:[function(require,module,exports){
var hasOwn = require('./hasOwn');

    var _hasDontEnumBug,
        _dontEnums;

    function checkDontEnum(){
        _dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];

        _hasDontEnumBug = true;

        for (var key in {'toString': null}) {
            _hasDontEnumBug = false;
        }
    }

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forIn(obj, fn, thisObj){
        var key, i = 0;
        // no need to check if argument is a real object that way we can use
        // it for arrays, functions, date, etc.

        //post-pone check till needed
        if (_hasDontEnumBug == null) checkDontEnum();

        for (key in obj) {
            if (exec(fn, obj, key, thisObj) === false) {
                break;
            }
        }


        if (_hasDontEnumBug) {
            var ctor = obj.constructor,
                isProto = !!ctor && obj === ctor.prototype;

            while (key = _dontEnums[i++]) {
                // For constructor, if it is a prototype object the constructor
                // is always non-enumerable unless defined otherwise (and
                // enumerated above).  For non-prototype objects, it will have
                // to be defined on this object, since it cannot be defined on
                // any prototype objects.
                //
                // For other [[DontEnum]] properties, check if the value is
                // different than Object prototype value.
                if (
                    (key !== 'constructor' ||
                        (!isProto && hasOwn(obj, key))) &&
                    obj[key] !== Object.prototype[key]
                ) {
                    if (exec(fn, obj, key, thisObj) === false) {
                        break;
                    }
                }
            }
        }
    }

    function exec(fn, obj, key, thisObj){
        return fn.call(thisObj, obj[key], key, obj);
    }

    module.exports = forIn;



},{"./hasOwn":14}],13:[function(require,module,exports){
var hasOwn = require('./hasOwn');
var forIn = require('./forIn');

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forOwn(obj, fn, thisObj){
        forIn(obj, function(val, key){
            if (hasOwn(obj, key)) {
                return fn.call(thisObj, obj[key], key, obj);
            }
        });
    }

    module.exports = forOwn;



},{"./forIn":12,"./hasOwn":14}],14:[function(require,module,exports){


    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



},{}],15:[function(require,module,exports){
var hasOwn = require('./hasOwn');
var deepClone = require('../lang/deepClone');
var isObject = require('../lang/isObject');

    /**
     * Deep merge objects.
     */
    function merge() {
        var i = 1,
            key, val, obj, target;

        // make sure we don't modify source element and it's properties
        // objects are passed by reference
        target = deepClone( arguments[0] );

        while (obj = arguments[i++]) {
            for (key in obj) {
                if ( ! hasOwn(obj, key) ) {
                    continue;
                }

                val = obj[key];

                if ( isObject(val) && isObject(target[key]) ){
                    // inception, deep merge objects
                    target[key] = merge(target[key], val);
                } else {
                    // make sure arrays, regexp, date, objects are cloned
                    target[key] = deepClone(val);
                }

            }
        }

        return target;
    }

    module.exports = merge;



},{"../lang/deepClone":7,"../lang/isObject":9,"./hasOwn":14}],16:[function(require,module,exports){
var forOwn = require('./forOwn');

    /**
    * Combine properties from all the objects into first one.
    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
    * @param {object} target    Target Object
    * @param {...object} objects    Objects to be combined (0...n objects).
    * @return {object} Target Object.
    */
    function mixIn(target, objects){
        var i = 0,
            n = arguments.length,
            obj;
        while(++i < n){
            obj = arguments[i];
            if (obj != null) {
                forOwn(obj, copyProp, target);
            }
        }
        return target;
    }

    function copyProp(val, key){
        this[key] = val;
    }

    module.exports = mixIn;


},{"./forOwn":13}],17:[function(require,module,exports){
var Class = require('uclass');
var merge = require("mout/object/merge")

var Options = new Class({

  initialize : function(){
    if(!this.options)
      this.options = {};
    //this.options = should clone here 
  },

  setOptions: function(options){
      var args = [{}, this.options]
      args.push.apply(args, arguments)
      this.options = merge.apply(null, args)
      return this
  }
});

module.exports = Options;
},{"mout/object/merge":15,"uclass":18}],18:[function(require,module,exports){
Function.prototype.static = function(){
  this.$static = true;
  return this;
}

var uClass = function(obj){
  var out = function(){
    if(obj.Binds) obj.Binds.forEach(function(f){
      var original = this[f];
      if(original) this[f] = original.bind(this);
    }.bind(this));
    obj.initialize.apply(this, arguments);
  }
  out.implements = function(obj){
    for(var i in obj) {
      if((typeof obj[i] == 'function') && obj[i].$static)
        out[i] = obj[i];
      else
        out.prototype[i] = obj[i];
    }
  }

  if(obj.Implements)
    obj.Implements.forEach(function(Mixin){
      out.implements(new Mixin);
    });
  out.implements(obj);

  return out;
};



module.exports = uClass;
},{}],19:[function(require,module,exports){
window.lonesomedom = require('..');

},{"..":1}]},{},[19]);