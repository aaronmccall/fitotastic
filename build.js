var sys = require('sys'),
	exec = require('child_process').exec,
	templatizer = require('templatizer'),
	child;

// build our demo file
templatizer(__dirname + '/src/common/includes/clientTemplates', __dirname + '/src/common/includes/ui/templates.js');

var kango_build = 'python ~/bin/kango/kango.py build ./';

// executes kango_build command
child = exec(kango_build, function (error, stdout, stderr) {
  sys.print('stdout: ' + stdout);
  sys.print('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});
