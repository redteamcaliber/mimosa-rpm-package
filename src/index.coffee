'use strict'

path = require 'path'
fs = require 'fs'
{exec, spawn} = require 'child_process'

_ = require 'lodash'
mkdirp = require('mkdirp')

moduleConfig = require './config'

logger = null
isReallyWindows = true
langs =
  coffee:"coffee-script"
  js:false
  ls:"LiveScript"
  iced:"iced-coffee-script"

registration = (config, register) ->
  if config.isPackage
    logger = config.log

    register ['postBuild'], 'package',  _package

    if process.platform is "win32"
      exec 'uname', (error, stdout, stderr) =>
        if not error then isReallyWindows = false

_writeSpecFile = (config, logger, buildRoot)->
  fs = require 'fs'
  wrench = require('wrench')
  path = require 'path'
  _ = require 'underscore'

  pkgName = config.rpmPackage.name + "-" + config.rpmPackage.version + "-" + config.rpmPackage.buildArch
  specFilepath = path.join(config.rpmPackage.rootOutPath, "SPECS", pkgName + ".spec")
  buffer = []
  files = _.filter (wrench.readdirSyncRecursive buildRoot), (file)->
    file = buildRoot+"/"+file
    unless fs.lstatSync(file).isDirectory() then return true
    logger.debug "Excluding #{file} from RPM because its a directory"
    return false



  buffer.push("%define   _topdir " + config.rpmPackage.rootOutPath)
  buffer.push("");
  buffer.push("Name: "+config.rpmPackage.name)
  buffer.push("Version: "+config.rpmPackage.version)
  buffer.push("Release: "+config.rpmPackage.release)
  buffer.push("Group: "+config.rpmPackage.group)
  buffer.push("Summary: "+config.rpmPackage.summary)
  buffer.push("Group: "+config.rpmPackage.group)
  buffer.push("License: "+config.rpmPackage.license)
  buffer.push("BuildArch: "+config.rpmPackage.buildArch)
  if typeof config.rpmPackage.autoReqProv != "undefined" then buffer.push("AutoReqProv: "+config.rpmPackage.autoReqProv)

  if config.rpmPackage.dependencies.length > 0 then buffer.push("Requires: " + config.rpmPackage.dependencies.join(","))

  buffer.push("")
  buffer.push("%description")
  buffer.push(config.rpmPackage.description)
  buffer.push("")
  buffer.push("%files")
  if _.isArray config.rpmPackage.defattrScript
    for defattr in config.rpmPackage.defattrScript
      buffer.push("%defattr(-, #{defattr.user}, #{defattr.group}, -)")
  for file in files
    if file.indexOf('%') == 0
      buffer.push(file)
    else
      buffer.push("\"/"+file+"\"")

  buffer.push("")
  buffer.push("%pre")
  buffer.push(preInstallScript) for preInstallScript in config.rpmPackage.preInstallScript


  buffer.push("")
  buffer.push("%post")
  buffer.push(postInstallScript) for postInstallScript in config.rpmPackage.postInstallScript


  buffer.push("")
  buffer.push("%preun")
  buffer.push(preUninstallScript) for preUninstallScript in config.rpmPackage.preUninstallScript


  buffer.push("")
  buffer.push("%postun")
  buffer.push(postUninstallScript) for postUninstallScript in config.rpmPackage.postUninstallScript

  specFileContent = buffer.join("\n")
  fs.writeFileSync specFilepath, specFileContent
  return specFilepath

__rpm = (config, done) ->
  wrench = require('wrench')
  rimraf = require 'rimraf'


  rpmStructure = ["BUILD","RPMS","SOURCES","SPECS","SRPMS"]

  #Create RPM build folder structure
  fs.mkdirSync config.rpmPackage.rootOutPath+"/"+folder for folder in rpmStructure

  #generate spec file
  buildRoot = config.rpmPackage.rootOutPath+"/BUILDROOT"
  logger.info "Generating RPM spec file from #{buildRoot}"
  specFilepath = _writeSpecFile(config, logger, buildRoot)

  #build rpm
  logger.info "Building RPM package"
  #spawn rpmbuilt tool
  buildCmd = "rpmbuild"
  buildArgs = [
    "-bb",
    "--buildroot",
    buildRoot,
    specFilepath
  ]
  logger.info "Building RPM: #{buildCmd} #{buildArgs.join(' ')}"

  rpmbuild = spawn buildCmd, buildArgs

  rpmbuild.stdout.on 'data',  (data)-> logger.debug data
  rpmbuild.stderr.on 'data', (data)-> logger.warn data

  rpmbuild.on 'close', (code)->

    if code != 0
      logger.error('rpmbuild process exited with code ' + code);

      #clean out temp folders
      rimraf.sync config.rpmPackage.rootOutPath+"/"+folder for folder in rpmStructure

    else
      outputFilename = "#{config.rpmPackage.name}-#{config.rpmPackage.version}-#{config.rpmPackage.release}.#{config.rpmPackage.buildArch}.rpm"
      outputFilepath = path.join config.rpmPackage.rootOutPath, "RPMS", config.rpmPackage.buildArch, outputFilename
      logger.debug "Copy output RPM package to the current directory: #{outputFilepath}"
      fs.renameSync outputFilepath, path.join config.rpmPackage.rootOutPath, outputFilename

      #clean out temp folders
      rimraf.sync config.rpmPackage.rootOutPath+"/"+folder for folder in rpmStructure
    done()


_package = (config, options, next) ->
  logger.info "Beginning rpm-package"

  # delete directory if it exists
  if fs.existsSync config.rpmPackage.rootOutPath
    rimraf = require 'rimraf'
    logger.debug "Deleting #{config.rpmPackage.rootOutPath}"
    rimraf.sync config.rpmPackage.rootOutPath

  # copy over all assets
  logger.debug "Copying [[ #{config.root} ]] to [[ #{config.rpmPackage.outPath} ]]"
  copyDirSyncRecursive config.root, config.rpmPackage.outPath, config.rpmPackage.exclude, config

  # write config to output after modifying the config
  __writeConfig(config)

  if config.server?.defaultServer?.enabled is true
    logger.info "Default server being used, not writing app.js or running npm install"
    logger.info "Completed web-package"
    next()
  else
    # write app.js to output, run npm inside target directory
    if config.rpmPackage.appjs
      __writeApplicationStarter config
    __runNPMInstall config, next

__runNPMInstall = (config, next) ->
  # run npm in dist folder to generate node modules pre-package
  currentDir = process.cwd()
  process.chdir config.rpmPackage.outPath
  logger.debug "Running NPM inside [[ #{config.rpmPackage.outPath} ]]"
  exec "npm install --production", (err, sout, serr) =>
    logger.debug "NPM INSTALL standard out\n#{sout}"
    logger.debug "NPM INSTALL standard err\n#{serr}"

    done = ->
      process.chdir currentDir
      logger.info "Completed web-package"
      next()

    if err
      logger.error "Error running NPM Install: #{err}"
      done()
    else
      logger.debug "Zip contents of [[ #{config.rpmPackage.outPath} ]]"

      __rpm config, done

__writeConfig = (config) ->
  configClone = _.clone(config, true)

  if config.rpmPackage.useEntireConfig
    writeConfig = configClone
    if writeConfig.liveReload
      writeConfig.liveReload.enabled = false
    ["extensions", "installedModules", "logger", "timer", "helpers", "log"].forEach (prop) ->
      delete writeConfig[prop] if writeConfig[prop]

  else
    writeConfig =
      watch: configClone.watch
      liveReload:
        enabled:false
      isOptimize: configClone.isOptimize

  if configClone.server
    writeConfig.server = configClone.server
    if writeConfig.server.path
      writeConfig.server.path = path.relative(config.root, writeConfig.server.path).split(path.sep)
    if writeConfig.server.views?.path
      writeConfig.server.views.path = path.relative(config.root, writeConfig.server.views.path).split(path.sep)

  writeConfig.watch.sourceDir = path.relative(config.root, writeConfig.watch.sourceDir).split(path.sep)
  writeConfig.watch.compiledDir = path.relative(config.root, writeConfig.watch.compiledDir).split(path.sep)
  writeConfig.watch.javascriptDir = path.relative(config.root, writeConfig.watch.javascriptDir).split(path.sep)
  writeConfig.watch.compiledJavascriptDir = path.relative(config.root, writeConfig.watch.compiledJavascriptDir).split(path.sep)
  configOutPath = path.join config.rpmPackage.outPath, "#{config.rpmPackage.configName}.js"
  logger.debug "Writing mimosa-config to [[ #{configOutPath} ]]"
  configText = __generateConfigText(writeConfig)
  fs.writeFileSync configOutPath, configText, 'ascii'

__generateConfigText = (configText) ->
  hogan = require 'hogan.js'
  hoganTemplateText = fs.readFileSync path.join(__dirname, 'resources', 'config-template.hogan'), 'ascii'
  compiledHogan = hogan.compile(hoganTemplateText)
  context =
    configJSON: JSON.stringify(configText, null, 2)
  compiledHogan.render(context).replace(/&quot;/g,"\"").replace(/&#39;/g, "'")

__writeApplicationStarter = (config) ->
  appJsInPath = path.join __dirname, 'resources', 'app.js'
  appJsText = fs.readFileSync appJsInPath, 'ascii'
  if config.server?.path?
    serverExtension = path.extname(config.server.path).substring(1)
  prependLang = if serverExtension? and langs[serverExtension]?
    if langs[serverExtension]
      logger.debug "Adding require statement to app.js"
      langs[serverExtension]
  else
    try
      pack = require(path.join config.root, 'package.json')
      logger.debug "Looking through package to determine proper language to require in at top of app.js"
      chosenLang = null
      for ext, lang of langs
        if pack.dependencies[lang]?
          chosenLang = lang
          break
      chosenLang
    catch err
      logger.info "Unable to determine language of server file, you might need to address the app.js file to add a require statement for your language of choice"

  if prependLang?
    coffeeMatch = /.*?coffee-script/.test prependLang
    if coffeeMatch
      prepend = """
      // with coffeescript 1.7, need to bring in register to have coffeescript compiled on the fly
      var trans = require('#{prependLang}');
      if (trans.register) {
        trans.register();
      }

      """
    else
      prepend = "require('#{prependLang}')\n";
    appJsText = prepend + appJsText

  rootPathFromAppjs = ''
  serverRelPath = config.server.path.split(config.root)[1].substr(1)

  if path.dirname(config.rpmPackage.appjs) isnt '.'
    for level in path.dirname(config.rpmPackage.appjs).split(path.sep)
      do ->
        rootPathFromAppjs += '..' + path.sep

  if rootPathFromAppjs == ''
    appJsText = appJsText.replace "CONFIG_PATH", "./#{config.rpmPackage.configName}"
    appJsText = appJsText.replace "SERVER_PATH", "./#{serverRelPath}"
  else
    appJsText = appJsText.replace "CONFIG_PATH", path.join(rootPathFromAppjs, config.rpmPackage.configName)
    appJsText = appJsText.replace "SERVER_PATH", path.join(rootPathFromAppjs, serverRelPath)

  appJsOutPath = path.join config.rpmPackage.outPath, config.rpmPackage.appjs
  logger.debug "Writing app.js to [[ #{appJsOutPath} ]]"
  fs.writeFileSync appJsOutPath, appJsText, 'ascii'

copyDirSyncRecursive = (sourceDir, newDirLocation, excludes, config) ->
  checkDir = fs.statSync(sourceDir);
  mkdirp.sync(newDirLocation, checkDir.mode)
  files = fs.readdirSync(sourceDir);

  files.forEach (f) ->
    filePath = path.join sourceDir, f
    return if excludes.indexOf(filePath) >= 0

    newFilePath = path.join newDirLocation, f
    currFile = fs.lstatSync filePath
    if currFile.isDirectory()
      copyDirSyncRecursive filePath, newFilePath, excludes, config
    else if currFile.isSymbolicLink()
      symlinkFull = fs.readlinkSync filePath
      fs.symlinkSync symlinkFull, newFilePath
    else
      contents = fs.readFileSync filePath
      if f is "package.json"
        try
          packageJson = require filePath
          _.keys(packageJson.dependencies).forEach (key) ->
            if key.indexOf('mimosa-') is 0
              delete packageJson.dependencies[key]
          #coerce package.json to match what's defined in the rpm config
          if config.rpmPackage.version and config.rpmPackage.release
            packageJson.version = "#{config.rpmPackage.version}.#{config.rpmPackage.release}"
          contents = JSON.stringify packageJson, null, 2
        catch err
          logger.error "Error parsing package.json: #{err}"

      fs.writeFileSync newFilePath, contents

module.exports =
  registration: registration
  defaults:     moduleConfig.defaults
  placeholder:  moduleConfig.placeholder
  validate:     moduleConfig.validate
