var async = require('async');
var config = require('../config.json');

var xhrQueue;

// worker function for processing queued xhr tasks
function xhrQueueWorker(task, next) {
    if (!task || !task.url) return next();
    $[task.method||'get'](task.url, function () {
        if (task.cb) task.cb.apply(null, arguments);
        next();
    });
}

function getQueue() {
    if (!xhrQueue) xhrQueue = async.queue(xhrQueueWorker, config.maxConcurrentXHR);
    return xhrQueue;
}

module.exports = {
	getQueue: getQueue,

    add: function (task) {
        if (task) getQueue().push(task);
    }
};