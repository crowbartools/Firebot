/*
grunt include-source
    Includes all AngularJS files in the index.html file
*/

'use strict';
module.exports = function (grunt) {
    grunt.config.merge({
        includeSource: {
            options: {
                //This is the directory inside which grunt-include-source will be looking for files
                basePath: 'build/gui/app/',
                templates: {
                    html: {
                        js: '<script type="text/javascript" src="./{filePath}"></script>',
                        css: '<link rel="stylesheet" type="text/css" href="./{filePath}" />'
                    }
                }
            },
            app: {
                files: {
                    //Overwriting index.html
                    'build/gui/app/index.html': 'build/gui/app/index.html'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-include-source');

    grunt.registerTask('include-source', ['includeSource']);
};