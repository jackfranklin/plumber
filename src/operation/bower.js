var Resource = require('../model/resource');

var glob = require('./glob');

var q = require('q');
var flatten = require('flatten');
var bower = require('bower');


function filenameToResource(path) {
  return new Resource({path: path});
}

// FIXME: use native helper?
function extend(source, props) {
    Object.keys(props).forEach(function(key) {
        source[key] = props[key];
    });
    return source;
}

function bowerList(options, config) {
  var defer = q.defer();
  // TODO: API wtf, why is directory not read from config? .bowerrc
  // not looked up relatively

  bower.commands.list(options, extend({
      offline: true
  }, config)).on('end', function(value) {
      defer.resolve(value);
  });

  return defer.promise;
}

function bowerPaths(moduleName, config) {
    return bowerList({paths: true, relative: false}, config).then(function(map) {
        // might be string or array of string - return flat list
        return flatten([map[moduleName]]);
    });
}

function bowerDirectory(moduleName, config) {
    return bowerList({relative: false}, config).then(function(config) {
        var module = config.dependencies[moduleName];
        // FIXME: if missing?
        return module.canonicalDir;
    });
}


function bowerOperation(config) {
    return function(moduleName, files) {
        return function(/* TODO: resources? */) {
            var paths;
            // if files/patterns, use from component dir
            if (files) {
                paths = bowerDirectory(moduleName, config).then(function(dir) {
                    return glob.within(dir)(files)();
                });
                // else use main files (if any)
            } else {
                paths = bowerPaths(moduleName, config).then(function(paths) {
                    return paths.map(filenameToResource);
                });
            }

            return paths;
        };
    };
};

var defaultBower = bowerOperation({});

defaultBower.from = function(baseDirectory, componentsDirectory) {
    return bowerOperation({
        cwd: baseDirectory,
        directory: componentsDirectory
    });
};

module.exports = defaultBower;