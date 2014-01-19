var path = require('path');

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

/**
 * Source the UAC environment script before running grunt commands.
 *
 * . /opt/web/apps/uac/bin/env.sh
 */
module.exports = function (grunt) {
    function get_local_connection() {
        return {
            user: 'uac_user',
            password: 'devnet',
            database: 'uac',
            host: 'localhost',
            port: 5432
        }
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            /**
             * Watch the underscore templates and re-compile the templates to a JST file.
             */
            templates: {
                files: ['views/sf/templates/*.html', 'views/nt/templates/*.html'],
                tasks: ['jst']
            }
        },

        /**
         * Compile underscore templates into a .jst file.
         */
        jst: {
            sf: {
                options: {
                    namespace: 'StrikeFinder.templates',
                    prettify: true,
                    processName: process_name
                },
                files: {
                    'static/sf/js/templates.js': ['views/sf/templates/*.html']
                }
            },
            nt: {
                options: {
                    namespace: 'Network.templates',
                    prettify: true,
                    processName: process_name
                },
                files: {
                    'static/nt/js/templates.js': ['views/nt/templates/*.html']
                }
            }
        },

        /**
         * Combine and uglify Javascript files.
         */
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            default: {
                files: {
                    // Async library comes  uncompressed.
                    'static/js/async.js': 'static/js/async.js',

                    // Datatables bootstrap.
                    'static/datatables/js/dataTables.bootstrap.js': ['static/datatables/js/dataTables.bootstrap.js'],

                    'static/uac/js/uac.js': ['static/uac/js/common.js'],

                    // StrikeFinder client sources.
                    'static/sf/js/strikefinder.js': [
                        'static/sf/js/utils.js',
                        'static/sf/js/components.js',
                        'static/sf/js/models.js',
                        'static/sf/js/hits.js',
                        'static/sf/js/acquisitions.js',
                        'static/sf/js/hits-by-tag.js',
                        'static/sf/js/hosts.js',
                        'static/sf/js/shopping.js',
                        'static/sf/js/suppressions.js',
                        'static/sf/js/tasks.js'
                    ],

                    // IOC Viewer source.
                    'static/js/jquery.iocViewer.js': ['static/js/jquery.iocViewer.js']
                }
            }
        },

        prompt: {
            db_password: {
                options: {
                    questions: [
                        {
                            config: 'db.password',       // arbitrary name or config for any other grunt task
                            type: 'password',   // list, checkbox, confirm, input, password
                            message: 'Database Password: ',
                            validate: function (value) {
                                // return true if valid, error message if invalid
                                return value ? true : false;
                            }
                        }
                    ]
                }
            }
        },

        gitclone: {
            master: {
                options: {
                    repository: 'git@github.mandiant.com:amilano/uac-node.git',
                    branch: 'master',
                    directory: '/root/build'
                }
            }
        },

        'run-sql': {
            'create-local-db': {
                src: 'sql/create_database.sql',
                options: {
                    connection: {
                        user: 'postgres',
                        password: 'devnet',
                        host: 'localhost',
                        port: 5432
                    }
                }
            },
            'create-local-tables': {
                src: 'sql/create_tables.sql',
                options: {
                    connection: get_local_connection()
                }
            },
            'create-local-data': {
                src: 'sql/create_data.sql',
                options: {
                    connection: get_local_connection()
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-pg-utils');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-contrib-jst');


    /**
     * Deploy a local database.
     *
     * $ grunt deploy-local-db
     */
    grunt.registerTask('deploy-local-db', 'Deploy a local database.', function () {
        grunt.task.run('run-sql:create-local-db', 'run-sql:create-local-tables', 'run-sql:create-local-data');
    });
};
