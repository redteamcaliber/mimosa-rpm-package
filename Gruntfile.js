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
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            default: {
                files: {
                    'static/datatables/js/dataTables.bootstrap.js': ['static/datatables/js/dataTables.bootstrap.js'],


                    'static/sf/js/strikefinder.js': [
                        'static/sf/js/acquisitions.js',
                        'static/sf/js/components.js',
                        'hits.js static/sf/js/hits.js',
                        'hits-by-tag.js',
                        'hosts.js',
                        'models.js',
                        'shopping.js',
                        'suppressions.js',
                        'tasks.js',
                        'utils.js'
                    ],

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

    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-pg-utils');
    grunt.loadNpmTasks('grunt-prompt');

    grunt.registerTask('deploy-local-db', 'Deploy a local database.', function () {
        grunt.task.run('run-sql:create-local-db', 'run-sql:create-local-tables', 'run-sql:create-local-data');
    });

    // Default task(s).
    //grunt.registerTask('default', ['uglify']);

};
