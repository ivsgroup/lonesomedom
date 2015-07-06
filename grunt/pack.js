var fs = require('fs');
var cp = require('child_process');

module.exports = function(grunt) {
  var manifest = grunt.config.get('manifest')

  grunt.config('uglify', {
    options: {
      mangle: false
    },
    pack : {
      files: {
        'release/pack.min.js': ['release/pack.js']
      }
    }
  });

  grunt.config('browserify', {
    options : { browserifyOptions : {
      //  https://github.com/substack/node-browserify/blob/master/bin/args.js#L71
      detectGlobals : false,
    },},

    pack : {
      files: {
        'release/pack.js': ['release/bootstrap.js']
      }
    }
  });

  
  grunt.registerTask('pack', ['browserify', 'uglify']);


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
};