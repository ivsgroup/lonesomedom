var Class = require('uclass');
var ucss  = require('microcss');

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
      var foo = new Element(container.nodeName, {'class': container.className, 'style' : container.style, id: container.id});
      if(container == this.anchor)
        foo.innerHTML = this.anchor.innerHTML;
      else {
        foo.adopt(lastfoo);
      }
      container = container.parentNode;

      lastfoo = foo;
    }

    var head = (new Element('head')).inject(lastfoo, 'top');
    (new Element('meta', {'http-equiv': "Content-Type", content: 'text/html', charset: 'utf-8'})).inject(head);
    (new Element('style', {type: "text/css", text: allcss })).inject(head);

    return lastfoo;
  }
});

