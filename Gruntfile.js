module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Rewrite
  var rewrite = require('connect-modrewrite');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ['*'],
      tasks: ['concat', 'uglify'],
      options: {
        livereload: true,
        nospawn: true
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['node_modules/lodash/lodash.min.js', 'framework/core.js', 'framework/loader.js', 'framework/utils.js', 'framework/model.js', 'framework/router.js', 'framework/template.js', 'js/models.js', 'js/app.js', 'js/helpers.js', 'js/routes.js', 'js/events.js'],
        dest: 'dist/app.js'
      }
    },
    cssmin: {
      target: {
        files: [{
          src: ['assets/css/app.css'],
          dest: 'dist/app.min.css'
        }]
      }
    },
    uglify: {
      options: {
        banner: '/*! Application <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      default: {
        files: {
          'dist/dependencies.min.js': ['dist/dependencies.js'],
          'dist/app.min.js': ['dist/app.js']
        }
      }
    },
    connect: {
      base: {
        options: {
          port: 3000,
          livereload: true,
          hostname: 'localhost',
          open: true,
          middleware: function (connect, options, middlewares) {
            var rules = [ // 1. mod-rewrite-ish behavior
              '!\\.html|\\.js|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.woff|\\.woff2|\\.eot|\\.ttf|\\.gif$ /index.html'
            ];
            middlewares.unshift(rewrite(rules));
            return middlewares;
          }
        }
      },
      keepalive: {
        options: {
          port: 3000,
          livereload: true,
          keepalive: true,
          open: true
        }
      }
    }
  });

  grunt.registerTask('none', function() {});

  grunt.registerTask('server', 'connect:keepalive');

  grunt.registerTask('default', ['connect:base', 'concat', 'uglify', 'cssmin', 'watch']);
};
