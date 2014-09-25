var xhrQueue = (function (async, concurrency) {
    var queue;
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
        if (!queue) queue = async.queue(xhrQueueWorker, concurrency||1);
        return queue;
    }

    function add(task) {
        var method = 'push';
        if (task.options.priority) method = 'unshift';
        if (task) getQueue()[method](task);
    }

    function get(url, success, opts, fail) {
        if (!url) return;
        if ('object' === typeof url && arguments.length === 1) {
            opts = url;
        }
        if ('function' === typeof opts) {
            fail = opts;
            opts = {};
        }
        var task = {};
        if (!opts) opts = {};
        if (!opts.url) opts.url = url;
        task.options = opts;
        if (typeof success === 'function') task.success = success;
        if (typeof fail === 'function') task.error = fail;
        add(task);
    }

    function post(url, data, success, opts, fail) {
        if ('function' === typeof data) {
            data = data();
        }
        if ('function' === typeof opts && 'undefined' === typeof fail) {
            fail = opts;
            opts = undefined;
        }
        opts = opts || {};
        opts.data = data;
        opts.type = 'POST';
        get(url, success, opts, fail);
    }

    return {
        getQueue: getQueue,

        add: add,

        get: get,

        post: post
    };
});