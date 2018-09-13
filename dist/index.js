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
            data.assets.js.unshift(this.output + '/ext.js');
            data.assets.css.unshift(this.output + '/ext.css');
          } else {
            data.assets.js.unshift(_path.default.join(compilation.outputOptions.publicPath, this.output, '/ext.js'));
            data.assets.css.unshift(_path.default.join(compilation.outputOptions.publicPath, this.output, '/ext.css'));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZWFjdFZlcnNpb24iLCJyZWFjdFZlcnNpb25GdWxsIiwid2F0Y2hpbmciLCJhcHAiLCJjaGFsayIsImdyZWVuIiwibW9kdWxlIiwiZXhwb3J0cyIsIkV4dFJlYWN0V2VicGFja1BsdWdpbiIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsImZpcnN0VGltZSIsImNvdW50IiwicGtnIiwiZnMiLCJleGlzdHNTeW5jIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZGVwZW5kZW5jaWVzIiwicmVhY3QiLCJpczE2IiwiaW5jbHVkZXMiLCJleHRSZWFjdFJjIiwiZ2V0RGVmYXVsdE9wdGlvbnMiLCJidWlsZHMiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiYnVpbGRPcHRpb25zIiwiZXh0IiwibmFtZSIsIl92YWxpZGF0ZUJ1aWxkQ29uZmlnIiwiYXNzaWduIiwiY3VycmVudEZpbGUiLCJtYW5pZmVzdCIsIndhdGNoUnVuIiwid2F0Y2giLCJhcHBseSIsImNvbXBpbGVyIiwid2VicGFja1ZlcnNpb24iLCJ1bmRlZmluZWQiLCJpc1dlYnBhY2s0IiwiaG9va3MiLCJyZWFkbGluZSIsImN1cnNvclRvIiwicHJvY2VzcyIsInN0ZG91dCIsImNvbnNvbGUiLCJsb2ciLCJtZSIsImFzeW5jaHJvbm91cyIsInRhcEFzeW5jIiwiY2IiLCJ0YXAiLCJwbHVnaW4iLCJhZGRUb01hbmlmZXN0IiwiY2FsbCIsImZpbGUiLCJzdGF0ZSIsInJlc291cmNlIiwiZSIsImVycm9yIiwiY29tcGlsYXRpb24iLCJkYXRhIiwic3VjY2VlZE1vZHVsZSIsIm5vcm1hbE1vZHVsZUZhY3RvcnkiLCJwYXJzZXIiLCJodG1sV2VicGFja1BsdWdpbkJlZm9yZUh0bWxHZW5lcmF0aW9uIiwib3V0cHV0T3B0aW9ucyIsInB1YmxpY1BhdGgiLCJhc3NldHMiLCJqcyIsInVuc2hpZnQiLCJvdXRwdXQiLCJjc3MiLCJwYXRoIiwiam9pbiIsImVtaXQiLCJjYWxsYmFjayIsImRvbmUiLCJtb2R1bGVzIiwiY2h1bmtzIiwicmVkdWNlIiwiYSIsImIiLCJjb25jYXQiLCJkZXBzIiwiYnVpbGQiLCJvdXRwdXRQYXRoIiwiZGV2U2VydmVyIiwiY29udGVudEJhc2UiLCJjbWRFcnJvcnMiLCJwcm9taXNlIiwiX2J1aWxkRXh0QnVuZGxlIiwidG9vbGtpdCIsInRoZW1lIiwicGFja2FnZXMiLCJwYWNrYWdlRGlycyIsInNkayIsIm92ZXJyaWRlcyIsInNhc3MiLCJyZXNvdXJjZXMiLCJzZW5jaGEiLCJfZ2V0U2VuY2hDbWRQYXRoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJvbkJ1aWxkRG9uZSIsIkVycm9yIiwidXNlclBhY2thZ2VzIiwicHVzaCIsIndyaXRlRmlsZVN5bmMiLCJjb21wcmVzcyIsInByb2R1Y3Rpb24iLCJwYXJtcyIsImN3ZCIsInNpbGVudCIsInN0ZGlvIiwiZW5jb2RpbmciLCJ2ZXJib3NlIiwiZW52IiwiRVhUUkVBQ1RfVkVSQk9TRSIsInRoZW4iLCJyZWFzb24iLCJwb3J0IiwiZGVidWciLCJ0ZXN0IiwibWFuaWZlc3RFeHRyYWN0b3IiLCJleHRyYWN0RnJvbUpTWCIsInRyZWVTaGFraW5nIiwibWF0Y2giLCJkb1BhcnNlIiwiX3NvdXJjZSIsIl92YWx1ZSIsIl9hZGRSZWFjdG9yUGFja2FnZSIsImRpcm5hbWUiLCJiYXNlZGlyIiwiX2ZpbmRQYWNrYWdlcyIsIm1vZHVsZXNEaXIiLCJyZWFkZGlyU3luYyIsImZpbHRlciIsImRpciIsIm1hcCIsInBhY2thZ2VJbmZvIiwidHlwZSIsInJlcXVpcmUiXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUdBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFmQSxJQUFJQSxZQUFZLEdBQUcsQ0FBbkI7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxFQUF2QjtBQVlBLElBQUlDLFFB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNKO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHSTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0ICdAYmFiZWwvcG9seWZpbGwnO1xudmFyIHJlYWN0VmVyc2lvbiA9IDBcbnZhciByZWFjdFZlcnNpb25GdWxsID0gJydcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBzeW5jIGFzIG1rZGlycCB9IGZyb20gJ21rZGlycCc7XG5pbXBvcnQgeyBleGVjdXRlQXN5bmMgfSBmcm9tICcuL2V4ZWN1dGVBc3luYydcbmltcG9ydCBleHRyYWN0RnJvbUpTWCBmcm9tICcuL2V4dHJhY3RGcm9tSlNYJztcbmltcG9ydCB7IHN5bmMgYXMgcmltcmFmIH0gZnJvbSAncmltcmFmJztcbmltcG9ydCB7IGJ1aWxkWE1MLCBjcmVhdGVBcHBKc29uLCBjcmVhdGVXb3Jrc3BhY2VKc29uIH0gZnJvbSAnLi9hcnRpZmFjdHMnO1xuaW1wb3J0IHsgY3JlYXRlSlNET01FbnZpcm9ubWVudCB9IGZyb20gJy4vYXJ0aWZhY3RzJztcbmltcG9ydCB7IGdlbmVyYXRlIH0gZnJvbSAnYXN0cmluZyc7XG5pbXBvcnQgeyBzeW5jIGFzIHJlc29sdmUgfSBmcm9tICdyZXNvbHZlJztcbmxldCB3YXRjaGluZyA9IGZhbHNlO1xuY29uc3QgYXBwID0gYCR7Y2hhbGsuZ3JlZW4oJ+KEuSDvvaJleHTvvaM6Jyl9IGV4dC1yZWFjdC13ZWJwYWNrLXBsdWdpbjogYDtcbmltcG9ydCAqIGFzIHJlYWRsaW5lIGZyb20gJ3JlYWRsaW5lJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEV4dFJlYWN0V2VicGFja1BsdWdpbiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdFtdfSBidWlsZHNcbiAgICogQHBhcmFtIHtCb29sZWFufSBbZGVidWc9ZmFsc2VdIFNldCB0byB0cnVlIHRvIHByZXZlbnQgY2xlYW51cCBvZiBidWlsZCB0ZW1wb3JhcnkgYnVpbGQgYXJ0aWZhY3RzIHRoYXQgbWlnaHQgYmUgaGVscGZ1bCBpbiB0cm91Ymxlc2hvb3RpbmcgaXNzdWVzLlxuICAgKiBkZXByZWNhdGVkIEBwYXJhbSB7U3RyaW5nfSBzZGsgVGhlIGZ1bGwgcGF0aCB0byB0aGUgRXh0UmVhY3QgU0RLXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdG9vbGtpdD0nbW9kZXJuJ10gXCJtb2Rlcm5cIiBvciBcImNsYXNzaWNcIlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdGhlbWUgVGhlIG5hbWUgb2YgdGhlIEV4dFJlYWN0IHRoZW1lIHBhY2thZ2UgdG8gdXNlLCBmb3IgZXhhbXBsZSBcInRoZW1lLW1hdGVyaWFsXCJcbiAgICogQHBhcmFtIHtTdHJpbmdbXX0gcGFja2FnZXMgQW4gYXJyYXkgb2YgRXh0UmVhY3QgcGFja2FnZXMgdG8gaW5jbHVkZVxuICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBvdmVycmlkZXMgQW4gYXJyYXkgd2l0aCB0aGUgcGF0aHMgb2YgZGlyZWN0b3JpZXMgb3IgZmlsZXMgdG8gc2VhcmNoLiBBbnkgY2xhc3Nlc1xuICAgKiBkZWNsYXJlZCBpbiB0aGVzZSBsb2NhdGlvbnMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHJlcXVpcmVkIGFuZCBpbmNsdWRlZCBpbiB0aGUgYnVpbGQuXG4gICAqIElmIGFueSBmaWxlIGRlZmluZXMgYW4gRXh0UmVhY3Qgb3ZlcnJpZGUgKHVzaW5nIEV4dC5kZWZpbmUgd2l0aCBhbiBcIm92ZXJyaWRlXCIgcHJvcGVydHkpLFxuICAgKiB0aGF0IG92ZXJyaWRlIHdpbGwgaW4gZmFjdCBvbmx5IGJlIGluY2x1ZGVkIGluIHRoZSBidWlsZCBpZiB0aGUgdGFyZ2V0IGNsYXNzIHNwZWNpZmllZFxuICAgKiBpbiB0aGUgXCJvdmVycmlkZVwiIHByb3BlcnR5IGlzIGFsc28gaW5jbHVkZWQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvdXRwdXQgVGhlIHBhdGggdG8gZGlyZWN0b3J5IHdoZXJlIHRoZSBFeHRSZWFjdCBidW5kbGUgc2hvdWxkIGJlIHdyaXR0ZW5cbiAgICogQHBhcmFtIHtCb29sZWFufSBhc3luY2hyb25vdXMgU2V0IHRvIHRydWUgdG8gcnVuIFNlbmNoYSBDbWQgYnVpbGRzIGFzeW5jaHJvbm91c2x5LiBUaGlzIG1ha2VzIHRoZSB3ZWJwYWNrIGJ1aWxkIGZpbmlzaCBtdWNoIGZhc3RlciwgYnV0IHRoZSBhcHAgbWF5IG5vdCBsb2FkIGNvcnJlY3RseSBpbiB5b3VyIGJyb3dzZXIgdW50aWwgU2VuY2hhIENtZCBpcyBmaW5pc2hlZCBidWlsZGluZyB0aGUgRXh0UmVhY3QgYnVuZGxlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJvZHVjdGlvbiBTZXQgdG8gdHJ1ZSBmb3IgcHJvZHVjdGlvbiBidWlsZHMuICBUaGlzIHRlbGwgU2VuY2hhIENtZCB0byBjb21wcmVzcyB0aGUgZ2VuZXJhdGVkIEpTIGJ1bmRsZS5cbiAgICogQHBhcmFtIHtCb29sZWFufSB0cmVlU2hha2luZyBTZXQgdG8gZmFsc2UgdG8gZGlzYWJsZSB0cmVlIHNoYWtpbmcgaW4gZGV2ZWxvcG1lbnQgYnVpbGRzLiAgVGhpcyBtYWtlcyBpbmNyZW1lbnRhbCByZWJ1aWxkcyBmYXN0ZXIgYXMgYWxsIEV4dFJlYWN0IGNvbXBvbmVudHMgYXJlIGluY2x1ZGVkIGluIHRoZSBleHQuanMgYnVuZGxlIGluIHRoZSBpbml0aWFsIGJ1aWxkIGFuZCB0aHVzIHRoZSBidW5kbGUgZG9lcyBub3QgbmVlZCB0byBiZSByZWJ1aWx0IGFmdGVyIGVhY2ggY2hhbmdlLiBEZWZhdWx0cyB0byB0cnVlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gc2FzcyBTYXNzIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcy5cbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc291cmNlcyBFeHRyYSByZXNvdXJjZXMgdG8gYmUgY29waWVkIGludG8gdGhlIHJlc291cmNlIGZvbGRlciBhcyBzcGVjaWZpZWQgaW4gdGhlIFwicmVzb3VyY2VzXCIgcHJvcGVydHkgb2YgdGhlIFwib3V0cHV0XCIgb2JqZWN0LiBGb2xkZXJzIHNwZWNpZmllZCBpbiB0aGlzIGxpc3Qgd2lsbCBiZSBkZWVwbHkgY29waWVkLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMuZmlyc3RUaW1lID0gdHJ1ZVxuICAgIHRoaXMuY291bnQgPSAwXG4gICAgLy9jYW4gYmUgaW4gZGV2ZGVwZW5kZW5jaWVzIC0gYWNjb3VudCBmb3IgdGhpczogcmVhY3Q6IFwiMTUuMTYuMFwiXG4gICAgdmFyIHBrZyA9IChmcy5leGlzdHNTeW5jKCdwYWNrYWdlLmpzb24nKSAmJiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygncGFja2FnZS5qc29uJywgJ3V0Zi04JykpIHx8IHt9KVxuICAgIHJlYWN0VmVyc2lvbkZ1bGwgPSBwa2cuZGVwZW5kZW5jaWVzLnJlYWN0XG4gICAgdmFyIGlzMTYgPSByZWFjdFZlcnNpb25GdWxsLmluY2x1ZGVzKFwiMTZcIilcbiAgICBpZiAoaXMxNikgeyByZWFjdFZlcnNpb24gPSAxNiB9XG4gICAgZWxzZSB7IHJlYWN0VmVyc2lvbiA9IDE1IH1cbiAgICB0aGlzLnJlYWN0VmVyc2lvbiA9IHJlYWN0VmVyc2lvblxuICAgIHRoaXMucmVhY3RWZXJzaW9uRnVsbCA9IHJlYWN0VmVyc2lvbkZ1bGxcbiAgICBjb25zdCBleHRSZWFjdFJjID0gKGZzLmV4aXN0c1N5bmMoJy5leHQtcmVhY3RyYycpICYmIEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKCcuZXh0LXJlYWN0cmMnLCAndXRmLTgnKSkgfHwge30pXG4gICAgb3B0aW9ucyA9IHsgLi4udGhpcy5nZXREZWZhdWx0T3B0aW9ucygpLCAuLi5vcHRpb25zLCAuLi5leHRSZWFjdFJjIH1cbiAgICBjb25zdCB7IGJ1aWxkcyB9ID0gb3B0aW9uc1xuICAgIGlmIChPYmplY3Qua2V5cyhidWlsZHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgeyBidWlsZHMsIC4uLmJ1aWxkT3B0aW9ucyB9ID0gb3B0aW9uc1xuICAgICAgYnVpbGRzLmV4dCA9IGJ1aWxkT3B0aW9uc1xuICAgIH1cbiAgICBmb3IgKGxldCBuYW1lIGluIGJ1aWxkcykge1xuICAgICAgdGhpcy5fdmFsaWRhdGVCdWlsZENvbmZpZyhuYW1lLCBidWlsZHNbbmFtZV0pXG4gICAgfVxuICAgIE9iamVjdC5hc3NpZ24odGhpcywge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGN1cnJlbnRGaWxlOiBudWxsLFxuICAgICAgbWFuaWZlc3Q6IG51bGwsXG4gICAgICBkZXBlbmRlbmNpZXM6IFtdXG4gICAgfSlcbiAgfVxuXG4gIHdhdGNoUnVuKCkge1xuICAgIHRoaXMud2F0Y2ggPSB0cnVlXG4gIH1cblxuICBhcHBseShjb21waWxlcikge1xuICAgIGlmICh0aGlzLndlYnBhY2tWZXJzaW9uID09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaXNXZWJwYWNrNCA9IGNvbXBpbGVyLmhvb2tzO1xuICAgICAgaWYgKGlzV2VicGFjazQpIHt0aGlzLndlYnBhY2tWZXJzaW9uID0gJ0lTIHdlYnBhY2sgNCd9XG4gICAgICBlbHNlIHt0aGlzLndlYnBhY2tWZXJzaW9uID0gJ05PVCB3ZWJwYWNrIDQnfVxuICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdyZWFjdFZlcnNpb246ICcgKyB0aGlzLnJlYWN0VmVyc2lvbkZ1bGwgKyAnLCAnICsgdGhpcy53ZWJwYWNrVmVyc2lvbilcbiAgICB9XG4gICAgY29uc3QgbWUgPSB0aGlzXG5cbiAgICBpZiAoY29tcGlsZXIuaG9va3MpIHtcbiAgICAgIGlmICh0aGlzLmFzeW5jaHJvbm91cykge1xuICAgICAgICBjb21waWxlci5ob29rcy53YXRjaFJ1bi50YXBBc3luYygnZXh0LXJlYWN0LXdhdGNoLXJ1biAoYXN5bmMpJywgKHdhdGNoaW5nLCBjYikgPT4ge1xuICAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LXdhdGNoLXJ1biAoYXN5bmMpJylcbiAgICAgICAgICB0aGlzLndhdGNoUnVuKClcbiAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3Mud2F0Y2hSdW4udGFwKCdleHQtcmVhY3Qtd2F0Y2gtcnVuJywgKHdhdGNoaW5nKSA9PiB7XG4gICAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3Qtd2F0Y2gtcnVuJylcbiAgICAgICAgICB0aGlzLndhdGNoUnVuKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlci5wbHVnaW4oJ3dhdGNoLXJ1bicsICh3YXRjaGluZywgY2IpID0+IHtcbiAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICd3YXRjaC1ydW4nKVxuICAgICAgICB0aGlzLndhdGNoUnVuKClcbiAgICAgICAgY2IoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIHRoZSBjb2RlIGZvciB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9uIGNhbGwgdG8gdGhlIG1hbmlmZXN0LmpzIGZpbGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FsbCBBIGZ1bmN0aW9uIGNhbGwgQVNUIG5vZGUuXG4gICAgICovXG4gICAgY29uc3QgYWRkVG9NYW5pZmVzdCA9IGZ1bmN0aW9uKGNhbGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLnN0YXRlLm1vZHVsZS5yZXNvdXJjZTtcbiAgICAgICAgbWUuZGVwZW5kZW5jaWVzW2ZpbGVdID0gWyAuLi4obWUuZGVwZW5kZW5jaWVzW2ZpbGVdIHx8IFtdKSwgZ2VuZXJhdGUoY2FsbCkgXTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyAke2ZpbGV9YCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChjb21waWxlci5ob29rcykge1xuICAgICAgY29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24udGFwKCdleHQtcmVhY3QtY29tcGlsYXRpb24nLCAoY29tcGlsYXRpb24sZGF0YSkgPT4ge1xuICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dC1yZWFjdC1jb21waWxhdGlvbicpXG4gICAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLnN1Y2NlZWRNb2R1bGUudGFwKCdleHQtcmVhY3Qtc3VjY2VlZC1tb2R1bGUnLCAobW9kdWxlKSA9PiB7XG4gICAgICAgICAgdGhpcy5zdWNjZWVkTW9kdWxlKGNvbXBpbGF0aW9uLCBtb2R1bGUpXG4gICAgICAgIH0pXG5cbiAgICAgICAgZGF0YS5ub3JtYWxNb2R1bGVGYWN0b3J5LnBsdWdpbihcInBhcnNlclwiLCBmdW5jdGlvbihwYXJzZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAvLyBleHRyYWN0IHh0eXBlcyBhbmQgY2xhc3NlcyBmcm9tIEV4dC5jcmVhdGUgY2FsbHNcbiAgICAgICAgICBwYXJzZXIucGx1Z2luKCdjYWxsIEV4dC5jcmVhdGUnLCBhZGRUb01hbmlmZXN0KTtcbiAgICAgICAgICAvLyBjb3B5IEV4dC5yZXF1aXJlIGNhbGxzIHRvIHRoZSBtYW5pZmVzdC4gIFRoaXMgYWxsb3dzIHRoZSB1c2VycyB0byBleHBsaWNpdGx5IHJlcXVpcmUgYSBjbGFzcyBpZiB0aGUgcGx1Z2luIGZhaWxzIHRvIGRldGVjdCBpdC5cbiAgICAgICAgICBwYXJzZXIucGx1Z2luKCdjYWxsIEV4dC5yZXF1aXJlJywgYWRkVG9NYW5pZmVzdCk7XG4gICAgICAgICAgLy8gY29weSBFeHQuZGVmaW5lIGNhbGxzIHRvIHRoZSBtYW5pZmVzdC4gIFRoaXMgYWxsb3dzIHVzZXJzIHRvIHdyaXRlIHN0YW5kYXJkIEV4dFJlYWN0IGNsYXNzZXMuXG4gICAgICAgICAgcGFyc2VyLnBsdWdpbignY2FsbCBFeHQuZGVmaW5lJywgYWRkVG9NYW5pZmVzdCk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgY29tcGlsYXRpb24uaG9va3MuaHRtbFdlYnBhY2tQbHVnaW5CZWZvcmVIdG1sR2VuZXJhdGlvbi50YXBBc3luYygnZXh0LXJlYWN0LWh0bWxnZW5lcmF0aW9uJywoZGF0YSwgY2IpID0+IHtcblxuICAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0LXJlYWN0LWh0bWxnZW5lcmF0aW9uJylcbiAgICAgICAgICAvL3JlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyBjb21waWxhdGlvbi5vdXRwdXRPcHRpb25zLnB1YmxpY1BhdGgpXG4gICAgICAgICAgaWYgKGNvbXBpbGF0aW9uLm91dHB1dE9wdGlvbnMucHVibGljUGF0aCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRhdGEuYXNzZXRzLmpzLnVuc2hpZnQodGhpcy5vdXRwdXQgKyAnL2V4dC5qcycpXG4gICAgICAgICAgICBkYXRhLmFzc2V0cy5jc3MudW5zaGlmdCh0aGlzLm91dHB1dCArICcvZXh0LmNzcycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YS5hc3NldHMuanMudW5zaGlmdChwYXRoLmpvaW4oY29tcGlsYXRpb24ub3V0cHV0T3B0aW9ucy5wdWJsaWNQYXRoLCB0aGlzLm91dHB1dCwgJy9leHQuanMnKSlcbiAgICAgICAgICAgIGRhdGEuYXNzZXRzLmNzcy51bnNoaWZ0KHBhdGguam9pbihjb21waWxhdGlvbi5vdXRwdXRPcHRpb25zLnB1YmxpY1BhdGgsIHRoaXMub3V0cHV0LCAnL2V4dC5jc3MnKSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY2IobnVsbCwgZGF0YSlcbiAgICAgICAgfSlcblxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlci5wbHVnaW4oJ2NvbXBpbGF0aW9uJywgKGNvbXBpbGF0aW9uLCBkYXRhKSA9PiB7XG4gICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnY29tcGlsYXRpb24nKVxuICAgICAgICBjb21waWxhdGlvbi5wbHVnaW4oJ3N1Y2NlZWQtbW9kdWxlJywgKG1vZHVsZSkgPT4ge1xuICAgICAgICAgIHRoaXMuc3VjY2VlZE1vZHVsZShjb21waWxhdGlvbiwgbW9kdWxlKVxuICAgICAgICB9KVxuICAgICAgICBkYXRhLm5vcm1hbE1vZHVsZUZhY3RvcnkucGx1Z2luKFwicGFyc2VyXCIsIGZ1bmN0aW9uKHBhcnNlciwgb3B0aW9ucykge1xuICAgICAgICAgIC8vIGV4dHJhY3QgeHR5cGVzIGFuZCBjbGFzc2VzIGZyb20gRXh0LmNyZWF0ZSBjYWxsc1xuICAgICAgICAgIHBhcnNlci5wbHVnaW4oJ2NhbGwgRXh0LmNyZWF0ZScsIGFkZFRvTWFuaWZlc3QpO1xuICAgICAgICAgIC8vIGNvcHkgRXh0LnJlcXVpcmUgY2FsbHMgdG8gdGhlIG1hbmlmZXN0LiAgVGhpcyBhbGxvd3MgdGhlIHVzZXJzIHRvIGV4cGxpY2l0bHkgcmVxdWlyZSBhIGNsYXNzIGlmIHRoZSBwbHVnaW4gZmFpbHMgdG8gZGV0ZWN0IGl0LlxuICAgICAgICAgIHBhcnNlci5wbHVnaW4oJ2NhbGwgRXh0LnJlcXVpcmUnLCBhZGRUb01hbmlmZXN0KTtcbiAgICAgICAgICAvLyBjb3B5IEV4dC5kZWZpbmUgY2FsbHMgdG8gdGhlIG1hbmlmZXN0LiAgVGhpcyBhbGxvd3MgdXNlcnMgdG8gd3JpdGUgc3RhbmRhcmQgRXh0UmVhY3QgY2xhc3Nlcy5cbiAgICAgICAgICBwYXJzZXIucGx1Z2luKCdjYWxsIEV4dC5kZWZpbmUnLCBhZGRUb01hbmlmZXN0KTtcbiAgICAgICAgfSlcblxuICAgICAgfSlcbiAgICB9XG5cbi8vKmVtaXQgLSBvbmNlIGFsbCBtb2R1bGVzIGFyZSBwcm9jZXNzZWQsIGNyZWF0ZSB0aGUgb3B0aW1pemVkIEV4dFJlYWN0IGJ1aWxkLlxuICAgIGlmIChjb21waWxlci5ob29rcykge1xuICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3MuZW1pdC50YXBBc3luYygnZXh0LXJlYWN0LWVtaXQgKGFzeW5jKScsIChjb21waWxhdGlvbiwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dC1yZWFjdC1lbWl0ICAoYXN5bmMpJylcbiAgICAgICAgICB0aGlzLmVtaXQoY29tcGlsZXIsIGNvbXBpbGF0aW9uLCBjYWxsYmFjaylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb21waWxlci5ob29rcy5lbWl0LnRhcCgnZXh0LXJlYWN0LWVtaXQnLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ2V4dC1yZWFjdC1lbWl0JylcbiAgICAgICAgICB0aGlzLmVtaXQoY29tcGlsZXIsIGNvbXBpbGF0aW9uKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbXBpbGVyLnBsdWdpbignZW1pdCcsIChjb21waWxhdGlvbiwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdlbWl0JylcbiAgICAgICAgdGhpcy5lbWl0KGNvbXBpbGVyLCBjb21waWxhdGlvbiwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21waWxlci5ob29rcykge1xuICAgICAgaWYgKHRoaXMuYXN5bmNocm9ub3VzKSB7XG4gICAgICAgIGNvbXBpbGVyLmhvb2tzLmRvbmUudGFwQXN5bmMoJ2V4dC1yZWFjdC1kb25lIChhc3luYyknLCAoY29tcGlsYXRpb24sIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtZG9uZSAoYXN5bmMpJylcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkgXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXN5bmNocm9ub3VzKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NhbGxpbmcgY2FsbGJhY2sgZm9yIGV4dC1yZWFjdC1lbWl0ICAoYXN5bmMpJylcbiAgICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb21waWxlci5ob29rcy5kb25lLnRhcCgnZXh0LXJlYWN0LWRvbmUnLCAoKSA9PiB7XG4gICAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtZG9uZScpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW1pdChjb21waWxlciwgY29tcGlsYXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGlzV2VicGFjazQgPSBjb21waWxhdGlvbi5ob29rcztcbiAgICB2YXIgbW9kdWxlcyA9IFtdXG4gICAgaWYgKGlzV2VicGFjazQpIHtcbiAgICAgIGlzV2VicGFjazQgPSB0cnVlXG5cblxuXG5cbi8vICAgICAgIG1vZHVsZXMgPSBjb21waWxhdGlvbi5jaHVua3MucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiLl9tb2R1bGVzKSwgW10pXG4vLyAvLyAgICAgIGNvbnNvbGUubG9nKG1vZHVsZXMpXG4vLyAgICAgICB2YXIgaSA9IDBcbi8vICAgICAgIHZhciB0aGVNb2R1bGUgPSAnJ1xuLy8gICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIG1vZHVsZXMpIHtcbi8vICAgICAgICAgaWYgKGkgPT0gMCkge1xuLy8gICAgICAgICAgIHRoZU1vZHVsZSA9IG1vZHVsZVxuLy8gICAgICAgICAgIGkrK1xuLy8gICAgICAgICB9XG4vLyAvL2NvbnN0IGRlcHMgPSB0aGlzLmRlcGVuZGVuY2llc1ttb2R1bGUucmVzb3VyY2VdXG4vLyAgICAgICAgIC8vY29uc29sZS5sb2coZGVwcylcbi8vICAgICAgICAgLy9pZiAoZGVwcykgc3RhdGVtZW50cyA9IHN0YXRlbWVudHMuY29uY2F0KGRlcHMpO1xuLy8gICAgICAgfVxuLy8gICAgICAgdmFyIHRoZVBhdGggPSBwYXRoLmpvaW4oY29tcGlsZXIub3V0cHV0UGF0aCwgJ21vZHVsZS50eHQnKVxuLy8gICAgICAgLy9jb25zb2xlLmxvZyh0aGVQYXRoKVxuXG4vLyAgICAgICAvL3ZhciBvID0ge307XG4vLyAgICAgICAvL28ubyA9IHRoZU1vZHVsZTtcbi8vICAgICAgIC8vY29uc29sZS5sb2codGhlTW9kdWxlWzBdLmNvbnRleHQpXG4gICAgICBcbi8vICAgICAgIHZhciBjYWNoZSA9IFtdO1xuLy8gICAgICAgdmFyIGggPSBKU09OLnN0cmluZ2lmeSh0aGVNb2R1bGUsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbi8vICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuLy8gICAgICAgICAgICAgICBpZiAoY2FjaGUuaW5kZXhPZih2YWx1ZSkgIT09IC0xKSB7XG4vLyAgICAgICAgICAgICAgICAgICAvLyBDaXJjdWxhciByZWZlcmVuY2UgZm91bmQsIGRpc2NhcmQga2V5XG4vLyAgICAgICAgICAgICAgICAgICByZXR1cm47XG4vLyAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgLy8gU3RvcmUgdmFsdWUgaW4gb3VyIGNvbGxlY3Rpb25cbi8vICAgICAgICAgICAgICAgY2FjaGUucHVzaCh2YWx1ZSk7XG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICAgIHJldHVybiB2YWx1ZTtcbi8vICAgICAgIH0pO1xuLy8gICAgICAgY2FjaGUgPSBudWxsOyAvLyBFbmFibGUgZ2FyYmFnZSBjb2xsZWN0aW9uXG4vLyAgICAgICAvL2ZzLndyaXRlRmlsZVN5bmMoIHRoZVBhdGgsIGgsICd1dGY4JylcblxuXG5cblxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlzV2VicGFjazQgPSBmYWxzZVxuXG5cblxuICAgICAgbW9kdWxlcyA9IGNvbXBpbGF0aW9uLmNodW5rcy5yZWR1Y2UoKGEsIGIpID0+IGEuY29uY2F0KGIubW9kdWxlcyksIFtdKVxuXG4gICAgICBmb3IgKGxldCBtb2R1bGUgb2YgbW9kdWxlcykge1xuICAgICAgICBjb25zdCBkZXBzID0gdGhpcy5kZXBlbmRlbmNpZXNbbW9kdWxlLnJlc291cmNlXVxuICAgICAgICBjb25zb2xlLmxvZyhkZXBzKVxuICAgICAgICAvL2lmIChkZXBzKSBzdGF0ZW1lbnRzID0gc3RhdGVtZW50cy5jb25jYXQoZGVwcyk7XG4gICAgICB9XG5cblxuXG5cbiAgICB9XG4gICAgY29uc3QgYnVpbGQgPSB0aGlzLmJ1aWxkc1tPYmplY3Qua2V5cyh0aGlzLmJ1aWxkcylbMF1dO1xuICAgIGxldCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKGNvbXBpbGVyLm91dHB1dFBhdGgsIHRoaXMub3V0cHV0KTtcbiAgICAvLyB3ZWJwYWNrLWRldi1zZXJ2ZXIgb3ZlcndyaXRlcyB0aGUgb3V0cHV0UGF0aCB0byBcIi9cIiwgc28gd2UgbmVlZCB0byBwcmVwZW5kIGNvbnRlbnRCYXNlXG4gICAgaWYgKGNvbXBpbGVyLm91dHB1dFBhdGggPT09ICcvJyAmJiBjb21waWxlci5vcHRpb25zLmRldlNlcnZlcikge1xuICAgICAgb3V0cHV0UGF0aCA9IHBhdGguam9pbihjb21waWxlci5vcHRpb25zLmRldlNlcnZlci5jb250ZW50QmFzZSwgb3V0cHV0UGF0aCk7XG4gICAgfVxuICAgIHZhciBjbWRFcnJvcnMgPSBbXVxuXG4gICAgbGV0IHByb21pc2UgPSB0aGlzLl9idWlsZEV4dEJ1bmRsZShjb21waWxhdGlvbiwgY21kRXJyb3JzLCBvdXRwdXRQYXRoLCBidWlsZClcblxuICAgIGF3YWl0IHByb21pc2VcbiBcbiAgICBpZiAodGhpcy53YXRjaCAmJiB0aGlzLmNvdW50ID09IDAgJiYgY21kRXJyb3JzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAvLyB2YXIgdXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHRoaXMucG9ydFxuICAgICAgLy8gcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdleHQtcmVhY3QtZW1pdCAtIG9wZW4gYnJvd3NlciBhdCAnICsgdXJsKVxuICAgICAgLy8gdGhpcy5jb3VudCsrXG4gICAgICAvLyBjb25zdCBvcG4gPSByZXF1aXJlKCdvcG4nKVxuICAgICAgLy8gb3BuKHVybClcbiAgICB9XG4gICAgaWYgKGNhbGxiYWNrICE9IG51bGwpeyBjYWxsYmFjaygpIH1cbiAgfVxuXG4gIC8qKlxuICAgLyoqXG4gICAgKiBCdWlsZHMgYSBtaW5pbWFsIHZlcnNpb24gb2YgdGhlIEV4dFJlYWN0IGZyYW1ld29yayBiYXNlZCBvbiB0aGUgY2xhc3NlcyB1c2VkXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVpbGRcbiAgICAqIEBwYXJhbSB7TW9kdWxlW119IG1vZHVsZXMgd2VicGFjayBtb2R1bGVzXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gb3V0cHV0IFRoZSBwYXRoIHRvIHdoZXJlIHRoZSBmcmFtZXdvcmsgYnVpbGQgc2hvdWxkIGJlIHdyaXR0ZW5cbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdG9vbGtpdD0nbW9kZXJuJ10gXCJtb2Rlcm5cIiBvciBcImNsYXNzaWNcIlxuICAgICogQHBhcmFtIHtTdHJpbmd9IG91dHB1dCBUaGUgcGF0aCB0byB0aGUgZGlyZWN0b3J5IHRvIGNyZWF0ZSB3aGljaCB3aWxsIGNvbnRhaW4gdGhlIGpzIGFuZCBjc3MgYnVuZGxlc1xuICAgICogQHBhcmFtIHtTdHJpbmd9IHRoZW1lIFRoZSBuYW1lIG9mIHRoZSBFeHRSZWFjdCB0aGVtZSBwYWNrYWdlIHRvIHVzZSwgZm9yIGV4YW1wbGUgXCJ0aGVtZS1tYXRlcmlhbFwiXG4gICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBwYWNrYWdlcyBBbiBhcnJheSBvZiBFeHRSZWFjdCBwYWNrYWdlcyB0byBpbmNsdWRlXG4gICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBwYWNrYWdlRGlycyBEaXJlY3RvcmllcyBjb250YWluaW5nIHBhY2thZ2VzXG4gICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBvdmVycmlkZXMgQW4gYXJyYXkgb2YgbG9jYXRpb25zIGZvciBvdmVycmlkZXNcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZGsgVGhlIGZ1bGwgcGF0aCB0byB0aGUgRXh0UmVhY3QgU0RLXG4gICAgKiBAcGFyYW0ge09iamVjdH0gc2FzcyBTYXNzIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXNvdXJjZXMgRXh0cmEgcmVzb3VyY2VzIHRvIGJlIGNvcGllZCBpbnRvIHRoZSByZXNvdXJjZSBmb2xkZXIgYXMgc3BlY2lmaWVkIGluIHRoZSBcInJlc291cmNlc1wiIHByb3BlcnR5IG9mIHRoZSBcIm91dHB1dFwiIG9iamVjdC4gRm9sZGVycyBzcGVjaWZpZWQgaW4gdGhpcyBsaXN0IHdpbGwgYmUgZGVlcGx5IGNvcGllZC5cbiAgICAqIEBwcml2YXRlXG4gICAgKi9cbiAgX2J1aWxkRXh0QnVuZGxlKGNvbXBpbGF0aW9uLCBjbWRFcnJvcnMsIG91dHB1dCwgeyB0b29sa2l0PSdtb2Rlcm4nLCB0aGVtZSwgcGFja2FnZXM9W10sIHBhY2thZ2VEaXJzPVtdLCBzZGssIG92ZXJyaWRlcywgc2FzcywgcmVzb3VyY2VzIH0pIHtcbiAgICBsZXQgc2VuY2hhID0gdGhpcy5fZ2V0U2VuY2hDbWRQYXRoKClcbiAgICB0aGVtZSA9IHRoZW1lIHx8ICh0b29sa2l0ID09PSAnY2xhc3NpYycgPyAndGhlbWUtdHJpdG9uJyA6ICd0aGVtZS1tYXRlcmlhbCcpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgb25CdWlsZERvbmUgPSAoKSA9PiB7XG4gICAgICAgIGlmIChjbWRFcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihjbWRFcnJvcnMuam9pbihcIlwiKSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdXNlclBhY2thZ2VzID0gcGF0aC5qb2luKCcuJywgb3V0cHV0LCAncGFja2FnZXMnKVxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModXNlclBhY2thZ2VzKSkge1xuICAgICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ0FkZGluZyBQYWNrYWdlIEZvbGRlcjogJyArIHVzZXJQYWNrYWdlcylcbiAgICAgICAgcGFja2FnZURpcnMucHVzaCh1c2VyUGFja2FnZXMpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmZpcnN0VGltZSkge1xuICAgICAgICByaW1yYWYob3V0cHV0KVxuICAgICAgICBta2RpcnAob3V0cHV0KVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXQsICdidWlsZC54bWwnKSwgYnVpbGRYTUwoeyBjb21wcmVzczogdGhpcy5wcm9kdWN0aW9uIH0pLCAndXRmOCcpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKG91dHB1dCwgJ2pzZG9tLWVudmlyb25tZW50LmpzJyksIGNyZWF0ZUpTRE9NRW52aXJvbm1lbnQoKSwgJ3V0ZjgnKVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXQsICdhcHAuanNvbicpLCBjcmVhdGVBcHBKc29uKHsgdGhlbWUsIHBhY2thZ2VzLCB0b29sa2l0LCBvdmVycmlkZXMsIHBhY2thZ2VEaXJzLCBzYXNzLCByZXNvdXJjZXMgfSksICd1dGY4JylcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0LCAnd29ya3NwYWNlLmpzb24nKSwgY3JlYXRlV29ya3NwYWNlSnNvbihzZGssIHBhY2thZ2VEaXJzLCBvdXRwdXQpLCAndXRmOCcpXG4gICAgICB9XG4gICAgICB0aGlzLmZpcnN0VGltZSA9IGZhbHNlXG5cbiAgICAgIGxldCBqc1xuICAgICAganMgPSAnRXh0LnJlcXVpcmUoXCJFeHQuKlwiKSdcblxuICAgICAgLy8gaWYgKHRoaXMudHJlZVNoYWtpbmcpIHtcbiAgICAgIC8vICAgLy9sZXQgc3RhdGVtZW50cyA9IFsnRXh0LnJlcXVpcmUoW1wiRXh0LmFwcC5BcHBsaWNhdGlvblwiLCBcIkV4dC5Db21wb25lbnRcIiwgXCJFeHQuV2lkZ2V0XCIsIFwiRXh0LmxheW91dC5GaXRcIiwgXCJFeHQucmVhY3QuVHJhbnNpdGlvblwiLCBcIkV4dC5yZWFjdC5SZW5kZXJlckNlbGxcIl0pJ107IC8vIGZvciBzb21lIHJlYXNvbiBjb21tYW5kIGRvZXNuJ3QgbG9hZCBjb21wb25lbnQgd2hlbiBvbmx5IHBhbmVsIGlzIHJlcXVpcmVkXG4gICAgICAvLyAgIGxldCBzdGF0ZW1lbnRzID0gWydFeHQucmVxdWlyZShbXCJFeHQuYXBwLkFwcGxpY2F0aW9uXCIsIFwiRXh0LkNvbXBvbmVudFwiLCBcIkV4dC5XaWRnZXRcIiwgXCJFeHQubGF5b3V0LkZpdFwiLCBcIkV4dC5yZWFjdC5UcmFuc2l0aW9uXCJdKSddOyAvLyBmb3Igc29tZSByZWFzb24gY29tbWFuZCBkb2Vzbid0IGxvYWQgY29tcG9uZW50IHdoZW4gb25seSBwYW5lbCBpcyByZXF1aXJlZFxuICAgICAgLy8gICAvLyBpZiAocGFja2FnZXMuaW5kZXhPZigncmVhY3RvJykgIT09IC0xKSB7XG4gICAgICAvLyAgIC8vICAgc3RhdGVtZW50cy5wdXNoKCdFeHQucmVxdWlyZShcIkV4dC5yZWFjdC5SZW5kZXJlckNlbGxcIiknKTtcbiAgICAgIC8vICAgLy8gfVxuICAgICAgLy8gICAvL21qZ1xuICAgICAgLy8gICBmb3IgKGxldCBtb2R1bGUgb2YgbW9kdWxlcykge1xuICAgICAgLy8gICAgIGNvbnN0IGRlcHMgPSB0aGlzLmRlcGVuZGVuY2llc1ttb2R1bGUucmVzb3VyY2VdO1xuICAgICAgLy8gICAgIGlmIChkZXBzKSBzdGF0ZW1lbnRzID0gc3RhdGVtZW50cy5jb25jYXQoZGVwcyk7XG4gICAgICAvLyAgIH1cbiAgICAgIC8vICAganMgPSBzdGF0ZW1lbnRzLmpvaW4oJztcXG4nKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIGpzID0gJ0V4dC5yZXF1aXJlKFwiRXh0LipcIiknO1xuICAgICAgLy8gfVxuXG5cblxuICAgICAgLy8gaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHNkaywgJ2V4dCcpKSkge1xuICAgICAgLy8gICAvLyBsb2NhbCBjaGVja291dCBvZiB0aGUgU0RLIHJlcG9cbiAgICAgIC8vICAgcGFja2FnZURpcnMucHVzaChwYXRoLmpvaW4oJ2V4dCcsICdwYWNrYWdlcycpKTtcbiAgICAgIC8vICAgc2RrID0gcGF0aC5qb2luKHNkaywgJ2V4dCcpO1xuICAgICAgLy8gfVxuXG5cblxuICAgICAgdmFyIHBhcm1zID0gW11cbiAgICAgIGlmICh0aGlzLndhdGNoKSB7IHBhcm1zID0gWydhcHAnLCAnd2F0Y2gnXSB9XG4gICAgICBlbHNlIHsgcGFybXMgPSBbJ2FwcCcsICdidWlsZCddIH1cblxuICAgICAgaWYgKHRoaXMubWFuaWZlc3QgPT09IG51bGwgfHwganMgIT09IHRoaXMubWFuaWZlc3QpIHtcbiAgICAgICAgdGhpcy5tYW5pZmVzdCA9IGpzXG4gICAgICAgIC8vcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICd0cmVlIHNoYWtpbmc6ICcgKyB0aGlzLnRyZWVTaGFraW5nKVxuICAgICAgICBjb25zdCBtYW5pZmVzdCA9IHBhdGguam9pbihvdXRwdXQsICdtYW5pZmVzdC5qcycpXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMobWFuaWZlc3QsIGpzLCAndXRmOCcpXG4gICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyBgYnVpbGRpbmcgRXh0UmVhY3QgYnVuZGxlIGF0OiAke291dHB1dH1gKVxuXG4gICAgICAgIGlmICh0aGlzLndhdGNoICYmICF3YXRjaGluZyB8fCAhdGhpcy53YXRjaCkge1xuICAgICAgICAgIHZhciBvcHRpb25zID0geyBjd2Q6IG91dHB1dCwgc2lsZW50OiB0cnVlLCBzdGRpbzogJ3BpcGUnLCBlbmNvZGluZzogJ3V0Zi04J31cbiAgICAgICAgICB2YXIgdmVyYm9zZSA9ICdubydcbiAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuRVhUUkVBQ1RfVkVSQk9TRSAgPT0gJ3llcycpIHtcbiAgICAgICAgICAgIHZlcmJvc2UgPSAneWVzJ1xuICAgICAgICAgIH1cbiAgICAgICAgICBleGVjdXRlQXN5bmMoc2VuY2hhLCBwYXJtcywgb3B0aW9ucywgY29tcGlsYXRpb24sIGNtZEVycm9ycywgdmVyYm9zZSkudGhlbiAoXG4gICAgICAgICAgICBmdW5jdGlvbigpIHsgb25CdWlsZERvbmUoKSB9LCBcbiAgICAgICAgICAgIGZ1bmN0aW9uKHJlYXNvbikgeyByZXNvbHZlKHJlYXNvbikgfVxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmVhZGxpbmUuY3Vyc29yVG8ocHJvY2Vzcy5zdGRvdXQsIDApO2NvbnNvbGUubG9nKGFwcCArICdFeHQgcmVidWlsZCBOT1QgbmVlZGVkJylcbiAgICAgICAgb25CdWlsZERvbmUoKVxuICAgICAgfVxuXG4gICAgICAvLyB2YXIgcGFybXNcbiAgICAgIC8vIGlmICh0aGlzLndhdGNoKSB7XG4gICAgICAvLyAgIGlmICghd2F0Y2hpbmcpIHtcbiAgICAgIC8vICAgICBwYXJtcyA9IFsnYXBwJywgJ3dhdGNoJ11cbiAgICAgIC8vICAgfVxuICAgICAgLy8gICAvLyBpZiAoIWNtZFJlYnVpbGROZWVkZWQpIHtcbiAgICAgIC8vICAgLy8gICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ0V4dCByZWJ1aWxkIE5PVCBuZWVkZWQnKVxuICAgICAgLy8gICAvLyAgIG9uQnVpbGREb25lKClcbiAgICAgIC8vICAgLy8gfVxuICAgICAgLy8gfVxuICAgICAgLy8gZWxzZSB7XG4gICAgICAvLyAgIHBhcm1zID0gWydhcHAnLCAnYnVpbGQnXVxuICAgICAgLy8gfVxuICAgICAgLy8gaWYgKGNtZFJlYnVpbGROZWVkZWQpIHtcbiAgICAgIC8vICAgdmFyIG9wdGlvbnMgPSB7IGN3ZDogb3V0cHV0LCBzaWxlbnQ6IHRydWUsIHN0ZGlvOiAncGlwZScsIGVuY29kaW5nOiAndXRmLTgnfVxuICAgICAgLy8gICBleGVjdXRlQXN5bmMoc2VuY2hhLCBwYXJtcywgb3B0aW9ucywgY29tcGlsYXRpb24sIGNtZEVycm9ycykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIC8vICAgICBvbkJ1aWxkRG9uZSgpXG4gICAgICAvLyAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyAgICAgcmVzb2x2ZShyZWFzb24pXG4gICAgICAvLyAgIH0pXG4gICAgICAvLyB9XG5cblxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBjb25maWcgb3B0aW9uc1xuICAgKiBAcHJvdGVjdGVkXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIGdldERlZmF1bHRPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwb3J0OiA4MDE2LFxuICAgICAgYnVpbGRzOiB7fSxcbiAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgIHdhdGNoOiBmYWxzZSxcbiAgICAgIHRlc3Q6IC9cXC4oanx0KXN4PyQvLFxuXG4gICAgICAvKiBiZWdpbiBzaW5nbGUgYnVpbGQgb25seSAqL1xuICAgICAgb3V0cHV0OiAnZXh0LXJlYWN0JyxcbiAgICAgIHRvb2xraXQ6ICdtb2Rlcm4nLFxuICAgICAgcGFja2FnZXM6IG51bGwsXG4gICAgICBwYWNrYWdlRGlyczogW10sXG4gICAgICBvdmVycmlkZXM6IFtdLFxuICAgICAgYXN5bmNocm9ub3VzOiBmYWxzZSxcbiAgICAgIHByb2R1Y3Rpb246IGZhbHNlLFxuICAgICAgbWFuaWZlc3RFeHRyYWN0b3I6IGV4dHJhY3RGcm9tSlNYLFxuICAgICAgdHJlZVNoYWtpbmc6IGZhbHNlXG4gICAgICAvKiBlbmQgc2luZ2xlIGJ1aWxkIG9ubHkgKi9cbiAgICB9XG4gIH1cblxuICBzdWNjZWVkTW9kdWxlKGNvbXBpbGF0aW9uLCBtb2R1bGUpIHtcbiAgICB0aGlzLmN1cnJlbnRGaWxlID0gbW9kdWxlLnJlc291cmNlO1xuICAgIGlmIChtb2R1bGUucmVzb3VyY2UgJiYgbW9kdWxlLnJlc291cmNlLm1hdGNoKHRoaXMudGVzdCkgJiYgIW1vZHVsZS5yZXNvdXJjZS5tYXRjaCgvbm9kZV9tb2R1bGVzLykgJiYgIW1vZHVsZS5yZXNvdXJjZS5tYXRjaChgL2V4dC1yZWFjdCR7cmVhY3RWZXJzaW9ufS9gKSkge1xuICAgICAgY29uc3QgZG9QYXJzZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXNbdGhpcy5jdXJyZW50RmlsZV0gPSBbXG4gICAgICAgICAgLi4uKHRoaXMuZGVwZW5kZW5jaWVzW3RoaXMuY3VycmVudEZpbGVdIHx8IFtdKSxcbiAgICAgICAgICAuLi50aGlzLm1hbmlmZXN0RXh0cmFjdG9yKG1vZHVsZS5fc291cmNlLl92YWx1ZSwgY29tcGlsYXRpb24sIG1vZHVsZSwgcmVhY3RWZXJzaW9uKVxuICAgICAgICBdXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgICBkb1BhcnNlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkgeyBkb1BhcnNlKCk7IH0gY2F0Y2ggKGUpIFxuICAgICAgICB7IFxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1xcbmVycm9yIHBhcnNpbmcgJyArIHRoaXMuY3VycmVudEZpbGUpOyBcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpOyBcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgZWFjaCBidWlsZCBjb25maWcgZm9yIG1pc3NpbmcvaW52YWxpZCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBidWlsZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gYnVpbGQgVGhlIGJ1aWxkIGNvbmZpZ1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3ZhbGlkYXRlQnVpbGRDb25maWcobmFtZSwgYnVpbGQpIHtcbiAgICBsZXQgeyBzZGssIHByb2R1Y3Rpb24gfSA9IGJ1aWxkO1xuXG4gICAgaWYgKHByb2R1Y3Rpb24pIHtcbiAgICAgIGJ1aWxkLnRyZWVTaGFraW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHNkaykge1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHNkaykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIFNESyBmb3VuZCBhdCAke3BhdGgucmVzb2x2ZShzZGspfS4gIERpZCB5b3UgZm9yIGdldCB0byBsaW5rL2NvcHkgeW91ciBFeHQgSlMgU0RLIHRvIHRoYXQgbG9jYXRpb24/YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2FkZFJlYWN0b3JQYWNrYWdlKGJ1aWxkKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICAgIGJ1aWxkLnNkayA9IHBhdGguZGlybmFtZShyZXNvbHZlKCdAZXh0anMvZXh0LXJlYWN0JywgeyBiYXNlZGlyOiBwcm9jZXNzLmN3ZCgpIH0pKVxuICAgICAgICAgIGJ1aWxkLnBhY2thZ2VEaXJzID0gWy4uLihidWlsZC5wYWNrYWdlRGlycyB8fCBbXSksIHBhdGguZGlybmFtZShidWlsZC5zZGspXTtcbiAgICAgICAgICBidWlsZC5wYWNrYWdlcyA9IGJ1aWxkLnBhY2thZ2VzIHx8IHRoaXMuX2ZpbmRQYWNrYWdlcyhidWlsZC5zZGspO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQGV4dGpzL2V4dC1yZWFjdCBub3QgZm91bmQuICBZb3UgY2FuIGluc3RhbGwgaXQgd2l0aCBcIm5wbSBpbnN0YWxsIC0tc2F2ZSBAZXh0anMvZXh0LXJlYWN0XCIgb3IsIGlmIHlvdSBoYXZlIGEgbG9jYWwgY29weSBvZiB0aGUgU0RLLCBzcGVjaWZ5IHRoZSBwYXRoIHRvIGl0IHVzaW5nIHRoZSBcInNka1wiIG9wdGlvbiBpbiBidWlsZCBcIiR7bmFtZX0uXCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgcmVhY3RvciBwYWNrYWdlIGlmIHByZXNlbnQgYW5kIHRoZSB0b29sa2l0IGlzIG1vZGVyblxuICAgKiBAcGFyYW0ge09iamVjdH0gYnVpbGQgXG4gICAqL1xuICBfYWRkUmVhY3RvclBhY2thZ2UoYnVpbGQpIHtcbiAgICBpZiAoYnVpbGQudG9vbGtpdCA9PT0gJ2NsYXNzaWMnKSByZXR1cm47XG5cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGQuc2RrLCAnZXh0JywgJ21vZGVybicsICdyZWFjdG9yJykpIHx8ICAvLyByZXBvXG4gICAgICAgIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGJ1aWxkLnNkaywgJ21vZGVybicsICdyZWFjdG9yJykpKSB7IC8vIHByb2R1Y3Rpb24gYnVpbGRcblxuICAgICAgICBpZiAoIWJ1aWxkLnBhY2thZ2VzKSB7XG4gICAgICAgICAgICBidWlsZC5wYWNrYWdlcyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGQucGFja2FnZXMucHVzaCgncmVhY3RvcicpO1xuICAgIH1cbn1cblxuICAvLyAvKipcbiAgLy8gICogQWRkcyB0aGUgRXh0UmVhY3QgcGFja2FnZSBpZiBwcmVzZW50IGFuZCB0aGUgdG9vbGtpdCBpcyBtb2Rlcm5cbiAgLy8gICogQHBhcmFtIHtPYmplY3R9IGJ1aWxkIFxuICAvLyAgKi9cbiAgLy8gX2FkZEV4dFJlYWN0UGFja2FnZShidWlsZCkge1xuICAvLyAgIGlmIChidWlsZC50b29sa2l0ID09PSAnY2xhc3NpYycpIHJldHVybjtcbiAgLy8gICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGQuc2RrLCAnZXh0JywgJ21vZGVybicsICdyZWFjdCcpKSB8fCAgLy8gcmVwb1xuICAvLyAgICAgZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oYnVpbGQuc2RrLCAnbW9kZXJuJywgJ3JlYWN0JykpKSB7IC8vIHByb2R1Y3Rpb24gYnVpbGRcbiAgLy8gICAgIGlmICghYnVpbGQucGFja2FnZXMpIHtcbiAgLy8gICAgICAgYnVpbGQucGFja2FnZXMgPSBbXTtcbiAgLy8gICAgIH1cbiAgLy8gICAgIGJ1aWxkLnBhY2thZ2VzLnB1c2goJ3JlYWN0Jyk7XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgbmFtZXMgb2YgYWxsIEV4dFJlYWN0IHBhY2thZ2VzIGluIHRoZSBzYW1lIHBhcmVudCBkaXJlY3RvcnkgYXMgZXh0LXJlYWN0ICh0eXBpY2FsbHkgbm9kZV9tb2R1bGVzL0BzZW5jaGEpXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZGsgUGF0aCB0byBleHQtcmVhY3RcbiAgICogQHJldHVybiB7U3RyaW5nW119XG4gICAqL1xuICBfZmluZFBhY2thZ2VzKHNkaykge1xuICAgIGNvbnN0IG1vZHVsZXNEaXIgPSBwYXRoLmpvaW4oc2RrLCAnLi4nKTtcbiAgICByZXR1cm4gZnMucmVhZGRpclN5bmMobW9kdWxlc0RpcilcbiAgICAgIC8vIEZpbHRlciBvdXQgZGlyZWN0b3JpZXMgd2l0aG91dCAncGFja2FnZS5qc29uJ1xuICAgICAgLmZpbHRlcihkaXIgPT4gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4obW9kdWxlc0RpciwgZGlyLCAncGFja2FnZS5qc29uJykpKVxuICAgICAgLy8gR2VuZXJhdGUgYXJyYXkgb2YgcGFja2FnZSBuYW1lc1xuICAgICAgLm1hcChkaXIgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhY2thZ2VJbmZvID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKG1vZHVsZXNEaXIsIGRpciwgJ3BhY2thZ2UuanNvbicpKSk7XG4gICAgICAgICAgLy8gRG9uJ3QgaW5jbHVkZSB0aGVtZSB0eXBlIHBhY2thZ2VzLlxuICAgICAgICAgIGlmKHBhY2thZ2VJbmZvLnNlbmNoYSAmJiBwYWNrYWdlSW5mby5zZW5jaGEudHlwZSAhPT0gJ3RoZW1lJykge1xuICAgICAgICAgICAgICByZXR1cm4gcGFja2FnZUluZm8uc2VuY2hhLm5hbWU7XG4gICAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC8vIFJlbW92ZSBhbnkgdW5kZWZpbmVkcyBmcm9tIG1hcFxuICAgICAgLmZpbHRlcihuYW1lID0+IG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIHNlbmNoYSBjbWQgZXhlY3V0YWJsZVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBfZ2V0U2VuY2hDbWRQYXRoKCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIHVzZSBAZXh0anMvc2VuY2hhLWNtZCBmcm9tIG5vZGVfbW9kdWxlc1xuICAgICAgICByZXR1cm4gcmVxdWlyZSgnQGV4dGpzL3NlbmNoYS1jbWQnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGF0dGVtcHQgdG8gdXNlIGdsb2JhbGx5IGluc3RhbGxlZCBTZW5jaGEgQ21kXG4gICAgICAgIHJldHVybiAnc2VuY2hhJztcbiAgICB9XG59XG59XG5cblxuXG5cbiAgICAgIC8vIGlmICh0aGlzLndhdGNoKSB7XG4gICAgICAvLyAgIGlmICghd2F0Y2hpbmcpIHtcbiAgICAgIC8vICAgICB3YXRjaGluZyA9IGdhdGhlckVycm9ycyhmb3JrKHNlbmNoYSwgWydhbnQnLCAnd2F0Y2gnXSwgeyBjd2Q6IG91dHB1dCwgc2lsZW50OiB0cnVlIH0pKTtcbiAgICAgIC8vICAgICB3YXRjaGluZy5zdGRlcnIucGlwZShwcm9jZXNzLnN0ZGVycik7XG4gICAgICAvLyAgICAgd2F0Y2hpbmcuc3Rkb3V0LnBpcGUocHJvY2Vzcy5zdGRvdXQpO1xuICAgICAgLy8gICAgIHdhdGNoaW5nLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgLy8gICAgICAgaWYgKGRhdGEgJiYgZGF0YS50b1N0cmluZygpLm1hdGNoKC9XYWl0aW5nIGZvciBjaGFuZ2VzXFwuXFwuXFwuLykpIHtcbiAgICAgIC8vICAgICAgICAgb25CdWlsZERvbmUoKVxuICAgICAgLy8gICAgICAgfVxuICAgICAgLy8gICAgIH0pXG4gICAgICAvLyAgICAgd2F0Y2hpbmcub24oJ2V4aXQnLCBvbkJ1aWxkRG9uZSlcbiAgICAgIC8vICAgfVxuICAgICAgLy8gICBpZiAoIWNtZFJlYnVpbGROZWVkZWQpIHtcbiAgICAgIC8vICAgICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ0V4dCByZWJ1aWxkIE5PVCBuZWVkZWQnKVxuICAgICAgLy8gICAgIG9uQnVpbGREb25lKClcbiAgICAgIC8vICAgfVxuICAgICAgLy8gICBlbHNlIHtcbiAgICAgIC8vICAgICAvL3JlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnRXh0IHJlYnVpbGQgSVMgbmVlZGVkJylcbiAgICAgIC8vICAgfVxuICAgICAgLy8gfSBcbiAgICAgIC8vIGVsc2Uge1xuICAgICAgLy8gICBjb25zdCBidWlsZCA9IGdhdGhlckVycm9ycyhmb3JrKHNlbmNoYSwgWydhbnQnLCAnYnVpbGQnXSwgeyBzdGRpbzogJ2luaGVyaXQnLCBlbmNvZGluZzogJ3V0Zi04JywgY3dkOiBvdXRwdXQsIHNpbGVudDogZmFsc2UgfSkpO1xuICAgICAgLy8gICByZWFkbGluZS5jdXJzb3JUbyhwcm9jZXNzLnN0ZG91dCwgMCk7Y29uc29sZS5sb2coYXBwICsgJ3NlbmNoYSBhbnQgYnVpbGQnKVxuICAgICAgLy8gICBpZihidWlsZC5zdGRvdXQpIHsgYnVpbGQuc3Rkb3V0LnBpcGUocHJvY2Vzcy5zdGRvdXQpIH1cbiAgICAgIC8vICAgaWYoYnVpbGQuc3RkZXJyKSB7IGJ1aWxkLnN0ZGVyci5waXBlKHByb2Nlc3Muc3RkZXJyKSB9XG4gICAgICAvLyAgIGJ1aWxkLm9uKCdleGl0Jywgb25CdWlsZERvbmUpO1xuICAgICAgLy8gfVxuXG5cblxuLy8gY29uc3QgZ2F0aGVyRXJyb3JzMiA9IChjbWQpID0+IHtcbi8vICAgaWYgKGNtZC5zdGRvdXQpIHtcbi8vICAgICBjbWQuc3Rkb3V0Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4vLyAgICAgICBjb25zdCBtZXNzYWdlID0gZGF0YS50b1N0cmluZygpO1xuLy8gICAgICAgaWYgKG1lc3NhZ2UubWF0Y2goL15cXFtFUlJcXF0vKSkge1xuLy8gICAgICAgICBjbWRFcnJvcnMucHVzaChtZXNzYWdlLnJlcGxhY2UoL15cXFtFUlJcXF0gL2dpLCAnJykpO1xuLy8gICAgICAgfVxuLy8gICAgIH0pXG4vLyAgIH1cbi8vICAgcmV0dXJuIGNtZDtcbi8vIH1cblxuLy8gZnVuY3Rpb24gZ2F0aGVyRXJyb3JzIChjbWQpIHtcbi8vICAgaWYgKGNtZC5zdGRvdXQpIHtcbi8vICAgICBjbWQuc3Rkb3V0Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4vLyAgICAgICBjb25zdCBtZXNzYWdlID0gZGF0YS50b1N0cmluZygpO1xuLy8gICAgICAgaWYgKG1lc3NhZ2UubWF0Y2goL15cXFtFUlJcXF0vKSkge1xuLy8gICAgICAgICBjbWRFcnJvcnMucHVzaChtZXNzYWdlLnJlcGxhY2UoL15cXFtFUlJcXF0gL2dpLCAnJykpO1xuLy8gICAgICAgfVxuLy8gICAgIH0pXG4vLyAgIH1cbi8vICAgcmV0dXJuIGNtZFxuLy8gfVxuXG5cblxuXG5cblxuLy8gZnJvbSB0aGlzLmVtaXRcbiAgICAvLyB0aGUgZm9sbG93aW5nIGlzIG5lZWRlZCBmb3IgaHRtbC13ZWJwYWNrLXBsdWdpbiB0byBpbmNsdWRlIDxzY3JpcHQ+IGFuZCA8bGluaz4gdGFncyBmb3IgRXh0UmVhY3RcbiAgICAvLyBjb25zb2xlLmxvZygnY29tcGlsYXRpb24nKVxuICAgIC8vIGNvbnNvbGUubG9nKCcqKioqKioqKmNvbXBpbGF0aW9uLmNodW5rc1swXScpXG4gICAgLy8gY29uc29sZS5sb2coY29tcGlsYXRpb24uY2h1bmtzWzBdLmlkKVxuICAgIC8vIGNvbnNvbGUubG9nKHBhdGguam9pbih0aGlzLm91dHB1dCwgJ2V4dC5qcycpKVxuICAgIC8vIGNvbnN0IGpzQ2h1bmsgPSBjb21waWxhdGlvbi5hZGRDaHVuayhgJHt0aGlzLm91dHB1dH0tanNgKTtcbiAgICAvLyBqc0NodW5rLmhhc1J1bnRpbWUgPSBqc0NodW5rLmlzSW5pdGlhbCA9ICgpID0+IHRydWU7XG4gICAgLy8ganNDaHVuay5maWxlcy5wdXNoKHBhdGguam9pbih0aGlzLm91dHB1dCwgJ2V4dC5qcycpKTtcbiAgICAvLyBqc0NodW5rLmZpbGVzLnB1c2gocGF0aC5qb2luKHRoaXMub3V0cHV0LCAnZXh0LmNzcycpKTtcbiAgICAvLyBqc0NodW5rLmlkID0gJ2FhYWFwJzsgLy8gdGhpcyBmb3JjZXMgaHRtbC13ZWJwYWNrLXBsdWdpbiB0byBpbmNsdWRlIGV4dC5qcyBmaXJzdFxuICAgIC8vIGNvbnNvbGUubG9nKCcqKioqKioqKmNvbXBpbGF0aW9uLmNodW5rc1sxXScpXG4gICAgLy8gY29uc29sZS5sb2coY29tcGlsYXRpb24uY2h1bmtzWzFdLmlkKVxuXG4gICAgLy9pZiAodGhpcy5hc3luY2hyb25vdXMpIGNhbGxiYWNrKCk7XG4vLyAgICBjb25zb2xlLmxvZyhjYWxsYmFjaylcblxuLy8gaWYgKGlzV2VicGFjazQpIHtcbi8vICAgY29uc29sZS5sb2cocGF0aC5qb2luKHRoaXMub3V0cHV0LCAnZXh0LmpzJykpXG4vLyAgIGNvbnN0IHN0YXRzID0gZnMuc3RhdFN5bmMocGF0aC5qb2luKG91dHB1dFBhdGgsICdleHQuanMnKSlcbi8vICAgY29uc3QgZmlsZVNpemVJbkJ5dGVzID0gc3RhdHMuc2l6ZVxuLy8gICBjb21waWxhdGlvbi5hc3NldHNbJ2V4dC5qcyddID0ge1xuLy8gICAgIHNvdXJjZTogZnVuY3Rpb24oKSB7cmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0UGF0aCwgJ2V4dC5qcycpKX0sXG4vLyAgICAgc2l6ZTogZnVuY3Rpb24oKSB7cmV0dXJuIGZpbGVTaXplSW5CeXRlc31cbi8vICAgfVxuLy8gICBjb25zb2xlLmxvZyhjb21waWxhdGlvbi5lbnRyeXBvaW50cylcblxuLy8gICB2YXIgZmlsZWxpc3QgPSAnSW4gdGhpcyBidWlsZDpcXG5cXG4nO1xuXG4vLyAgIC8vIExvb3AgdGhyb3VnaCBhbGwgY29tcGlsZWQgYXNzZXRzLFxuLy8gICAvLyBhZGRpbmcgYSBuZXcgbGluZSBpdGVtIGZvciBlYWNoIGZpbGVuYW1lLlxuLy8gICBmb3IgKHZhciBmaWxlbmFtZSBpbiBjb21waWxhdGlvbi5hc3NldHMpIHtcbi8vICAgICBmaWxlbGlzdCArPSAoJy0gJysgZmlsZW5hbWUgKydcXG4nKTtcbi8vICAgfVxuXG4vLyAgIC8vIEluc2VydCB0aGlzIGxpc3QgaW50byB0aGUgd2VicGFjayBidWlsZCBhcyBhIG5ldyBmaWxlIGFzc2V0OlxuLy8gICBjb21waWxhdGlvbi5hc3NldHNbJ2ZpbGVsaXN0Lm1kJ10gPSB7XG4vLyAgICAgc291cmNlKCkge1xuLy8gICAgICAgcmV0dXJuIGZpbGVsaXN0O1xuLy8gICAgIH0sXG4vLyAgICAgc2l6ZSgpIHtcbi8vICAgICAgIHJldHVybiBmaWxlbGlzdC5sZW5ndGg7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5cblxuICAgIC8vIGlmIChjb21waWxlci5ob29rcykge1xuICAgIC8vICAgICAvLyBpbiAnZXh0cmVhY3QtY29tcGlsYXRpb24nXG4gICAgLy8gICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL2pha2V0cmVudC9odG1sLXdlYnBhY2stdGVtcGxhdGVcbiAgICAvLyAgICAgLy9odHRwczovL2dpdGh1Yi5jb20vamFudGltb24vaHRtbC13ZWJwYWNrLXBsdWdpbiNcbiAgICAvLyAgICAgLy8gdGhlIGZvbGxvd2luZyBpcyBuZWVkZWQgZm9yIGh0bWwtd2VicGFjay1wbHVnaW4gdG8gaW5jbHVkZSA8c2NyaXB0PiBhbmQgPGxpbms+IHRhZ3MgZm9yIEV4dFJlYWN0XG4gICAgLy8gICAgIGNvbXBpbGVyLmhvb2tzLmh0bWxXZWJwYWNrUGx1Z2luQmVmb3JlSHRtbEdlbmVyYXRpb24udGFwQXN5bmMoXG4gICAgLy8gICAgICAgJ2V4dHJlYWN0LWh0bWxnZW5lcmF0aW9uJyxcbiAgICAvLyAgICAgICAoZGF0YSwgY2IpID0+IHtcbiAgICAvLyAgICAgICAgIHJlYWRsaW5lLmN1cnNvclRvKHByb2Nlc3Muc3Rkb3V0LCAwKTtjb25zb2xlLmxvZyhhcHAgKyAnZXh0cmVhY3QtaHRtbGdlbmVyYXRpb24nKVxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coJ2RhdGEuYXNzZXRzLmpzLmxlbmd0aCcpXG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmFzc2V0cy5qcy5sZW5ndGgpXG4gICAgLy8gICAgICAgICBkYXRhLmFzc2V0cy5qcy51bnNoaWZ0KCdleHQtcmVhY3QvZXh0LmpzJylcbiAgICAvLyAgICAgICAgIGRhdGEuYXNzZXRzLmNzcy51bnNoaWZ0KCdleHQtcmVhY3QvZXh0LmNzcycpXG4gICAgLy8gICAgICAgICBjYihudWxsLCBkYXRhKVxuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgKVxuICAgIC8vICAgfVxuXG4iXX0=