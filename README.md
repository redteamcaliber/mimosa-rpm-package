Mimosa Rpm Package
=========

A plugin to [mimosa] to based on the [web-package] plugin written by [David Bashford] and the [easy-rpm] plugin writen by [Panit Wechasil]. Will generate an RPM-packaged version of your project sutible to distribute to RHEL-compatible boxes.

*NOTE:* this plugin will only work on linux boxes with `rpm-tools` installed.


Version
----

1.0

Default Config
-----------
```
 rpmPackage:
      name: "noname"
      summary: "No Summary"
      description: "None"
      version: "0.1.0"
      release: "1"
      license: "MIT"
      vendor: "Vendor"
      group: "Development/Tools"
      buildArch: "noarch"
      dependencies: []
      preInstallScript: []
      postInstallScript: []
      preUninstallScript: []
      postUninstallScript: []
      targetDestination: "/"
      outPath:"dist"
      configName:"config"
      useEntireConfig: false
      exclude:["README.md","node_modules","mimosa-config.coffee","mimosa-config-documented.coffee", "mimosa-config.js","assets",".git",".gitignore",".travis.yml",".mimosa","bower.json"]
      appjs: "app.js"

```
* `name`: A string value that is used to set at the name of your RPM package.
* `summary`: A string value that is used to set as the summary text of your RPM package
* `description`: A string value that is used to set as the description of your RPM package
* `version`: A string value that is used to set as the version of your RPM package
* `release`: A string value that is used to set as the release of your RPM package
* `license`: A string value that is used to specify the license type of your RPM package
* `vendor`: A string value that is used to set as the Vendor property of your RPM package
* `group`: A string value that is used to specify the group of your RPM package
* `buildArch`: A string value that is used to set specify the target architecture of your RPM package
* `dependencies`: An array of required packages, that should be installed before(e.g. ["nodejs >= 0.10.22"])
* `preInstallScript`: An array of command to be excecuted before the installation
* `postInstallScript`: An array of command to be excecuted after the installation
* `preUninstallScript`: An array of command to be excecuted before the uninstallation
* `postUninstallScript`: An array of command to be excecuted after the uninstallation
* `targetDestination`: The root target for files when the RPM is installed
* `outPath`: a string, the folder where mimosa-web-package will place your packaged app. Can be either relative to the root of your project or absolute.
* `configName`: a string, the name of output configuration file without extension; it is also acceptable to define a subdirectory, although the subdirectory must exist and the path separator character ('/' or '\') must be at the beginning (e.g. "config/settings"). The relevant portions of the mimosa-config are written to the outPath directory as configName + '.js'
* `useEntireConfig`: a boolean, this module pulls out specific pieces of the mimosa-config that apply to what you may need with a packaged application. For instance, it does not include a coffeescript config, or a jshint config. If you want it to include the entire resolved mimosa-config flip this flag to true.
* `exclude`: an array, files, relative to the root of the project, to not include in the package. If it isn't listed in this array, it will be included in the package.
* `appjs`: name of the output app.js file which bootstraps the application, when set to null, web-package will not output a bootstrap file

Installation
--------------
Add `rpm-package` to your modules array
```
  modules: [
    "rpm-package"
    ...
  ]
```

[mimosa]:http://mimosa.io/
[web-package]:https://github.com/dbashford/mimosa-web-package
[David Bashford]:https://github.com/dbashford
[easy-rpm]: https://github.com/panitw/easy-rpm
[Panit Wechasil]: https://github.com/panitw