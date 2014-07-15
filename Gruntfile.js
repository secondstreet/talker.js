module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      options: {
        report: 'gzip',
        sourceMap: true,
        preserveComments: 'some',
        wrap: 'Talker'
      },
      dist: {
        files: {
          'dist/talker.min.js': [
            'src/talker.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify']);
};

