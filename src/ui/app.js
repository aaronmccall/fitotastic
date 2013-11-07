var UI = require('./modules/ui'),
    App = {

        backend: {
            send: function (method, data, callback) {
                var channel = _.uniqueId(method + '_'),
                    messenger = function (msg) {
                        callback(msg.data);
                        kango.removeMessageListener(channel, messenger);
                    };
                kango.addMessageListener(channel, messenger);
                kango.dispatchMessage('RPC', {channel: channel, data: data, method: method});

            },

            subscribe: function (name, callback) {
                kango.addMessageListener(name, function (msg) {
                    callback(msg.data);
                });
            }
        },

        giveProp: function (id, cb) {
            $.post('https://www.fitocracy.com/give_prop/', {id: id}, function (data) {
                cb(data);
            });
        },

        giveCommentProp: function (id) {
            $.post('https://www.fitocracy.com/give_comment_prop/', {id: id}, function (data) {
                cb(data);
            });
        },

        getCookie: function (name) {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    };

App.UI = UI;

// Add PubSub capability to App
(function(targetObj, defContext) {
    var topics = {},
        attachTo = targetObj||this,
        defaultContext = defContext||this,
        __slice = function (obj) { return Array.prototype.slice.call(obj); };

    attachTo.publish = function() {
        var args = __slice(arguments),
            topic = args.shift();
        if (topics[topic]) {
            var currentTopic = topics[topic]||[];
            for (var i = 0, j = currentTopic.length; i < j; i++) {
                currentTopic[i].apply(null, args || []);
            }
        }
    };

    attachTo.subscribe = function(topic, callback, context) {
        var cb = callback.bind ?
            callback.bind(context||defaultContext) :
            function () {
                callback.apply(context||defaultContext, __slice(arguments));
            };
        if (!topics[topic]) topics[topic] = [];

        topics[topic].push(cb);

        return { "topic": topic, "callback": cb };
    };

    attachTo.unsubscribe = function(handle) {
        var topic = handle.topic;

        if (topics[topic]) {
            var currentTopic = topics[topic];

            for (var i = 0, j = currentTopic.length; i < j; i++) {
                if (currentTopic[i].callback === handle.callback) {
                    currentTopic.splice(i, 1);
                }
            }
        }
    };

})(App);

$(document).ajaxSend(function(event, xhr, settings) {
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", App.getCookie('csrftoken'));
    }
});

module.exports = App;
