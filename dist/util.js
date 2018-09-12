"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

//const npmScope = '@sencha'
var chalk = require('chalk');

var fs = require('fs-extra'); //var json = require('comment-json');
//const sencha = require(`${npmScope}/cmd`)


const sencha = require(`@extjs/sencha-cmd`);

const spawnSync = require('child_process').spawnSync; //const spawn = require('child_process').spawn


const crossSpawn = require('cross-spawn');

var prefix = ``;

if (require('os').platform() == 'darwin') {
  prefix = `ℹ ｢ext｣:`;
} else {
  prefix = `i [ext]:`;
}

const app = `${chalk.green(prefix)} ext-build-util:`;
const DEFAULT_SUBSTRS = ['[ERR]', '[WRN]', '[INF] Processing', "[INF] Server", "[INF] Writing content", "[INF] Loading Build", "[INF] Waiting", "[LOG] Fashion waiting"];

exports.senchaCmd = parms => {
  process.stdout.cursorTo(0);
  console.log(app + 'started - sencha ' + parms.toString().replace(/,/g, " ") + '\n');
  spawnSync(sencha, parms, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  process.stdout.cursorTo(0);
  console.log(app + 'completed - sencha ' + parms.toString().replace(/,/g, " "));
};

exports.senchaCmdAsync =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(parms, output, verbose, substrings = DEFAULT_SUBSTRS) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          console.log('here');
          spawnPromise(sencha, parms, {
            stdio: 'pipe',
            encoding: 'utf-8',
            cwd: output
          }, verbose, substrings).then(() => {
            console.log('after spawnPromise');
            return;
          });

        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee, this);
  }));

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var spawnPromise = (command, args, options, verbose, substrings) => {
  var noErrors = true;
  let child;
  let promise = new Promise((resolve, reject) => {
    child = crossSpawn(command, args, options);
    child.on('close', (code, signal) => {
      if (code === 0) {
        if (noErrors) {
          resolve({
            code,
            signal
          });
        } else {
          reject('ext-build errors');
        }
      } else {
        reject('ext-build errors...');
      }
    });
    child.on('error', error => {
      reject(error);
    });

    if (child.stdout) {
      child.stdout.on('data', data => {
        var str = data.toString();
        str = str.replace(/\r?\n|\r/g, " ");

        if (data && data.toString().match(/Waiting for changes\.\.\./)) {
          resolve({});
        }

        if (verbose == 'yes') {
          console.log(`${app}${str}`);
        } else {
          if (substrings.some(function (v) {
            return data.indexOf(v) >= 0;
          })) {
            str = str.replace("[INF]", "");
            str = str.replace(process.cwd(), '');

            if (str.includes("[ERR]")) {
              const err = `${chalk.red("[ERR]")}`;
              str = str.replace("[ERR]", err);
              noErrors = false;
            }

            console.log(`${app}${str}`);
          } // else {//nothing}

        }
      });
    } else {
      console.log(`${app} ${chalk.red('[ERR]')} no stdout`);
    }

    if (child.stderr) {
      child.stderr.on('data', data => {
        var str = data.toString();
        var s = str.replace(/\r?\n|\r/g, " ");
        var strJavaOpts = "Picked up _JAVA_OPTIONS";
        var includes = s.includes(strJavaOpts);

        if (!includes) {
          console.log(`${app} ${chalk.black("[ERR]")} ${s}`);
        }
      });
    } else {
      console.log(`${app} ${chalk.red('[ERR]')} no stderr`);
    }
  });
  promise.child = child;
  return promise;
}; //exports.err = function err(s) { return chalk.red('[ERR] ') + s }
//exports.inf = function inf(s) { return chalk.green('[INF] ') + s }
//exports.wrn = function err(s) { return chalk.yellow('[WRN] ') + s }


exports.errLog = function err(s) {
  console.log(chalk.red('[ERR] ') + s);
};

exports.infLog = function inf(s) {
  console.log(chalk.green('[INF] ') + s);
};

exports.wrnLog = function err(s) {
  console.log(chalk.yellow('[WRN] ') + s);
}; //exports.dbgLog = function dbgLog(s) { if (debug) console.log(chalk.blue('[DBG] ') + s) }


exports.dbgLog = function dbgLog(s) {};

exports.err = function err(s) {
  return chalk.red('[ERR] ') + s;
};

exports.inf = function inf(s) {
  return chalk.green('[INF] ') + s;
};

exports.wrn = function err(s) {
  return chalk.yellow('[WRN] ') + s;
};

exports.dbg = function err(s) {
  return chalk.blue('[DBG] ') + s;
};

var errThrow = function err(s) {
  throw chalk.red('[ERR] ') + s;
};

exports.errThrow = errThrow;

exports.dbgThrow = function err(s) {
  throw chalk.blue('[ERR] ') + s;
};

exports.getAppName = function getAppName(CurrWorkingDir) {
  var appJsonFileName = getAppJson(CurrWorkingDir);

  if (appJsonFileName == '') {
    throw 'Not a Sencha Cmd project - no app.json found';
  }

  var objAppJson = json.parse(fs.readFileSync(appJsonFileName).toString());
  var appName = objAppJson.name;
  return appName;
};

function getAppJson(CurrWorkingDir) {
  var myStringArray = CurrWorkingDir.split('/');
  var arrayLength = myStringArray.length;
  var appJsonFile = '';

  for (var j = arrayLength; j > 0; j--) {
    var dir = '';

    for (var i = 0; i < j; i++) {
      if (myStringArray[i] != '') {
        dir = dir + '/' + myStringArray[i];
      }
    } // var workspaceJson = dir + '/' + 'workspace.json'
    // if (fs.existsSync(workspaceJson)) {
    // 	console.log('yes ' + workspaceJson)
    // }


    var appJson = dir + '/' + 'app.json'; //		console.log(appJson)

    if (fs.existsSync(appJson)) {
      //			console.log('here')
      appJsonFile = appJson;
    }
  }

  return appJsonFile;
}

exports.getSenchaCmdPath = function getSenchaCmdPath(toPath, path) {
  pathVar = process.env.PATH;
  var myStringArray = pathVar.split(':');
  var arrayLength = myStringArray.length;
  var pathSenchaCmd = '';

  for (var i = 0; i < arrayLength; i++) {
    var str = myStringArray[i];
    var n = str.indexOf("Sencha/Cmd");

    if (n != -1) {
      pathSenchaCmd = str;
    }
  } //var other = '/plugins/ext/current'
  //console.log(pathSenchaCmd + other)


  return pathSenchaCmd;
};

exports.handleOutput = child => {
  child.on('exit', function (code, signal) {
    console.log(`child process exited with code ${code} and signal ${signal}`);
  });
  child.stdout.on('data', data => {
    var substrings = DEFAULT_SUBSTRS;

    if (substrings.some(function (v) {
      return data.indexOf(v) >= 0;
    })) {
      var str = data.toString();
      var s = str.replace(/\r?\n|\r/g, " ");
      console.log(`${s}`);
    }
  });
  child.stderr.on('data', data => {
    console.error(`E:${data}`);
  });
  return child;
}; // async executeAsync2(parms) {
//   return new Promise(function(resolve, reject) {
//     var child = spawn(sencha, parms)
//     child.on('exit', function (code, signal) {
//       resolve(0) 
//     })
//     child.stdout.on('data', (data) => {
//       var substrings = ["[INF] Writing xcontent", '[ERR]', '[WRN]', '[INF] Processing', "[INF] Server", "[INF] Loading Build", "[INF] Waiting", "[LOG] Fashion waiting"]
//       if (substrings.some(function(v) { return data.indexOf(v) >= 0; })) { 
//         var str = data.toString()
//         var s = str.replace(/\r?\n|\r/g, " ")
//         var s2 = s.replace("[INF]", "")
//         console.log(`${app} ${s2}`) 
//       }
//     })
//     child.stderr.on('data', (data) => {
//       var str = data.toString()
//       var s = str.replace(/\r?\n|\r/g, " ")
//       console.log(`${app} ${chalk.red("[ERR]")} ${s}`) 
//     })
//   })
// }
// const spawn = require('child_process').spawn;
// var spawn = require('child-process-promise').spawn;
// function executeCommand(cmd, args) {
//     var promise = spawn(cmd, args);
//     var childProcess = promise.childProcess;
//     console.log('[spawn] childProcess.pid: ', childProcess.pid);
//     childProcess.stdout.on('data', function (data) {
//         console.log('[spawn] stdout: ', data.toString());
//     });
//     childProcess.stderr.on('data', function (data) {
//         console.log('[spawn] stderr: ', data.toString());
//     });
//     return promise;
// }
// exports.senchaCmd2 = (parms) => {
//   process.stdout.cursorTo(0);console.log(app + 'started - sencha ' + parms.toString().replace(/,/g , " ") + '\n')
//   await executeCommand(sencha, parms)
//   process.stdout.cursorTo(0);console.log(app + 'completed - sencha ' + parms.toString().replace(/,/g , " "))
// }
// async function executer() {
//     console.log('[MAIN] start');
//     await executeCommand('echo', ['info']);
//     console.log('[MAIN] end');
// }
// executer();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbImNoYWxrIiwicmVxdWlyZSIsImZzIiwic2VuY2hhIiwic3Bhd25TeW5jIiwiY3Jvc3NTcGF3biIsInByZWZpeCIsInBsYXRmb3JtIiwiYXBwIiwiZ3JlZW4iLCJERUZBVUxUX1NVQlNUUlMiLCJleHBvcnRzIiwic2VuY2hhQ21kIiwicGFybXMiLCJwcm9jZXNzIiwic3Rkb3V0IiwiY3Vyc29yVG8iLCJjb25zb2xlIiwibG9nIiwidG9TdHJpbmciLCJyZXBsYWNlIiwic3RkaW8iLCJlbmNvZGluZyIsInNlbmNoYUNtZEFzeW5jIiwib3V0cHV0IiwidmVyYm9zZSIsInN1YnN0cmluZ3MiLCJzcGF3blByb21pc2UiLCJjd2QiLCJ0aGVuIiwiY29tbWFuZCIsImFyZ3MiLCJvcHRpb25zIiwibm9FcnJvcnMiLCJjaGlsZCIsInByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm9uIiwiY29kZSIsInNpZ25hbCIsImVycm9yIiwiZGF0YSIsInN0ciIsIm1hdGNoIiwic29tZSIsInYiLCJpbmRleE9mIiwiaW5jbHVkZXMiLCJlcnIiLCJyZWQiLCJzdGRlcnIiLCJzIiwic3RySmF2YU9wdHMiLCJibGFjayIsImVyckxvZyIsImluZkxvZyIsImluZiIsIndybkxvZyIsInllbGxvdyIsImRiZ0xvZyIsIndybiIsImRiZyIsImJsdWUiLCJlcnJUaHJvdyIsImRiZ1Rocm93IiwiZ2V0QXBwTmFtZSIsIkN1cnJXb3JraW5nRGlyIiwiYXBwSnNvbkZpbGVOYW1lIiwiZ2V0QXBwSnNvbiIsIm9iakFwcEpzb24iLCJqc29uIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJhcHBOYW1lIiwibmFtZSIsIm15U3RyaW5nQXJyYXkiLCJzcGxpdCIsImFycmF5TGVuZ3RoIiwibGVuZ3RoIiwiYXBwSnNvbkZpbGUiLCJqIiwiZGlyIiwiaSIsImFwcEpzb24iLCJleGlzdHNTeW5jIiwiZ2V0U2VuY2hhQ21kUGF0aCIsInRvUGF0aCIsInBhdGgiLCJwYXRoVmFyIiwiZW52IiwiUEFUSCIsInBhdGhTZW5jaGFDbWQiLCJuIiwiaGFuZGxlT3V0cHV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBLElBQUlBLEtBQUssR0FBR0MsT0FBTyxDQUFDLE9BQUQsQ0FBbkI7O0FBQ0EsSUFBSUMsRUFBRSxHQUFHRCxPQUFPLENBQUMsVUFBRCxDQUFoQixDLENBQ0E7QUFDQTs7O0FBRUEsTUFBTUUsTUFBTSxHQUFHRixPQUFPLENBQUUsbUJBQUYsQ0FBdEI7O0FBRUEsTUFBTUcsU0FBUyxHQUFHSCxPQUFPLENBQUMsZUFBRCxDQUFQLENBQXlCRyxTQUEzQyxDLENBQ0E7OztBQUNBLE1BQU1DLFVBQVUsR0FBR0osT0FBTyxDQUFDLGFBQUQsQ0FBMUI7O0FBRUEsSUFBSUssTUFBTSxHQUFJLEVBQWQ7O0FBQ0EsSUFBSUwsT0FBTyxDQUFDLElBQUQsQ0FBUCxDQUFjTSxRQUFkLE1BQTRCLFFBQWhDLEVBQTBDO0FBQ3hDRCxFQUFBQSxNQUFNLEdBQUksVUFBVjtBQUNELENBRkQsTUFHSztBQUNIQSxFQUFBQSxNQUFNLEdBQUksVUFBVjtBQUNEOztBQUNELE1BQU1FLEdBQUcsR0FBSSxHQUFFUixLQUFLLENBQUNTLEtBQU4sQ0FBWUgsTUFBWixDQUFvQixrQkFBbkM7QUFDQSxNQUFNSSxlQUFlLEdBQUcsQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixrQkFBbkIsRUFBdUMsY0FBdkMsRUFBdUQsdUJBQXZELEVBQWdGLHFCQUFoRixFQUF1RyxlQUF2RyxFQUF3SCx1QkFBeEgsQ0FBeEI7O0FBRUFDLE9BQU8sQ0FBQ0MsU0FBUixHQUFxQkMsS0FBRCxJQUFXO0FBQzdCQyxFQUFBQSxPQUFPLENBQUNDLE1BQVIsQ0FBZUMsUUFBZixDQUF3QixDQUF4QjtBQUEyQkMsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlWLEdBQUcsR0FBRyxtQkFBTixHQUE0QkssS0FBSyxDQUFDTSxRQUFOLEdBQWlCQyxPQUFqQixDQUF5QixJQUF6QixFQUFnQyxH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ZXF1aXJlKCdjaGFsaycpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKVxuLy92YXIganNvbiA9IHJlcXVpcmUoJ2NvbW1lbnQtanNvbicpO1xuLy9jb25zdCBzZW5jaGEgPSByZXF1aXJlKGAke25wbVNjb3BlfS9jbWRgKVxuXG5jb25zdCBzZW5jaGEgPSByZXF1aXJlKGBAZXh0anMvc2VuY2hhLWNtZGApXG5cbmNvbnN0IHNwYXduU3luYyA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3blN5bmNcbi8vY29uc3Qgc3Bhd24gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuc3Bhd25cbmNvbnN0IGNyb3NzU3Bhd24gPSByZXF1aXJlKCdjcm9zcy1zcGF3bicpXG5cbnZhciBwcmVmaXggPSBgYFxuaWYgKHJlcXVpcmUoJ29zJykucGxhdGZvcm0oKSA9PSAnZGFyd2luJykge1xuICBwcmVmaXggPSBg4oS5IO+9omV4dO+9ozpgXG59XG5lbHNlIHtcbiAgcHJlZml4ID0gYGkgW2V4dF06YFxufVxuY29uc3QgYXBwID0gYCR7Y2hhbGsuZ3JlZW4ocHJlZml4KX0gZXh0LWJ1aWxkLXV0aWw6YFxuY29uc3QgREVGQVVMVF9TVUJTVFJTID0gWydbRVJSXScsICdbV1JOXScsICdbSU5GXSBQcm9jZXNzaW5nJywgXCJbSU5GXSBTZXJ2ZXJcIiwgXCJbSU5GXSBXcml0aW5nIGNvbnRlbnRcIiwgXCJbSU5GXSBMb2FkaW5nIEJ1aWxkXCIsIFwiW0lORl0gV2FpdGluZ1wiLCBcIltMT0ddIEZhc2hpb24gd2FpdGluZ1wiXTtcblxuZXhwb3J0cy5zZW5jaGFDbWQgPSAocGFybXMpID0+IHtcbiAgcHJvY2Vzcy5zdGRvdXQuY3Vyc29yVG8oMCk7Y29uc29sZS5sb2coYXBwICsgJ3N0YXJ0ZWQgLSBzZW5jaGEgJyArIHBhcm1zLnRvU3RyaW5nKCkucmVwbGFjZSgvLC9nICwgXCIgXCIpICsgJ1xcbicpXG4gIHNwYXduU3luYyhzZW5jaGEsIHBhcm1zLCB7IHN0ZGlvOiAnaW5oZXJpdCcsIGVuY29kaW5nOiAndXRmLTgnfSlcbiAgcHJvY2Vzcy5zdGRvdXQuY3Vyc29yVG8oMCk7Y29uc29sZS5sb2coYXBwICsgJ2NvbXBsZXRlZCAtIHNlbmNoYSAnICsgcGFybXMudG9TdHJpbmcoKS5yZXBsYWNlKC8sL2cgLCBcIiBcIikpXG59XG5cbmV4cG9ydHMuc2VuY2hhQ21kQXN5bmMgPSBhc3luYyAocGFybXMsIG91dHB1dCwgdmVyYm9zZSwgc3Vic3RyaW5ncyA9IERFRkFVTFRfU1VCU1RSUykgPT4ge1xuICBjb25zb2xlLmxvZygnaGVyZScpXG4gIHNwYXduUHJvbWlzZShzZW5jaGEsIHBhcm1zLCB7IHN0ZGlvOiAncGlwZScsIGVuY29kaW5nOiAndXRmLTgnLGN3ZDogb3V0cHV0IH0sIHZlcmJvc2UsIHN1YnN0cmluZ3MpIC50aGVuKCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnYWZ0ZXIgc3Bhd25Qcm9taXNlJylcbiAgICByZXR1cm5cbiAgfSlcbn1cblxuXG52YXIgc3Bhd25Qcm9taXNlID0gKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMsIHZlcmJvc2UsIHN1YnN0cmluZ3MpID0+IHtcbiAgdmFyIG5vRXJyb3JzID0gdHJ1ZVxuICBsZXQgY2hpbGRcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICBjaGlsZCA9IGNyb3NzU3Bhd24oXG4gICAgICBjb21tYW5kLCBcbiAgICAgIGFyZ3MsIFxuICAgICAgb3B0aW9uc1xuICAgIClcbiAgICBjaGlsZC5vbignY2xvc2UnLCAoY29kZSwgc2lnbmFsKSA9PiB7XG4gICAgICBpZihjb2RlID09PSAwKSB7XG4gICAgICAgIGlmIChub0Vycm9ycykge1xuICAgICAgICAgIHJlc29sdmUoe2NvZGUsIHNpZ25hbH0pXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KCdleHQtYnVpbGQgZXJyb3JzJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlamVjdCgnZXh0LWJ1aWxkIGVycm9ycy4uLicpXG4gICAgICB9XG4gICAgfSlcbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9KVxuICAgIGlmIChjaGlsZC5zdGRvdXQpIHtcbiAgICAgIGNoaWxkLnN0ZG91dC5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgIHZhciBzdHIgPSBkYXRhLnRvU3RyaW5nKClcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xccj9cXG58XFxyL2csIFwiIFwiKVxuXG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEudG9TdHJpbmcoKS5tYXRjaCgvV2FpdGluZyBmb3IgY2hhbmdlc1xcLlxcLlxcLi8pKSB7XG4gICAgICAgICAgcmVzb2x2ZSh7fSlcbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih2ZXJib3NlID09ICd5ZXMnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYCR7YXBwfSR7c3RyfWApIFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChzdWJzdHJpbmdzLnNvbWUoZnVuY3Rpb24odikgeyByZXR1cm4gZGF0YS5pbmRleE9mKHYpID49IDA7IH0pKSB7IFxuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoXCJbSU5GXVwiLCBcIlwiKVxuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UocHJvY2Vzcy5jd2QoKSwgJycpXG4gICAgICAgICAgICBpZiAoc3RyLmluY2x1ZGVzKFwiW0VSUl1cIikpIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyID0gYCR7Y2hhbGsucmVkKFwiW0VSUl1cIil9YFxuICAgICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShcIltFUlJdXCIsIGVycilcbiAgICAgICAgICAgICAgbm9FcnJvcnMgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7YXBwfSR7c3RyfWApIFxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlbHNlIHsvL25vdGhpbmd9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYCR7YXBwfSAke2NoYWxrLnJlZCgnW0VSUl0nKX0gbm8gc3Rkb3V0YCkgXG4gICAgfVxuICAgIGlmIChjaGlsZC5zdGRlcnIpIHtcbiAgICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgIHZhciBzdHIgPSBkYXRhLnRvU3RyaW5nKClcbiAgICAgICAgdmFyIHMgPSBzdHIucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgXCIgXCIpXG4gICAgICAgIHZhciBzdHJKYXZhT3B0cyA9IFwiUGlja2VkIHVwIF9KQVZBX09QVElPTlNcIjtcbiAgICAgICAgdmFyIGluY2x1ZGVzID0gcy5pbmNsdWRlcyhzdHJKYXZhT3B0cylcbiAgICAgICAgaWYgKCFpbmNsdWRlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2FwcH0gJHtjaGFsay5ibGFjayhcIltFUlJdXCIpfSAke3N9YClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHthcHB9ICR7Y2hhbGsucmVkKCdbRVJSXScpfSBubyBzdGRlcnJgKSBcbiAgICB9XG4gIH0pO1xuICBwcm9taXNlLmNoaWxkID0gY2hpbGRcbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuLy9leHBvcnRzLmVyciA9IGZ1bmN0aW9uIGVycihzKSB7IHJldHVybiBjaGFsay5yZWQoJ1tFUlJdICcpICsgcyB9XG4vL2V4cG9ydHMuaW5mID0gZnVuY3Rpb24gaW5mKHMpIHsgcmV0dXJuIGNoYWxrLmdyZWVuKCdbSU5GXSAnKSArIHMgfVxuLy9leHBvcnRzLndybiA9IGZ1bmN0aW9uIGVycihzKSB7IHJldHVybiBjaGFsay55ZWxsb3coJ1tXUk5dICcpICsgcyB9XG5leHBvcnRzLmVyckxvZyA9IGZ1bmN0aW9uIGVycihzKSB7IGNvbnNvbGUubG9nKGNoYWxrLnJlZCgnW0VSUl0gJykgKyBzKSB9XG5leHBvcnRzLmluZkxvZyA9IGZ1bmN0aW9uIGluZihzKSB7IGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCdbSU5GXSAnKSArIHMpIH1cbmV4cG9ydHMud3JuTG9nID0gZnVuY3Rpb24gZXJyKHMpIHsgY29uc29sZS5sb2coY2hhbGsueWVsbG93KCdbV1JOXSAnKSArIHMpIH1cbi8vZXhwb3J0cy5kYmdMb2cgPSBmdW5jdGlvbiBkYmdMb2cocykgeyBpZiAoZGVidWcpIGNvbnNvbGUubG9nKGNoYWxrLmJsdWUoJ1tEQkddICcpICsgcykgfVxuZXhwb3J0cy5kYmdMb2cgPSBmdW5jdGlvbiBkYmdMb2cocykgeyAgfVxuZXhwb3J0cy5lcnIgPSBmdW5jdGlvbiBlcnIocykgeyByZXR1cm4gY2hhbGsucmVkKCdbRVJSXSAnKSArIHMgfVxuZXhwb3J0cy5pbmYgPSBmdW5jdGlvbiBpbmYocykgeyByZXR1cm4gY2hhbGsuZ3JlZW4oJ1tJTkZdICcpICsgcyB9XG5leHBvcnRzLndybiA9IGZ1bmN0aW9uIGVycihzKSB7IHJldHVybiBjaGFsay55ZWxsb3coJ1tXUk5dICcpICsgcyB9XG5leHBvcnRzLmRiZyA9IGZ1bmN0aW9uIGVycihzKSB7IHJldHVybiBjaGFsay5ibHVlKCdbREJHXSAnKSArIHMgfVxuXG52YXIgZXJyVGhyb3cgPSBmdW5jdGlvbiBlcnIocykgeyB0aHJvdyBjaGFsay5yZWQoJ1tFUlJdICcpICsgcyB9XG5leHBvcnRzLmVyclRocm93ID0gZXJyVGhyb3dcbmV4cG9ydHMuZGJnVGhyb3cgPSBmdW5jdGlvbiBlcnIocykgeyB0aHJvdyBjaGFsay5ibHVlKCdbRVJSXSAnKSArIHMgfVxuXG5leHBvcnRzLmdldEFwcE5hbWUgPSBmdW5jdGlvbiBnZXRBcHBOYW1lKEN1cnJXb3JraW5nRGlyKSB7XG5cdHZhciBhcHBKc29uRmlsZU5hbWUgPSBnZXRBcHBKc29uKEN1cnJXb3JraW5nRGlyKVxuXHRpZiAoYXBwSnNvbkZpbGVOYW1lID09ICcnKSB7XG5cdFx0dGhyb3cgJ05vdCBhIFNlbmNoYSBDbWQgcHJvamVjdCAtIG5vIGFwcC5qc29uIGZvdW5kJ1xuXHR9XG5cdHZhciBvYmpBcHBKc29uID0ganNvbi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoYXBwSnNvbkZpbGVOYW1lKS50b1N0cmluZygpKTtcblx0dmFyIGFwcE5hbWUgPSBvYmpBcHBKc29uLm5hbWVcblx0cmV0dXJuIGFwcE5hbWVcbn1cblxuZnVuY3Rpb24gZ2V0QXBwSnNvbihDdXJyV29ya2luZ0Rpcikge1xuXHR2YXIgbXlTdHJpbmdBcnJheSA9IEN1cnJXb3JraW5nRGlyLnNwbGl0KCcvJylcblx0dmFyIGFycmF5TGVuZ3RoID0gbXlTdHJpbmdBcnJheS5sZW5ndGhcblx0dmFyIGFwcEpzb25GaWxlID0gJydcblx0Zm9yICh2YXIgaiA9IGFycmF5TGVuZ3RoOyBqID4gMDsgai0tKSB7XG5cdFx0dmFyIGRpciA9ICcnXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBqOyBpKyspIHtcblx0XHRcdGlmIChteVN0cmluZ0FycmF5W2ldIT0nJykge1xuXHRcdFx0XHRkaXIgPSBkaXIgKyAnLycgKyBteVN0cmluZ0FycmF5W2ldXG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHZhciB3b3Jrc3BhY2VKc29uID0gZGlyICsgJy8nICsgJ3dvcmtzcGFjZS5qc29uJ1xuXHRcdC8vIGlmIChmcy5leGlzdHNTeW5jKHdvcmtzcGFjZUpzb24pKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZygneWVzICcgKyB3b3Jrc3BhY2VKc29uKVxuXHRcdC8vIH1cblx0XHR2YXIgYXBwSnNvbiA9IGRpciArICcvJyArICdhcHAuanNvbidcbi8vXHRcdGNvbnNvbGUubG9nKGFwcEpzb24pXG5cdFx0aWYgKGZzLmV4aXN0c1N5bmMoYXBwSnNvbikpIHtcbi8vXHRcdFx0Y29uc29sZS5sb2coJ2hlcmUnKVxuXHRcdFx0YXBwSnNvbkZpbGUgPSBhcHBKc29uXG5cdFx0fVxuXHR9XG5cdHJldHVybiBhcHBKc29uRmlsZVxufVxuXG5leHBvcnRzLmdldFNlbmNoYUNtZFBhdGggPSBmdW5jdGlvbiBnZXRTZW5jaGFDbWRQYXRoKHRvUGF0aCwgcGF0aCkge1xuXHRwYXRoVmFyID0gcHJvY2Vzcy5lbnYuUEFUSFxuXHR2YXIgbXlTdHJpbmdBcnJheSA9IHBhdGhWYXIuc3BsaXQoJzonKVxuXHR2YXIgYXJyYXlMZW5ndGggPSBteVN0cmluZ0FycmF5Lmxlbmd0aFxuXHR2YXIgcGF0aFNlbmNoYUNtZCA9ICcnXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKykge1xuXHRcdHZhciBzdHIgPSBteVN0cmluZ0FycmF5W2ldXG5cdFx0dmFyIG4gPSBzdHIuaW5kZXhPZihcIlNlbmNoYS9DbWRcIik7XG5cdFx0aWYgKG4gIT0gLTEpIHtcblx0XHRcdHBhdGhTZW5jaGFDbWQgPSBzdHJcblx0XHR9XG5cdH1cblx0Ly92YXIgb3RoZXIgPSAnL3BsdWdpbnMvZXh0L2N1cnJlbnQnXG5cdC8vY29uc29sZS5sb2cocGF0aFNlbmNoYUNtZCArIG90aGVyKVxuXHRyZXR1cm4gcGF0aFNlbmNoYUNtZFxufVxuXG5leHBvcnRzLmhhbmRsZU91dHB1dCA9IChjaGlsZCkgPT4ge1xuICBjaGlsZC5vbignZXhpdCcsIGZ1bmN0aW9uIChjb2RlLCBzaWduYWwpIHtcbiAgICBjb25zb2xlLmxvZyhgY2hpbGQgcHJvY2VzcyBleGl0ZWQgd2l0aCBjb2RlICR7Y29kZX0gYW5kIHNpZ25hbCAke3NpZ25hbH1gKTtcbiAgfSk7XG4gIGNoaWxkLnN0ZG91dC5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgdmFyIHN1YnN0cmluZ3MgPSBERUZBVUxUX1NVQlNUUlM7XG4gICAgaWYgKHN1YnN0cmluZ3Muc29tZShmdW5jdGlvbih2KSB7IHJldHVybiBkYXRhLmluZGV4T2YodikgPj0gMDsgfSkpIHsgXG4gICAgICB2YXIgc3RyID0gZGF0YS50b1N0cmluZygpXG4gICAgICB2YXIgcyA9IHN0ci5yZXBsYWNlKC9cXHI/XFxufFxcci9nLCBcIiBcIilcbiAgICAgIGNvbnNvbGUubG9nKGAke3N9YCkgXG4gICAgfVxuICB9KTtcbiAgY2hpbGQuc3RkZXJyLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKGBFOiR7ZGF0YX1gKTtcbiAgfSk7XG4gIHJldHVybiBjaGlsZDtcbn1cblxuXG5cblxuXG5cblxuLy8gYXN5bmMgZXhlY3V0ZUFzeW5jMihwYXJtcykge1xuLy8gICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4vLyAgICAgdmFyIGNoaWxkID0gc3Bhd24oc2VuY2hhLCBwYXJtcylcbi8vICAgICBjaGlsZC5vbignZXhpdCcsIGZ1bmN0aW9uIChjb2RlLCBzaWduYWwpIHtcbi8vICAgICAgIHJlc29sdmUoMCkgXG4vLyAgICAgfSlcbi8vICAgICBjaGlsZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuLy8gICAgICAgdmFyIHN1YnN0cmluZ3MgPSBbXCJbSU5GXSBXcml0aW5nIHhjb250ZW50XCIsICdbRVJSXScsICdbV1JOXScsICdbSU5GXSBQcm9jZXNzaW5nJywgXCJbSU5GXSBTZXJ2ZXJcIiwgXCJbSU5GXSBMb2FkaW5nIEJ1aWxkXCIsIFwiW0lORl0gV2FpdGluZ1wiLCBcIltMT0ddIEZhc2hpb24gd2FpdGluZ1wiXVxuLy8gICAgICAgaWYgKHN1YnN0cmluZ3Muc29tZShmdW5jdGlvbih2KSB7IHJldHVybiBkYXRhLmluZGV4T2YodikgPj0gMDsgfSkpIHsgXG4vLyAgICAgICAgIHZhciBzdHIgPSBkYXRhLnRvU3RyaW5nKClcbi8vICAgICAgICAgdmFyIHMgPSBzdHIucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgXCIgXCIpXG4vLyAgICAgICAgIHZhciBzMiA9IHMucmVwbGFjZShcIltJTkZdXCIsIFwiXCIpXG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGAke2FwcH0gJHtzMn1gKSBcbi8vICAgICAgIH1cbi8vICAgICB9KVxuLy8gICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhKSA9PiB7XG4vLyAgICAgICB2YXIgc3RyID0gZGF0YS50b1N0cmluZygpXG4vLyAgICAgICB2YXIgcyA9IHN0ci5yZXBsYWNlKC9cXHI/XFxufFxcci9nLCBcIiBcIilcbi8vICAgICAgIGNvbnNvbGUubG9nKGAke2FwcH0gJHtjaGFsay5yZWQoXCJbRVJSXVwiKX0gJHtzfWApIFxuLy8gICAgIH0pXG4vLyAgIH0pXG4vLyB9XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG4vLyBjb25zdCBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bjtcbi8vIHZhciBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkLXByb2Nlc3MtcHJvbWlzZScpLnNwYXduO1xuLy8gZnVuY3Rpb24gZXhlY3V0ZUNvbW1hbmQoY21kLCBhcmdzKSB7XG4vLyAgICAgdmFyIHByb21pc2UgPSBzcGF3bihjbWQsIGFyZ3MpO1xuIFxuLy8gICAgIHZhciBjaGlsZFByb2Nlc3MgPSBwcm9taXNlLmNoaWxkUHJvY2VzcztcbiAgICBcbi8vICAgICBjb25zb2xlLmxvZygnW3NwYXduXSBjaGlsZFByb2Nlc3MucGlkOiAnLCBjaGlsZFByb2Nlc3MucGlkKTtcbi8vICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbi8vICAgICAgICAgY29uc29sZS5sb2coJ1tzcGF3bl0gc3Rkb3V0OiAnLCBkYXRhLnRvU3RyaW5nKCkpO1xuLy8gICAgIH0pO1xuLy8gICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbiAoZGF0YSkge1xuLy8gICAgICAgICBjb25zb2xlLmxvZygnW3NwYXduXSBzdGRlcnI6ICcsIGRhdGEudG9TdHJpbmcoKSk7XG4vLyAgICAgfSk7XG4vLyAgICAgcmV0dXJuIHByb21pc2U7XG4vLyB9XG5cbi8vIGV4cG9ydHMuc2VuY2hhQ21kMiA9IChwYXJtcykgPT4ge1xuLy8gICBwcm9jZXNzLnN0ZG91dC5jdXJzb3JUbygwKTtjb25zb2xlLmxvZyhhcHAgKyAnc3RhcnRlZCAtIHNlbmNoYSAnICsgcGFybXMudG9TdHJpbmcoKS5yZXBsYWNlKC8sL2cgLCBcIiBcIikgKyAnXFxuJylcbi8vICAgYXdhaXQgZXhlY3V0ZUNvbW1hbmQoc2VuY2hhLCBwYXJtcylcbi8vICAgcHJvY2Vzcy5zdGRvdXQuY3Vyc29yVG8oMCk7Y29uc29sZS5sb2coYXBwICsgJ2NvbXBsZXRlZCAtIHNlbmNoYSAnICsgcGFybXMudG9TdHJpbmcoKS5yZXBsYWNlKC8sL2cgLCBcIiBcIikpXG5cbi8vIH1cblxuXG4vLyBhc3luYyBmdW5jdGlvbiBleGVjdXRlcigpIHtcbi8vICAgICBjb25zb2xlLmxvZygnW01BSU5dIHN0YXJ0Jyk7XG4vLyAgICAgYXdhaXQgZXhlY3V0ZUNvbW1hbmQoJ2VjaG8nLCBbJ2luZm8nXSk7XG4vLyAgICAgY29uc29sZS5sb2coJ1tNQUlOXSBlbmQnKTtcbi8vIH1cbiBcbi8vIGV4ZWN1dGVyKCk7XG5cblxuXG5cblxuXG5cbiJdfQ==