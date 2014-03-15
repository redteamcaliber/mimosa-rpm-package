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
        // The Github repository.
        uac_repo: 'git@github.mandiant.com:amilano/uac-node.git',

        // The Github Branch.
        uac_branch: '1.1.2',

        uac_name: pkg['name'].charAt(0).toUpperCase() + pkg['name'].slice(1),
        uac_version: uac_version,
        uac_release: uac_release,

        // Set the build directory.
        'build_dir': '/root/build',
        'build_uac_dir': '<%= build_dir %>/uac',
        'build_rpm_dir': '<%= build_dir %>/rpm',

        // The UAC RPM file name.
        'uac_rpm_file': '<%= uac_name %>-<%= uac_version %>-<%= uac_release %>.x86_64.rpm',

        watch: {
            /**
             * Watch the underscore templates and re-compile the templates to a JST file.
             */
            templates: {
                files: ['static/uac/ejs/*.ejs', 'static/alerts/ejs/*.ejs', 'static/sf/ejs/*.ejs'],
                tasks: ['jst:uac-dev', 'jst:alerts-dev', 'jst:sf-dev', 'jst:nt-dev']
            },
            coffee: {
                files: ['uac-server.coffee', 'lib/**/*.coffee', 'static/**/*.coffee'],
                tasks: ['coffee']
            }
        },

        bower: {
            install: {
                options: {
                    targetDir: 'static/lib',
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

        coffee: {
            'uac-server': {
                options: {
                    bare: true
                },
                files: {
                    'uac-server.js': 'uac-server.coffee'
                }
            },
            node: {
                expand: true,
                cwd: 'lib',
                src: ['**/*.coffee'],
                dest: 'lib',
                ext: '.js'
            },
            web: {
                options: {
                    sourceMap: true
                },
                expand: true,
                cwd: 'static',
                src: ['**/*.coffee'],
                dest: 'static',
                ext: '.js'
            }
        },

        /**
         * Compile underscore templates into a .jst file.
         */
        jst: {
            sf: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    '<%= build_uac_dir %>/static/sf/ejs/templates.js': ['<%= build_uac_dir %>/static/sf/ejs/*.ejs']
                }
            },
            uac: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    '<%= build_uac_dir %>/static/uac/ejs/templates.js': ['<%= build_uac_dir %>/static/uac/ejs/*.ejs']
                }
            },
            alerts: {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    '<%= build_uac_dir %>/static/alerts/ejs/templates.js': ['<%= build_uac_dir %>/static/alerts/ejs/*.ejs']
                }
            },
            'uac-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'static/uac/ejs/templates.js': ['static/uac/ejs/*.ejs']
                }
            },
            'alerts-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'static/alerts/ejs/templates.js': ['static/alerts/ejs/*.ejs']
                }
            },
            'sf-dev': {
                options: {
                    prettify: true,
                    processName: process_name,
                    amd: true
                },
                files: {
                    'static/sf/ejs/templates.js': ['static/sf/ejs/*.ejs']
                }
            }
        },

        /**
         * Combine and uglify Javascript files.
         */
        uglify: {
            default: {
                files: {
                    // Async library comes  uncompressed.
                    '<%= build_uac_dir %>/static/js/async.js': '<%= build_uac_dir %>/static/js/async.js',

                    // Datatables bootstrap.
                    '<%= build_uac_dir %>/static/datatables/js/dataTables.bootstrap.js': ['<%= build_uac_dir %>/static/datatables/js/dataTables.bootstrap.js'],

                    '<%= build_uac_dir %>/static/uac/js/uac.js': [
                        '<%= build_uac_dir %>/static/uac/js/common.js',
                        '<%= build_uac_dir %>/static/uac/js/components.js'
                    ],

                    // StrikeFinder client sources.
                    '<%= build_uac_dir %>/static/sf/js/strikefinder.js': [
                        '<%= build_uac_dir %>/static/sf/js/common.js',
                        '<%= build_uac_dir %>/static/sf/js/models.js',
                        '<%= build_uac_dir %>/static/sf/js/hits.js',
                        '<%= build_uac_dir %>/static/sf/js/acquisitions.js',
                        '<%= build_uac_dir %>/static/sf/js/hits-by-tag.js',
                        '<%= build_uac_dir %>/static/sf/js/hosts.js',
                        '<%= build_uac_dir %>/static/sf/js/shopping.js',
                        '<%= build_uac_dir %>/static/sf/js/suppressions.js',
                        '<%= build_uac_dir %>/static/sf/js/tasks.js'
                    ],

                    // IOC Viewer source.
                    '<%= build_uac_dir %>/static/js/jquery.iocViewer.js': ['<%= build_uac_dir %>/static/js/jquery.iocViewer.js']
                }
            }
        },

        prompt: {
            /**
             * Prompt for a database password.
             */
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
            },
            /**
             * Confirm deleting the build directory.
             */
            'delete-build-dir': {
                options: {
                    questions: [
                        {
                            config: 'delete_build_dir',
                            type: 'confirm',
                            message: 'Delete directory: <%= build_dir%>'
                        }
                    ]
                }
            },
            'passphrase': {
                options: {
                    questions: [
                        {
                            config: 'passphrase',
                            type: 'password',
                            message: 'Enter passphrase: ',
                            validate: function (value) {
                                // return true if valid, error message if invalid
                                return value ? true : false;
                            }
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
                    'chmod +x <%= build_uac_dir %>/bin/*',
                    'cd <%= build_uac_dir %>',
                    'npm install --production'
                ].join('&&')
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
                keepTemp: true,
                defattrScript: [
                    {user: 'root', group: 'root'}
                ],
                postInstallScript: [
                    'mkdir -p /opt/web/apps/uac/logs',
                    'if [ $(pgrep -f "node uac-server.js") ]; then echo "Restarting UAC..."; restart uac; else echo "Starting UAC..."; start uac; fi'
                ]
            },
            release: {
                files: [
                    {
                        // Include the root files.
                        cwd: '<%= build_uac_dir %>',
                        src: '*',
                        dest: '/opt/web/apps/uac'
                    },
                    {
                        // Include the bin scripts, should be executable.
                        cwd: '<%= build_uac_dir %>/bin',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/bin',
                        mode: '755'
                    },
                    {
                        // Include the template conf files.
                        cwd: '<%= build_uac_dir %>/conf',
                        src: ['*_env.json', 'settings.json'],
                        dest: '/opt/web/apps/uac/conf'
                    },
                    {
                        // Include the conf/certs files.
                        cwd: '<%= build_uac_dir %>/conf/certs',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/conf/certs'
                    },
                    {
                        // Include the upstart script.
                        cwd: '<%= build_uac_dir %>/conf/upstart',
                        src: 'uac.conf',
                        dest: '/etc/init'
                    },
                    {
                        // Include the nginx templates.
                        cwd: '<%= build_uac_dir %>/conf/nginx',
                        src: '**',
                        dest: '/etc/nginx/conf.d'
                    },
                    {
                        // Include the uac source files.
                        cwd: '<%= build_uac_dir %>/lib',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/lib'
                    },
                    {
                        // Include the node modules.
                        cwd: '<%= build_uac_dir %>/node_modules',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/node_modules'
                    },
                    {
                        // Include the static files.
                        cwd: '<%= build_uac_dir %>/static',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/static'
                    },
                    {
                        // Include the views.
                        cwd: '<%= build_uac_dir %>/views',
                        src: '**/*',
                        dest: '/opt/web/apps/uac/views'
                    }
                ]
            }
        },

        gitclone: {
            /**
             * Clone the UAC repository to the build_uac_dir.
             */
            uac: {
                options: {
                    repository: '<%= uac_repo %>',
                    branch: '<%= uac_branch %>',
                    directory: '<%= build_uac_dir %>'
                }
            }
        },

        scp: {
            options: {
                host: 'uac.dev.mandiant.com',
                username: 'root',
                password: 'devnet'
            },
            /***
             * scp the UAC RPM package to devnet.
             */
            devnet: {
                files: [{
                    cwd: '/root/build/rpm/RPMS/x86_64',
                    src: '<%= uac_rpm_file %>',
                    dest: '.'
                }]
            }
        },

        sftp: {
            prod: {
                files: {
                    "/root/build/rpm/RPMS/x86_64": "<%= uac_rpm_file %>"
                },
                options: {
                    path: '/dev_deploy/uac-node',
                    host: 'nas1.mplex.us2.mcirt.mandiant.com',
                    username: 'mcirtdev',
                    privateKey: grunt.file.read("/root/.ssh/id_rsa"),
                    passphrase: '<%= passphrase %>',
                    showProgress: true
                }
            }
        },

        sshexec: {
            /**
             * Install the UAC RPM to devnet.
             */
            'install-devnet': {
                command: 'rpm -i --force <%= uac_rpm_file %>',
                options: {
                    host: 'uac.dev.mandiant.com',
                    username: 'root',
                    password: 'devnet'
                }
            }
        },

        'run-sql': {
            /**
             * Create a UAC database on localhost.
             */
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
            /**
             * Create the UAC tables on localhost.
             */
            'create-local-tables': {
                src: 'sql/create_tables.sql',
                options: {
                    connection: get_connection()
                }
            },
            /**
             * Create the UAC data on localhost.
             */
            'create-local-data': {
                src: 'sql/create_data.sql',
                options: {
                    connection: get_connection()
                }
            },
            /**
             * Create a UAC database on devnet.
             */
            'create-devnet-db': {
                src: 'sql/create_database.sql',
                options: {
                    connection: {
                        user: 'postgres',
                        password: 'devnet',
                        host: 'uac.dev.mandiant.com',
                        port: 5432
                    }
                }
            },
            /**
             * Create the UAC tables on devnet.
             */
            'create-devnet-tables': {
                src: 'sql/create_tables.sql',
                options: {
                    connection: get_connection({host: 'uac.dev.mandiant.com'})
                }
            },
            /**
             * Create the UAC data on localhost.
             */
            'create-devnet-data': {
                src: 'sql/create_data.sql',
                options: {
                    connection: get_connection({host: 'uac.dev.mandiant.com'})
                }
            }
        }
    });

    /**
     * Deploy a local database.
     *
     * $ grunt deploy-local-db
     */
    grunt.registerTask('deploy-local-db', 'Deploy a local database.', function () {
        grunt.task.run('run-sql:create-local-db', 'run-sql:create-local-tables', 'run-sql:create-local-data');
    });

    /**
     * Deploy a devnet database.
     *
     * $ grunt deploy-devnet-db
     */
    grunt.registerTask('deploy-devnet-db', 'Deploy a devnet database.', function () {
        grunt.task.run('run-sql:create-devnet-db', 'run-sql:create-devnet-tables', 'run-sql:create-devnet-data');
    });

    grunt.registerTask('dump-config', 'Dump the configuration to console.', function() {
        console.dir(grunt.config());
    });

    /**
     * Delete the build directory if the user confirmed deletion.
     */
    grunt.registerTask('delete-build-dir', 'Delete the build directory.', function() {
        grunt.config.requires('build_dir');
        if (grunt.config('delete_build_dir') === true) {
            grunt.log.writeln('Deleting build directory: ' + grunt.config('build_dir'));
            grunt.file.delete(grunt.config('build_dir'), {force: true});
            grunt.log.ok();
            return true;
        }
        else {
            // Fail.
            return false;
        }
    });

    /**
     * Create the build directory.
     */
    grunt.registerTask('create-build-dir', 'Create the build directory.', function() {
        grunt.config.requires('build_dir');
        grunt.config.requires('build_uac_dir');

        grunt.log.writeln('Creating the build directory: ' + grunt.config('build_dir'));
        grunt.file.mkdir(grunt.config('build_dir'));
        grunt.log.ok();

        grunt.log.writeln('Creating the UAC build directory: ' + grunt.config('build_uac_dir'));
        grunt.file.mkdir(grunt.config('build_uac_dir'));
        grunt.log.ok();
    });

    /**
     * Check whether the build directory exists and prompt the user to confirm deletion.
     */
    grunt.registerTask('check-build-dir', 'Clean and create the build directory.', function() {
        grunt.config.requires('build_dir');
        if (grunt.file.exists(grunt.config('build_dir'))) {
            grunt.log.writeln('Build directory exists: ' + grunt.config('build_dir'));

            // Remove the existing build directory.
            grunt.task.run(['prompt:delete-build-dir', 'delete-build-dir']);
        }
        grunt.task.run('create-build-dir');
    });

    /**
     * Create the UAC RPM package.
     */
    grunt.registerTask('build-rpm', 'Build the UAC RPM package.', [
        'check-build-dir',      // Ensure the build directory exists.
        'gitclone:uac',         // Pull the UAC baseline.
        'shell:install-libs',   // Load the dependencies.
        'uglify',               // Compress the JS files.
        'jst',                  // Compile the templates.
        'easy_rpm'          // Create the RPM.
    ]);

    /**
     * Deploy an existing UAC rpm to devnet.
     */
    grunt.registerTask('deploy-devnet', ['scp:devnet', 'sshexec:install-devnet']);

    /**
     * Deploy an existing UAC rpm to the FTP site.
     */
    grunt.registerTask('deploy-ftp', function() {
        grunt.task.run(['prompt:passphrase', 'sftp:prod']);
    });

    /**
     * Build the UAC RPM and install it to the devnet environment.
     */
    grunt.registerTask('build-deploy-devnet', ['build-rpm', 'deploy-devnet']);


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

/**
 * TODO: Replace this.
 */
function get_connection(options) {

    return {
        user: options && options.user ? options.user : 'uac_user',
        password: options && options.password ? options.password : 'devnet',
        database: options && options.database ? options.database : 'uac',
        host: options && options.host ? options.host : 'localhost',
        port: options && options.port ? options.port : 5432
    }
}