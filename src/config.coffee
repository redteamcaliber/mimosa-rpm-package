"use strict"

path = require 'path'

exports.defaults = ->
  rpmPackage:

    #RPM spec-related
    name: "noname",
    summary: "No Summary",
    description: "No Description",
    version: "0.1.0",
    release: "1",
    epoch: new Date().getTime(),
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

    #mimosa packaging-related
    outPath: "dist"
    configName: "config"
    useEntireConfig: false
    exclude: ["README.md","node_modules","mimosa-config.coffee","mimosa-config-documented.coffee", "mimosa-config.js","assets",".git",".gitignore",".travis.yml", ".mimosa","bower.json"]
    appjs:"app.js"

exports.placeholder = ->
  """
  \t

    ###
    The rpmPackage module works hand in hand with the mimosa-server module to package web
    applications
    ###
    rpmPackage:                   # Configration for packaging of web applications
      name: "noname"              # A string value that is used to set at the name of your RPM package.
      summary: "No Summary"       # A string value that is used to set as the summary text of your RPM package
      description: "None"         # A string value that is used to set as the description of your RPM package
      version: "0.1.0"            # A string value that is used to set as the version of your RPM package.
      release: "1"                # A string value that is used to set as the release of your RPM package.
      epoch: <current epoch>      # A string value used to represent the RPM epoch - In RPM version
                                  # comparison, the hidden Epoch value is most-significant. Epoch
                                  # comparison overrides the result of
                                  # ordinary version-release comparison. Highest Epoch wins, and any non
                                  # -zero Epoch wins over a missing Epoch.
      license: "MIT"              # A string value that is used to specify the license type of your RPM package.
      vendor: "Vendor"            # A string value that is used to set as the Vendor property of your RPM package.
      group: "Development/Tools"  # A string value that is used to specify the group of your RPM package.
      buildArch: "noarch"         # A string value that is used to set specify the target architecture of your RPM package.
      dependencies: []            # An array of required packages, that should be installed before(e.g. ["nodejs >= 0.10.22"]).
      preInstallScript: []        # An array of command to be excecuted before the installation.
      postInstallScript: []       # An array of command to be excecuted after the installation.
      preUninstallScript: []      # An array of command to be excecuted before the uninstallation.
      postUninstallScript: []     # An array of command to be excecuted after the uninstallation.
      targetDestination: "/"      # The root target for files when the RPM is installed.

      outPath:"dist"              # Output path for assets to package, should be relative to the
                                  # root of the project (location of mimosa-config) or be absolute
      configName:"config"         # the name of the config file, will be placed in outPath and have
                                  # a .json extension. it is also acceptable to define a subdirectory
      useEntireConfig: false      # this module pulls out specific pieces of the mimosa-config that
                                  # apply to  what you may need with a packaged application. For
                                  # instance, it does not include a coffeescript config, or a jshint
                                  # config. If you want it to include the entire resolved mimosa-config
                                  # flip this flag to true.
      ###
      Exclude is a list of files/folders relative to the root of the app to not copy to the outPath
      as part of a package.  By default the watch.sourceDir is added to this list during processing.
      ###
      exclude:["README.md","node_modules","mimosa-config.coffee","mimosa-config-documented.coffee", "mimosa-config.js","assets",".git",".gitignore",".travis.yml",".mimosa","bower.json"]
      appjs: "app.js"             # name of the output app.js file which bootstraps the application,
                                  # when set to null, web-package will not output a bootstrap file

  """

exports.validate = (config, validators) ->
  if validators.ifExistsIsArray(errors, "rpmPackage.exclude", config.rpmPackage.exclude)
      fullPathExcludes = []
      for ex in config.rpmPackage.exclude
        if typeof ex is "string"
          fullPathExcludes.push path.join config.root, ex
        else
          errors.push "rpmPackage.exclude must be an array of strings"
          break
      config.rpmPackage.exclude = fullPathExcludes
      config.rpmPackage.exclude.push path.resolve(config.rpmPackage.outPath)
  config.rpmPackage.rootOutPath = path.resolve(config.rpmPackage.outPath)
  config.rpmPackage.outPath = "#{config.rpmPackage.outPath}/BUILDROOT#{config.rpmPackage.installDestination}"


  errors = []
  #TODO

  errors
