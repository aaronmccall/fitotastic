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