
var Resource = require('../model/resource');

var q = require('q');
var globLib = require('glob');
var glob = q.denodeify(globLib);


function extractType(path) {
    var ext = path.split('.').slice(-1)[0];
    return {
        js:   'javascript',
        css:  'css',
        less: 'less',
        json: 'json'
    }[ext];
}

function filenameToResource(paths) {
    return paths.map(function(path) {
        return new Resource({path: path, type: extractType(path)});
    });
}


function Supervisor() {
  this.includes = [];
}

Supervisor.prototype.glob = function(pattern) {
  this.includes.push(pattern);
  return glob(pattern).then(filenameToResource);
};

Supervisor.prototype.dependOn = function(file) {
  this.includes.push(file);
};


module.exports = Supervisor;
