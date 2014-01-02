!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.App=e():"undefined"!=typeof global?global.App=e():"undefined"!=typeof self&&(self.App=e())}(function(){var define,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var process=require("__browserify_process");/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = setImmediate;
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

},{"__browserify_process":3}],2:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function ( window , undefined ) {
    'use strict';
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB,
        IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange,
        transactionModes = {
            readonly: 'readonly',
            readwrite: 'readwrite'
        };
        
    var hasOwn = Object.prototype.hasOwnProperty;

    if ( !indexedDB ) {
        throw 'IndexedDB required';
    }

    var CallbackList = function () {
        var state,
            list = [];

        var exec = function ( context , args ) {
            if ( list ) {
                args = args || [];
                state = state || [ context , args ];

                for ( var i = 0 , il = list.length ; i < il ; i++ ) {
                    list[ i ].apply( state[ 0 ] , state[ 1 ] );
                }

                list = [];
            }
        };

        this.add = function () {
            for ( var i = 0 , il = arguments.length ; i < il ; i ++ ) {
                list.push( arguments[ i ] );
            }

            if ( state ) {
                exec();
            }

            return this;
        };

        this.execute = function () {
            exec( this , arguments );
            return this;
        };
    };

    var Deferred = function ( func ) {
        var state = 'progress',
            actions = [
                [ 'resolve' , 'done' , new CallbackList() , 'resolved' ],
                [ 'reject' , 'fail' , new CallbackList() , 'rejected' ],
                [ 'notify' , 'progress' , new CallbackList() ],
            ],
            deferred = {},
            promise = {
                state: function () {
                    return state;
                },
                then: function ( /* doneHandler , failedHandler , progressHandler */ ) {
                    var handlers = arguments;

                    return Deferred(function ( newDefer ) {
                        actions.forEach(function ( action , i ) {
                            var handler = handlers[ i ];

                            deferred[ action[ 1 ] ]( typeof handler === 'function' ?
                                function () {
                                    var returned = handler.apply( this , arguments );

                                    if ( returned && typeof returned.promise === 'function' ) {
                                        returned.promise()
                                            .done( newDefer.resolve )
                                            .fail( newDefer.reject )
                                            .progress( newDefer.notify );
                                    }
                                } : newDefer[ action[ 0 ] ]
                            );
                        });
                    }).promise();
                },
                promise: function ( obj ) {
                    if ( obj ) {
                        Object.keys( promise )
                            .forEach(function ( key ) {
                                obj[ key ] = promise[ key ];
                            });

                        return obj;
                    }
                    return promise;
                }
            };

        actions.forEach(function ( action , i ) {
            var list = action[ 2 ],
                actionState = action[ 3 ];

            promise[ action[ 1 ] ] = list.add;

            if ( actionState ) {
                list.add(function () {
                    state = actionState;
                });
            }

            deferred[ action[ 0 ] ] = list.execute;
        });

        promise.promise( deferred );

        if ( func ) {
            func.call( deferred , deferred );
        }

        return deferred;
    };

    var Server = function ( db , name ) {
        var that = this,
            closed = false;

        this.add = function( table ) {
            if ( closed ) {
                throw 'Database has been closed';
            }

            var records = [];
            for (var i = 0; i < arguments.length - 1; i++) {
                records[i] = arguments[i + 1];
            }

            var transaction = db.transaction( table , transactionModes.readwrite ),
                store = transaction.objectStore( table ),
                deferred = Deferred();
            
            records.forEach( function ( record ) {
                var req;
                if ( record.item && record.key ) {
                    var key = record.key;
                    record = record.item;
                    req = store.add( record , key );
                } else {
                    req = store.add( record );
                }

                req.onsuccess = function ( e ) {
                    var target = e.target;
                    var keyPath = target.source.keyPath;
                    if ( keyPath === null ) {
                        keyPath = '__id__';
                    }
                    Object.defineProperty( record , keyPath , {
                        value: target.result,
                        enumerable: true
                    });
                    deferred.notify();
                };
            } );
            
            transaction.oncomplete = function () {
                deferred.resolve( records , that );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( records , e );
            };
            transaction.onabort = function ( e ) {
                deferred.reject( records , e );
            };
            return deferred.promise();
        };

        this.update = function( table ) {
            if ( closed ) {
                throw 'Database has been closed';
            }

            var records = [];
            for ( var i = 0 ; i < arguments.length - 1 ; i++ ) {
                records[ i ] = arguments[ i + 1 ];
            }

            var transaction = db.transaction( table , transactionModes.readwrite ),
                store = transaction.objectStore( table ),
                keyPath = store.keyPath,
                deferred = Deferred();

            records.forEach( function ( record ) {
                var req;
                if ( record.item && record.key ) {
                    var key = record.key;
                    record = record.item;
                    req = store.put( record , key );
                } else {
                    req = store.put( record );
                }

                req.onsuccess = function ( e ) {
                    deferred.notify();
                };
            } );
            
            transaction.oncomplete = function () {
                deferred.resolve( records , that );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( records , e );
            };
            transaction.onabort = function ( e ) {
                deferred.reject( records , e );
            };
            return deferred.promise();
        };
        
        this.remove = function ( table , key ) {
            if ( closed ) {
                throw 'Database has been closed';
            }
            var transaction = db.transaction( table , transactionModes.readwrite ),
                store = transaction.objectStore( table ),
                deferred = Deferred();
            
            var req = store.delete( key );
            transaction.oncomplete = function ( ) {
                deferred.resolve( key );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( e );
            };
            return deferred.promise();
        };

        this.clear = function ( table ) {
            if ( closed ) {
                throw 'Database has been closed';
            }
            var transaction = db.transaction( table , transactionModes.readwrite ),
                store = transaction.objectStore( table ),
                deferred = Deferred();

            var req = store.clear();
            transaction.oncomplete = function ( ) {
                deferred.resolve( );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( e );
            };
            return deferred.promise();
        };
        
        this.close = function ( ) {
            if ( closed ) {
                throw 'Database has been closed';
            }
            db.close();
            closed = true;
            delete dbCache[ name ];
        };

        this.get = function ( table , id ) {
            if ( closed ) {
                throw 'Database has been closed';
            }
            var transaction = db.transaction( table ),
                store = transaction.objectStore( table ),
                deferred = Deferred();

            var req = store.get( id );
            req.onsuccess = function ( e ) {
                deferred.resolve( e.target.result );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( e );
            };
            return deferred.promise();
        };

        this.query = function ( table , index ) {
            if ( closed ) {
                throw 'Database has been closed';
            }
            return new IndexQuery( table , db , index );
        };

        for ( var i = 0 , il = db.objectStoreNames.length ; i < il ; i++ ) {
            (function ( storeName ) {
                that[ storeName ] = { };
                for ( var i in that ) {
                    if ( !hasOwn.call( that , i ) || i === 'close' ) {
                        continue;
                    }
                    that[ storeName ][ i ] = (function ( i ) {
                        return function () {
                            var args = [ storeName ].concat( [].slice.call( arguments , 0 ) );
                            return that[ i ].apply( that , args );
                        };
                    })( i );
                }
            })( db.objectStoreNames[ i ] );
        }
    };

    var IndexQuery = function ( table , db , indexName ) {
        var that = this;
        var modifyObj = false;

        var runQuery = function ( type, args , cursorType , direction, limitRange, filters ) {
            var transaction = db.transaction( table, modifyObj ? transactionModes.readwrite : transactionModes.readonly ),
                store = transaction.objectStore( table ),
                index = indexName ? store.index( indexName ) : store,
                keyRange = type ? IDBKeyRange[ type ].apply( null, args ) : null,
                results = [],
                deferred = Deferred(),
                indexArgs = [ keyRange ],
                limitRange = limitRange ? limitRange : null,
                filters = filters ? filters : [],
                counter = 0;

            if ( cursorType !== 'count' ) {
                indexArgs.push( direction || 'next' );
            };

            // create a function that will set in the modifyObj properties into
            // the passed record.
            var modifyKeys = modifyObj ? Object.keys(modifyObj) : false;
            var modifyRecord = function(record) {
                for(var i = 0; i < modifyKeys.length; i++) {
                    var key = modifyKeys[i];
                    var val = modifyObj[key];
                    if(val instanceof Function) val = val(record);
                    record[key] = val;
                }
                return record;
            };

            index[cursorType].apply( index , indexArgs ).onsuccess = function ( e ) {
                var cursor = e.target.result;
                if ( typeof cursor === typeof 0 ) {
                    results = cursor;
                } else if ( cursor ) {
                	if ( limitRange !== null && limitRange[0] > counter) {
                    	counter = limitRange[0];
                    	cursor.advance(limitRange[0]);
                    } else if ( limitRange !== null && counter >= (limitRange[0] + limitRange[1]) ) {
                        //out of limit range... skip
                    } else {
                        var matchFilter = true;
                        var result = 'value' in cursor ? cursor.value : cursor.key;

                        filters.forEach( function ( filter ) {
                            if ( !filter || !filter.length ) {
                                //Invalid filter do nothing
                            } else if ( filter.length === 2 ) {
                                matchFilter = (result[filter[0]] === filter[1])
                            } else {
                                matchFilter = filter[0].apply(undefined,[result]);
                            }
                        });

                        if (matchFilter) {
                            counter++;
                            results.push( result );
                            // if we're doing a modify, run it now
                            if(modifyObj) {
                                result = modifyRecord(result);
                                cursor.update(result);
                            }
                        }
                        cursor.continue();
                    }
                }
            };

            transaction.oncomplete = function () {
                deferred.resolve( results );
            };
            transaction.onerror = function ( e ) {
                deferred.reject( e );
            };
            transaction.onabort = function ( e ) {
                deferred.reject( e );
            };
            return deferred.promise();
        };

        var Query = function ( type , args ) {
            var direction = 'next',
                cursorType = 'openCursor',
                filters = [],
                limitRange = null,
                unique = false;

            var execute = function () {
                return runQuery( type , args , cursorType , unique ? direction + 'unique' : direction, limitRange, filters );
            };

            var limit = function () {
                limitRange = Array.prototype.slice.call( arguments , 0 , 2 )
                if (limitRange.length == 1) {
                    limitRange.unshift(0)
                }

                return {
                    execute: execute
                };
            };
            var count = function () {
                direction = null;
                cursorType = 'count';

                return {
                    execute: execute
                };
            };
            var keys = function () {
                cursorType = 'openKeyCursor';

                return {
                    desc: desc,
                    execute: execute,
                    filter: filter,
                    distinct: distinct
                };
            };
            var filter = function ( ) {
                filters.push( Array.prototype.slice.call( arguments , 0 , 2 ) );

                return {
                    keys: keys,
                    execute: execute,
                    filter: filter,
                    desc: desc,
                    distinct: distinct,
                    modify: modify,
                    limit: limit
                };
            };
            var desc = function () {
                direction = 'prev';

                return {
                    keys: keys,
                    execute: execute,
                    filter: filter,
                    distinct: distinct,
                    modify: modify
                };
            };
            var distinct = function () {
                unique = true;
                return {
                    keys: keys,
                    count: count,
                    execute: execute,
                    filter: filter,
                    desc: desc,
                    modify: modify
                };
            };
            var modify = function(update) {
                modifyObj = update;
                return {
                    execute: execute
                };
            };

            return {
                execute: execute,
                count: count,
                keys: keys,
                filter: filter,
                desc: desc,
                distinct: distinct,
                modify: modify,
                limit: limit
            };
        };
        
        'only bound upperBound lowerBound'.split(' ').forEach(function (name) {
            that[name] = function () {
                return new Query( name , arguments );
            };
        });

        this.filter = function () {
            var query = new Query( null , null );
            return query.filter.apply( query , arguments );
        };

        this.all = function () {
            return this.filter();
        };
    };
    
    var createSchema = function ( e , schema , db ) {
        if ( typeof schema === 'function' ) {
            schema = schema();
        }
        
        for ( var tableName in schema ) {
            var table = schema[ tableName ];
            var store;
            if (!hasOwn.call(schema, tableName) || db.objectStoreNames.contains(tableName)) {
                store = e.currentTarget.transaction.objectStore(tableName);
            } else {
                store = db.createObjectStore(tableName, table.key);
            }

            for ( var indexKey in table.indexes ) {
                var index = table.indexes[ indexKey ];
                store.createIndex( indexKey , index.key || indexKey , Object.keys(index).length ? index : { unique: false } );
            }
        }
    };
    
    var open = function ( e , server , version , schema ) {
        var db = e.target.result;
        var s = new Server( db , server );
        var upgrade;

        var deferred = Deferred();
        deferred.resolve( s );
        dbCache[ server ] = db;

        return deferred.promise();
    };

    var dbCache = {};

    var db = {
        version: '0.8.0',
        open: function ( options ) {
            var request;

            var deferred = Deferred();

            if ( dbCache[ options.server ] ) {
                open( {
                    target: {
                        result: dbCache[ options.server ]
                    }
                } , options.server , options.version , options.schema )
                .done(deferred.resolve)
                .fail(deferred.reject)
                .progress(deferred.notify);
            } else {
                request = indexedDB.open( options.server , options.version );
                            
                request.onsuccess = function ( e ) {
                    open( e , options.server , options.version , options.schema )
                        .done(deferred.resolve)
                        .fail(deferred.reject)
                        .progress(deferred.notify);
                };
            
                request.onupgradeneeded = function ( e ) {
                    createSchema( e , options.schema , e.target.result );
                };
                request.onerror = function ( e ) {
                    deferred.reject( e );
                };
            }

            return deferred.promise();
        }
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = db;
    } else if ( typeof define === 'function' && define.amd ) {
        define( function() { return db; } );
    } else {
        window.db = db;
    }
})( window );

},{}],5:[function(require,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based 
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {
    
});

emitter.on('somenamespace*', function (eventName, payloads) {
    
});

Please note that callbacks triggered by wildcard registered events also get 
the event name as the first argument.
*/
module.exports = WildEmitter;

function WildEmitter() {
    this.callbacks = {};
}

// Listen on the given `event` with `fn`. Store a group name if present.
WildEmitter.prototype.on = function (event, groupName, fn) {
    var hasGroup = (arguments.length === 3),
        group = hasGroup ? arguments[1] : undefined, 
        func = hasGroup ? arguments[2] : arguments[1];
    func._groupName = group;
    (this.callbacks[event] = this.callbacks[event] || []).push(func);
    return this;
};

// Adds an `event` listener that will be invoked a single
// time then automatically removed.
WildEmitter.prototype.once = function (event, groupName, fn) {
    var self = this,
        hasGroup = (arguments.length === 3),
        group = hasGroup ? arguments[1] : undefined, 
        func = hasGroup ? arguments[2] : arguments[1];
    function on() {
        self.off(event, on);
        func.apply(this, arguments);
    }
    this.on(event, group, on);
    return this;
};

// Unbinds an entire group
WildEmitter.prototype.releaseGroup = function (groupName) {
    var item, i, len, handlers;
    for (item in this.callbacks) {
        handlers = this.callbacks[item];
        for (i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i]._groupName === groupName) {
                //console.log('removing');
                // remove it and shorten the array we're looping through
                handlers.splice(i, 1);
                i--;
                len--;
            }
        }
    }
    return this;
};

// Remove the given callback for `event` or all
// registered callbacks.
WildEmitter.prototype.off = function (event, fn) {
    var callbacks = this.callbacks[event],
        i;
    
    if (!callbacks) return this;

    // remove all handlers
    if (arguments.length === 1) {
        delete this.callbacks[event];
        return this;
    }

    // remove specific handler
    i = callbacks.indexOf(fn);
    callbacks.splice(i, 1);
    return this;
};

// Emit `event` with the given args.
// also calls any `*` handlers
WildEmitter.prototype.emit = function (event) {
    var args = [].slice.call(arguments, 1),
        callbacks = this.callbacks[event],
        specialCallbacks = this.getWildcardCallbacks(event),
        i,
        len,
        item;

    if (callbacks) {
        for (i = 0, len = callbacks.length; i < len; ++i) {
            if (callbacks[i]) {
                callbacks[i].apply(this, args);
            } else {
                break;
            }
        }
    }

    if (specialCallbacks) {
        for (i = 0, len = specialCallbacks.length; i < len; ++i) {
            if (specialCallbacks[i]) {
                specialCallbacks[i].apply(this, [event].concat(args));
            } else {
                break;
            }
        }
    }

    return this;
};

// Helper for for finding special wildcard event handlers that match the event
WildEmitter.prototype.getWildcardCallbacks = function (eventName) {
    var item,
        split,
        result = [];

    for (item in this.callbacks) {
        split = item.split('*');
        if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
            result = result.concat(this.callbacks[item]);
        }
    }
    return result;
};

},{}],6:[function(require,module,exports){
module.exports={
	"maxProppableDays": 7,
	"maxConcurrentXHR": 3
}
},{}],7:[function(require,module,exports){
var async = require('async');
var workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT');
var stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>');
var templatizer = require('../ui/modules/templates');
var proppables = require('./helpers/proppables');
var srcPrevent = require('./helpers/srcPrevent');
var friends = {};
var optsMap = { friends: 'following', fans: 'followers' };
//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var App, db, xhr, me, getLastConvo;

// Takes to integer timestamps and return the difference in hours
function to_hours(ts1, ts2) {
    if (isNaN(ts1) || isNaN(ts2)) return NaN;
    return (ts1 - ts2) / (60 * 60 * 1000);
}

// Given a .stream_item, return its age
function activity_age(activity) {
    return to_hours(Date.now(), Date.parse(activity.find('.action_time').text().trim()||''));
}

function getCountFromGrid() {
    return friends.grid.rows * friends.grid.columns;
}

function userSort(a, b) {}

friends.setLastWO = function setLastWorkout(friend, done) {
    xhr.get(workout_urlizer({user_id: friend.id}), function (html) {
        var activity = $(srcPrevent(html)).find('.action_time:first'),
            last_ts = activity.length ? Date.parse(activity.text().trim()) : NaN;
        if (last_ts) friend.last_workout = last_ts;
        done(null, friend);
    });
};

var initGetLastConvo = function (me) {
    var author_getter = function (author) {
            return '.stream-author[href$="' + author + '/"]:first';
        },
        commenter_getter = function (commenter) {
            return '.comment_username_link[href$="' + commenter + '/"]:first';
        },
        me_author = author_getter(me),
        me_commenter = commenter_getter(me),
        convo_selector = [
            me_author,
            me_commenter
        ].join(',');

    return function ($html, friend) {
        var $this = $html.find(convo_selector).first();
        if (!$this.length) return;
        var is_comment = $this.is('.comment_username_link'),
            $item = $this.closest('.stream_item'),
            headline = $('.stream-item-headline', $item).text().replace(/\s{2,}/g, ' ')
                        .trim().replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2})/, date_prettifier),
            body = $('.stream-status', $item).text().replace(/\s{2,}/g, ' ').trim(),
            $comment = (is_comment ? $this : $(commenter_getter(friend.username), $item))
                        .closest('.comment-content').text().replace(/\s{2,}/g, ' ').trim(),
            reply;
        if  (is_comment) {
            headline = headline.replace(me, 'you');
            reply = $comment.replace(me, 'and you replied: ');
        } else {
            headline = headline.replace(me, 'You');
            reply = $comment.replace(friend.username, 'and they replied: ');
        }
        return {headline: headline, body: body, reply: reply};
    };

};

friends.get = function getFriends(page, callback) {
    var self = this,
        q = db.query('last_workout'),
        per_page = getCountFromGrid(),
        start = page * per_page,
        end = start + per_page,
        now = Date.now(),
        lowBound = now - (App.options.mffs_active_days*86400000),
        filtered;
    console.log({start: start, page: page, end: end, lowBound: lowBound, now: now });
    if (App.options.active === 'on') {

        q = q.lowerBound(lowBound);
        filtered = true;
    }
    if (!filtered) q = q.all();
    q.limit(start, end).execute().done(function (results) {
        if (!results.length && start === 0) {
            self.load({
                start: start,
                end: end,
                page: page,
                user: me
            }, function (friends) {
                callback(_.sortBy(friends, 'username'));
            });
        } else {
            callback(_.sortBy(results, 'username'));
        }
    });
};

friends.save = function saveFriend(friend, callback) {
    db.update(friend).done(function (result) {
        callback(null, friend);
    }).fail(function (result) {
        db.add(friend).done(function (result) {
            callback(null, friend);
        });
    });
};

friends.load = function loadFriends(options, callback) {
    var self = this,
        who = optsMap[App.options.mffs_who],
        retrieve = function (page) {
            if (!friend_url_tpl) {
                friend_url_tpl = _.template(
                    App.site + '/get-user-friends/?user=' +
                    options.user + '&' + who + '=true&page=<%= page %>'
                );
            }
            xhr.get(friend_url_tpl({page: page}), processor, {dataType: 'json'});
        },
        fresh = ((Date.now() - (kango.storage.getItem('friends_freshness')||0)) < STALE),
        page = Math.floor(options.start / 5)||0,
        friend_url_tpl;

    function processor(friends) {
        console.log('processor called with ', friends);
        if (_.isArray(friends)) {
            async.forEach(friends, function (friend, friend_done) {
                async.waterfall([
                        function (cb) {
                            console.log('setting last WO on ' + friend.username);
                            self.setLastWO(friend, cb);
                        },
                        function (friend, cb) {
                            console.log('saving ' + friend.username);
                            self.save(friend, cb);
                        }
                    ], function (err, friend) {
                        friend_done();
                    }
                );
                
            }, function (err) {
                if (friends.length < 5 || page === 5) {
                    // App.appendUnique('friends', payload);
                    return self.get(options.page, callback);
                }
                retrieve(++page);
            });
            
        }
    }
    // App.db.friends.
    if (!fresh || !payload) {
        payload = [];
        retrieve(page);
    }
    // callback([]);
};

friends.setGrid = function setGrid(grid) {
    friends.grid = grid;
};

module.exports = {
    init: function (app) {
        App = app;
        db = App.db.friends;
        xhr = App.xhr;
        App.get_me(function (meRes) {
            me = meRes;
            friends.getProppables = proppables.init(me, xhr);
            getLastConvo = initGetLastConvo(me);
        });
        return friends;
    }
};
},{"../ui/modules/templates":16,"./helpers/proppables":8,"./helpers/srcPrevent":10,"async":1}],8:[function(require,module,exports){
var config = require('../config.json');

var maxProppableAge;
function getMaxProppableAge() {
    return maxProppableAge || (maxProppableAge = (24 * config.maxProppableDays));
}

var me, xhr;
function proppableFilter() {
    var $this = $(this),
        act_age = activity_age($this),
        propped_by_me = !!$this.find('.proppers a[href="/profile/' + me + '/"]').length;

    
    $this.data('activity_age', act_age);
    return propped_by_me || (act_age > getMaxProppableAge());
}

function initProppableTypes () {
    var proppablePrefix = '[data-ag-type^=',
        proppableSuffix = ']',
        proppableSeparator = proppableSuffix + ',' + proppablePrefix;
        
    return proppablePrefix + ['badge', 'level', 'quest', 'work'].join(proppableSeparator) + proppableSuffix;
}

var proppableTypes;
function getProppableTypes() {
    return proppableTypes || (proppableTypes = initProppableTypes());
}

function workoutDetail(workout) {
    var items = workout.find('.action_detail > li'),
        output = [];
    items.each(function () {
        var activity = $(this),
            payload = {},
            pr = activity.find('.pr');
        payload.name = activity.find('.action_prompt').text().replace(/:/g, '').trim();
        payload.note = activity.find('.stream_note').text();
        if (pr.length) {
            payload.pr = pr.find('.set_user_original').text().trim();
        }
        output.push(payload);
    });
    return output;
}

function activityDetail(activities_list, activity) {
    var $activity = $(activity),
        activity_type = $activity.attr('data-ag-type'),
        isWorkout = activity_type==='workout',
        title = $activity.find(isWorkout ? '.stream_total_points' : '.dramatic-title:first').text().trim(),
        activity_detail = isWorkout ? workoutDetail($activity) : [title],
        activity_time = get_activity_datetime($activity),
        url = $activity.find('.action_time').attr('href'),
        image = get_activity_image($activity),
        image_src;

    if (activity_time) title.push(activity_time);

    if (!image.length) {
        image_src = FitotasticImages.workout_logo;
    } else {
        image_src = image[0].src;
    }
    activities_list.push({
        title: title[0],
        age: get_activity_datetime($this),
        activity_age: $this.data('activity_age'),
        id: this.id.split('_').pop(),
        href: url || '#',
        image_src: image_src,
        details: activity_detail,
        isWorkout: isWorkout
    });
    return activities_list;
}

function getProppables(id, start, callback) {
    xhr.get(stream_urlizer({id: id, start: start}), function (html) {
        var $dom = $(srcPrevent(html)),
            page_age = activity_age($dom.find('.stream_item:first'));

        if (isNaN(page_age) || page_age > (24 * getMaxProppableAge())) {
            return callback(null, []);
        }

        var activities = $dom.find(getProppableTypes()).not(proppableFilter),
            activities_list = [];

        _.reduce(activities.toArray(), activityDetail, activities_list);

        callback(null, activities_list);
    });
}

module.exports = {
    init: function (username, xhrQueue) {
        me = username;
        xhr = xhrQueue;
        return getProppables;
    }
};
},{"../config.json":6}],9:[function(require,module,exports){
// Eliminates the need to do data && data.prop && data.prop.subprop testing
function resolver(prop_string, data) {
    // Handles null, undefined, and top-layer props (data.prop)
    if (data == null || prop_string.indexOf('.') === -1) {
        return data ? data[prop_string] : undefined;
    }
    var props = prop_string.split('.'),
        p = props.length,
        result = data,
        i, prop;
    for (i = 0; i < p;  i++) {
        prop = props[i];
        result = result[prop];
        if (result === undefined) {
            return undefined;
        }
    }
    return result;
}

module.exports = resolver;
},{}],10:[function(require,module,exports){
// Prevent loading of images when loading html into $()
module.exports = function srcPrevent(html) {
    return (html||'').replace(/\bsrc\b/g, 'src-attr');
};
},{}],11:[function(require,module,exports){
var async = require('async'),
    database = require('./modules/database'),
    Messenger = require('../shared/messaging'),
    resolver = require('./helpers/resolver'),
    friends = require('./friends'),
    xhr = require('./modules/xhrQueue');

//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var db, friends_updated;
database.connect(function (err, s) {
    if (err) console.error('could not connect to database: ' + err);
    console.log('database is ' + s);
    App.db = db = s;
    App.friends = friends.init(App);
});



// function _friendUpdater() {
//     setTimeout(function () {
//         App.getFriends(_friendUpdater);
//     }, Math.floor(STALE * 0.75));
// }
var App = {

    site: 'https://www.fitocracy.com',

    xhr: xhr,

    messaging: new Messenger('bg'),

    options: kango.storage.getItem('appOptions')||{ "mffs_who":"friends", "active":"on", "mffs_active_days":90 },

    // getPerformanceData: function (id_list, done) {
    //     var csv_data = [];
    //     async.forEach(
    //         id_list,
    //         function (id, next) {
    //             xhr.get('https://www.fitocracy.com/_get_activity_history_json/?activity-id=' + id, function (data) {
    //                 csv_data.push(generate_csv(data));
    //                 next();
    //             });
    //         },
    //         function (err) {
    //             done(csv_data);
    //         }
    //     );
    // },

    getUserData: function (username, callback) {
        xhr.get(
            'https://www.fitocracy.com/get_user_json_from_username/' + username + '/',
            function (data) { callback(data); }
        );
    },

    getMyData: function (callback) {
        if (!this.myData) {
            this.get_me(function (me) {
                this.getUserData(me, function (data) {
                    this.myData = data;
                    callback(data);
                });
            });
        } else {
            callback(this.myData);
        }
    },

    // getFriends: ,

    get_me: function (callback) {
        var me = App.me || kango.storage.getItem('me');
        if (me) return callback(me);

        xhr.get('https://fitocracy.com/profile/', function (html) {
            var match = html.match(/(\w+)'s Profile/);
            if (match && match[1]) App.me = match[1];
            kango.storage.setItem('me', App.me);
            callback(App.me);
        });
    }
};

kango.addMessageListener('RPC', function (msg) {
    var payload = msg.data,
        args = [],
        method, fail;
    if (!payload.method) {
        fail = true;
    } else {
        method = resolver(payload.method, App) || resolver(payload.method, kango);
        fail = !method;
    }

    if (fail) return msg.source.dispatchMessage(
        'RPC_Error',
        {error: 'No method or method not found.', original_msg: msg.data}
    );
    if (payload.data) args.push(payload.data);
    args.push(function (data) {
        msg.source.dispatchMessage(payload.channel, data);
    });
    method.apply(null, args);
});

App.messaging.on('app:*', function (channel, payload, msg) {
    var split = channel.substr(4).split(':'),
        action = (split.length === 2) ? split.pop() : null,
        target = (split.length) ? split.pop() : null,
        args = [],
        method_list = [],
        obj = App,
        method;
    if (action) method_list.push(action);
    if (target && typeof App[target] !== 'object') {
        method_list.push(target);
    } else {
        obj = App[target];
    }
    if (method_list.length && (method = obj[method_list.join('_')])) {
        if (payload) args.push(payload);
        args.push(function (payload) {
            App.messaging.send(channel, payload, msg.source);
        });
        method.apply(App, args);
    }
});

module.exports = App;

},{"../shared/messaging":15,"./friends":7,"./helpers/resolver":9,"./modules/database":12,"./modules/xhrQueue":13,"async":1}],12:[function(require,module,exports){
var db = require('db.js');
var schema = require('../schema.json');
var connection;

module.exports = {
    connect: function (cb) {
        if (!connection) {
            db.open( {
                server: 'fitotastic',
                version: 1,
                schema: schema
            } ).done( function ( conn ) {
                connection = conn;
                cb(null, conn);
            } );
        } else {
            cb(null, connection);
        }
    }
};

},{"../schema.json":14,"db.js":4}],13:[function(require,module,exports){
var async = require('async');
var config = require('../config.json');

var xhrQueue;

// worker function for processing queued xhr tasks
function xhrQueueWorker(task, next) {
    if (!task || !task.options || !task.options.url) return next();
    if (!task.options.type) task.options.type = 'GET';
    $.ajax(task.options).done(function () {
        if (task.success) task.success.apply(null, arguments);
        next();
    }).fail(function (jqXhr, status, descr) {
        console.warn("Unable to complete XHR: " + JSON.stringify(task.options));
        console.error(status + ": " + descr);
        if (task.error) task.error.apply(null, arguments);
        next();
    });
}

function getQueue() {
    if (!xhrQueue) xhrQueue = async.queue(xhrQueueWorker, config.maxConcurrentXHR);
    return xhrQueue;
}

function add(task) {
    if (task) getQueue().push(task);
}

function get(url, success, opts, fail) {
    if (!url) return;
    var payload = {};
    opts = opts || {};
    opts.url = url;
    payload.options = opts;
    if (typeof success === 'function') payload.success = success;
    if (typeof fail === 'function') payload.fail = fail;
    add(payload);
}

function post(url, success, opts, fail) {
    opts = opts || {};
    opts.type = 'POST';
    get(url, success, opts, fail);
}

module.exports = {
	getQueue: getQueue,

    add: add,

    get: get,

    post: post
};
},{"../config.json":6,"async":1}],14:[function(require,module,exports){
module.exports={
  "friends": {
    "key": { "keyPath": "id" },
    "indexes": {
      "followed": { },
      "username": { "unique": true },
      "level": {},
      "last_workout": {}
    }
  }
}
},{}],15:[function(require,module,exports){
var WildEmitter = require('wildemitter');

function Messenger (myEnd) {
    this.name = myEnd;
    WildEmitter.call(this);
    this.initialize();
}

Messenger.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: Messenger
    },
        
    send: {
        value: function (channel, payload, target) {
            if (!target) target = kango;
            target.dispatchMessage('fitotastic_messaging', {
                channel: channel,
                payload: payload,
                from: this.name
            });
        }
    },

    initialize: {
        value: function () {
            var self = this;
            kango.addMessageListener('fitotastic_messaging', function (msg) {
                if (msg.data.from === this.name) return;
                console.log('message received at ' + self.name, msg.data);
                self.emit(msg.data.channel, msg.data.payload, msg);
            });
        }
    }
});


module.exports = Messenger;
},{"wildemitter":5}],16:[function(require,module,exports){
(function () {
var root = this, exports = {};

// The jade runtime:
var jade = exports.jade=function(exports){Array.isArray||(Array.isArray=function(arr){return"[object Array]"==Object.prototype.toString.call(arr)}),Object.keys||(Object.keys=function(obj){var arr=[];for(var key in obj)obj.hasOwnProperty(key)&&arr.push(key);return arr}),exports.merge=function merge(a,b){var ac=a["class"],bc=b["class"];if(ac||bc)ac=ac||[],bc=bc||[],Array.isArray(ac)||(ac=[ac]),Array.isArray(bc)||(bc=[bc]),ac=ac.filter(nulls),bc=bc.filter(nulls),a["class"]=ac.concat(bc).join(" ");for(var key in b)key!="class"&&(a[key]=b[key]);return a};function nulls(val){return val!=null}return exports.attrs=function attrs(obj,escaped){var buf=[],terse=obj.terse;delete obj.terse;var keys=Object.keys(obj),len=keys.length;if(len){buf.push("");for(var i=0;i<len;++i){var key=keys[i],val=obj[key];"boolean"==typeof val||null==val?val&&(terse?buf.push(key):buf.push(key+'="'+key+'"')):0==key.indexOf("data")&&"string"!=typeof val?buf.push(key+"='"+JSON.stringify(val)+"'"):"class"==key&&Array.isArray(val)?buf.push(key+'="'+exports.escape(val.join(" "))+'"'):escaped&&escaped[key]?buf.push(key+'="'+exports.escape(val)+'"'):buf.push(key+'="'+val+'"')}}return buf.join(" ")},exports.escape=function escape(html){return String(html).replace(/&(?!(\w+|\#\d+);)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")},exports.rethrow=function rethrow(err,filename,lineno){if(!filename)throw err;var context=3,str=require("fs").readFileSync(filename,"utf8"),lines=str.split("\n"),start=Math.max(lineno-context,0),end=Math.min(lines.length,lineno+context),context=lines.slice(start,end).map(function(line,i){var curr=i+start+1;return(curr==lineno?"  > ":"    ")+curr+"| "+line}).join("\n");throw err.path=filename,err.message=(filename||"Jade")+":"+lineno+"\n"+context+"\n\n"+err.message,err},exports}({});


// create our folder objects
exports["mffs"] = {};

// activity.jade compiled template
exports["mffs"]["activity"] = function anonymous(locals) {
    var buf = [];
    var locals_ = locals || {}, note = locals_.note, pr = locals_.pr, name = locals_.name;
    buf.push("<span" + jade.attrs({
        title: note + (locals.pr ? (locals.note ? "\n" : "") + "PR: " + pr : ""),
        "class": [ "mffs_activity", (note ? "note" : "") + (locals.pr ? "mffs_pr" : "") ]
    }, {
        "class": true,
        title: true
    }) + ">" + jade.escape(null == (jade.interp = name) ? "" : jade.interp) + "</span>");
    return buf.join("");
};

// convo.jade compiled template
exports["mffs"]["convo"] = function anonymous(locals) {
    var buf = [];
    var locals_ = locals || {}, headline = locals_.headline, body = locals_.body;
    buf.push('<span class="convo"><div class="mffs_detail"><h4>' + jade.escape((jade.interp = headline) == null ? "" : jade.interp) + ":</h4><p>" + jade.escape((jade.interp = body) == null ? "" : jade.interp) + "</p>");
    if (reply) {
        var reply = reply.split(":");
        buf.push("<p> <em>" + jade.escape((jade.interp = reply[0]) == null ? "" : jade.interp) + "</em><br/>" + jade.escape((jade.interp = reply[1]) == null ? "" : jade.interp) + "</p>");
    }
    buf.push("</div></span>");
    return buf.join("");
};

// friend.jade compiled template
exports["mffs"]["friend"] = function anonymous(locals) {
    var buf = [];
    var locals_ = locals || {}, id = locals_.id, followed = locals_.followed, pic_url = locals_.pic_url, username = locals_.username, level = locals_.level, info = locals_.info, throbber = locals_.throbber;
    buf.push("<td" + jade.attrs({
        id: "user_" + id
    }, {
        id: true
    }) + "><div" + jade.attrs({
        "data-id": id,
        "class": [ "mffs_friend", followed ? "followed" : "" ]
    }, {
        "class": true,
        "data-id": true
    }) + "><img" + jade.attrs({
        src: pic_url,
        "class": [ "friend_pp" ]
    }, {
        src: true
    }) + '/><span class="mffs_user">' + jade.escape(null == (jade.interp = username) ? "" : jade.interp) + '</span><span class="mffs_level">' + jade.escape(null == (jade.interp = level) ? "" : jade.interp) + '</span><div class="mffs_detail"><ul><li><a' + jade.attrs({
        href: "/profile/" + username + "/"
    }, {
        href: true
    }) + "><strong>" + jade.escape(null == (jade.interp = username) ? "" : jade.interp) + "</strong><em> \n(" + jade.escape((jade.interp = level) == null ? "" : jade.interp) + ")");
    if (followed) {
        buf.push("&nbsp;&#x2714;");
    }
    buf.push('</em></a></li><li class="info">' + (null == (jade.interp = info) ? "" : jade.interp) + '</li></ul><textarea maxlength="500" cols="27" rows="5"></textarea><button class="pill-btn munsell-blue-btn">Post</button></div></div><p class="proppables">' + (null == (jade.interp = throbber) ? "" : jade.interp) + "</p></td>");
    return buf.join("");
};

// goto_link.jade compiled template
exports["mffs"]["goto_link"] = function anonymous(locals) {
    var buf = [];
    var locals_ = locals || {}, page = locals_.page;
    buf.push("<a" + jade.attrs({
        href: "#",
        "data-mffs_page": page,
        "class": [ "mffs_goto" ]
    }, {
        href: true,
        "data-mffs_page": true
    }) + ">" + jade.escape(null == (jade.interp = page) ? "" : jade.interp) + "</a>");
    return buf.join("");
};

// nav.jade compiled template
exports["mffs"]["nav"] = function anonymous(locals) {
    var buf = [];
    buf.push('<div class="mffs_nav"><a href="#" class="mffs_prev">&laquo;</a><div class="mffs_pages"></div><a href="#" class="mffs_next">&raquo;</a><button class="prop_all pill-btn munsell-blue-btn">Prop All</button></div>');
    return buf.join("");
};

// proppable.jade compiled template
exports["mffs"]["proppable"] = function anonymous(locals) {
    var buf = [];
    var locals_ = locals || {}, id = locals_.id, activity_age = locals_.activity_age, title = locals_.title, href = locals_.href, image_src = locals_.image_src, age = locals_.age, details = locals_.details;
    buf.push("<span" + jade.attrs({
        "data-id": id,
        "data-activity_age": activity_age,
        "class": [ "proppable" ]
    }, {
        "data-id": true,
        "data-activity_age": true
    }) + "><a" + jade.attrs({
        title: title,
        href: href,
        "data-activity-id": id
    }, {
        title: true,
        href: true,
        "data-activity-id": true
    }) + "><img" + jade.attrs({
        src: image_src
    }, {
        src: true
    }) + '/></a><span class="mffs_detail"><h4>' + jade.escape(null == (jade.interp = title) ? "" : jade.interp) + "<span>" + jade.escape(null == (jade.interp = age !== "now" ? age + " ago" : age) ? "" : jade.interp) + "</span></h4><ul>");
    if (details.length) {
        (function() {
            var $$obj = details;
            if ("number" == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var item = $$obj[$index];
                    buf.push("<li>" + (null == (jade.interp = item) ? "" : jade.interp) + "</li>");
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var item = $$obj[$index];
                    buf.push("<li>" + (null == (jade.interp = item) ? "" : jade.interp) + "</li>");
                }
            }
        }).call(this);
    }
    buf.push('</ul><textarea maxlength="500" cols="27" rows="5"></textarea><button class="pill-btn munsell-blue-btn">Comment</button></span></span>');
    return buf.join("");
};

// style.jade compiled template
exports["mffs"]["style"] = function anonymous(locals) {
    var buf = [];
    buf.push('<style type="text/css">#mffs_modal h2 {\n  font-size: 24px;\n}\n#mffs_modal .modal_contents {\n  padding-top: 0;\n}\n#mffs_modal .widget-subsection:first-of-type {\n  padding: 6px 12px;\n}\n#mffs_modal .mffs_friend {\n  position: relative;\n  display: block;\n}\n#mffs_modal .mffs_friend img.friend_pp {\n  width: 128px;\n  height: 128px;\n}\n#mffs_modal .mffs_friend:hover .mffs_detail {\n  display: block;\n}\n#mffs_modal .mffs_user,\n#mffs_modal .mffs_level {\n  position: absolute;\n  top: 1px;\n  left: 2px;\n  color: #1da6da;\n  text-shadow: 1px 1px 1px #000;\n}\n#mffs_modal .mffs_level {\n  left: auto;\n  right: 8px;\n}\n#mffs_modal .mffs_detail {\n  display: none;\n  position: absolute;\n  width: 200px;\n  top: 16px;\n  left: 16px;\n  z-index: 3;\n  padding: 0.25em 0.5em;\n  border-radius: 4px;\n  border: none;\n  background: #f4f5f5;\n  box-shadow: 3px 3px 6px #444;\n}\n#mffs_modal .mffs_detail textarea {\n  height: 48px;\n}\n#mffs_modal .mffs_detail li.info {\n  white-space: pre-line;\n}\n#mffs_modal .convo {\n  position: relative;\n  margin-bottom: -10px;\n  z-index: 1;\n  display: inline-block;\n  height: 24px;\n  width: 24px;\n  background: url("/site_media/images/master-sprite.png?v080612") no-repeat;\n  background-position: -504px -16px;\n  -webkit-transform: scale(0.75);\n}\n#mffs_modal .convo:hover .mffs_detail {\n  display: block;\n  padding: 6px;\n  font-size: 2rem;\n}\n#mffs_modal .proppable {\n  position: relative;\n}\n#mffs_modal .proppable:hover .mffs_detail {\n  display: block;\n}\n#mffs_modal .proppable .mffs_activity {\n  padding-left: 12px;\n  position: relative;\n}\n#mffs_modal .proppable .mffs_activity.note:before {\n  position: absolute;\n  left: -6px;\n  width: 21px;\n  height: 18px;\n  content: "\\270D";\n  font-size: 18px;\n}\n#mffs_modal .proppable .mffs_activity.mffs_pr {\n  color: #8bc53f;\n}\n#mffs_modal .proppable .mffs_activity.mffs_pr.note {\n  padding-left: 21px;\n}\n#mffs_modal .proppable .mffs_activity.mffs_pr.note:before {\n  left: 5px;\n}\n#mffs_modal .proppable .mffs_activity.mffs_pr:after {\n  position: absolute;\n  left: 0px;\n  top: 3px;\n  width: 8px;\n  height: 8px;\n  content: "";\n  background: url("/site_media/images/master-sprite.png?v080612") no-repeat;\n  background-position: -224px 0px;\n}\n#mffs_modal .proppables .mffs_detail {\n  left: 30px;\n  top: 2px;\n}\n#mffs_modal .proppables .propped::before {\n  z-index: 2;\n  pointer-events: none;\n  position: absolute;\n  content: "";\n  width: 32px;\n  height: 16px;\n  top: -18px;\n  left: 4px;\n  background: url("data:image/png;base64,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") no-repeat;\n}\n#mffs_modal .proppables .propped img {\n  opacity: 0.6;\n}\n#mffs_modal .proppables .proppable img {\n  height: 40px;\n  width: 40px;\n}\n#mffs_modal .proppables .no-work {\n  color: #933;\n}\n#mffs_modal .proppables h4 span {\n  margin-left: 1em;\n  display: inline-block;\n  font-size: 0.75em;\n  color: #0f536d;\n}\n#mffs_modal .mffs_nav {\n  position: absolute;\n  top: 12px;\n  left: 152px;\n  width: 300px;\n}\n#mffs_modal .mffs_nav .prop_all {\n  position: absolute;\n  top: -8px;\n  right: -100px;\n}\n#mffs_modal .mffs_nav .mffs_next,\n#mffs_modal .mffs_nav .mffs_prev {\n  line-height: 150%;\n  height: 1.5em;\n  position: absolute;\n  top: 0;\n}\n#mffs_modal .mffs_nav .mffs_next {\n  text-align: right;\n  right: 0px;\n}\n#mffs_modal .mffs_nav .mffs_prev {\n  left: 0px;\n}\n#mffs_modal .mffs_nav a {\n  min-width: 1em;\n  max-width: 1.5em;\n  font-size: 1.5em;\n  text-align: center;\n  text-decoration: none;\n  border-radius: 4px;\n}\n#mffs_modal .mffs_nav a:hover,\n#mffs_modal .mffs_nav a.mffs_active {\n  background: #c6e9f6;\n  color: #0f536d;\n}\n#mffs_modal .mffs_pages {\n  margin: 0 1.5em;\n  border: 1px solid #ccc;\n  border-width: 0px 1px;\n  overflow: hidden;\n  height: 35px;\n}\n#mffs_modal .mffs_goto {\n  display: inline-block;\n  line-height: 150%;\n  height: 1.5em;\n  margin-right: 0.15em;\n}\n#mffs_modal table tr:nth-of-type(n+3) .mffs_detail {\n  top: auto;\n  bottom: 20px;\n}\n#mffs_modal table tr td {\n  border: none;\n  width: 140px;\n  padding-left: 0;\n}\n#mffs_modal table tr td:nth-child(n+4) .mffs_detail {\n  left: auto;\n  right: 30px;\n}\n</style>');
    return buf.join("");
};

// style.jade compiled template
exports["style"] = function anonymous(locals) {
    var buf = [];
    buf.push('<style type="text/css">#fitotastic_container {\n  position: fixed;\n  top: 54px;\n  right: 0px;\n  min-width: 150px;\n  z-index: 50;\n}\n#fitotastic {\n  display: block;\n  float: right;\n  font-size: 0.1rem;\n  text-indent: -1000em;\n  margin-right: -1000px;\n  margin-top: -48px;\n  width: 1048px;\n  height: 48px;\n  background-repeat: no-repeat;\n  background-image: url("data:image/png;base64,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");\n}\n#fitotastic_menu {\n  background: #fff;\n  -webkit-box-shadow: 2px 3px 3px 1px #999;\n  box-shadow: 2px 3px 3px 1px #999;\n  -webkit-border-radius: 4px;\n  border-radius: 4px;\n}\n#fitotastic_menu a {\n  font-size: 1.6rem;\n}\n</style>');
    return buf.join("");
};


// attach to window or export with commonJS
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = exports;
} else if (typeof define === "function" && define.amd) {
    define(exports);
} else {
    root.templatizer = exports;
}

})();
},{"fs":2}]},{},[11])
(11)
});
;