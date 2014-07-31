'use strict';
var copyDirSyncRecursive, exec, fs, isReallyWindows, langs, logger, mkdirp, moduleConfig, path, registration, spawn, _, __generateConfigText, __rpm, __runNPMInstall, __writeApplicationStarter, __writeConfig, _package, _ref, _writeSpecFile;

path = require('path');

fs = require('fs');

_ref = require('child_process'), exec = _ref.exec, spawn = _ref.spawn;

_ = require('lodash');

mkdirp = require('mkdirp');

moduleConfig = require('./config');

logger = null;

isReallyWindows = true;

langs = {
  coffee: "coffee-script",
  js: false,
  ls: "LiveScript",
  iced: "iced-coffee-script"
};

registration = function(config, register) {
  if (config.isPackage) {
    logger = config.log;
    register(['postBuild'], 'package', _package);
    if (process.platform === "win32") {
      return exec('uname', (function(_this) {
        return function(error, stdout, stderr) {
          if (!error) {
            return isReallyWindows = false;
          }
        };
      })(this));
    }
  }
};

_writeSpecFile = function(config, logger, buildRoot) {
  var buffer, defattr, file, files, pkgName, postInstallScript, postUninstallScript, preInstallScript, preUninstallScript, specFileContent, specFilepath, wrench, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5;
  fs = require('fs');
  wrench = require('wrench');
  path = require('path');
  _ = require('underscore');
  pkgName = config.rpmPackage.name + "-" + config.rpmPackage.version + "-" + config.rpmPackage.buildArch;
  specFilepath = path.join(config.rpmPackage.rootOutPath, "SPECS", pkgName + ".spec");
  buffer = [];
  files = _.filter(wrench.readdirSyncRecursive(buildRoot), function(file) {
    file = buildRoot + "/" + file;
    if (!fs.lstatSync(file).isDirectory()) {
      return true;
    }
    logger.debug("Excluding " + file + " from RPM because its a directory");
    return false;
  });
  buffer.push("%define   _topdir " + config.rpmPackage.rootOutPath);
  buffer.push("");
  buffer.push("Name: " + config.rpmPackage.name);
  buffer.push("Version: " + config.rpmPackage.version);
  buffer.push("Release: " + config.rpmPackage.release);
  buffer.push("Group: " + config.rpmPackage.group);
  buffer.push("Summary: " + config.rpmPackage.summary);
  buffer.push("Group: " + config.rpmPackage.group);
  buffer.push("License: " + config.rpmPackage.license);
  buffer.push("BuildArch: " + config.rpmPackage.buildArch);
  if (typeof config.rpmPackage.autoReqProv !== "undefined") {
    buffer.push("AutoReqProv: " + config.rpmPackage.autoReqProv);
  }
  if (config.rpmPackage.dependencies.length > 0) {
    buffer.push("Requires: " + config.rpmPackage.dependencies.join(","));
  }
  buffer.push("");
  buffer.push("%description");
  buffer.push(config.rpmPackage.description);
  buffer.push("");
  buffer.push("%files");
  if (_.isArray(config.rpmPackage.defattrScript)) {
    _ref1 = config.rpmPackage.defattrScript;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      defattr = _ref1[_i];
      buffer.push("%defattr(-, " + defattr.user + ", " + defattr.group + ", -)");
    }
  }
  for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
    file = files[_j];
    if (file.indexOf('%') === 0) {
      buffer.push(file);
    } else {
      buffer.push("\"/" + file + "\"");
    }
  }
  buffer.push("");
  buffer.push("%pre");
  _ref2 = config.rpmPackage.preInstallScript;
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    preInstallScript = _ref2[_k];
    buffer.push(preInstallScript);
  }
  buffer.push("");
  buffer.push("%post");
  _ref3 = config.rpmPackage.postInstallScript;
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    postInstallScript = _ref3[_l];
    buffer.push(postInstallScript);
  }
  buffer.push("");
  buffer.push("%preun");
  _ref4 = config.rpmPackage.preUninstallScript;
  for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
    preUninstallScript = _ref4[_m];
    buffer.push(preUninstallScript);
  }
  buffer.push("");
  buffer.push("%postun");
  _ref5 = config.rpmPackage.postUninstallScript;
  for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
    postUninstallScript = _ref5[_n];
    buffer.push(postUninstallScript);
  }
  specFileContent = buffer.join("\n");
  fs.writeFileSync(specFilepath, specFileContent);
  return specFilepath;
};

__rpm = function(config, done) {
  var buildArgs, buildCmd, buildRoot, folder, rimraf, rpmStructure, rpmbuild, specFilepath, wrench, _i, _len;
  wrench = require('wrench');
  rimraf = require('rimraf');
  rpmStructure = ["BUILD", "RPMS", "SOURCES", "SPECS", "SRPMS"];
  for (_i = 0, _len = rpmStructure.length; _i < _len; _i++) {
    folder = rpmStructure[_i];
    fs.mkdirSync(config.rpmPackage.rootOutPath + "/" + folder);
  }
  buildRoot = config.rpmPackage.rootOutPath + "/BUILDROOT";
  logger.info("Generating RPM spec file from " + buildRoot);
  specFilepath = _writeSpecFile(config, logger, buildRoot);
  logger.info("Building RPM package");
  buildCmd = "rpmbuild";
  buildArgs = ["-bb", "--buildroot", buildRoot, specFilepath];
  logger.info("Building RPM: " + buildCmd + " " + (buildArgs.join(' ')));
  rpmbuild = spawn(buildCmd, buildArgs);
  rpmbuild.stdout.on('data', function(data) {
    return logger.debug(data);
  });
  rpmbuild.stderr.on('data', function(data) {
    return logger.warn(data);
  });
  return rpmbuild.on('close', function(code) {
    var outputFilename, outputFilepath, _j, _k, _len1, _len2;
    if (code !== 0) {
      logger.error('rpmbuild process exited with code ' + code);
      for (_j = 0, _len1 = rpmStructure.length; _j < _len1; _j++) {
        folder = rpmStructure[_j];
        rimraf.sync(config.rpmPackage.rootOutPath + "/" + folder);
      }
    } else {
      outputFilename = "" + config.rpmPackage.name + "-" + config.rpmPackage.version + "-" + config.rpmPackage.release + "." + config.rpmPackage.buildArch + ".rpm";
      outputFilepath = path.join(config.rpmPackage.rootOutPath, "RPMS", config.rpmPackage.buildArch, outputFilename);
      logger.debug("Copy output RPM package to the current directory: " + outputFilepath);
      fs.renameSync(outputFilepath, path.join(config.rpmPackage.rootOutPath, outputFilename));
      for (_k = 0, _len2 = rpmStructure.length; _k < _len2; _k++) {
        folder = rpmStructure[_k];
        rimraf.sync(config.rpmPackage.rootOutPath + "/" + folder);
      }
    }
    return done();
  });
};

_package = function(config, options, next) {
  var rimraf, _ref1, _ref2;
  logger.info("Beginning rpm-package");
  if (fs.existsSync(config.rpmPackage.rootOutPath)) {
    rimraf = require('rimraf');
    logger.debug("Deleting " + config.rpmPackage.rootOutPath);
    rimraf.sync(config.rpmPackage.rootOutPath);
  }
  logger.debug("Copying [[ " + config.root + " ]] to [[ " + config.rpmPackage.outPath + " ]]");
  copyDirSyncRecursive(config.root, config.rpmPackage.outPath, config.rpmPackage.exclude);
  __writeConfig(config);
  if (((_ref1 = config.server) != null ? (_ref2 = _ref1.defaultServer) != null ? _ref2.enabled : void 0 : void 0) === true) {
    logger.info("Default server being used, not writing app.js or running npm install");
    logger.info("Completed web-package");
    return next();
  } else {
    if (config.rpmPackage.appjs) {
      __writeApplicationStarter(config);
    }
    return __runNPMInstall(config, next);
  }
};

__runNPMInstall = function(config, next) {
  var currentDir;
  currentDir = process.cwd();
  process.chdir(config.rpmPackage.outPath);
  logger.debug("Running NPM inside [[ " + config.rpmPackage.outPath + " ]]");
  return exec("npm install --production", (function(_this) {
    return function(err, sout, serr) {
      var done;
      logger.debug("NPM INSTALL standard out\n" + sout);
      logger.debug("NPM INSTALL standard err\n" + serr);
      done = function() {
        process.chdir(currentDir);
        logger.info("Completed web-package");
        return next();
      };
      if (err) {
        logger.error("Error running NPM Install: " + err);
        return done();
      } else {
        logger.debug("Zip contents of [[ " + config.rpmPackage.outPath + " ]]");
        return __rpm(config, done);
      }
    };
  })(this));
};

__writeConfig = function(config) {
  var configClone, configOutPath, configText, writeConfig, _ref1;
  configClone = _.clone(config, true);
  if (config.rpmPackage.useEntireConfig) {
    writeConfig = configClone;
    if (writeConfig.liveReload) {
      writeConfig.liveReload.enabled = false;
    }
    ["extensions", "installedModules", "logger", "timer", "helpers", "log"].forEach(function(prop) {
      if (writeConfig[prop]) {
        return delete writeConfig[prop];
      }
    });
  } else {
    writeConfig = {
      watch: configClone.watch,
      liveReload: {
        enabled: false
      },
      isOptimize: configClone.isOptimize
    };
  }
  if (configClone.server) {
    writeConfig.server = configClone.server;
    if (writeConfig.server.path) {
      writeConfig.server.path = path.relative(config.root, writeConfig.server.path).split(path.sep);
    }
    if ((_ref1 = writeConfig.server.views) != null ? _ref1.path : void 0) {
      writeConfig.server.views.path = path.relative(config.root, writeConfig.server.views.path).split(path.sep);
    }
  }
  writeConfig.watch.sourceDir = path.relative(config.root, writeConfig.watch.sourceDir).split(path.sep);
  writeConfig.watch.compiledDir = path.relative(config.root, writeConfig.watch.compiledDir).split(path.sep);
  writeConfig.watch.javascriptDir = path.relative(config.root, writeConfig.watch.javascriptDir).split(path.sep);
  writeConfig.watch.compiledJavascriptDir = path.relative(config.root, writeConfig.watch.compiledJavascriptDir).split(path.sep);
  configOutPath = path.join(config.rpmPackage.outPath, "" + config.rpmPackage.configName + ".js");
  logger.debug("Writing mimosa-config to [[ " + configOutPath + " ]]");
  configText = __generateConfigText(writeConfig);
  return fs.writeFileSync(configOutPath, configText, 'ascii');
};

__generateConfigText = function(configText) {
  var compiledHogan, context, hogan, hoganTemplateText;
  hogan = require('hogan.js');
  hoganTemplateText = fs.readFileSync(path.join(__dirname, 'resources', 'config-template.hogan'), 'ascii');
  compiledHogan = hogan.compile(hoganTemplateText);
  context = {
    configJSON: JSON.stringify(configText, null, 2)
  };
  return compiledHogan.render(context).replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
};

__writeApplicationStarter = function(config) {
  var appJsInPath, appJsOutPath, appJsText, chosenLang, coffeeMatch, err, ext, lang, level, pack, prepend, prependLang, rootPathFromAppjs, serverExtension, serverRelPath, _fn, _i, _len, _ref1, _ref2;
  appJsInPath = path.join(__dirname, 'resources', 'app.js');
  appJsText = fs.readFileSync(appJsInPath, 'ascii');
  if (((_ref1 = config.server) != null ? _ref1.path : void 0) != null) {
    serverExtension = path.extname(config.server.path).substring(1);
  }
  prependLang = (function() {
    if ((serverExtension != null) && (langs[serverExtension] != null)) {
      if (langs[serverExtension]) {
        logger.debug("Adding require statement to app.js");
        return langs[serverExtension];
      }
    } else {
      try {
        pack = require(path.join(config.root, 'package.json'));
        logger.debug("Looking through package to determine proper language to require in at top of app.js");
        chosenLang = null;
        for (ext in langs) {
          lang = langs[ext];
          if (pack.dependencies[lang] != null) {
            chosenLang = lang;
            break;
          }
        }
        return chosenLang;
      } catch (_error) {
        err = _error;
        return logger.info("Unable to determine language of server file, you might need to address the app.js file to add a require statement for your language of choice");
      }
    }
  })();
  if (prependLang != null) {
    coffeeMatch = /.*?coffee-script/.test(prependLang);
    if (coffeeMatch) {
      prepend = "// with coffeescript 1.7, need to bring in register to have coffeescript compiled on the fly\nvar trans = require('" + prependLang + "');\nif (trans.register) {\n  trans.register();\n}\n";
    } else {
      prepend = "require('" + prependLang + "')\n";
    }
    appJsText = prepend + appJsText;
  }
  rootPathFromAppjs = '';
  serverRelPath = config.server.path.split(config.root)[1].substr(1);
  if (path.dirname(config.rpmPackage.appjs) !== '.') {
    _ref2 = path.dirname(config.rpmPackage.appjs).split(path.sep);
    _fn = function() {
      return rootPathFromAppjs += '..' + path.sep;
    };
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      level = _ref2[_i];
      _fn();
    }
  }
  if (rootPathFromAppjs === '') {
    appJsText = appJsText.replace("CONFIG_PATH", "./" + config.rpmPackage.configName);
    appJsText = appJsText.replace("SERVER_PATH", "./" + serverRelPath);
  } else {
    appJsText = appJsText.replace("CONFIG_PATH", path.join(rootPathFromAppjs, config.rpmPackage.configName));
    appJsText = appJsText.replace("SERVER_PATH", path.join(rootPathFromAppjs, serverRelPath));
  }
  appJsOutPath = path.join(config.rpmPackage.outPath, config.rpmPackage.appjs);
  logger.debug("Writing app.js to [[ " + appJsOutPath + " ]]");
  return fs.writeFileSync(appJsOutPath, appJsText, 'ascii');
};

copyDirSyncRecursive = function(sourceDir, newDirLocation, excludes) {
  var checkDir, files;
  checkDir = fs.statSync(sourceDir);
  mkdirp.sync(newDirLocation, checkDir.mode);
  files = fs.readdirSync(sourceDir);
  return files.forEach(function(f) {
    var contents, currFile, err, filePath, newFilePath, packageJson, symlinkFull;
    filePath = path.join(sourceDir, f);
    if (excludes.indexOf(filePath) >= 0) {
      return;
    }
    newFilePath = path.join(newDirLocation, f);
    currFile = fs.lstatSync(filePath);
    if (currFile.isDirectory()) {
      return copyDirSyncRecursive(filePath, newFilePath, excludes);
    } else if (currFile.isSymbolicLink()) {
      symlinkFull = fs.readlinkSync(filePath);
      return fs.symlinkSync(symlinkFull, newFilePath);
    } else {
      contents = fs.readFileSync(filePath);
      if (f === "package.json") {
        try {
          packageJson = require(filePath);
          _.keys(packageJson.dependencies).forEach(function(key) {
            if (key.indexOf('mimosa-') === 0) {
              return delete packageJson.dependencies[key];
            }
          });
          contents = JSON.stringify(packageJson, null, 2);
        } catch (_error) {
          err = _error;
          logger.error("Error parsing package.json: " + err);
        }
      }
      return fs.writeFileSync(newFilePath, contents);
    }
  });
};

module.exports = {
  registration: registration,
  defaults: moduleConfig.defaults,
  placeholder: moduleConfig.placeholder,
  validate: moduleConfig.validate
};
