'use strict';

//usa a lib crypto do node, entao tem que importar para o script
var crypto = require('crypto');

var countFiles = {
    css: 0,
    js: 0
};

//funcao que converte o nome dos arquivos para um hash MD5
var convertMD5 = function(destBase, destPath, hash) {

    //define o tipo de hash a ser usado
    var shasum = crypto.createHash('md5');
    //pega a extensao do arquivo
    var extension = destPath.split('.').pop();
    var number = destPath.split(',');
    number = number[0];

    //retira do nome do arquivo o .less e o .temp para gerar o hash
    var fileName = destPath.replace('.temp','');

    //converte o nome do arquivo para o hash md5
    shasum.update(fileName);
    //pega somente os 6 primeiros caracteres do hash
    var fileNameHash = shasum.digest('hex').slice(0, 6);
    //gera o nome do arquivo final
    fileName =  number +','+ fileNameHash +','+ hash +'.'+ extension;
    //retiorna o nome completo do arquivo
    return destBase+'/'+ fileName;

};

var pad = function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

//variavael para armazenar o map dos arquivos js a serem compilados
var filesJSMap = {};
//variavael para armazenar o map dos arquivos css a serem compilados
var filesCSSMap = {};
//variavael para armazenar o map dos arquivos less a serem compilados
var filesAppLESSMap = {};
//variavael para armazenar o map dos arquivos js a serem compilados
var filesAppJSMap = {};

var filesMap = function (filesMap, dir, type, extension) {

    var files = {};

    for (var key in filesMap) {
        var lblCount = countFiles[extension];
        var newKey = '<%= appConfig.temp %>/assets/'+ extension +'/'+ pad(lblCount,3)+','+key+'.'+ extension;

        var sources = [];
        for (var source in filesMap[key].src) {
            var newSource = '<%= appConfig.assetsSources %>/'+ dir +'/'+ type +'/'+filesMap[key].src[source];
            sources.push(newSource);
        }
        files[newKey] = sources;
        countFiles[extension]++;
    }
    return files;

};

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    var commitShortHash   = 'f5ecf0c';
    var commitHash        = 'f5ecf0cb0c0fe46c4387b828105e6d02d097acd0';
    var commitDate        = '2015-01-01 00:00:00';

    // variaveis separadas do config para facilitar na hora do deploy
    // essas variaveis vao ser modificadas pelo script de deploy para executar a compilacao
    var appConfig = {
        app:  'web/public/',
        dist: 'dist',
        temp: 'web/public/.tmp',
        assetsSources : 'sources/assets',
        assetsDest : 'web/public/assets',
        commitShortHash : commitShortHash,
    };

    //carrega os arquivos com o map das conversoes
    filesJSMap = grunt.file.readJSON(appConfig.assetsSources +'/vendor/js.json');
    filesCSSMap = grunt.file.readJSON(appConfig.assetsSources +'/vendor/css.json');
    filesAppLESSMap = grunt.file.readJSON(appConfig.assetsSources +'/app/less.json');
    filesAppJSMap = grunt.file.readJSON(appConfig.assetsSources +'/app/js.json');

    grunt.initConfig({
        commit:{
            hash: commitHash,
        },
        appConfig : appConfig,

        banner: '/* \n'+
        ' * Generated at: <%= grunt.template.today("dddd, mmmm dS, yyyy, h:MM:ss TT") %>\n'+
        ' * Commit Date: '+ commitDate +'\n'+
        ' * Commit Hash: '+ commitHash +'\n'+
        '*/',

        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: [
                        '<%= appConfig.assetsDest %>/js/*.js',
                        '<%= appConfig.assetsDest %>/css/*.css']
                }
            }
        },

        uglify: {
            options: {
                mangle: true,
            },
            assets: {
                files: [
                    {
                        expand: true,
                        src: ['<%= appConfig.temp %>/dist/assets/js/*.js'],
                        dest: '<%= appConfig.assetsDest %>/js/',
                        flatten: true,
                        rename: function(destBase, destPath) {
                            return destBase+destPath.replace('.js', '.min.js');
                        }
                    }
                ]
            }
        },

        concat: {
            js: {
                files: filesMap(filesJSMap, 'vendor', 'js', 'js')
            },
            css: {
                files: filesMap(filesCSSMap, 'vendor', 'css', 'css')
            },
            appjs: {
                files: filesMap(filesAppJSMap, 'app', 'js', 'js')
            },
            distRenameJs: {
                files: [
                    {
                        expand: true,
                        src: ['<%= appConfig.temp %>/assets/js/*'],
                        dest: '<%= appConfig.temp %>/dist/assets/js',
                        flatten: true,
                        rename: function(destBase, destPath) {
                            return convertMD5(destBase, destPath, commitShortHash);
                        }
                    }
                ]
            },
            distRenameCss: {
                files: [
                    {
                        expand: true,
                        src: ['<%= appConfig.temp %>/assets/css/*'],
                        dest: '<%= appConfig.temp %>/dist/assets/css',
                        flatten: true,
                        rename: function(destBase, destPath) {
                            return convertMD5(destBase, destPath, commitShortHash);
                        }
                    }
                ]
            }
        },

        less : {
            options: {
                yuicompress: false
            },
            //concatena e compila os arquivos less de acordo com o map
            less: {
                files: filesMap(filesAppLESSMap, 'app', 'less', 'css')
            }
        },

        cssmin : {
            options: {
                report: 'gzip',
                keepSpecialComments: 0,
            },
            css: {
                files: [{
                    expand: true,
                    cwd: '<%= appConfig.temp %>/dist/assets/css',
                    src: ['*.css'],
                    dest: '<%= appConfig.assetsDest %>/css',
                    ext: '.min.css'
                }]
            },
        },

        // Injeta automaticamente os arquivo js e css dentro do arquivo index.html
        injector: {
            assets:{
                options:{
                    starttag: '<!-- assets injector:{{ext}} -->',
                    ignorePath: 'web/public',
                    addRootSlash: true
                },
                files:{
                    '<%= appConfig.app %>/index.php' : [
                        '<%= appConfig.temp %>/assets/**/*.css',
                        '<%= appConfig.temp %>/assets/**/*.js'
                    ]
                }
            },
            dist:{
                options:{
                    starttag: '<!-- assets injector:{{ext}} -->',
                    ignorePath: 'web/public',
                    addRootSlash: true
                },
                files:{
                    '<%= appConfig.app %>/index.php' : [
                        '<%= appConfig.assetsDest %>/css/**/*.css',
                        '<%= appConfig.assetsDest %>/js/**/*.js'
                    ]
                }
            }
        },

        //por hora nao estou usando o watch mais a ideia é usar para compilar automatico
        watch: {
            options: {
                spawn: false,
                livereload: true,
            },
            exit:  {
                files: [
                    'package.json',
                    'gruntfile.js',
                    '<%= appConfig.assetsSources %>/vendor/js.json',
                    '<%= appConfig.assetsSources %>/vendor/css.json',
                    '<%= appConfig.assetsSources %>/app/less.json',
                    '<%= appConfig.assetsSources %>/app/js.json'
                ],
                tasks: ['exit']
            },
            php: {
                files: ['web/public/**/*.php'],
            },
            js:  {
                files: ['<%= appConfig.assetsSources %>/vendor/js/**/*.js'],
                tasks: ['concat:js','injector:assets'],
            },
            css:  {
                files: ['<%= appConfig.assetsSources %>/vendor/css/**/*.css'],
                tasks: ['concat:css','injector:assets'],
            },
            appless:  {
                files: ['<%= appConfig.assetsSources %>/app/less/**/*.less'],
                tasks: ['less','injector:assets'],
            },
            appjs:  {
                files: ['<%= appConfig.assetsSources %>/app/js/**/*.js'],
                tasks: ['concat:appjs','injector:assets','newer:jshint:all'],
            },
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'gruntfile.js',
                    '<%= appConfig.assetsSources %>/app/js/{,*/}*.js'
                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        //usa o clean para limapr os arquivos temporarios e limpar tudo antes de executar a nova compilacao
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= appConfig.assetsDest %>/js',
                        '<%= appConfig.assetsDest %>/css'
                    ]
                }]
            },
            tmp: 'public/.tmp'
        }

    });

    //carrega todos os plugins usados no script
    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-regex-replace');

    grunt.registerTask('exit', 'Just exits.', function() {
        process.exit(0);
    });

    //task build - usada somente para compilar os arquivos para producao,
    //minificando, gzipand e concatenando
    grunt.registerTask('build', [
        'clean',
        //'copy:dist',
        'concat:js',
        'concat:css',
        'concat:appjs',
        'less',
        'concat:distRenameJs',
        'concat:distRenameCss',
        //'regex-replace',
        'cssmin',
        'uglify:assets',
        'usebanner:dist',
        'injector:dist',
        'clean:tmp'
    ]);

    //task dev - usada somente para desenvolvimento, ela gera somente os arquivos nos packs
    // e gera tambem um servidor para servir os arquivos via grunt
    grunt.registerTask('dev', 'Compila e depois inicia o web server', function () {

        grunt.task.run([
            'clean:tmp',
            'concat:js',
            'concat:css',
            'concat:appjs',
            'less',
            'injector:assets',
            'newer:jshint:all',
            'watch'
        ]);

    });

};
