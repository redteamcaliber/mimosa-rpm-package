var path = require('path');
var assert = require('assert');
var pkg = require('./package.json');

// Ensure required fields are set.
assert(pkg);
assert(pkg['name']);
assert(pkg['version']);


/**
 * Source the UAC environment script before running grunt commands.
 *
 * . /opt/web/apps/uac/bin/env.sh
 *
 * Commands:
 *
 * deploy-local-db  - Deploy the UAC database to localhost.
 * build-rpm        - Build the UAC RPM.
 * deploy-devnet    - Build and deploy the UAC RPM to devnet.
 *
 */
module.exports = function (grunt) {
    // Tokenize the version to strings for use with RPM.  Assumes version follows the format: ##.##.##.
    var tokens = pkg.version.split('.');
    assert(tokens);
    assert(tokens.length == 3);
    var uac_version = tokens[0] + '.' + tokens[1];
    assert(uac_version);
    var uac_release = tokens[2];
    assert(uac_release);


    // Project configuration.
    grunt.initConfig({

        uac_name: pkg['name'].charAt(0).toUpperCase() + pkg['name'].slice(1),
        uac_version: uac_version,
        uac_release: uac_release,

        // Set the build directory.
//        'build_dir': '.',
        'build_uac_dir': '<%= projectPath %>dist',
        'build_rpm_dir': '<%= projectPath %>rpm',

        // The UAC RPM file name.
        'uac_rpm_file': '<%= uac_name %>-<%= uac_version %>-<%= uac_release %>.x86_64.rpm',



        touch: {
            options: {
                nocreate: true
            },
            'server': ['uac-server.js']
        },

        bower: {
            install: {
                options: {
                    targetDir: 'dist/client/js/raw/lib',
                    layout: 'byComponent',
                    install: true,
                    verbose: true,
                    cleanTargetDir: true,
                    cleanBowerDir: false,
                    bowerOptions: {
                        forceLatest: true
                    }
                }
            }
        },

        easy_rpm: {
            options: {
                name: '<%= uac_name %>',
                version: '<%= uac_version %>',
                release: '<%= uac_release %>',
                buildArch: 'x86_64',
                destination: '<%= build_rpm_dir %>',
                summary: 'The Mandiant Unified Analyst Console (UAC)',
                license: 'Commercial',
                group: 'Applications/Internet',
                vendor: 'Mandiant',
                url: 'http://www.mandiant.com',
                tempDir: '<%= build_rpm_dir %>',
                defattrScript: [
                    {user: 'root', group: 'root'}
                ]
            },
            release: {
                files: [
                    {
                        // Include the root files.
                        cwd: '<%= build_uac_dir %>',
                        src: ['**/*', '!server/conf/env.json'],
                        dest: '/opt/web/apps/uac'
                    }
                ]
            }
        },


        coffee: {
            'uac-server': {
                options: {
                    bare: true,
                    sourceMap: true
                },
                files: {
                    'dist/server/uac-server.js': 'uac-server.coffee'
                }
            },
            node: {
                options: {
                    sourceMap: true
                },
                expand: true,
                cwd: 'src/server/js',
                src: ['**/*.coffee'],
                dest: 'dist/server/js',
                ext: '.js'
            },
            web: {
                options: {
                    sourceMap: true
                },
                expand: true,
                cwd: 'dist/client/js/raw',
                src: ['**/*.coffee'],
                dest: 'dist/client/js/raw',
                ext: '.js'
            }
        },
        /**
         * Compile underscore templates into a .jst file.
         */
        //TODO: the output file dir should be a var
        jst: {
            uac: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/uac/ejs/templates.js': ['src/client/js/uac/ejs/*.ejs']
                }
            },
            sf: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/sf/ejs/templates.js': ['src/client/js/sf/ejs/*.ejs']
                }
            },
            alerts: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/alerts/ejs/templates.js': ['src/client/js/alerts/ejs/*.ejs']
                }
            },
            //these should copy into dist
            'uac-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/uac/ejs/templates.js': ['src/client/js/uac/ejs/*.ejs']
                }
            },
            'sf-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/sf/ejs/templates.js': ['src/client/js/sf/ejs/*.ejs']
                }
            },
            'alerts-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'dist/client/js/raw/alerts/ejs/templates.js': ['src/client/js/alerts/ejs/*.ejs']
                }
            }
        },
        watch: {
            /**
             * Watch the underscore templates and re-compile the templates to a JST file.
             */
            templates: {
                files: ['src/client/js/uac/ejs/*.ejs', 'src/client/js/alerts/ejs/*.ejs', 'src/client/js/sf/ejs/*.ejs'],
                tasks: ['jst-dev']//should copy directly into dist
            },
            'grunt': {
                files: ['Gruntfile.js'],
                tasks: ['build']
            },
            'node-coffee': {
                files: ['uac-server.coffee', 'src/server/js/**/*.coffee'],
                tasks: ['coffee:node', 'coffee:uac-server']
            },
            'node-js': {
                files: ['src/server/js/**/*.js'],
                tasks: ['copy:unconvertedNode', 'coffee:uac-server']
            },
            'web-coffee': {
                files: ['src/client/js/**/*.coffee', 'src/client/js/**/*.js'],
                tasks: ['copy:preBuild','coffee:web']
            },
            'css': {
                files: ['src/client/css/**/*.css'],
                tasks: ['cssmin']
            }
        },
        clean: {
            preBuild: ['dist'],
            postBuild: ["dist/client/js/.tmp"]
        },
        copy: {
            preBuild: {
                files: [
                    {expand: true, cwd: 'src/client/js', src: ['**/*.js','**/*.coffee'], dest: 'dist/client/js/raw', filter: 'isFile'}
                ]
            },
            cssResources: {
                files: [
                    {expand: true, cwd: 'dist/client/js/raw/lib/font-awesome/fonts', src: ['**/*'], dest: 'dist/client/fonts', filter: 'isFile'},
                    {expand: true, cwd: 'dist/client/js/raw/lib/select2', src: ['*.png', '*.gif'], dest: 'dist/client/css', filter: 'isFile'},
                    {expand: true, cwd: 'dist/client/js/raw/lib/bootstrap/css', src: ['bootstrap.min.css'], dest: 'dist/client/css/bootstrap', filter: 'isFile'},
                    {expand: true, cwd: 'dist/client/js/raw/lib/bootswatch/dist', src: ['**/*.css'], dest: 'dist/client/css/bootswatch', filter: 'isFile'},
                    {expand: true, cwd: 'dist/client/js/raw/lib/bootstrap/fonts', src: ['*.*'], dest: 'dist/client/css/bootswatch/fonts', filter: 'isFile'},
                    {expand: true, cwd: 'src/client/css/img', src: ['**/*'], dest: 'dist/client/css/img', filter: 'isFile'},
                    {expand: true, cwd: 'src/client/css/img', src: ['sort_*.png'], dest: 'dist/client/img', filter: 'isFile'},
                    {expand: true, cwd: 'src/client/css', src: ['mocha.css'], dest: 'dist/client/css', filter: 'isFile'}

                ]
            },
            unconvertedNode:{
                files: [
                    {expand: true, cwd: 'src/server', src: ['**/*.js', '**/*.json', '**/*.html'], dest: 'dist/server', filter: 'isFile'}
                ]
            },
            nodePackages:{
                files: [
                    {expand: true, src: ['package.json'], dest: 'dist/server/', filter: 'isFile'}
                ]
            },
            serverConfig:{
                files: [
                    {expand: true, cwd: 'conf', src: ['**/*'], dest: 'dist/server/conf', filter: 'isFile'}
                ]
            },
            binScripts:{
                files: [
                    {expand: true, cwd: 'bin', src: ['**/*'], dest: 'dist/server/bin', filter: 'isFile'}
                ]
            },
            serverViews:{
                files: [
                    {expand: true, cwd: 'views', src: ['**/*'], dest: 'dist/server/views', filter: 'isFile'}
                ]
            }
        },
        cssmin: {
            combine:{
                files: {
                    "dist/client/css/main.css": [
                        'src/client/css/base.css',
                        'dist/client/js/raw/lib/font-awesome/css/font-awesome.min.css',
                        'dist/client/js/raw/lib/select2/select2.css',
                        'dist/client/js/raw/lib/eonasdan-bootstrap-datetimepicker/bootstrap-datetimepicker.min.css',
                        'src/client/css/typeahead.js-bootstrap.css',
                        'dist/client/js/raw/lib/datatables/jquery.dataTables.css',
                        'src/client/css/datatables.css',
                        'src/client/css/dataTables.fixedHeader.css',
                        'src/client/css/datatables-scroller.css',
                        'src/client/css/jquery.iocViewer.css'
                    ]
                }
            }
        },
        requirejs: {
            dist: {
                options: {
                    optimize: 'none',
                    appDir: "dist/client/js/raw",
                    baseUrl: ".",
                    keepBuildDir: true,
                    allowSourceOverwrites: true,
                    paths: {
                        ace: 'lib/ace',
                        async: 'lib/async/async',
                        backbone: 'lib/backbone/backbone',
                        'backbone.babysitter': 'lib/backbone.babysitter/backbone.babysitter',
                        'backbone.wreqr': 'lib/backbone.wreqr/backbone.wreqr',
                        bootstrap: 'lib/bootstrap/js/bootstrap',
                        bootstrap_growl: 'lib/bootstrap-growl/jquery.bootstrap-growl',
                        blockui: 'lib/blockui/jquery.blockUI',
                        cocktail: 'lib/cocktail/Cocktail',
                        datatables: 'lib/datatables/jquery.dataTables',
                        datatables_bootstrap: 'js/datatables',
                        'datatables-fixedheader': 'js/dataTables.fixedHeader',
                        'datatables-scroller': 'js/dataTables.scroller',
                        highlighter: 'js/jQuery.highlighter',
                        iocviewer: 'js/jquery.iocViewer',
                        jquery: 'js/jquery-1.9.1',
                        marionette: 'lib/marionette/backbone.marionette',
                        "marked": "lib/marked/marked",
                        moment: 'lib/moment/moment',
                        select2: 'lib/select2/select2',
                        typeahead: 'lib/typeahead.js/typeahead.bundle',
                        underscore: 'lib/underscore/underscore',
                        'underscore.string': 'lib/underscore.string/underscore.string',
                        bootstrap_datepicker: 'lib/eonasdan-bootstrap-datetimepicker/bootstrap-datetimepicker.min'
                    },
                    shim: {
                        jquery: {
                            exports: '$'
                        },
                        bootstrap: {
                            deps: ['jquery'],
                            exports: 'bootstrap'
                        },
                        bootstrap_growl: {
                            deps: ['jquery'],
                            exports: '$.bootstrapGrowl'
                        },
                        bootstrap_datepicker: {
                            deps: ['jquery'],
                            exports: '$'
                        },
                        cocktail: {
                            deps: ['backbone']
                        },
                        highlighter: {
                            deps: ['jquery'],
                            exports: '$.fn.highlighter'
                        },
                        iocviewer: {
                            deps: ['jquery'],
                            exports: '$.fn.iocViewer'
                        },
                        select2: {
                            deps: ['jquery'],
                            exports: 'Select2'
                        },
                        typeahead: {
                            deps: ['jquery'],
                            exports: 'jQuery.fn.typeahead'
                        },
                        underscore: {
                            exports: '_'
                        }
                    },
                    dir: "dist/client/js/.tmp",
                    modules: [
                        {
                            name: "../modules/main",
                            create: true,
                            include: [
                                // Alerts Stuff
                                "alerts/main/AlertsMain",
                                //strike finder stuff
                                "sf/main/AgentTasksMain",
                                "sf/main/HitReviewMain",
                                "sf/main/HitsByTagMain",
                                "sf/main/HostsMain",
                                "sf/main/IdentityMain",
                                "sf/main/SuppressionsMain",
                                "sf/main/TasksMain",

                                //uac stuff
                                "uac/views/MixedTypeAheadView",
                                "uac/views/ThemeView",
                                "uac/main/MD5Main",
                                "uac/main/PreferencesMain",

                                //addl deps
                                "bootstrap"
                            ]
                        }
                    ]
                }
            }
        },
        shell: {
            /**
             * Install the node libraries.
             */
            'install-libs': {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: [
                    'cd dist/server',
                    'npm install --production'
                ].join('&&')
            }
        }
    });

    grunt.registerTask('build', [
        'clean:preBuild',

        //build client
        'jst:uac',
        'jst:alerts',
        'jst:sf',
        'copy:preBuild',
        'coffee',
        'bower:install',
        'requirejs:dist',
        'cssmin:combine',
        'copy:cssResources',
        'clean:postBuild',

        //build server
        'coffee:node',
        'copy:unconvertedNode',
        'copy:nodePackages',
        'copy:serverConfig',
        'copy:binScripts',
        'copy:serverViews'
    ]);

    grunt.registerTask('rpm', [
        'build',
        'shell:install-libs',
        'easy_rpm'
    ]);


    /**
     * Compile the JST templates for development.
     */
    grunt.registerTask('jst-dev', ['jst:uac-dev', 'jst:alerts-dev', 'jst:sf-dev']);


    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-scp');
    grunt.loadNpmTasks('grunt-ssh');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-pg-utils');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-easy-rpm');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-touch');

};

/**
 * Convert the filename/path to only use the filename.
 * @param filename - the filename with the path included.
 */
function process_name(filename) {
    var last_index = filename.lastIndexOf('/');
    if (last_index == -1) {
        return filename;
    }
    else {
        return filename.substring(last_index + 1, filename.length);
    }
}