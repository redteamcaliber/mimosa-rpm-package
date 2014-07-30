"use strict"

path = require 'path'

exports.defaults = ->
  rpmPackage:

    name: "noname",
    summary: "No Summary",
    description: "No Description",
    version: "0.1.0",
    release: "1",
    license: "MIT",
    vendor: "Vendor",
    group: "Development/Tools",
    buildArch: "noarch",
    dependencies: [],
    preInstallScript: [],
    postInstallScript: [],
    preUninstallScript: [],
    postUninstallScript: [],
    keepTemp: false
    targetDestination: "/"


    outPath: "dist"
    configName: "config"
    useEntireConfig: false
    exclude: ["README.md","node_modules","mimosa-config.coffee","mimosa-config-documented.coffee", "mimosa-config.js","assets",".git",".gitignore",".travis.yml", ".mimosa","bower.json"]
    appjs:"app.js"

exports.placeholder = ->
  """
  \t

    ###
    The webPackage module works hand in hand with the mimosa-server module to package web
    applications
    ###
    rpmPackage:                 # Configration for packaging of web applications

      outPath:"dist"            # Output path for assets to package, should be relative to the
                                # root of the project (location of mimosa-config) or be absolute
      configName:"config"       # the name of the config file, will be placed in outPath and have
                                # a .json extension. it is also acceptable to define a subdirectory
      useEntireConfig: false    # this module pulls out specific pieces of the mimosa-config that
                                # apply to  what you may need with a packaged application. For
                                # instance, it does not include a coffeescript config, or a jshint
                                # config. If you want it to include the entire resolved mimosa-config
                                # flip this flag to true.
      ###
      Exclude is a list of files/folders relative to the root of the app to not copy to the outPath
      as part of a package.  By default the watch.sourceDir is added to this list during processing.
      ###
      exclude:["README.md","node_modules","mimosa-config.coffee","mimosa-config-documented.coffee", "mimosa-config.js","assets",".git",".gitignore",".travis.yml",".mimosa","bower.json"]
      appjs: "app.js"           # name of the output app.js file which bootstraps the application,
                                # when set to null, web-package will not output a bootstrap file

  """

exports.validate = (config, validators) ->
  errors = []
  #TODO

  errors
