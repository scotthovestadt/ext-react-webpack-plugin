'use strict';

require("@babel/polyfill");

var _chalk = _interopRequireDefault(require("chalk"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _mkdirp = require("mkdirp");

var _executeAsync = require("./executeAsync");

var _extractFromJSX = _interopRequireDefault(require("./extractFromJSX"));

var _rimraf = require("rimraf");

var _artifacts = require("./artifacts");

var _astring = require("astring");

var _resolve = require("resolve");

var readline = _interopRequireWildcard(require("readline"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var reactVersion = 0;
var reactVersionFull = '';
let watching = false;
const app = `${_chalk.default.green('ℹ ｢ext｣:')} ext-react-webpack-plugin: `;
module.exports = class ExtReactWebpackPlugin {
  /**
   * @param {Object[]} builds
   * @param {Boolean} [debug=false] Set to true to prevent cleanup of build temporary build artifacts that might be helpful in troubleshooting issues.
   * deprecated @param {String} sdk The full path to the ExtReact SDK
   * @param {String} [toolkit='modern'] "modern" or "classic"
   * @param {String} theme The name of the ExtReact theme package to use, for example "theme-material"
   * @param {String[]} packages An array of ExtReact packages to include
   * @param {String[]} overrides An array with the paths of directories or files to search. Any classes
   * declared in these locations will be automatically required and included in the build.
   * If any file defines an ExtReact override (using Ext.define with an "override" property),
   * that override will in fact only be included in the build if the target class specified
   * in the "override" property is also included.
   * @param {String} output The path to directory where the ExtReact bundle should be written
   * @param {Boolean} asynchronous Set to true to run Sencha Cmd builds asynchronously. This makes the webpack build finish much faster, but the app may not load correctly in your browser until Sencha Cmd is finished building the ExtReact bundle
   * @param {Boolean} production Set to true for production builds.  This tell Sencha Cmd to compress the generated JS bundle.
   * @param {Boolean} treeShaking Set to false to disable tree shaking in development builds.  This makes incremental rebuilds faster as all ExtReact components are included in the ext.js bundle in the initial build and thus the bundle does not need to be rebuilt after each change. Defaults to true.
   * @param {Object} sass Sass configuration properties.
   * @param {Object} resources Extra resources to be copied into the resource folder as specified in the "resources" property of the "output" object. Folders specified in this list will be deeply copied.
   */
  constructor(options) {
    this.firstTime = true;
    this.count = 0; //can be in devdependencies - account for this: react: "15.16.0"

    var pkg = _fs.default.existsSync('package.json') && JSON.parse(_fs.default.readFileSync('package.json', 'utf-8')) || {};
    reactVersionFull = pkg.dependencies.react;
    var is16 = reactVersionFull.includes("16");

    if (is16) {
      reactVersion = 16;
    } else {
      reactVersion = 15;
    }

    this.reactVersion = reactVersion;
    this.reactVersionFull = reactVersionFull;
    const extReactRc = _fs.default.existsSync('.ext-reactrc') && JSON.parse(_fs.default.readFileSync('.ext-reactrc', 'utf-8')) || {};
    options = _objectSpread({}, this.getDefaultOptions(), options, extReactRc);
    const {
      builds
    } = options;

    if (Object.keys(builds).length === 0) {
      const {
        builds
      } = options,
            buildOptions = _objectWithoutProperties(options, ["builds"]);

      builds.ext = buildOptions;
    }

    for (let name in builds) {
      this._validateBuildConfig(name, builds[name]);
    }

    Object.assign(this, _objectSpread({}, options, {
      currentFile: null,
      manifest: null,
      dependencies: []
    }));
  }

  watchRun() {
    this.watch = true;
  }

  apply(compiler) {
    if (this.webpackVersion == undefined) {
      const isWebpack4 = compiler.hooks;

      if (isWebpack4) {
        this.webpackVersion = 'IS webpack 4';
      } else {
        this.webpackVersion = 'NOT webpack 4';
      }

      readline.cursorTo(process.stdout, 0);
      console.log(app + 'reactVersion: ' + this.reactVersionFull + ', ' + this.webpackVersion);
    }

    const me = this;

    if (compiler.hooks) {
      if (this.asynchronous) {
        compiler.hooks.watchRun.tapAsync('ext-react-watch-run (async)', (watching, cb) => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-watch-run (async)');
          this.watchRun();
          cb();
        });
      } else {
        compiler.hooks.watchRun.tap('ext-react-watch-run', watching => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-watch-run');
          this.watchRun();
        });
      }
    } else {
      compiler.plugin('watch-run', (watching, cb) => {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'watch-run');
        this.watchRun();
        cb();
      });
    }
    /**
     * Adds the code for the specified function call to the manifest.js file
     * @param {Object} call A function call AST node.
     */


    const addToManifest = function (call) {
      try {
        const file = this.state.module.resource;
        me.dependencies[file] = [...(me.dependencies[file] || []), (0, _astring.generate)(call)];
      } catch (e) {
        console.error(`Error processing ${file}`);
      }
    };

    if (compiler.hooks) {
      compiler.hooks.compilation.tap('ext-react-compilation', (compilation, data) => {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'ext-react-compilation');
        compilation.hooks.succeedModule.tap('ext-react-succeed-module', module => {
          this.succeedModule(compilation, module);
        });
        data.normalModuleFactory.plugin("parser", function (parser, options) {
          // extract xtypes and classes from Ext.create calls
          parser.plugin('call Ext.create', addToManifest); // copy Ext.require calls to the manifest.  This allows the users to explicitly require a class if the plugin fails to detect it.

          parser.plugin('call Ext.require', addToManifest); // copy Ext.define calls to the manifest.  This allows users to write standard ExtReact classes.

          parser.plugin('call Ext.define', addToManifest);
        });
        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('ext-react-htmlgeneration', (data, cb) => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-htmlgeneration'); //readline.cursorTo(process.stdout, 0);console.log(app + compilation.outputOptions.publicPath)

          if (compilation.outputOptions.publicPath == undefined) {
            data.assets.js.unshift('ext-react/ext.js');
            data.assets.css.unshift('ext-react/ext.css');
          } else {
            data.assets.js.unshift(_path.default.join(compilation.outputOptions.publicPath, 'ext-react/ext.js'));
            data.assets.css.unshift(_path.default.join(compilation.outputOptions.publicPath, 'ext-react/ext.css'));
          }

          cb(null, data);
        });
      });
    } else {
      compiler.plugin('compilation', (compilation, data) => {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'compilation');
        compilation.plugin('succeed-module', module => {
          this.succeedModule(compilation, module);
        });
        data.normalModuleFactory.plugin("parser", function (parser, options) {
          // extract xtypes and classes from Ext.create calls
          parser.plugin('call Ext.create', addToManifest); // copy Ext.require calls to the manifest.  This allows the users to explicitly require a class if the plugin fails to detect it.

          parser.plugin('call Ext.require', addToManifest); // copy Ext.define calls to the manifest.  This allows users to write standard ExtReact classes.

          parser.plugin('call Ext.define', addToManifest);
        });
      });
    } //*emit - once all modules are processed, create the optimized ExtReact build.


    if (compiler.hooks) {
      if (true) {
        compiler.hooks.emit.tapAsync('ext-react-emit (async)', (compilation, callback) => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-emit  (async)');
          this.emit(compiler, compilation, callback);
        });
      } else {
        compiler.hooks.emit.tap('ext-react-emit', compilation => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-emit');
          this.emit(compiler, compilation);
        });
      }
    } else {
      compiler.plugin('emit', (compilation, callback) => {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'emit');
        this.emit(compiler, compilation, callback);
      });
    }

    if (compiler.hooks) {
      if (this.asynchronous) {
        compiler.hooks.done.tapAsync('ext-react-done (async)', (compilation, callback) => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-done (async)');

          if (callback != null) {
            if (this.asynchronous) {
              console.log('calling callback for ext-react-emit  (async)');
              callback();
            }
          }
        });
      } else {
        compiler.hooks.done.tap('ext-react-done', () => {
          readline.cursorTo(process.stdout, 0);
          console.log(app + 'ext-react-done');
        });
      }
    }
  }

  emit(compiler, compilation, callback) {
    var _this = this;

    return _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var isWebpack4, modules, module, deps, build, outputPath, cmdErrors, promise;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            isWebpack4 = compilation.hooks;
            modules = [];

            if (isWebpack4) {
              isWebpack4 = true; //       modules = compilation.chunks.reduce((a, b) => a.concat(b._modules), [])
              // //      console.log(modules)
              //       var i = 0
              //       var theModule = ''
              //       for (let module of modules) {
              //         if (i == 0) {
              //           theModule = module
              //           i++
              //         }
              // //const deps = this.dependencies[module.resource]
              //         //console.log(deps)
              //         //if (deps) statements = statements.concat(deps);
              //       }
              //       var thePath = path.join(compiler.outputPath, 'module.txt')
              //       //console.log(thePath)
              //       //var o = {};
              //       //o.o = theModule;
              //       //console.log(theModule[0].context)
              //       var cache = [];
              //       var h = JSON.stringify(theModule, function(key, value) {
              //           if (typeof value === 'object' && value !== null) {
              //               if (cache.indexOf(value) !== -1) {
              //                   // Circular reference found, discard key
              //                   return;
              //               }
              //               // Store value in our collection
              //               cache.push(value);
              //           }
              //           return value;
              //       });
              //       cache = null; // Enable garbage collection
              //       //fs.writeFileSync( thePath, h, 'utf8')
            } else {
              isWebpack4 = false;
              modules = compilation.chunks.reduce((a, b) => a.concat(b.modules), []);

              for (module of modules) {
                deps = _this.dependencies[module.resource];
                console.log(deps); //if (deps) statements = statements.concat(deps);
              }
            }

            build = _this.builds[Object.keys(_this.builds)[0]];
            outputPath = _path.default.join(compiler.outputPath, _this.output); // webpack-dev-server overwrites the outputPath to "/", so we need to prepend contentBase

            if (compiler.outputPath === '/' && compiler.options.devServer) {
              outputPath = _path.default.join(compiler.options.devServer.contentBase, outputPath);
            }

            cmdErrors = [];
            promise = _this._buildExtBundle(compilation, cmdErrors, outputPath, build);
            _context.next = 10;
            return promise;

          case 10:
            if (_this.watch && _this.count == 0 && cmdErrors.length == 0) {// var url = 'http://localhost:' + this.port
              // readline.cursorTo(process.stdout, 0);console.log(app + 'ext-react-emit - open browser at ' + url)
              // this.count++
              // const opn = require('opn')
              // opn(url)
            }

            if (callback != null) {
              callback();
            }

          case 12:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }))();
  }
  /**
   /**
    * Builds a minimal version of the ExtReact framework based on the classes used
    * @param {String} name The name of the build
    * @param {Module[]} modules webpack modules
    * @param {String} output The path to where the framework build should be written
    * @param {String} [toolkit='modern'] "modern" or "classic"
    * @param {String} output The path to the directory to create which will contain the js and css bundles
    * @param {String} theme The name of the ExtReact theme package to use, for example "theme-material"
    * @param {String[]} packages An array of ExtReact packages to include
    * @param {String[]} packageDirs Directories containing packages
    * @param {String[]} overrides An array of locations for overrides
    * @param {String} sdk The full path to the ExtReact SDK
    * @param {Object} sass Sass configuration properties.
    * @param {Object} resources Extra resources to be copied into the resource folder as specified in the "resources" property of the "output" object. Folders specified in this list will be deeply copied.
    * @private
    */


  _buildExtBundle(compilation, cmdErrors, output, {
    toolkit = 'modern',
    theme,
    packages = [],
    packageDirs = [],
    sdk,
    overrides,
    sass,
    resources
  }) {
    let sencha = this._getSenchCmdPath();

    theme = theme || (toolkit === 'classic' ? 'theme-triton' : 'theme-material');
    return new Promise((resolve, reject) => {
      const onBuildDone = () => {
        if (cmdErrors.length) {
          reject(new Error(cmdErrors.join("")));
        } else {
          resolve();
        }
      };

      const userPackages = _path.default.join('.', output, 'packages');

      if (_fs.default.existsSync(userPackages)) {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'Adding Package Folder: ' + userPackages);
        packageDirs.push(userPackages);
      }

      if (this.firstTime) {
        (0, _rimraf.sync)(output);
        (0, _mkdirp.sync)(output);

        _fs.default.writeFileSync(_path.default.join(output, 'build.xml'), (0, _artifacts.buildXML)({
          compress: this.production
        }), 'utf8');

        _fs.default.writeFileSync(_path.default.join(output, 'jsdom-environment.js'), (0, _artifacts.createJSDOMEnvironment)(), 'utf8');

        _fs.default.writeFileSync(_path.default.join(output, 'app.json'), (0, _artifacts.createAppJson)({
          theme,
          packages,
          toolkit,
          overrides,
          packageDirs,
          sass,
          resources
        }), 'utf8');

        _fs.default.writeFileSync(_path.default.join(output, 'workspace.json'), (0, _artifacts.createWorkspaceJson)(sdk, packageDirs, output), 'utf8');
      }

      this.firstTime = false;
      let js;
      js = 'Ext.require("Ext.*")'; // if (this.treeShaking) {
      //   //let statements = ['Ext.require(["Ext.app.Application", "Ext.Component", "Ext.Widget", "Ext.layout.Fit", "Ext.react.Transition", "Ext.react.RendererCell"])']; // for some reason command doesn't load component when only panel is required
      //   let statements = ['Ext.require(["Ext.app.Application", "Ext.Component", "Ext.Widget", "Ext.layout.Fit", "Ext.react.Transition"])']; // for some reason command doesn't load component when only panel is required
      //   // if (packages.indexOf('reacto') !== -1) {
      //   //   statements.push('Ext.require("Ext.react.RendererCell")');
      //   // }
      //   //mjg
      //   for (let module of modules) {
      //     const deps = this.dependencies[module.resource];
      //     if (deps) statements = statements.concat(deps);
      //   }
      //   js = statements.join(';\n');
      // } else {
      //   js = 'Ext.require("Ext.*")';
      // }
      // if (fs.existsSync(path.join(sdk, 'ext'))) {
      //   // local checkout of the SDK repo
      //   packageDirs.push(path.join('ext', 'packages'));
      //   sdk = path.join(sdk, 'ext');
      // }

      var parms = [];

      if (this.watch) {
        parms = ['app', 'watch'];
      } else {
        parms = ['app', 'build'];
      }

      if (this.manifest === null || js !== this.manifest) {
        this.manifest = js; //readline.cursorTo(process.stdout, 0);console.log(app + 'tree shaking: ' + this.treeShaking)

        const manifest = _path.default.join(output, 'manifest.js');

        _fs.default.writeFileSync(manifest, js, 'utf8');

        readline.cursorTo(process.stdout, 0);
        console.log(app + `building ExtReact bundle at: ${output}`);

        if (this.watch && !watching || !this.watch) {
          var options = {
            cwd: output,
            silent: true,
            stdio: 'pipe',
            encoding: 'utf-8'
          };
          var verbose = 'no';

          if (process.env.EXTREACT_VERBOSE == 'yes') {
            verbose = 'yes';
          }

          (0, _executeAsync.executeAsync)(sencha, parms, options, compilation, cmdErrors, verbose).then(function () {
            onBuildDone();
          }, function (reason) {
            resolve(reason);
          });
        }
      } else {
        readline.cursorTo(process.stdout, 0);
        console.log(app + 'Ext rebuild NOT needed');
        onBuildDone();
      } // var parms
      // if (this.watch) {
      //   if (!watching) {
      //     parms = ['app', 'watch']
      //   }
      //   // if (!cmdRebuildNeeded) {
      //   //   readline.cursorTo(process.stdout, 0);console.log(app + 'Ext rebuild NOT needed')
      //   //   onBuildDone()
      //   // }
      // }
      // else {
      //   parms = ['app', 'build']
      // }
      // if (cmdRebuildNeeded) {
      //   var options = { cwd: output, silent: true, stdio: 'pipe', encoding: 'utf-8'}
      //   executeAsync(sencha, parms, options, compilation, cmdErrors).then(function() {
      //     onBuildDone()
      //   }, function(reason){
      //     resolve(reason)
      //   })
      // }

    });
  }
  /**
   * Default config options
   * @protected
   * @return {Object}
   */


  getDefaultOptions() {
    return {
      port: 8016,
      builds: {},
      debug: false,
      watch: false,
      test: /\.(j|t)sx?$/,

      /* begin single build only */
      output: 'ext-react',
      toolkit: 'modern',
      packages: null,
      packageDirs: [],
      overrides: [],
      asynchronous: false,
      production: false,
      manifestExtractor: _extractFromJSX.default,
      treeShaking: false
      /* end single build only */

    };
  }

  succeedModule(compilation, module) {
    this.currentFile = module.resource;

    if (module.resource && module.resource.match(this.test) && !module.resource.match(/node_modules/) && !module.resource.match(`/ext-react${reactVersion}/`)) {
      const doParse = () => {
        this.dependencies[this.currentFile] = [...(this.dependencies[this.currentFile] || []), ...this.manifestExtractor(module._source._value, compilation, module, reactVersion)];
      };

      if (this.debug) {
        doParse();
      } else {
        try {
          doParse();
        } catch (e) {
          console.error('\nerror parsing ' + this.currentFile);
          console.error(e);
        }
      }
    }
  }
  /**
   * Checks each build config for missing/invalid properties
   * @param {String} name The name of the build
   * @param {String} build The build config
   * @private
   */


  _validateBuildConfig(name, build) {
    let {
      sdk,
      production
    } = build;

    if (production) {
      build.treeShaking = false;
    }

    if (sdk) {
      if (!_fs.default.existsSync(sdk)) {
        throw new Error(`No SDK found at ${_path.default.resolve(sdk)}.  Did you for get to link/copy your Ext JS SDK to that location?`);
      } else {
        this._addReactorPackage(build);
      }
    } else {
      try {
        build.sdk = _path.default.dirname((0, _resolve.sync)('@extjs/ext-react', {
          basedir: process.cwd()
        }));
        build.packageDirs = [...(build.packageDirs || []), _path.default.dirname(build.sdk)];
        build.packages = build.packages || this._findPackages(build.sdk);
      } catch (e) {
        throw new Error(`@extjs/ext-react not found.  You can install it with "npm install --save @extjs/ext-react" or, if you have a local copy of the SDK, specify the path to it using the "sdk" option in build "${name}."`);
      }
    }
  }
  /**
   * Adds the reactor package if present and the toolkit is modern
   * @param {Object} build 
   */


  _addReactorPackage(build) {
    if (build.toolkit === 'classic') return;

    if (_fs.default.existsSync(_path.default.join(build.sdk, 'ext', 'modern', 'reactor')) || // repo
    _fs.default.existsSync(_path.default.join(build.sdk, 'modern', 'reactor'))) {
      // production build
      if (!build.packages) {
        build.packages = [];
      }

      build.packages.push('reactor');
    }
  } // /**
  //  * Adds the ExtReact package if present and the toolkit is modern
  //  * @param {Object} build 
  //  */
  // _addExtReactPackage(build) {
  //   if (build.toolkit === 'classic') return;
  //   if (fs.existsSync(path.join(build.sdk, 'ext', 'modern', 'react')) ||  // repo
  //     fs.existsSync(path.join(build.sdk, 'modern', 'react'))) { // production build
  //     if (!build.packages) {
  //       build.packages = [];
  //     }
  //     build.packages.push('react');
  //   }
  // }

  /**
   * Return the names of all ExtReact packages in the same parent directory as ext-react (typically node_modules/@sencha)
   * @private
   * @param {String} sdk Path to ext-react
   * @return {String[]}
   */


  _findPackages(sdk) {
    const modulesDir = _path.default.join(sdk, '..');

    return _fs.default.readdirSync(modulesDir) // Filter out directories without 'package.json'
    .filter(dir => _fs.default.existsSync(_path.default.join(modulesDir, dir, 'package.json'))) // Generate array of package names
    .map(dir => {
      const packageInfo = JSON.parse(_fs.default.readFileSync(_path.default.join(modulesDir, dir, 'package.json'))); // Don't include theme type packages.

      if (packageInfo.sencha && packageInfo.sencha.type !== 'theme') {
        return packageInfo.sencha.name;
      }
    }) // Remove any undefineds from map
    .filter(name => name);
  }
  /**
   * Returns the path to the sencha cmd executable
   * @private
   * @return {String}
   */


  _getSenchCmdPath() {
    try {
      // use @extjs/sencha-cmd from node_modules
      return require('@extjs/sencha-cmd');
    } catch (e) {
      // attempt to use globally installed Sencha Cmd
      return 'sencha';
    }
  }

}; // if (this.watch) {
//   if (!watching) {
//     watching = gatherErrors(fork(sencha, ['ant', 'watch'], { cwd: output, silent: true }));
//     watching.stderr.pipe(process.stderr);
//     watching.stdout.pipe(process.stdout);
//     watching.stdout.on('data', data => {
//       if (data && data.toString().match(/Waiting for changes\.\.\./)) {
//         onBuildDone()
//       }
//     })
//     watching.on('exit', onBuildDone)
//   }
//   if (!cmdRebuildNeeded) {
//     readline.cursorTo(process.stdout, 0);console.log(app + 'Ext rebuild NOT needed')
//     onBuildDone()
//   }
//   else {
//     //readline.cursorTo(process.stdout, 0);console.log(app + 'Ext rebuild IS needed')
//   }
// } 
// else {
//   const build = gatherErrors(fork(sencha, ['ant', 'build'], { stdio: 'inherit', encoding: 'utf-8', cwd: output, silent: false }));
//   readline.cursorTo(process.stdout, 0);console.log(app + 'sencha ant build')
//   if(build.stdout) { build.stdout.pipe(process.stdout) }
//   if(build.stderr) { build.stderr.pipe(process.stderr) }
//   build.on('exit', onBuildDone);
// }
// const gatherErrors2 = (cmd) => {
//   if (cmd.stdout) {
//     cmd.stdout.on('data', data => {
//       const message = data.toString();
//       if (message.match(/^\[ERR\]/)) {
//         cmdErrors.push(message.replace(/^\[ERR\] /gi, ''));
//       }
//     })
//   }
//   return cmd;
// }
// function gatherErrors (cmd) {
//   if (cmd.stdout) {
//     cmd.stdout.on('data', data => {
//       const message = data.toString();
//       if (message.match(/^\[ERR\]/)) {
//         cmdErrors.push(message.replace(/^\[ERR\] /gi, ''));
//       }
//     })
//   }
//   return cmd
// }
// from this.emit
// the following is needed for html-webpack-plugin to include <script> and <link> tags for ExtReact
// console.log('compilation')
// console.log('********compilation.chunks[0]')
// console.log(compilation.chunks[0].id)
// console.log(path.join(this.output, 'ext.js'))
// const jsChunk = compilation.addChunk(`${this.output}-js`);
// jsChunk.hasRuntime = jsChunk.isInitial = () => true;
// jsChunk.files.push(path.join(this.output, 'ext.js'));
// jsChunk.files.push(path.join(this.output, 'ext.css'));
// jsChunk.id = 'aaaap'; // this forces html-webpack-plugin to include ext.js first
// console.log('********compilation.chunks[1]')
// console.log(compilation.chunks[1].id)
//if (this.asynchronous) callback();
//    console.log(callback)
// if (isWebpack4) {
//   console.log(path.join(this.output, 'ext.js'))
//   const stats = fs.statSync(path.join(outputPath, 'ext.js'))
//   const fileSizeInBytes = stats.size
//   compilation.assets['ext.js'] = {
//     source: function() {return fs.readFileSync(path.join(outputPath, 'ext.js'))},
//     size: function() {return fileSizeInBytes}
//   }
//   console.log(compilation.entrypoints)
//   var filelist = 'In this build:\n\n';
//   // Loop through all compiled assets,
//   // adding a new line item for each filename.
//   for (var filename in compilation.assets) {
//     filelist += ('- '+ filename +'\n');
//   }
//   // Insert this list into the webpack build as a new file asset:
//   compilation.assets['filelist.md'] = {
//     source() {
//       return filelist;
//     },
//     size() {
//       return filelist.length;
//     }
//   }
// }
// if (compiler.hooks) {
//     // in 'extreact-compilation'
//     //https://github.com/jaketrent/html-webpack-template
//     //https://github.com/jantimon/html-webpack-plugin#
//     // the following is needed for html-webpack-plugin to include <script> and <link> tags for ExtReact
//     compiler.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
//       'extreact-htmlgeneration',
//       (data, cb) => {
//         readline.cursorTo(process.stdout, 0);console.log(app + 'extreact-htmlgeneration')
//         console.log('data.assets.js.length')
//         console.log(data.assets.js.length)
//         data.assets.js.unshift('ext-react/ext.js')
//         data.assets.css.unshift('ext-react/ext.css')
//         cb(null, data)
//       }
//     )
//   }
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZWFjdFZlcnNpb24iLCJyZWFjdFZlcnNpb25GdWxsIiwid2F0Y2hpbmciLCJhcHAiLCJjaGFsayIsImdyZWVuIiwibW9kdWxlIiwiZXhwb3J0cyIsIkV4dFJlYWN0V2VicGFja1BsdWdpbiIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsImZpcnN0VGltZSIsImNvdW50IiwicGtnIiwiZnMiLCJleGlzdHNTeW5jIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZGVwZW5kZW5jaWVzIiwicmVhY3QiLCJpczE2IiwiaW5jbHVkZXMiLCJleHRSZWFjdFJjIiwiZ2V0RGVmYXVsdE9wdGlvbnMiLCJidWlsZHMiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiYnVpbGRPcHRpb25zIiwiZXh0IiwibmFtZSIsIl92YWxpZGF0ZUJ1aWxkQ29uZmlnIiwiYXNzaWduIiwiY3VycmVudEZpbGUiLCJtYW5pZmVzdCIsIndhdGNoUnVuIiwid2F0Y2giLCJhcHBseSIsImNvbXBpbGVyIiwid2VicGFja1ZlcnNpb24iLCJ1bmRlZmluZWQiLCJpc1dlYnBhY2s0IiwiaG9va3MiLCJyZWFkbGluZSIsImN1cnNvclRvIiwicHJvY2VzcyIsInN0ZG91dCIsImNvbnNvbGUiLCJsb2ciLCJtZSIsImFzeW5jaHJvbm91cyIsInRhcEFzeW5jIiwiY2IiLCJ0YXAiLCJwbHVnaW4iLCJhZGRUb01hbmlmZXN0IiwiY2FsbCIsImZpbGUiLCJzdGF0ZSIsInJlc291cmNlIiwiZSIsImVycm9yIiwiY29tcGlsYXRpb24iLCJkYXRhIiwic3VjY2VlZE1vZHVsZSIsIm5vcm1hbE1vZHVsZUZhY3RvcnkiLCJwYXJzZXIiLCJodG1sV2VicGFja1BsdWdpbkJlZm9yZUh0bWxHZW5lcmF0aW9uIiwib3V0cHV0T3B0aW9ucyIsInB1YmxpY1BhdGgiLCJhc3NldHMiLCJqcyIsInVuc2hpZnQiLCJjc3MiLCJwYXRoIiwiam9pbiIsImVtaXQiLCJjYWxsYmFjayIsImRvbmUiLCJtb2R1bGVzIiwiY2h1bmtzIiwicmVkdWNlIiwiYSIsImIiLCJjb25jYXQiLCJkZXBzIiwiYnVpbGQiLCJvdXRwdXRQYXRoIiwib3V0cHV0IiwiZGV2U2VydmVyIiwiY29udGVudEJhc2UiLCJjbWRFcnJvcnMiLCJwcm9taXNlIiwiX2J1aWxkRXh0QnVuZGxlIiwidG9vbGtpdCIsInRoZW1lIiwicGFja2FnZXMiLCJwYWNrYWdlRGlycyIsInNkayIsIm92ZXJyaWRlcyIsInNhc3MiLCJyZXNvdXJjZXMiLCJzZW5jaGEiLCJfZ2V0U2VuY2hDbWRQYXRoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJvbkJ1aWxkRG9uZSIsIkVycm9yIiwidXNlclBhY2thZ2VzIiwicHVzaCIsIndyaXRlRmlsZVN5bmMiLCJjb21wcmVzcyIsInByb2R1Y3Rpb24iLCJwYXJtcyIsImN3ZCIsInNpbGVudCIsInN0ZGlvIiwiZW5jb2RpbmciLCJ2ZXJib3NlIiwiZW52IiwiRVhUUkVBQ1RfVkVSQk9TRSIsInRoZW4iLCJyZWFzb24iLCJwb3J0IiwiZGVidWciLCJ0ZXN0IiwibWFuaWZlc3RFeHRyYWN0b3IiLCJleHRyYWN0RnJvbUpTWCIsInRyZWVTaGFraW5nIiwibWF0Y2giLCJkb1BhcnNlIiwiX3NvdXJjZSIsIl92YWx1ZSIsIl9hZGRSZWFjdG9yUGFja2FnZSIsImRpcm5hbWUiLCJiYXNlZGlyIiwiX2ZpbmRQYWNrYWdlcyIsIm1vZHVsZXNEaXIiLCJyZWFkZGlyU3luYyIsImZpbHRlciIsImRpciIsIm1hcCIsInBhY2thZ2VJbmZvIiwidHlwZSIsInJlcXVpcmUiXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUdBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFmQSxJQUFJQSxZQUFZLEdBQUcsQ0FBbkI7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxFQUF2QjtBQVlBLElBQUlDLFFB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QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0k7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmltcG9ydCAnQGJhYmVsL3BvbHlmaWxsJztcbnZhciByZWFjdFZlcnNpb24gPSAwXG52YXIgcmVhY3RWZXJzaW9uRnVsbCA9ICcnXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgc3luYyBhcyBta2RpcnAgfSBmcm9tICdta2RpcnAnO1xuaW1wb3J0IHsgZXhlY3V0ZUFzeW5jIH0gZnJvbSAnLi9leGVjdXRlQXN5bmMnXG5pbXBvcnQgZXh0cmFjdEZyb21KU1ggZnJvbSAnLi9leHRyYWN0RnJvbUpTWCc7XG5pbXBvcnQgeyBzeW5jIGFzIHJpbXJhZiB9IGZyb20gJ3JpbXJhZic7XG5pbXBvcnQgeyBidWlsZFhNTCwgY3JlYXRlQXBwSnNvbiwgY3JlYXRlV29ya3NwYWNlSnNvbiB9IGZyb20gJy4vYXJ0aWZhY3RzJztcbmltcG9ydCB7IGNyZWF0ZUpTRE9NRW52aXJvbm1lbnQgfSBmcm9tICcuL2FydGlmYWN0cyc7XG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ2FzdHJpbmcnO1xuaW1wb3J0IHsgc3luYyBhcyByZXNvbHZlIH0gZnJvbSAncmVzb2x2ZSc7XG5sZXQgd2F0Y2hpbmcgPSBmYWxzZTtcbmNvbnN0IGFwcCA9IGAke2NoYWxrLmdyZWVuKCfihLkg772iZXh0772jOicpfSBleHQtcmVhY3Qtd2VicGFjay1wbHVnaW46IGA7XG5pbXBvcnQgKiBhcyByZWFkbGluZSBmcm9tICdyZWFkbGluZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFeHRSZWFjdFdlYnBhY2tQbHVnaW4ge1xuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3RbXX0gYnVpbGRzXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2RlYnVnPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBwcmV2ZW50IGNsZWFudXAgb2YgYnVpbGQgdGVtcG9yYXJ5IGJ1aWxkIGFydGlmYWN0cyB0aGF0IG1pZ2h0IGJlIGhlbHBmdWwgaW4gdHJvdWJsZXNob290aW5nIGlzc3Vlcy5cbiAgICogZGVwcmVjYXRlZCBAcGFyYW0ge1N0cmluZ30gc2RrIFRoZSBmdWxsIHBhdGggdG8gdGhlIEV4dFJlYWN0IFNES1xuICAgKiBAcGFyYW0ge1N0cmluZ30gW3Rvb2xraXQ9J21vZGVybiddIFwibW9kZXJuXCIgb3IgXCJjbGFzc2ljXCJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRoZW1lIFRoZSBuYW1lIG9mIHRoZSBFeHRSZWFjdCB0aGVtZSBwYWNrYWdlIHRvIHVzZSwgZm9yIGV4YW1wbGUgXCJ0aGVtZS1tYXRlcmlhbFwiXG4gICAqIEBwYXJhbSB7U3RyaW5nW119IHBhY2thZ2VzIEFuIGFycmF5IG9mIEV4dFJlYWN0IHBhY2thZ2VzIHRvIGluY2x1ZGVcbiAgICogQHBhcmFtIHtTdHJpbmdbXX0gb3ZlcnJpZGVzIEFuIGFycmF5IHdpdGggdGhlIHBhdGhzIG9mIGRpcmVjdG9yaWVzIG9yIGZpbGVzIHRvIHNlYXJjaC4gQW55IGNsYXNzZXNcbiAgICogZGVjbGFyZWQgaW4gdGhlc2UgbG9jYXRpb25zIHdpbGwgYmUgYXV0b21hdGljYWxseSByZXF1aXJlZCBhbmQgaW5jbHVkZWQgaW4gdGhlIGJ1aWxkLlxuICAgKiBJZiBhbnkgZmlsZSBkZWZpbmVzIGFuIEV4dFJlYWN0IG92ZXJyaWRlICh1c2luZyBFeHQuZGVmaW5lIHdpdGggYW4gXCJvdmVycmlkZVwiIHByb3BlcnR5KSxcbiAgICogdGhhdCBvdmVycmlkZSB3aWxsIGluIGZhY3Qgb25seSBiZSBpbmNsdWRlZCBpbiB0aGUgYnVpbGQgaWYgdGhlIHRhcmdldCBjbGFzcyBzcGVjaWZpZWRcbiAgICogaW4gdGhlIFwib3ZlcnJpZGVcIiBwcm9wZXJ0eSBpcyBhbHNvIGluY2x1ZGVkLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3V0cHV0IFRoZSBwYXRoIHRvIGRpcmVjdG9yeSB3aGVyZSB0aGUgRXh0UmVhY3QgYnVuZGxlIHNob3VsZCBiZSB3cml0dGVuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gYXN5bmNocm9ub3VzIFNldCB0byB0cnVlIHRvIHJ1biBTZW5jaGEgQ21kIGJ1aWxkcyBhc3luY2hyb25vdXNseS4gVGhpcyBtYWtlcyB0aGUgd2VicGFjayBidWlsZCBmaW5pc2ggbXVjaCBmYXN0ZXIsIGJ1dCB0aGUgYXBwIG1heSBub3QgbG9hZCBjb3JyZWN0bHkgaW4geW91ciBicm93c2VyIHVudGlsIFNlbmNoYSBDbWQgaXMgZmluaXNoZWQgYnVpbGRpbmcgdGhlIEV4dFJlYWN0IGJ1bmRsZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHByb2R1Y3Rpb24gU2V0IHRvIHRydWUgZm9yIHByb2R1Y3Rpb24gYnVpbGRzLiAgVGhpcyB0ZWxsIFNlbmNoYSBDbWQgdG8gY29tcHJlc3MgdGhlIGdlbmVyYXRlZCBKUyBidW5kbGUuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gdHJlZVNoYWtpbmcgU2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdHJlZSBzaGFraW5nIGluIGRldmVsb3BtZW50IGJ1aWxkcy4gIFRoaXMgbWFrZXMgaW5jcmVtZW50YWwgcmVidWlsZHMgZmFzdGVyIGFzIGFsbCBFeHRSZWFjdCBjb21wb25lbnRzIGFyZSBpbmNsdWRlZCBpbiB0aGUgZXh0LmpzIGJ1bmRsZSBpbiB0aGUgaW5pdGlhbCBidWlsZCBhbmQgdGh1cyB0aGUgYnVuZGxlIGRvZXMgbm90IG5lZWQgdG8gYmUgcmVidWlsdCBhZnRlciBlYWNoIGNoYW5nZS4gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNhc3MgU2FzcyBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNvdXJjZXMgRXh0cmEgcmVzb3VyY2VzIHRvIGJlIGNvcGllZCBpbnRvIHRoZSByZXNvdXJjZSBmb2xkZXIgYXMgc3BlY2lmaWVkIGluIHRoZSBcInJlc291cmNlc1wiIHByb3BlcnR5IG9mIHRoZSBcIm91dHB1dFwiIG9iamVjdC4gRm9sZGVycyBzcGVjaWZpZWQgaW4gdGhpcyBsaXN0IHdpbGwgYmUgZGVlcGx5IGNvcGllZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLmZpcnN0VGltZSA9IHRydWVcbiAgICB0aGlzLmNvdW50ID0gMFxuICAgIC8vY2FuIGJlIGluIGRldmRlcGVuZGVuY2llcyAtIGFjY291bnQgZm9yIHRoaXM6IHJlYWN0OiBcIjE1LjE2LjBcIlxuICAgIHZhciBwa2cgPSAoZnMuZXhpc3RzU3luYygncGFja2FnZS5qc29uJykgJiYgSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ3BhY2thZ2UuanNvbicsICd1dGYtOCcpKSB8fCB7fSlcbiAgICByZWFjdFZlcnNpb25GdWxsID0gcGtnLmRlcGVuZGVuY2llcy5yZWFjdFxuICAgIHZhciBpczE2ID0gcmVhY3RWZXJzaW9uRnVsbC5pbmNsdWRlcyhcIjE2XCIpXG4gICAgaWYgKGlzMTYpIHsgcmVhY3RWZXJzaW9uID0gMTYgfVxuICAgIGVsc2UgeyByZWFjdFZlcnNpb24gPSAxNSB9XG4gICAgdGhpcy5yZWFjdFZlcnNpb24gPSByZWFjdFZlcnNpb25cbiAgICB0aGlzLnJlYWN0VmVyc2lvbkZ1bGwgPSByZWFjdFZlcnNpb25GdWxsXG4gICAgY29uc3QgZXh0UmVhY3RSYyA9IChmcy5leGlzdHNTeW5jKCcuZXh0LXJlYWN0cmMnKSAmJiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnLmV4dC1yZWFjdHJjJywgJ3V0Zi04JykpIHx8IHt9KVxuICAgIG9wdGlvbnMgPSB7IC4uLnRoaXMuZ2V0RGVmYXVsdE9wdGlvbnMoKSwgLi4ub3B0aW9ucywgLi4uZXh0UmVhY3RSYyB9XG4gICAgY29uc3QgeyBidWlsZHMgfSA9IG9wdGlvbnNcbiAgICBpZiAoT2JqZWN0LmtleXMoYnVpbGRzKS5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IHsgYnVpbGRzLCAuLi5idWlsZE9wdGlvbnMgfSA9IG9wdGlvbnNcbiAgICAgIGJ1aWxkcy5leHQgPSBidWlsZE9wdGlvbnNcbiAgICB9XG4gICAgZm9yIChsZXQgbmFtZSBpbiBidWlsZHMpIHtcbiAgICAgIHRoaXMuX3ZhbGlkYXRlQnVpbGRDb25maWcobmFtZSwgYnVpbGRzW25hbWVdKVxuICAgIH1cbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBjdXJyZW50RmlsZTogbnVsbCxcbiAgICAgIG1hbmlmZXN0OiBudWxsLFxuICAgICAgZGVwZW5kZW5jaWVzOiBbXVxuICAgIH0pXG4gIH1cblxuICB3YXRjaFJ1bigpIHtcbiAgICB0aGlzLndhdGNoID0gdHJ1ZVxuICB9XG5cbiAgYXBwbHkoY29tcGlsZXIpIHtcbiAgICBpZiAodGhpcy53ZWJwYWNrVmVyc2lvbiA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlzV2VicGFjazQgPSBjb21waWxlci5ob29rcztcbiAgICAgIGlmIChpc1dlYnBhY2s0KSB7dGhpcy53ZWJwYWNrVmVyc2lvbiA9ICdJUyB3ZWJwYWNrIDQnfVxuICAgICAgZWxzZSB7dGhpcy53ZWJwYWNrVmVyc2lvbiA9ICdOT1Qgd2VicGFjayA0J31cbiAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAncmVhY3RWZXJzaW9uOiAnICsgdGhpcy5yZWFjdFZlcnNpb25GdWxsICsgJywgJyArIHRoaXMud2VicGFja1ZlcnNpb24pXG4gICAgfVxuICAgIGNvbnN0IG1lID0gdGhpc1xuXG4gICAgaWYgKGNvbXBpbGVyLmhvb2tzKSB7XG4gICAgICBpZiAodGhpcy5hc3luY2hyb25vdXMpIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3Mud2F0Y2hSdW4udGFwQXN5bmMoJ2V4dC1yZWFjdC13YXRjaC1ydW4gKGFzeW5jKScsICh3YXRjaGluZywgY2IpID0+IHtcbiAgICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dC1yZWFjdC13YXRjaC1ydW4gKGFzeW5jKScpXG4gICAgICAgICAgdGhpcy53YXRjaFJ1bigpXG4gICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbXBpbGVyLmhvb2tzLndhdGNoUnVuLnRhcCgnZXh0LXJlYWN0LXdhdGNoLXJ1bicsICh3YXRjaGluZykgPT4ge1xuICAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LXdhdGNoLXJ1bicpXG4gICAgICAgICAgdGhpcy53YXRjaFJ1bigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29tcGlsZXIucGx1Z2luKCd3YXRjaC1ydW4nLCAod2F0Y2hpbmcsIGNiKSA9PiB7XG4gICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnd2F0Y2gtcnVuJylcbiAgICAgICAgdGhpcy53YXRjaFJ1bigpXG4gICAgICAgIGNiKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgY29kZSBmb3IgdGhlIHNwZWNpZmllZCBmdW5jdGlvbiBjYWxsIHRvIHRoZSBtYW5pZmVzdC5qcyBmaWxlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNhbGwgQSBmdW5jdGlvbiBjYWxsIEFTVCBub2RlLlxuICAgICAqL1xuICAgIGNvbnN0IGFkZFRvTWFuaWZlc3QgPSBmdW5jdGlvbihjYWxsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5zdGF0ZS5tb2R1bGUucmVzb3VyY2U7XG4gICAgICAgIG1lLmRlcGVuZGVuY2llc1tmaWxlXSA9IFsgLi4uKG1lLmRlcGVuZGVuY2llc1tmaWxlXSB8fCBbXSksIGdlbmVyYXRlKGNhbGwpIF07XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgJHtmaWxlfWApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoY29tcGlsZXIuaG9va3MpIHtcbiAgICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnZXh0LXJlYWN0LWNvbXBpbGF0aW9uJywgKGNvbXBpbGF0aW9uLGRhdGEpID0+IHtcbiAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtY29tcGlsYXRpb24nKVxuICAgICAgICBjb21waWxhdGlvbi5ob29rcy5zdWNjZWVkTW9kdWxlLnRhcCgnZXh0LXJlYWN0LXN1Y2NlZWQtbW9kdWxlJywgKG1vZHVsZSkgPT4ge1xuICAgICAgICAgIHRoaXMuc3VjY2VlZE1vZHVsZShjb21waWxhdGlvbiwgbW9kdWxlKVxuICAgICAgICB9KVxuXG4gICAgICAgIGRhdGEubm9ybWFsTW9kdWxlRmFjdG9yeS5wbHVnaW4oXCJwYXJzZXJcIiwgZnVuY3Rpb24ocGFyc2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgLy8gZXh0cmFjdCB4dHlwZXMgYW5kIGNsYXNzZXMgZnJvbSBFeHQuY3JlYXRlIGNhbGxzXG4gICAgICAgICAgcGFyc2VyLnBsdWdpbignY2FsbCBFeHQuY3JlYXRlJywgYWRkVG9NYW5pZmVzdCk7XG4gICAgICAgICAgLy8gY29weSBFeHQucmVxdWlyZSBjYWxscyB0byB0aGUgbWFuaWZlc3QuICBUaGlzIGFsbG93cyB0aGUgdXNlcnMgdG8gZXhwbGljaXRseSByZXF1aXJlIGEgY2xhc3MgaWYgdGhlIHBsdWdpbiBmYWlscyB0byBkZXRlY3QgaXQuXG4gICAgICAgICAgcGFyc2VyLnBsdWdpbignY2FsbCBFeHQucmVxdWlyZScsIGFkZFRvTWFuaWZlc3QpO1xuICAgICAgICAgIC8vIGNvcHkgRXh0LmRlZmluZSBjYWxscyB0byB0aGUgbWFuaWZlc3QuICBUaGlzIGFsbG93cyB1c2VycyB0byB3cml0ZSBzdGFuZGFyZCBFeHRSZWFjdCBjbGFzc2VzLlxuICAgICAgICAgIHBhcnNlci5wbHVnaW4oJ2NhbGwgRXh0LmRlZmluZScsIGFkZFRvTWFuaWZlc3QpO1xuICAgICAgICB9KVxuXG4gICAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmh0bWxXZWJwYWNrUGx1Z2luQmVmb3JlSHRtbEdlbmVyYXRpb24udGFwQXN5bmMoJ2V4dC1yZWFjdC1odG1sZ2VuZXJhdGlvbicsKGRhdGEsIGNiKSA9PiB7XG5cbiAgICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dC1yZWFjdC1odG1sZ2VuZXJhdGlvbicpXG4gICAgICAgICAgLy9yZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgY29tcGlsYXRpb24ub3V0cHV0T3B0aW9ucy5wdWJsaWNQYXRoKVxuICAgICAgICAgIGlmIChjb21waWxhdGlvbi5vdXRwdXRPcHRpb25zLnB1YmxpY1BhdGggPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkYXRhLmFzc2V0cy5qcy51bnNoaWZ0KCdleHQtcmVhY3QvZXh0LmpzJylcbiAgICAgICAgICAgIGRhdGEuYXNzZXRzLmNzcy51bnNoaWZ0KCdleHQtcmVhY3QvZXh0LmNzcycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YS5hc3NldHMuanMudW5zaGlmdChwYXRoLmpvaW4oY29tcGlsYXRpb24ub3V0cHV0T3B0aW9ucy5wdWJsaWNQYXRoLCAnZXh0LXJlYWN0L2V4dC5qcycpKVxuICAgICAgICAgICAgZGF0YS5hc3NldHMuY3NzLnVuc2hpZnQocGF0aC5qb2luKGNvbXBpbGF0aW9uLm91dHB1dE9wdGlvbnMucHVibGljUGF0aCwgJ2V4dC1yZWFjdC9leHQuY3NzJykpXG4gICAgICAgICAgfVxuICAgICAgICAgIGNiKG51bGwsIGRhdGEpXG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29tcGlsZXIucGx1Z2luKCdjb21waWxhdGlvbicsIChjb21waWxhdGlvbiwgZGF0YSkgPT4ge1xuICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2NvbXBpbGF0aW9uJylcbiAgICAgICAgY29tcGlsYXRpb24ucGx1Z2luKCdzdWNjZWVkLW1vZHVsZScsIChtb2R1bGUpID0+IHtcbiAgICAgICAgICB0aGlzLnN1Y2NlZWRNb2R1bGUoY29tcGlsYXRpb24sIG1vZHVsZSlcbiAgICAgICAgfSlcbiAgICAgICAgZGF0YS5ub3JtYWxNb2R1bGVGYWN0b3J5LnBsdWdpbihcInBhcnNlclwiLCBmdW5jdGlvbihwYXJzZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAvLyBleHRyYWN0IHh0eXBlcyBhbmQgY2xhc3NlcyBmcm9tIEV4dC5jcmVhdGUgY2FsbHNcbiAgICAgICAgICBwYXJzZXIucGx1Z2luKCdjYWxsIEV4dC5jcmVhdGUnLCBhZGRUb01hbmlmZXN0KTtcbiAgICAgICAgICAvLyBjb3B5IEV4dC5yZXF1aXJlIGNhbGxzIHRvIHRoZSBtYW5pZmVzdC4gIFRoaXMgYWxsb3dzIHRoZSB1c2VycyB0byBleHBsaWNpdGx5IHJlcXVpcmUgYSBjbGFzcyBpZiB0aGUgcGx1Z2luIGZhaWxzIHRvIGRldGVjdCBpdC5cbiAgICAgICAgICBwYXJzZXIucGx1Z2luKCdjYWxsIEV4dC5yZXF1aXJlJywgYWRkVG9NYW5pZmVzdCk7XG4gICAgICAgICAgLy8gY29weSBFeHQuZGVmaW5lIGNhbGxzIHRvIHRoZSBtYW5pZmVzdC4gIFRoaXMgYWxsb3dzIHVzZXJzIHRvIHdyaXRlIHN0YW5kYXJkIEV4dFJlYWN0IGNsYXNzZXMuXG4gICAgICAgICAgcGFyc2VyLnBsdWdpbignY2FsbCBFeHQuZGVmaW5lJywgYWRkVG9NYW5pZmVzdCk7XG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG4gICAgfVxuXG4vLyplbWl0IC0gb25jZSBhbGwgbW9kdWxlcyBhcmUgcHJvY2Vzc2VkLCBjcmVhdGUgdGhlIG9wdGltaXplZCBFeHRSZWFjdCBidWlsZC5cbiAgICBpZiAoY29tcGlsZXIuaG9va3MpIHtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIGNvbXBpbGVyLmhvb2tzLmVtaXQudGFwQXN5bmMoJ2V4dC1yZWFjdC1lbWl0IChhc3luYyknLCAoY29tcGlsYXRpb24sIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtZW1pdCAgKGFzeW5jKScpXG4gICAgICAgICAgdGhpcy5lbWl0KGNvbXBpbGVyLCBjb21waWxhdGlvbiwgY2FsbGJhY2spXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3MuZW1pdC50YXAoJ2V4dC1yZWFjdC1lbWl0JywgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtZW1pdCcpXG4gICAgICAgICAgdGhpcy5lbWl0KGNvbXBpbGVyLCBjb21waWxhdGlvbilcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlci5wbHVnaW4oJ2VtaXQnLCAoY29tcGlsYXRpb24sIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZW1pdCcpXG4gICAgICAgIHRoaXMuZW1pdChjb21waWxlciwgY29tcGlsYXRpb24sIGNhbGxiYWNrKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tcGlsZXIuaG9va3MpIHtcbiAgICAgIGlmICh0aGlzLmFzeW5jaHJvbm91cykge1xuICAgICAgICBjb21waWxlci5ob29rcy5kb25lLnRhcEFzeW5jKCdleHQtcmVhY3QtZG9uZSAoYXN5bmMpJywgKGNvbXBpbGF0aW9uLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LWRvbmUgKGFzeW5jKScpXG4gICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFzeW5jaHJvbm91cykgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjYWxsaW5nIGNhbGxiYWNrIGZvciBleHQtcmVhY3QtZW1pdCAgKGFzeW5jKScpXG4gICAgICAgICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3MuZG9uZS50YXAoJ2V4dC1yZWFjdC1kb25lJywgKCkgPT4ge1xuICAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LWRvbmUnKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVtaXQoY29tcGlsZXIsIGNvbXBpbGF0aW9uLCBjYWxsYmFjaykge1xuICAgIHZhciBpc1dlYnBhY2s0ID0gY29tcGlsYXRpb24uaG9va3M7XG4gICAgdmFyIG1vZHVsZXMgPSBbXVxuICAgIGlmIChpc1dlYnBhY2s0KSB7XG4gICAgICBpc1dlYnBhY2s0ID0gdHJ1ZVxuXG5cblxuXG4vLyAgICAgICBtb2R1bGVzID0gY29tcGlsYXRpb24uY2h1bmtzLnJlZHVjZSgoYSwgYikgPT4gYS5jb25jYXQoYi5fbW9kdWxlcyksIFtdKVxuLy8gLy8gICAgICBjb25zb2xlLmxvZyhtb2R1bGVzKVxuLy8gICAgICAgdmFyIGkgPSAwXG4vLyAgICAgICB2YXIgdGhlTW9kdWxlID0gJydcbi8vICAgICAgIGZvciAobGV0IG1vZHVsZSBvZiBtb2R1bGVzKSB7XG4vLyAgICAgICAgIGlmIChpID09IDApIHtcbi8vICAgICAgICAgICB0aGVNb2R1bGUgPSBtb2R1bGVcbi8vICAgICAgICAgICBpKytcbi8vICAgICAgICAgfVxuLy8gLy9jb25zdCBkZXBzID0gdGhpcy5kZXBlbmRlbmNpZXNbbW9kdWxlLnJlc291cmNlXVxuLy8gICAgICAgICAvL2NvbnNvbGUubG9nKGRlcHMpXG4vLyAgICAgICAgIC8vaWYgKGRlcHMpIHN0YXRlbWVudHMgPSBzdGF0ZW1lbnRzLmNvbmNhdChkZXBzKTtcbi8vICAgICAgIH1cbi8vICAgICAgIHZhciB0aGVQYXRoID0gcGF0aC5qb2luKGNvbXBpbGVyLm91dHB1dFBhdGgsICdtb2R1bGUudHh0Jylcbi8vICAgICAgIC8vY29uc29sZS5sb2codGhlUGF0aClcblxuLy8gICAgICAgLy92YXIgbyA9IHt9O1xuLy8gICAgICAgLy9vLm8gPSB0aGVNb2R1bGU7XG4vLyAgICAgICAvL2NvbnNvbGUubG9nKHRoZU1vZHVsZVswXS5jb250ZXh0KVxuICAgICAgXG4vLyAgICAgICB2YXIgY2FjaGUgPSBbXTtcbi8vICAgICAgIHZhciBoID0gSlNPTi5zdHJpbmdpZnkodGhlTW9kdWxlLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4vLyAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbi8vICAgICAgICAgICAgICAgaWYgKGNhY2hlLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuLy8gICAgICAgICAgICAgICAgICAgLy8gQ2lyY3VsYXIgcmVmZXJlbmNlIGZvdW5kLCBkaXNjYXJkIGtleVxuLy8gICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuLy8gICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgIC8vIFN0b3JlIHZhbHVlIGluIG91ciBjb2xsZWN0aW9uXG4vLyAgICAgICAgICAgICAgIGNhY2hlLnB1c2godmFsdWUpO1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4vLyAgICAgICB9KTtcbi8vICAgICAgIGNhY2hlID0gbnVsbDsgLy8gRW5hYmxlIGdhcmJhZ2UgY29sbGVjdGlvblxuLy8gICAgICAgLy9mcy53cml0ZUZpbGVTeW5jKCB0aGVQYXRoLCBoLCAndXRmOCcpXG5cblxuXG5cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpc1dlYnBhY2s0ID0gZmFsc2VcblxuXG5cbiAgICAgIG1vZHVsZXMgPSBjb21waWxhdGlvbi5jaHVua3MucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiLm1vZHVsZXMpLCBbXSlcblxuICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIG1vZHVsZXMpIHtcbiAgICAgICAgY29uc3QgZGVwcyA9IHRoaXMuZGVwZW5kZW5jaWVzW21vZHVsZS5yZXNvdXJjZV1cbiAgICAgICAgY29uc29sZS5sb2coZGVwcylcbiAgICAgICAgLy9pZiAoZGVwcykgc3RhdGVtZW50cyA9IHN0YXRlbWVudHMuY29uY2F0KGRlcHMpO1xuICAgICAgfVxuXG5cblxuXG4gICAgfVxuICAgIGNvbnN0IGJ1aWxkID0gdGhpcy5idWlsZHNbT2JqZWN0LmtleXModGhpcy5idWlsZHMpWzBdXTtcbiAgICBsZXQgb3V0cHV0UGF0aCA9IHBhdGguam9pbihjb21waWxlci5vdXRwdXRQYXRoLCB0aGlzLm91dHB1dCk7XG4gICAgLy8gd2VicGFjay1kZXYtc2VydmVyIG92ZXJ3cml0ZXMgdGhlIG91dHB1dFBhdGggdG8gXCIvXCIsIHNvIHdlIG5lZWQgdG8gcHJlcGVuZCBjb250ZW50QmFzZVxuICAgIGlmIChjb21waWxlci5vdXRwdXRQYXRoID09PSAnLycgJiYgY29tcGlsZXIub3B0aW9ucy5kZXZTZXJ2ZXIpIHtcbiAgICAgIG91dHB1dFBhdGggPSBwYXRoLmpvaW4oY29tcGlsZXIub3B0aW9ucy5kZXZTZXJ2ZXIuY29udGVudEJhc2UsIG91dHB1dFBhdGgpO1xuICAgIH1cbiAgICB2YXIgY21kRXJyb3JzID0gW11cblxuICAgIGxldCBwcm9taXNlID0gdGhpcy5fYnVpbGRFeHRCdW5kbGUoY29tcGlsYXRpb24sIGNtZEVycm9ycywgb3V0cHV0UGF0aCwgYnVpbGQpXG5cbiAgICBhd2FpdCBwcm9taXNlXG4gXG4gICAgaWYgKHRoaXMud2F0Y2ggJiYgdGhpcy5jb3VudCA9PSAwICYmIGNtZEVycm9ycy5sZW5ndGggPT0gMCkge1xuICAgICAgLy8gdmFyIHVybCA9ICdodHRwOi8vbG9jYWxob3N0OicgKyB0aGlzLnBvcnRcbiAgICAgIC8vIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LWVtaXQgLSBvcGVuIGJyb3dzZXIgYXQgJyArIHVybClcbiAgICAgIC8vIHRoaXMuY291bnQrK1xuICAgICAgLy8gY29uc3Qgb3BuID0gcmVxdWlyZSgnb3BuJylcbiAgICAgIC8vIG9wbih1cmwpXG4gICAgfVxuICAgIGlmIChjYWxsYmFjayAhPSBudWxsKXsgY2FsbGJhY2soKSB9XG4gIH1cblxuICAvKipcbiAgIC8qKlxuICAgICogQnVpbGRzIGEgbWluaW1hbCB2ZXJzaW9uIG9mIHRoZSBFeHRSZWFjdCBmcmFtZXdvcmsgYmFzZWQgb24gdGhlIGNsYXNzZXMgdXNlZFxuICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGJ1aWxkXG4gICAgKiBAcGFyYW0ge01vZHVsZVtdfSBtb2R1bGVzIHdlYnBhY2sgbW9kdWxlc1xuICAgICogQHBhcmFtIHtTdHJpbmd9IG91dHB1dCBUaGUgcGF0aCB0byB3aGVyZSB0aGUgZnJhbWV3b3JrIGJ1aWxkIHNob3VsZCBiZSB3cml0dGVuXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gW3Rvb2xraXQ9J21vZGVybiddIFwibW9kZXJuXCIgb3IgXCJjbGFzc2ljXCJcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBvdXRwdXQgVGhlIHBhdGggdG8gdGhlIGRpcmVjdG9yeSB0byBjcmVhdGUgd2hpY2ggd2lsbCBjb250YWluIHRoZSBqcyBhbmQgY3NzIGJ1bmRsZXNcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSB0aGVtZSBUaGUgbmFtZSBvZiB0aGUgRXh0UmVhY3QgdGhlbWUgcGFja2FnZSB0byB1c2UsIGZvciBleGFtcGxlIFwidGhlbWUtbWF0ZXJpYWxcIlxuICAgICogQHBhcmFtIHtTdHJpbmdbXX0gcGFja2FnZXMgQW4gYXJyYXkgb2YgRXh0UmVhY3QgcGFja2FnZXMgdG8gaW5jbHVkZVxuICAgICogQHBhcmFtIHtTdHJpbmdbXX0gcGFja2FnZURpcnMgRGlyZWN0b3JpZXMgY29udGFpbmluZyBwYWNrYWdlc1xuICAgICogQHBhcmFtIHtTdHJpbmdbXX0gb3ZlcnJpZGVzIEFuIGFycmF5IG9mIGxvY2F0aW9ucyBmb3Igb3ZlcnJpZGVzXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gc2RrIFRoZSBmdWxsIHBhdGggdG8gdGhlIEV4dFJlYWN0IFNES1xuICAgICogQHBhcmFtIHtPYmplY3R9IHNhc3MgU2FzcyBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcmVzb3VyY2VzIEV4dHJhIHJlc291cmNlcyB0byBiZSBjb3BpZWQgaW50byB0aGUgcmVzb3VyY2UgZm9sZGVyIGFzIHNwZWNpZmllZCBpbiB0aGUgXCJyZXNvdXJjZXNcIiBwcm9wZXJ0eSBvZiB0aGUgXCJvdXRwdXRcIiBvYmplY3QuIEZvbGRlcnMgc3BlY2lmaWVkIGluIHRoaXMgbGlzdCB3aWxsIGJlIGRlZXBseSBjb3BpZWQuXG4gICAgKiBAcHJpdmF0ZVxuICAgICovXG4gIF9idWlsZEV4dEJ1bmRsZShjb21waWxhdGlvbiwgY21kRXJyb3JzLCBvdXRwdXQsIHsgdG9vbGtpdD0nbW9kZXJuJywgdGhlbWUsIHBhY2thZ2VzPVtdLCBwYWNrYWdlRGlycz1bXSwgc2RrLCBvdmVycmlkZXMsIHNhc3MsIHJlc291cmNlcyB9KSB7XG4gICAgbGV0IHNlbmNoYSA9IHRoaXMuX2dldFNlbmNoQ21kUGF0aCgpXG4gICAgdGhlbWUgPSB0aGVtZSB8fCAodG9vbGtpdCA9PT0gJ2NsYXNzaWMnID8gJ3RoZW1lLXRyaXRvbicgOiAndGhlbWUtbWF0ZXJpYWwnKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IG9uQnVpbGREb25lID0gKCkgPT4ge1xuICAgICAgICBpZiAoY21kRXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoY21kRXJyb3JzLmpvaW4oXCJcIikpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVzZXJQYWNrYWdlcyA9IHBhdGguam9pbignLicsIG91dHB1dCwgJ3BhY2thZ2VzJylcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKHVzZXJQYWNrYWdlcykpIHtcbiAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdBZGRpbmcgUGFja2FnZSBGb2xkZXI6ICcgKyB1c2VyUGFja2FnZXMpXG4gICAgICAgIHBhY2thZ2VEaXJzLnB1c2godXNlclBhY2thZ2VzKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5maXJzdFRpbWUpIHtcbiAgICAgICAgcmltcmFmKG91dHB1dClcbiAgICAgICAgbWtkaXJwKG91dHB1dClcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0LCAnYnVpbGQueG1sJyksIGJ1aWxkWE1MKHsgY29tcHJlc3M6IHRoaXMucHJvZHVjdGlvbiB9KSwgJ3V0ZjgnKVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXQsICdqc2RvbS1lbnZpcm9ubWVudC5qcycpLCBjcmVhdGVKU0RPTUVudmlyb25tZW50KCksICd1dGY4JylcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0LCAnYXBwLmpzb24nKSwgY3JlYXRlQXBwSnNvbih7IHRoZW1lLCBwYWNrYWdlcywgdG9vbGtpdCwgb3ZlcnJpZGVzLCBwYWNrYWdlRGlycywgc2FzcywgcmVzb3VyY2VzIH0pLCAndXRmOCcpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKG91dHB1dCwgJ3dvcmtzcGFjZS5qc29uJyksIGNyZWF0ZVdvcmtzcGFjZUpzb24oc2RrLCBwYWNrYWdlRGlycywgb3V0cHV0KSwgJ3V0ZjgnKVxuICAgICAgfVxuICAgICAgdGhpcy5maXJzdFRpbWUgPSBmYWxzZVxuXG4gICAgICBsZXQganNcbiAgICAgIGpzID0gJ0V4dC5yZXF1aXJlKFwiRXh0LipcIiknXG5cbiAgICAgIC8vIGlmICh0aGlzLnRyZWVTaGFraW5nKSB7XG4gICAgICAvLyAgIC8vbGV0IHN0YXRlbWVudHMgPSBbJ0V4dC5yZXF1aXJlKFtcIkV4dC5hcHAuQXBwbGljYXRpb25cIiwgXCJFeHQuQ29tcG9uZW50XCIsIFwiRXh0LldpZGdldFwiLCBcIkV4dC5sYXlvdXQuRml0XCIsIFwiRXh0LnJlYWN0LlRyYW5zaXRpb25cIiwgXCJFeHQucmVhY3QuUmVuZGVyZXJDZWxsXCJdKSddOyAvLyBmb3Igc29tZSByZWFzb24gY29tbWFuZCBkb2Vzbid0IGxvYWQgY29tcG9uZW50IHdoZW4gb25seSBwYW5lbCBpcyByZXF1aXJlZFxuICAgICAgLy8gICBsZXQgc3RhdGVtZW50cyA9IFsnRXh0LnJlcXVpcmUoW1wiRXh0LmFwcC5BcHBsaWNhdGlvblwiLCBcIkV4dC5Db21wb25lbnRcIiwgXCJFeHQuV2lkZ2V0XCIsIFwiRXh0LmxheW91dC5GaXRcIiwgXCJFeHQucmVhY3QuVHJhbnNpdGlvblwiXSknXTsgLy8gZm9yIHNvbWUgcmVhc29uIGNvbW1hbmQgZG9lc24ndCBsb2FkIGNvbXBvbmVudCB3aGVuIG9ubHkgcGFuZWwgaXMgcmVxdWlyZWRcbiAgICAgIC8vICAgLy8gaWYgKHBhY2thZ2VzLmluZGV4T2YoJ3JlYWN0bycpICE9PSAtMSkge1xuICAgICAgLy8gICAvLyAgIHN0YXRlbWVudHMucHVzaCgnRXh0LnJlcXVpcmUoXCJFeHQucmVhY3QuUmVuZGVyZXJDZWxsXCIpJyk7XG4gICAgICAvLyAgIC8vIH1cbiAgICAgIC8vICAgLy9tamdcbiAgICAgIC8vICAgZm9yIChsZXQgbW9kdWxlIG9mIG1vZHVsZXMpIHtcbiAgICAgIC8vICAgICBjb25zdCBkZXBzID0gdGhpcy5kZXBlbmRlbmNpZXNbbW9kdWxlLnJlc291cmNlXTtcbiAgICAgIC8vICAgICBpZiAoZGVwcykgc3RhdGVtZW50cyA9IHN0YXRlbWVudHMuY29uY2F0KGRlcHMpO1xuICAgICAgLy8gICB9XG4gICAgICAvLyAgIGpzID0gc3RhdGVtZW50cy5qb2luKCc7XFxuJyk7XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gICBqcyA9ICdFeHQucmVxdWlyZShcIkV4dC4qXCIpJztcbiAgICAgIC8vIH1cblxuXG5cbiAgICAgIC8vIGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihzZGssICdleHQnKSkpIHtcbiAgICAgIC8vICAgLy8gbG9jYWwgY2hlY2tvdXQgb2YgdGhlIFNESyByZXBvXG4gICAgICAvLyAgIHBhY2thZ2VEaXJzLnB1c2gocGF0aC5qb2luKCdleHQnLCAncGFja2FnZXMnKSk7XG4gICAgICAvLyAgIHNkayA9IHBhdGguam9pbihzZGssICdleHQnKTtcbiAgICAgIC8vIH1cblxuXG5cbiAgICAgIHZhciBwYXJtcyA9IFtdXG4gICAgICBpZiAodGhpcy53YXRjaCkgeyBwYXJtcyA9IFsnYXBwJywgJ3dhdGNoJ10gfVxuICAgICAgZWxzZSB7IHBhcm1zID0gWydhcHAnLCAnYnVpbGQnXSB9XG5cbiAgICAgIGlmICh0aGlzLm1hbmlmZXN0ID09PSBudWxsIHx8IGpzICE9PSB0aGlzLm1hbmlmZXN0KSB7XG4gICAgICAgIHRoaXMubWFuaWZlc3QgPSBqc1xuICAgICAgICAvL3JlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAndHJlZSBzaGFraW5nOiAnICsgdGhpcy50cmVlU2hha2luZylcbiAgICAgICAgY29uc3QgbWFuaWZlc3QgPSBwYXRoLmpvaW4ob3V0cHV0LCAnbWFuaWZlc3QuanMnKVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG1hbmlmZXN0LCBqcywgJ3V0ZjgnKVxuICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgYGJ1aWxkaW5nIEV4dFJlYWN0IGJ1bmRsZSBhdDogJHtvdXRwdXR9YClcblxuICAgICAgICBpZiAodGhpcy53YXRjaCAmJiAhd2F0Y2hpbmcgfHwgIXRoaXMud2F0Y2gpIHtcbiAgICAgICAgICB2YXIgb3B0aW9ucyA9IHsgY3dkOiBvdXRwdXQsIHNpbGVudDogdHJ1ZSwgc3RkaW86ICdwaXBlJywgZW5jb2Rpbmc6ICd1dGYtOCd9XG4gICAgICAgICAgdmFyIHZlcmJvc2UgPSAnbm8nXG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52LkVYVFJFQUNUX1ZFUkJPU0UgID09ICd5ZXMnKSB7XG4gICAgICAgICAgICB2ZXJib3NlID0gJ3llcydcbiAgICAgICAgICB9XG4gICAgICAgICAgZXhlY3V0ZUFzeW5jKHNlbmNoYSwgcGFybXMsIG9wdGlvbnMsIGNvbXBpbGF0aW9uLCBjbWRFcnJvcnMsIHZlcmJvc2UpLnRoZW4gKFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7IG9uQnVpbGREb25lKCkgfSwgXG4gICAgICAgICAgICBmdW5jdGlvbihyZWFzb24pIHsgcmVzb2x2ZShyZWFzb24pIH1cbiAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnRXh0IHJlYnVpbGQgTk9UIG5lZWRlZCcpXG4gICAgICAgIG9uQnVpbGREb25lKClcbiAgICAgIH1cblxuICAgICAgLy8gdmFyIHBhcm1zXG4gICAgICAvLyBpZiAodGhpcy53YXRjaCkge1xuICAgICAgLy8gICBpZiAoIXdhdGNoaW5nKSB7XG4gICAgICAvLyAgICAgcGFybXMgPSBbJ2FwcCcsICd3YXRjaCddXG4gICAgICAvLyAgIH1cbiAgICAgIC8vICAgLy8gaWYgKCFjbWRSZWJ1aWxkTmVlZGVkKSB7XG4gICAgICAvLyAgIC8vICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdFeHQgcmVidWlsZCBOT1QgbmVlZGVkJylcbiAgICAgIC8vICAgLy8gICBvbkJ1aWxkRG9uZSgpXG4gICAgICAvLyAgIC8vIH1cbiAgICAgIC8vIH1cbiAgICAgIC8vIGVsc2Uge1xuICAgICAgLy8gICBwYXJtcyA9IFsnYXBwJywgJ2J1aWxkJ11cbiAgICAgIC8vIH1cbiAgICAgIC8vIGlmIChjbWRSZWJ1aWxkTmVlZGVkKSB7XG4gICAgICAvLyAgIHZhciBvcHRpb25zID0geyBjd2Q6IG91dHB1dCwgc2lsZW50OiB0cnVlLCBzdGRpbzogJ3BpcGUnLCBlbmNvZGluZzogJ3V0Zi04J31cbiAgICAgIC8vICAgZXhlY3V0ZUFzeW5jKHNlbmNoYSwgcGFybXMsIG9wdGlvbnMsIGNvbXBpbGF0aW9uLCBjbWRFcnJvcnMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAvLyAgICAgb25CdWlsZERvbmUoKVxuICAgICAgLy8gICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gICAgIHJlc29sdmUocmVhc29uKVxuICAgICAgLy8gICB9KVxuICAgICAgLy8gfVxuXG5cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgY29uZmlnIG9wdGlvbnNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBnZXREZWZhdWx0T3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcG9ydDogODAxNixcbiAgICAgIGJ1aWxkczoge30sXG4gICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICB3YXRjaDogZmFsc2UsXG4gICAgICB0ZXN0OiAvXFwuKGp8dClzeD8kLyxcblxuICAgICAgLyogYmVnaW4gc2luZ2xlIGJ1aWxkIG9ubHkgKi9cbiAgICAgIG91dHB1dDogJ2V4dC1yZWFjdCcsXG4gICAgICB0b29sa2l0OiAnbW9kZXJuJyxcbiAgICAgIHBhY2thZ2VzOiBudWxsLFxuICAgICAgcGFja2FnZURpcnM6IFtdLFxuICAgICAgb3ZlcnJpZGVzOiBbXSxcbiAgICAgIGFzeW5jaHJvbm91czogZmFsc2UsXG4gICAgICBwcm9kdWN0aW9uOiBmYWxzZSxcbiAgICAgIG1hbmlmZXN0RXh0cmFjdG9yOiBleHRyYWN0RnJvbUpTWCxcbiAgICAgIHRyZWVTaGFraW5nOiBmYWxzZVxuICAgICAgLyogZW5kIHNpbmdsZSBidWlsZCBvbmx5ICovXG4gICAgfVxuICB9XG5cbiAgc3VjY2VlZE1vZHVsZShjb21waWxhdGlvbiwgbW9kdWxlKSB7XG4gICAgdGhpcy5jdXJyZW50RmlsZSA9IG1vZHVsZS5yZXNvdXJjZTtcbiAgICBpZiAobW9kdWxlLnJlc291cmNlICYmIG1vZHVsZS5yZXNvdXJjZS5tYXRjaCh0aGlzLnRlc3QpICYmICFtb2R1bGUucmVzb3VyY2UubWF0Y2goL25vZGVfbW9kdWxlcy8pICYmICFtb2R1bGUucmVzb3VyY2UubWF0Y2goYC9leHQtcmVhY3Qke3JlYWN0VmVyc2lvbn0vYCkpIHtcbiAgICAgIGNvbnN0IGRvUGFyc2UgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzW3RoaXMuY3VycmVudEZpbGVdID0gW1xuICAgICAgICAgIC4uLih0aGlzLmRlcGVuZGVuY2llc1t0aGlzLmN1cnJlbnRGaWxlXSB8fCBbXSksXG4gICAgICAgICAgLi4udGhpcy5tYW5pZmVzdEV4dHJhY3Rvcihtb2R1bGUuX3NvdXJjZS5fdmFsdWUsIGNvbXBpbGF0aW9uLCBtb2R1bGUsIHJlYWN0VmVyc2lvbilcbiAgICAgICAgXVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgICAgZG9QYXJzZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHsgZG9QYXJzZSgpOyB9IGNhdGNoIChlKSBcbiAgICAgICAgeyBcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdcXG5lcnJvciBwYXJzaW5nICcgKyB0aGlzLmN1cnJlbnRGaWxlKTsgXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlKTsgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGVhY2ggYnVpbGQgY29uZmlnIGZvciBtaXNzaW5nL2ludmFsaWQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVpbGRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGJ1aWxkIFRoZSBidWlsZCBjb25maWdcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF92YWxpZGF0ZUJ1aWxkQ29uZmlnKG5hbWUsIGJ1aWxkKSB7XG4gICAgbGV0IHsgc2RrLCBwcm9kdWN0aW9uIH0gPSBidWlsZDtcblxuICAgIGlmIChwcm9kdWN0aW9uKSB7XG4gICAgICBidWlsZC50cmVlU2hha2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChzZGspIHtcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhzZGspKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBTREsgZm91bmQgYXQgJHtwYXRoLnJlc29sdmUoc2RrKX0uICBEaWQgeW91IGZvciBnZXQgdG8gbGluay9jb3B5IHlvdXIgRXh0IEpTIFNESyB0byB0aGF0IGxvY2F0aW9uP2ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9hZGRSZWFjdG9yUGFja2FnZShidWlsZClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgICBidWlsZC5zZGsgPSBwYXRoLmRpcm5hbWUocmVzb2x2ZSgnQGV4dGpzL2V4dC1yZWFjdCcsIHsgYmFzZWRpcjogcHJvY2Vzcy5jd2QoKSB9KSlcbiAgICAgICAgICBidWlsZC5wYWNrYWdlRGlycyA9IFsuLi4oYnVpbGQucGFja2FnZURpcnMgfHwgW10pLCBwYXRoLmRpcm5hbWUoYnVpbGQuc2RrKV07XG4gICAgICAgICAgYnVpbGQucGFja2FnZXMgPSBidWlsZC5wYWNrYWdlcyB8fCB0aGlzLl9maW5kUGFja2FnZXMoYnVpbGQuc2RrKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEBleHRqcy9leHQtcmVhY3Qgbm90IGZvdW5kLiAgWW91IGNhbiBpbnN0YWxsIGl0IHdpdGggXCJucG0gaW5zdGFsbCAtLXNhdmUgQGV4dGpzL2V4dC1yZWFjdFwiIG9yLCBpZiB5b3UgaGF2ZSBhIGxvY2FsIGNvcHkgb2YgdGhlIFNESywgc3BlY2lmeSB0aGUgcGF0aCB0byBpdCB1c2luZyB0aGUgXCJzZGtcIiBvcHRpb24gaW4gYnVpbGQgXCIke25hbWV9LlwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHJlYWN0b3IgcGFja2FnZSBpZiBwcmVzZW50IGFuZCB0aGUgdG9vbGtpdCBpcyBtb2Rlcm5cbiAgICogQHBhcmFtIHtPYmplY3R9IGJ1aWxkIFxuICAgKi9cbiAgX2FkZFJlYWN0b3JQYWNrYWdlKGJ1aWxkKSB7XG4gICAgaWYgKGJ1aWxkLnRvb2xraXQgPT09ICdjbGFzc2ljJykgcmV0dXJuO1xuXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJ1aWxkLnNkaywgJ2V4dCcsICdtb2Rlcm4nLCAncmVhY3RvcicpKSB8fCAgLy8gcmVwb1xuICAgICAgICBmcy5leGlzdHNTeW5jKHBhdGguam9pbihidWlsZC5zZGssICdtb2Rlcm4nLCAncmVhY3RvcicpKSkgeyAvLyBwcm9kdWN0aW9uIGJ1aWxkXG5cbiAgICAgICAgaWYgKCFidWlsZC5wYWNrYWdlcykge1xuICAgICAgICAgICAgYnVpbGQucGFja2FnZXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1aWxkLnBhY2thZ2VzLnB1c2goJ3JlYWN0b3InKTtcbiAgICB9XG59XG5cbiAgLy8gLyoqXG4gIC8vICAqIEFkZHMgdGhlIEV4dFJlYWN0IHBhY2thZ2UgaWYgcHJlc2VudCBhbmQgdGhlIHRvb2xraXQgaXMgbW9kZXJuXG4gIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBidWlsZCBcbiAgLy8gICovXG4gIC8vIF9hZGRFeHRSZWFjdFBhY2thZ2UoYnVpbGQpIHtcbiAgLy8gICBpZiAoYnVpbGQudG9vbGtpdCA9PT0gJ2NsYXNzaWMnKSByZXR1cm47XG4gIC8vICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJ1aWxkLnNkaywgJ2V4dCcsICdtb2Rlcm4nLCAncmVhY3QnKSkgfHwgIC8vIHJlcG9cbiAgLy8gICAgIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJ1aWxkLnNkaywgJ21vZGVybicsICdyZWFjdCcpKSkgeyAvLyBwcm9kdWN0aW9uIGJ1aWxkXG4gIC8vICAgICBpZiAoIWJ1aWxkLnBhY2thZ2VzKSB7XG4gIC8vICAgICAgIGJ1aWxkLnBhY2thZ2VzID0gW107XG4gIC8vICAgICB9XG4gIC8vICAgICBidWlsZC5wYWNrYWdlcy5wdXNoKCdyZWFjdCcpO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIG5hbWVzIG9mIGFsbCBFeHRSZWFjdCBwYWNrYWdlcyBpbiB0aGUgc2FtZSBwYXJlbnQgZGlyZWN0b3J5IGFzIGV4dC1yZWFjdCAodHlwaWNhbGx5IG5vZGVfbW9kdWxlcy9Ac2VuY2hhKVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2RrIFBhdGggdG8gZXh0LXJlYWN0XG4gICAqIEByZXR1cm4ge1N0cmluZ1tdfVxuICAgKi9cbiAgX2ZpbmRQYWNrYWdlcyhzZGspIHtcbiAgICBjb25zdCBtb2R1bGVzRGlyID0gcGF0aC5qb2luKHNkaywgJy4uJyk7XG4gICAgcmV0dXJuIGZzLnJlYWRkaXJTeW5jKG1vZHVsZXNEaXIpXG4gICAgICAvLyBGaWx0ZXIgb3V0IGRpcmVjdG9yaWVzIHdpdGhvdXQgJ3BhY2thZ2UuanNvbidcbiAgICAgIC5maWx0ZXIoZGlyID0+IGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKG1vZHVsZXNEaXIsIGRpciwgJ3BhY2thZ2UuanNvbicpKSlcbiAgICAgIC8vIEdlbmVyYXRlIGFycmF5IG9mIHBhY2thZ2UgbmFtZXNcbiAgICAgIC5tYXAoZGlyID0+IHtcbiAgICAgICAgICBjb25zdCBwYWNrYWdlSW5mbyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihtb2R1bGVzRGlyLCBkaXIsICdwYWNrYWdlLmpzb24nKSkpO1xuICAgICAgICAgIC8vIERvbid0IGluY2x1ZGUgdGhlbWUgdHlwZSBwYWNrYWdlcy5cbiAgICAgICAgICBpZihwYWNrYWdlSW5mby5zZW5jaGEgJiYgcGFja2FnZUluZm8uc2VuY2hhLnR5cGUgIT09ICd0aGVtZScpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhY2thZ2VJbmZvLnNlbmNoYS5uYW1lO1xuICAgICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAvLyBSZW1vdmUgYW55IHVuZGVmaW5lZHMgZnJvbSBtYXBcbiAgICAgIC5maWx0ZXIobmFtZSA9PiBuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBzZW5jaGEgY21kIGV4ZWN1dGFibGVcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgX2dldFNlbmNoQ21kUGF0aCgpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyB1c2UgQGV4dGpzL3NlbmNoYS1jbWQgZnJvbSBub2RlX21vZHVsZXNcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJ0BleHRqcy9zZW5jaGEtY21kJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBhdHRlbXB0IHRvIHVzZSBnbG9iYWxseSBpbnN0YWxsZWQgU2VuY2hhIENtZFxuICAgICAgICByZXR1cm4gJ3NlbmNoYSc7XG4gICAgfVxufVxufVxuXG5cblxuXG4gICAgICAvLyBpZiAodGhpcy53YXRjaCkge1xuICAgICAgLy8gICBpZiAoIXdhdGNoaW5nKSB7XG4gICAgICAvLyAgICAgd2F0Y2hpbmcgPSBnYXRoZXJFcnJvcnMoZm9yayhzZW5jaGEsIFsnYW50JywgJ3dhdGNoJ10sIHsgY3dkOiBvdXRwdXQsIHNpbGVudDogdHJ1ZSB9KSk7XG4gICAgICAvLyAgICAgd2F0Y2hpbmcuc3RkZXJyLnBpcGUocHJvY2Vzcy5zdGRlcnIpO1xuICAgICAgLy8gICAgIHdhdGNoaW5nLnN0ZG91dC5waXBlKHByb2Nlc3Muc3Rkb3V0KTtcbiAgICAgIC8vICAgICB3YXRjaGluZy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgIC8vICAgICAgIGlmIChkYXRhICYmIGRhdGEudG9TdHJpbmcoKS5tYXRjaCgvV2FpdGluZyBmb3IgY2hhbmdlc1xcLlxcLlxcLi8pKSB7XG4gICAgICAvLyAgICAgICAgIG9uQnVpbGREb25lKClcbiAgICAgIC8vICAgICAgIH1cbiAgICAgIC8vICAgICB9KVxuICAgICAgLy8gICAgIHdhdGNoaW5nLm9uKCdleGl0Jywgb25CdWlsZERvbmUpXG4gICAgICAvLyAgIH1cbiAgICAgIC8vICAgaWYgKCFjbWRSZWJ1aWxkTmVlZGVkKSB7XG4gICAgICAvLyAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdFeHQgcmVidWlsZCBOT1QgbmVlZGVkJylcbiAgICAgIC8vICAgICBvbkJ1aWxkRG9uZSgpXG4gICAgICAvLyAgIH1cbiAgICAgIC8vICAgZWxzZSB7XG4gICAgICAvLyAgICAgLy9yZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ0V4dCByZWJ1aWxkIElTIG5lZWRlZCcpXG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0gXG4gICAgICAvLyBlbHNlIHtcbiAgICAgIC8vICAgY29uc3QgYnVpbGQgPSBnYXRoZXJFcnJvcnMoZm9yayhzZW5jaGEsIFsnYW50JywgJ2J1aWxkJ10sIHsgc3RkaW86ICdpbmhlcml0JywgZW5jb2Rpbmc6ICd1dGYtOCcsIGN3ZDogb3V0cHV0LCBzaWxlbnQ6IGZhbHNlIH0pKTtcbiAgICAgIC8vICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdzZW5jaGEgYW50IGJ1aWxkJylcbiAgICAgIC8vICAgaWYoYnVpbGQuc3Rkb3V0KSB7IGJ1aWxkLnN0ZG91dC5waXBlKHByb2Nlc3Muc3Rkb3V0KSB9XG4gICAgICAvLyAgIGlmKGJ1aWxkLnN0ZGVycikgeyBidWlsZC5zdGRlcnIucGlwZShwcm9jZXNzLnN0ZGVycikgfVxuICAgICAgLy8gICBidWlsZC5vbignZXhpdCcsIG9uQnVpbGREb25lKTtcbiAgICAgIC8vIH1cblxuXG5cbi8vIGNvbnN0IGdhdGhlckVycm9yczIgPSAoY21kKSA9PiB7XG4vLyAgIGlmIChjbWQuc3Rkb3V0KSB7XG4vLyAgICAgY21kLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4ge1xuLy8gICAgICAgY29uc3QgbWVzc2FnZSA9IGRhdGEudG9TdHJpbmcoKTtcbi8vICAgICAgIGlmIChtZXNzYWdlLm1hdGNoKC9eXFxbRVJSXFxdLykpIHtcbi8vICAgICAgICAgY21kRXJyb3JzLnB1c2gobWVzc2FnZS5yZXBsYWNlKC9eXFxbRVJSXFxdIC9naSwgJycpKTtcbi8vICAgICAgIH1cbi8vICAgICB9KVxuLy8gICB9XG4vLyAgIHJldHVybiBjbWQ7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGdhdGhlckVycm9ycyAoY21kKSB7XG4vLyAgIGlmIChjbWQuc3Rkb3V0KSB7XG4vLyAgICAgY21kLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4ge1xuLy8gICAgICAgY29uc3QgbWVzc2FnZSA9IGRhdGEudG9TdHJpbmcoKTtcbi8vICAgICAgIGlmIChtZXNzYWdlLm1hdGNoKC9eXFxbRVJSXFxdLykpIHtcbi8vICAgICAgICAgY21kRXJyb3JzLnB1c2gobWVzc2FnZS5yZXBsYWNlKC9eXFxbRVJSXFxdIC9naSwgJycpKTtcbi8vICAgICAgIH1cbi8vICAgICB9KVxuLy8gICB9XG4vLyAgIHJldHVybiBjbWRcbi8vIH1cblxuXG5cblxuXG5cbi8vIGZyb20gdGhpcy5lbWl0XG4gICAgLy8gdGhlIGZvbGxvd2luZyBpcyBuZWVkZWQgZm9yIGh0bWwtd2VicGFjay1wbHVnaW4gdG8gaW5jbHVkZSA8c2NyaXB0PiBhbmQgPGxpbms+IHRhZ3MgZm9yIEV4dFJlYWN0XG4gICAgLy8gY29uc29sZS5sb2coJ2NvbXBpbGF0aW9uJylcbiAgICAvLyBjb25zb2xlLmxvZygnKioqKioqKipjb21waWxhdGlvbi5jaHVua3NbMF0nKVxuICAgIC8vIGNvbnNvbGUubG9nKGNvbXBpbGF0aW9uLmNodW5rc1swXS5pZClcbiAgICAvLyBjb25zb2xlLmxvZyhwYXRoLmpvaW4odGhpcy5vdXRwdXQsICdleHQuanMnKSlcbiAgICAvLyBjb25zdCBqc0NodW5rID0gY29tcGlsYXRpb24uYWRkQ2h1bmsoYCR7dGhpcy5vdXRwdXR9LWpzYCk7XG4gICAgLy8ganNDaHVuay5oYXNSdW50aW1lID0ganNDaHVuay5pc0luaXRpYWwgPSAoKSA9PiB0cnVlO1xuICAgIC8vIGpzQ2h1bmsuZmlsZXMucHVzaChwYXRoLmpvaW4odGhpcy5vdXRwdXQsICdleHQuanMnKSk7XG4gICAgLy8ganNDaHVuay5maWxlcy5wdXNoKHBhdGguam9pbih0aGlzLm91dHB1dCwgJ2V4dC5jc3MnKSk7XG4gICAgLy8ganNDaHVuay5pZCA9ICdhYWFhcCc7IC8vIHRoaXMgZm9yY2VzIGh0bWwtd2VicGFjay1wbHVnaW4gdG8gaW5jbHVkZSBleHQuanMgZmlyc3RcbiAgICAvLyBjb25zb2xlLmxvZygnKioqKioqKipjb21waWxhdGlvbi5jaHVua3NbMV0nKVxuICAgIC8vIGNvbnNvbGUubG9nKGNvbXBpbGF0aW9uLmNodW5rc1sxXS5pZClcblxuICAgIC8vaWYgKHRoaXMuYXN5bmNocm9ub3VzKSBjYWxsYmFjaygpO1xuLy8gICAgY29uc29sZS5sb2coY2FsbGJhY2spXG5cbi8vIGlmIChpc1dlYnBhY2s0KSB7XG4vLyAgIGNvbnNvbGUubG9nKHBhdGguam9pbih0aGlzLm91dHB1dCwgJ2V4dC5qcycpKVxuLy8gICBjb25zdCBzdGF0cyA9IGZzLnN0YXRTeW5jKHBhdGguam9pbihvdXRwdXRQYXRoLCAnZXh0LmpzJykpXG4vLyAgIGNvbnN0IGZpbGVTaXplSW5CeXRlcyA9IHN0YXRzLnNpemVcbi8vICAgY29tcGlsYXRpb24uYXNzZXRzWydleHQuanMnXSA9IHtcbi8vICAgICBzb3VyY2U6IGZ1bmN0aW9uKCkge3JldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKG91dHB1dFBhdGgsICdleHQuanMnKSl9LFxuLy8gICAgIHNpemU6IGZ1bmN0aW9uKCkge3JldHVybiBmaWxlU2l6ZUluQnl0ZXN9XG4vLyAgIH1cbi8vICAgY29uc29sZS5sb2coY29tcGlsYXRpb24uZW50cnlwb2ludHMpXG5cbi8vICAgdmFyIGZpbGVsaXN0ID0gJ0luIHRoaXMgYnVpbGQ6XFxuXFxuJztcblxuLy8gICAvLyBMb29wIHRocm91Z2ggYWxsIGNvbXBpbGVkIGFzc2V0cyxcbi8vICAgLy8gYWRkaW5nIGEgbmV3IGxpbmUgaXRlbSBmb3IgZWFjaCBmaWxlbmFtZS5cbi8vICAgZm9yICh2YXIgZmlsZW5hbWUgaW4gY29tcGlsYXRpb24uYXNzZXRzKSB7XG4vLyAgICAgZmlsZWxpc3QgKz0gKCctICcrIGZpbGVuYW1lICsnXFxuJyk7XG4vLyAgIH1cblxuLy8gICAvLyBJbnNlcnQgdGhpcyBsaXN0IGludG8gdGhlIHdlYnBhY2sgYnVpbGQgYXMgYSBuZXcgZmlsZSBhc3NldDpcbi8vICAgY29tcGlsYXRpb24uYXNzZXRzWydmaWxlbGlzdC5tZCddID0ge1xuLy8gICAgIHNvdXJjZSgpIHtcbi8vICAgICAgIHJldHVybiBmaWxlbGlzdDtcbi8vICAgICB9LFxuLy8gICAgIHNpemUoKSB7XG4vLyAgICAgICByZXR1cm4gZmlsZWxpc3QubGVuZ3RoO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuXG5cbiAgICAvLyBpZiAoY29tcGlsZXIuaG9va3MpIHtcbiAgICAvLyAgICAgLy8gaW4gJ2V4dHJlYWN0LWNvbXBpbGF0aW9uJ1xuICAgIC8vICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9qYWtldHJlbnQvaHRtbC13ZWJwYWNrLXRlbXBsYXRlXG4gICAgLy8gICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL2phbnRpbW9uL2h0bWwtd2VicGFjay1wbHVnaW4jXG4gICAgLy8gICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgbmVlZGVkIGZvciBodG1sLXdlYnBhY2stcGx1Z2luIHRvIGluY2x1ZGUgPHNjcmlwdD4gYW5kIDxsaW5rPiB0YWdzIGZvciBFeHRSZWFjdFxuICAgIC8vICAgICBjb21waWxlci5ob29rcy5odG1sV2VicGFja1BsdWdpbkJlZm9yZUh0bWxHZW5lcmF0aW9uLnRhcEFzeW5jKFxuICAgIC8vICAgICAgICdleHRyZWFjdC1odG1sZ2VuZXJhdGlvbicsXG4gICAgLy8gICAgICAgKGRhdGEsIGNiKSA9PiB7XG4gICAgLy8gICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dHJlYWN0LWh0bWxnZW5lcmF0aW9uJylcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhLmFzc2V0cy5qcy5sZW5ndGgnKVxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coZGF0YS5hc3NldHMuanMubGVuZ3RoKVxuICAgIC8vICAgICAgICAgZGF0YS5hc3NldHMuanMudW5zaGlmdCgnZXh0LXJlYWN0L2V4dC5qcycpXG4gICAgLy8gICAgICAgICBkYXRhLmFzc2V0cy5jc3MudW5zaGlmdCgnZXh0LXJlYWN0L2V4dC5jc3MnKVxuICAgIC8vICAgICAgICAgY2IobnVsbCwgZGF0YSlcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIClcbiAgICAvLyAgIH1cblxuIl19