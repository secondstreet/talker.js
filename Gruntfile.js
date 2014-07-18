module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      options: {
        report: 'gzip',
        preserveComments: 'some',
        compress: {
          pure_getters: true
        }
      },
      globals: {
        options: {
          banner: '(function(){',
          footer: '\nwindow.Talker=Talker})()'
        },
        files: {
          'dist/talker.min.js': [
            'src/talker.js'
          ]
        }
      },
      amd: {
        options: {
          banner: 'define([],function(){',
          footer: '\nreturn Talker})'
        },
        files: {
          'dist/amd/talker.min.js': [
            'src/talker.js'
          ]
        }
      },
      named_amd: {
        options: {
          banner: 'define("talker",[],function(){',
          footer: '\nreturn Talker})'
        },
        files: {
          'dist/named_amd/talker.min.js': [
            'src/talker.js'
          ]
        }
      },
      common_js: {
        options: {
          footer: '\nmodule.exports=Talker'
        },
        files: {
          'dist/common_js/talker.min.js': [
            'src/talker.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify']);
};

