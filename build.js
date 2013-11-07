var sys = require('sys'),
    exec = require('child_process').exec,
    templatizer = require('templatizer'),
    async = require('async'),
    browserify = require('browserify'),
    bgBundle = browserify(),
    uiBundle = browserify(),
    fs = require('fs'),
    child;

// build our demo file
templatizer(__dirname + '/src/ui/templates', __dirname + '/src/ui/modules/templates.js');
async.waterfall([
    function (cb) {
        bgBundle.add('./src/bg/main');
        bgBundle.bundle({standalone: 'App'}, function (err, source) {
            if (err) {
                sys.print('browserify error ' + err);
                return cb(err);
            }
            fs.writeFile(__dirname + '/src/common/main.js', source, function (err) {
                cb(err);
            });
        });
    },
    function (cb) {
        fs.readFile(__dirname + '/src/ui/kango_requires.js', {encoding: 'utf8'}, function (err, header) {
            cb(err, header);
        });
        
    },
    function (header, cb) {
        uiBundle.add('./src/ui/content');
        uiBundle.bundle({standalone: 'App'}, function (err, source) {
            if (err) {
                sys.print('browserify error ' + err);
                return cb(err);
            }
            fs.writeFile(__dirname + '/src/common/ui.js', header + source, function (err) {
                cb(err);
            });
        });
    },
    function (cb) {
        // executes kango_build command
        var kango_build = 'python ~/bin/kango/kango.py build ./';
        child = exec(kango_build, function (error, stdout, stderr) {
          sys.print('stdout: ' + stdout);
          sys.print('stderr: ' + stderr);
          if (error) {
            console.log('exec error: ' + error);
          }
          cb();
        });
    }
], function (err) {
    if (err) console.error(err);
    console.log('build complete');
});




