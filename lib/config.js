"use strict";
var path;

path = require('path');

exports.defaults = function() {
  return {
    rpmPackage: {
      name: "noname",
      summary: "No Summary",
      description: "No Description",
      version: "0.1.0",
      release: "1",
      epoch: Math.ceil(new Date().getTime() / 1000),
      license: "MIT",
      vendor: "Vendor",
      group: "Development/Tools",
      buildArch: "noarch",
      dependencies: [],
      preInstallScript: [],
      postInstallScript: [],
      preUninstallScript: [],
      postUninstallScript: [],
      keepTemp: false,
      targetDestination: "/",
      outPath: "dist",
      configName: "config",
      useEntireConfig: false,
      exclude: ["README.md", "node_modules", "mimosa-config.coffee", "mimosa-config-documented.coffee", "mimosa-config.js", "assets", ".git", ".gitignore", ".travis.yml", ".mimosa", "bower.json"],
      appjs: "app.js"
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  ###\n  The rpmPackage module works hand in hand with the mimosa-server module to package web\n  applications\n  ###\n  rpmPackage:                   # Configration for packaging of web applications\n    name: \"noname\"              # A string value that is used to set at the name of your RPM package.\n    summary: \"No Summary\"       # A string value that is used to set as the summary text of your RPM package\n    description: \"None\"         # A string value that is used to set as the description of your RPM package\n    version: \"0.1.0\"            # A string value that is used to set as the version of your RPM package.\n    release: \"1\"                # A string value that is used to set as the release of your RPM package.\n    epoch: <current epoch>      # A string value used to represent the RPM epoch - In RPM version\n                                # comparison, the hidden Epoch value is most-significant. Epoch\n                                # comparison overrides the result of\n                                # ordinary version-release comparison. Highest Epoch wins, and any non\n                                # -zero Epoch wins over a missing Epoch.\n    license: \"MIT\"              # A string value that is used to specify the license type of your RPM package.\n    vendor: \"Vendor\"            # A string value that is used to set as the Vendor property of your RPM package.\n    group: \"Development/Tools\"  # A string value that is used to specify the group of your RPM package.\n    buildArch: \"noarch\"         # A string value that is used to set specify the target architecture of your RPM package.\n    dependencies: []            # An array of required packages, that should be installed before(e.g. [\"nodejs >= 0.10.22\"]).\n    preInstallScript: []        # An array of command to be excecuted before the installation.\n    postInstallScript: []       # An array of command to be excecuted after the installation.\n    preUninstallScript: []      # An array of command to be excecuted before the uninstallation.\n    postUninstallScript: []     # An array of command to be excecuted after the uninstallation.\n    targetDestination: \"/\"      # The root target for files when the RPM is installed.\n\n    outPath:\"dist\"              # Output path for assets to package, should be relative to the\n                                # root of the project (location of mimosa-config) or be absolute\n    configName:\"config\"         # the name of the config file, will be placed in outPath and have\n                                # a .json extension. it is also acceptable to define a subdirectory\n    useEntireConfig: false      # this module pulls out specific pieces of the mimosa-config that\n                                # apply to  what you may need with a packaged application. For\n                                # instance, it does not include a coffeescript config, or a jshint\n                                # config. If you want it to include the entire resolved mimosa-config\n                                # flip this flag to true.\n    ###\n    Exclude is a list of files/folders relative to the root of the app to not copy to the outPath\n    as part of a package.  By default the watch.sourceDir is added to this list during processing.\n    ###\n    exclude:[\"README.md\",\"node_modules\",\"mimosa-config.coffee\",\"mimosa-config-documented.coffee\", \"mimosa-config.js\",\"assets\",\".git\",\".gitignore\",\".travis.yml\",\".mimosa\",\"bower.json\"]\n    appjs: \"app.js\"             # name of the output app.js file which bootstraps the application,\n                                # when set to null, web-package will not output a bootstrap file\n";
};

exports.validate = function(config, validators) {
  var errors, ex, fullPathExcludes, _i, _len, _ref;
  if (validators.ifExistsIsArray(errors, "rpmPackage.exclude", config.rpmPackage.exclude)) {
    fullPathExcludes = [];
    _ref = config.rpmPackage.exclude;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ex = _ref[_i];
      if (typeof ex === "string") {
        fullPathExcludes.push(path.join(config.root, ex));
      } else {
        errors.push("rpmPackage.exclude must be an array of strings");
        break;
      }
    }
    config.rpmPackage.exclude = fullPathExcludes;
    config.rpmPackage.exclude.push(path.resolve(config.rpmPackage.outPath));
  }
  config.rpmPackage.rootOutPath = path.resolve(config.rpmPackage.outPath);
  config.rpmPackage.outPath = "" + config.rpmPackage.outPath + "/BUILDROOT" + config.rpmPackage.installDestination;
  errors = [];
  return errors;
};
