var Class = require('uclass');
var ucss  = require('microcss');


var $n = function(type, attrs){
  var out = document.createElement(type);
  for(var k in attrs)
      out[k] = attrs[k];
  out.inject = function(parent, top){
    parent.insertBefore(out, top ? parent.firstChild : null);
    return out;
  }
  return out;
}

module.exports = function(anchor){
  return (new LonesomeDom(anchor)).process();
}

var LonesomeDom = new Class({
  anchor     : null,

  initialize : function(anchor){
    this.anchor = anchor;
  },

  process : function (){
    var output = null, container = this.anchor, lastfoo =  null;
    var allcss = ucss(this.anchor);

    while(container != document){ 
      var foo = $n(container.nodeName, {'class': container.className, 'style' : container.style});
      if(container.id) foo.id = container.id;
      if(container == this.anchor)
        foo.innerHTML = this.anchor.innerHTML;
      else {
        lastfoo.inject(foo);
      }
      container = container.parentNode;

      lastfoo = foo;
    }

    var head = $n('head').inject(lastfoo, 'top');
    $n('meta', {'http-equiv': "Content-Type", content: 'text/html', charset: 'utf-8'}).inject(head);
    $n('style', {type: "text/css", innerText: allcss }).inject(head);

    return lastfoo;
  }
});

