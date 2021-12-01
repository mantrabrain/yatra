/* jshint node:true */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        // Setting folder templates.
        dirs: {
            js: 'assets/js',
            css: 'assets/css',
            scss: 'assets/scss',
            img: 'assets/images',
        },

        // JavaScript linting with JSHint.
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                '!Gruntfile.js',
                '<%= dirs.js %>/*.js',
                '!<%= dirs.js %>/*.min.js',
                '<%= dirs.js %>/*.js',
                '!<%= dirs.js %>/*.min.js'
            ]
        },

        // Sass linting with Stylelint.
        stylelint: {
            options: {
                stylelintrc: '.stylelintrc'
            },
            all: [
                '<%= dirs.scss %>/*.scss'
            ]
        },

        // Minify all .js files.
        uglify: {
            options: {
                ie8: true,
                parse: {
                    strict: false,
                },
                output: {
                    comments: /@license|@preserve|^!/
                },
                mangle: {
                    properties: false,
                },
            },
            assets: {
                files: [{
                    expand: true,
                    cwd: '<%= dirs.js %>/',
                    src: [
                        '*.js',
                        '!*.min.js'
                    ],
                    dest: '<%= dirs.js %>/',
                    ext: '.min.js'
                }],
            },
        },

        // Compile all .scss files.
        sass: {
            options: {
                sourceMap: true,
                // check:false,
                // unix_newlines: true,
                // sourceMapFileInline: true,
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= dirs.scss %>/',
                    src: ['*.scss', '!*.css'],
                    dest: '<%= dirs.css %>/',
                    ext: '.css',
                }]
            }
        },

        // Generate all RTL .css files
        rtlcss: {
            generate: {
                options: {
                    map: true,
                    //map: {inline:false},
                },
                expand: true,
                cwd: '<%= dirs.css %>',
                src: ['*.min.css', '!*.min-rtl.css'],
                dest: '<%= dirs.css %>/',
                ext: '.min-rtl.css'
            }
        },

        // Minify all .css files.
        cssmin: {
            options: {
                sourceMap: true,
            },
            minify: {
                expand: true,
                cwd: '<%= dirs.css %>/',
                src: ['*.css', '!*.min.css', '!*.min-rtl.css'],
                dest: '<%= dirs.css %>/',
                ext: '.min.css'
            }
        },

        // Concatenate select2.css onto the admin.css files.
        concat: {
            admin: {
                files: {}
            }
        },

        // Watch changes for assets.
        watch: {
            css: {
                files: [
                    '<%= dirs.scss %>/*.scss',
                    '<%= dirs.scss %>/**/*.scss'

                ],
                tasks: ['sass', 'postcss', 'cssmin', 'rtlcss'],
            },
            js: {
                files: [
                    '<%= dirs.js %>/*.js',
                    '<%= dirs.js %>/!*.min.js'
                ],
                tasks: [/*'jshint',*/ 'uglify']
            }
        },

        // Generate POT files.
        makepot: {
            options: {
                type: 'wp-plugin',
                domainPath: 'languages/',
                potHeaders: {
                    'report-msgid-bugs-to': 'mantrabrain@gmail.com',
                    'last-translator': 'Mantrabrain <mantrabrain@gmail.com>',
                    'language-team': 'Mantrabrain <mantrabrain@gmail.com>',
                },
                //updatePoFiles: true,

            },
            dist: {
                options: {
                    potFilename: 'yatra.pot',
                    exclude: [
                        'vendor/.*'
                    ],

                }
            }
        },

        // Check textdomain errors.
        checktextdomain: {
            options: {
                text_domain: 'yatra',
                keywords: [
                    '__:1,2d',
                    '_e:1,2d',
                    '_x:1,2c,3d',
                    'esc_html__:1,2d',
                    'esc_html_e:1,2d',
                    'esc_html_x:1,2c,3d',
                    'esc_attr__:1,2d',
                    'esc_attr_e:1,2d',
                    'esc_attr_x:1,2c,3d',
                    '_ex:1,2c,3d',
                    '_n:1,2,4d',
                    '_nx:1,2,4c,5d',
                    '_n_noop:1,2,3d',
                    '_nx_noop:1,2,3c,4d'
                ]
            },
            files: {
                src: [
                    '**/*.php',         // Include all files
                    '!node_modules/**', // Exclude node_modules/
                    '!svn-repository/**', // Exclude node_modules/
                    '!vendor/**'        // Exclude vendor/
                ],
                expand: true
            }
        },

        // PHP Code Sniffer.
        phpcs: {
            options: {
                bin: 'vendor/bin/phpcs',
                standard: './phpcs.ruleset.xml'
            },
            dist: {
                src: [
                    '**/*.php',         // Include all files
                    '!node_modules/**', // Exclude node_modules/
                    '!vendor/**'        // Exclude vendor/
                ]
            }
        },

        // Autoprefixer.
        postcss: {
            options: {
                map: true,
                processors: [
                    require('autoprefixer')({
                        browsers: [
                            'last 4 versions',
                            '> 0.1%',
                            'ie 8',
                            'ie 9',
                            'ie 7',
                            'opera 12',
                            'ff 15'
                        ]
                    })
                ]
            },
            dist: {
                src: [
                    '<%= dirs.css %>/*.css'
                ]
            }
        },

        // Compress files and folders.
        compress: {
            options: {
                archive: 'yatra.zip'
            },
            files: {
                src: [
                    '**',
                    '!.*',
                    '!*.md',
                    '!*.zip',
                    '!.*/**',
                    '!sass/**',
                    '!vendor/**',
                    '!Gruntfile.js',
                    '!package-lock.json',
                    '!composer.json',
                    '!package.json',
                    '!composer-lock.json',
                    '!composer.lock',
                    '!node_modules/**',
                    '!phpcs.ruleset.xml',
                    '!demo-content/**',
                    '!svn-repository/**',
                    '!mantrabrain-theme/.git',
                    '!*.gitignore',
                    '!*.editorconfig',
                    '!*.jshintrc',
                    '!.git',
                    '!requirement.txt',
                    '!assets/admin/src/**',
                    '!yatra.tar'
                ],
                dest: 'yatra',
                expand: true
            }
        },
        browserSync: {
            dev: {
                bsFiles: {
                    src: [
                        'assets/css/*.css',
                    ],
                },
                options: {
                    //watchTask: ['sass', 'postcss', 'cssmin', ''],
                    /*server:{
                        baseDir: "./assets/css",
                    },*/
                    port: 3500,
                    watchTask: true,
                    proxy: "localhost/WordPressThemes/yatri",
                },
            },
        },
    });

    // Load NPM tasks to be used here
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-phpcs');
    grunt.loadNpmTasks('grunt-rtlcss');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-stylelint');
    grunt.loadNpmTasks('grunt-wp-i18n');
    grunt.loadNpmTasks('grunt-checktextdomain');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-browser-sync');

    // Register tasks
    grunt.registerTask('default', [
        'browserSync',
        'watch',
        //'jshint',
        //'uglify',
        //'css'
    ]);

    grunt.registerTask('js', [
        //'jshint',
        'uglify:assets'

    ]);

    grunt.registerTask('css', [
        'sass',
        'postcss',
        'cssmin',
        'rtlcss',
        //'concat'
    ]);

    grunt.registerTask('dev', [
        'default',
        'makepot'
    ]);

    grunt.registerTask('zip', [
        'css',
        'js',
        'makepot',
        'compress'
    ]);

    /*grunt.registerTask('watch', [
        'watch',
    ]);*/
};