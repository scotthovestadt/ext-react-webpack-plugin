"use strict";

//import { fork } from 'child_process';
const fork = require('child_process').fork;

const exec = require('child_process').exec;

var output = '/'; //execFile('sencha', ['ant', 'watch'], { cwd: output, silent: false })

watching = fork('/Users/marcgusmano/bin/Sencha/sencha', ['ant', 'watch'], {
  cwd: output,
  silent: true
});
watching.stderr.pipe(process.stderr);
watching.stdout.pipe(process.stdout);
watching.stdout.on('data', data => {
  if (data && data.toString().match(/Waiting for changes\.\.\./)) {//onBuildDone()
  }
}); //watching.on('exit', onBuildDone)
// fork('sencha', function(error, stdout, stderr) {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
//   console.log(`stderr: ${stderr}`);
// });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pLmpzIl0sIm5hbWVzIjpbImZvcmsiLCJyZXF1aXJlIiwiZXhlYyIsIm91dHB1dCIsIndhdGNoaW5nIiwiY3dkIiwic2lsZW50Iiwic3RkZXJyIiwicGlwZSIsInByb2Nlc3MiLCJzdGRvdXQiLCJvbiIsImRhdGEiLCJ0b1N0cmluZyIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsTUFBTUEsSUFBSSxHQUFHQyxPQUFPLENBQUMsZUFBRCxDQUFQLENBQXlCRCxJQUF0Qzs7QUFDQSxNQUFNRSxJQUFJLEdBQUdELE9BQU8sQ0FBQyxlQUFELENBQVAsQ0FBeUJDLElBQXRDOztBQUdBLElBQUlDLE1BQU0sR0FBRyxHQUFiLEMsQ0FDQTs7QUFFQUMsUUFBUSxHQUFHSixJQUFJLENBQUMsc0NBQUQsRUFBeUMsQ0FBQyxLQUFELEVBQVEsT0FBUixDQUF6QyxFQUEyRDtBQUFFSyxFQUFBQSxHQUFHLEVBQUVGLE1BQVA7QUFBZUcsRUFBQUEsTUFBTSxFQUFFO0FBQXZCLENBQTNELENBQWY7QUFDQUYsUUFBUSxDQUFDRyxNQUFULENBQWdCQyxJQUFoQixDQUFxQkMsT0FBTyxDQUFDRixNQUE3QjtBQUNBSCxRQUFRLENBQUNNLE1BQVQsQ0FBZ0JGLElBQWhCLENBQXFCQyxPQUFPLENBQUNDLE1BQTdCO0FBQ0FOLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQkMsRUFBaEIsQ0FBbUIsTUFBbkIsRUFBMkJDLElBQUksSUFBSTtBQUNqQyxNQUFJQSxJQUFJLElBQUlBLElBQUksQ0FBQ0MsUUFBTCxHQUFnQkMsS0FBaEIsQ0FBc0IsMkJBQXRCLENBQVosRUFBZ0UsQ0FDOUQ7QUFDRDtBQUNGLENBSkQsRSxDQUtBO0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8vaW1wb3J0IHsgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuY29uc3QgZm9yayA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5mb3JrXG5jb25zdCBleGVjID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLmV4ZWNcblxuXG52YXIgb3V0cHV0ID0gJy8nXG4vL2V4ZWNGaWxlKCdzZW5jaGEnLCBbJ2FudCcsICd3YXRjaCddLCB7IGN3ZDogb3V0cHV0LCBzaWxlbnQ6IGZhbHNlIH0pXG5cbndhdGNoaW5nID0gZm9yaygnL1VzZXJzL21hcmNndXNtYW5vL2Jpbi9TZW5jaGEvc2VuY2hhJywgWydhbnQnLCAnd2F0Y2gnXSwgeyBjd2Q6IG91dHB1dCwgc2lsZW50OiB0cnVlIH0pXG53YXRjaGluZy5zdGRlcnIucGlwZShwcm9jZXNzLnN0ZGVycik7XG53YXRjaGluZy5zdGRvdXQucGlwZShwcm9jZXNzLnN0ZG91dCk7XG53YXRjaGluZy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgaWYgKGRhdGEgJiYgZGF0YS50b1N0cmluZygpLm1hdGNoKC9XYWl0aW5nIGZvciBjaGFuZ2VzXFwuXFwuXFwuLykpIHtcbiAgICAvL29uQnVpbGREb25lKClcbiAgfVxufSlcbi8vd2F0Y2hpbmcub24oJ2V4aXQnLCBvbkJ1aWxkRG9uZSlcblxuXG5cblxuXG4vLyBmb3JrKCdzZW5jaGEnLCBmdW5jdGlvbihlcnJvciwgc3Rkb3V0LCBzdGRlcnIpIHtcbi8vICAgaWYgKGVycm9yKSB7XG4vLyAgICAgY29uc29sZS5lcnJvcihgZXhlYyBlcnJvcjogJHtlcnJvcn1gKTtcbi8vICAgICByZXR1cm47XG4vLyAgIH1cbi8vICAgY29uc29sZS5sb2coYHN0ZG91dDogJHtzdGRvdXR9YCk7XG4vLyAgIGNvbnNvbGUubG9nKGBzdGRlcnI6ICR7c3RkZXJyfWApO1xuLy8gfSk7XG4iXX0=