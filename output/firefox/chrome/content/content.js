// ==UserScript==
// @name Main Content Script
// @include https://www.fitocracy.com/*
// @include http://www.fitocracy.com/*
// @require res/jquery.1.8.3.min.js
// @require res/jquery-ui.1.9.2.min.js
// @require res/underscore.1.4.3.min.js
// @require res/async.js
// @require res/sugar-1.3.9-custom.development.js
// @require includes/ui/main.js
// @require includes/ui/templates.js
// @require includes/ui/images.js
// @require includes/ui/conversationalist.js
// @require includes/ui/top_of_the_props.js
// @require includes/ui/nsfw_hider.js
// @require includes/ui/my_fito_friend_stalker.js
// @require includes/ui/dissaprop.js
// @require includes/ui/notice_me.js
// ==/UserScript==

var $content = $('#content'),
    content_right = ($content.offset().left + $content.width()),
    right_margin = $(document).width() - content_right,
    div = $('<div id="fitotastic_container"/>'),
    btn = $('<a id="fitotastic">F!</a>'),
    menu = $('<ul id="fitotastic_menu" class="vert-nav" />'),
    App = {

        modals: {},

        UI: {},

        async: async,

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

        addItem: function (menu_item) {
            var li = $('<li/>');
            li.append(menu_item);
            App.UI.menu.append(li);
        },

        getModal: function (id, h2_text, css_opts, position_opts) {
            if (this.modals[id]) return this.modals[id];
            var $orig_modal = $('#view-all-notifications'),
                $modal = $orig_modal.clone(true),
                $modal_h2 = $modal.find('h2'),
                $modal_content = $modal.find('.modal_contents');

            $modal.attr('id', id).css(css_opts || { height: '400px' });
            $orig_modal.after($modal);
            $modal.find('.close_modal').click(function (e) {
                $modal.hide(0, function () { $('#mask').hide(); });
            });
            $modal_h2.text(h2_text);
            $modal_content.empty();
            $modal_content.append('<p style="text-align:center;">' + this.throbber + '</p>');
            $modal.position(position_opts || {
                my: "center",
                at: "center",
                of: window
            });
            this.modals[id] = $modal;
            return $modal;
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
        },

        throbber: '<img class="throbber" src="https://s3.amazonaws.com/static.fitocracy.com/site_media/images/ajax-loader.gif" />'
    },
    indicator_cache = {};

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

// Register UI modules to initialize
App.UI.modules = [ Mffs, DPN, Totp, Conversationalist, HideNSFW, NoticeMe ];

// Define who the current user is
App.me = App.getCookie('km_ai') || App.getCookie('km_ni');
if (!App.me) {
    App.ready = false;
    $.get('/profile/', function (html) {
        var match = html.match(/(\w+)'s Profile/);
        if (match && match[1]) App.me = match[1];
        App.ready = true;
        App.publish('app:ready:change', true);
    });
} else {
    App.ready = true;
}

App.init = function () {
    FitotasticUI.init(App);
    App.UI.modules.forEach(function (module) {
        module.init.call(module, App);
    });
};

if (App.ready) {
    App.init();
} else {
    App.subscribe('app:ready:change', function (isReady) {
        if (isReady === true) App.init();
    });
}

kango.addMessageListener('RPC_Error', function (msg) {
    console.error(msg.data.error);
});

function friendUpdater (friends) {
    if (_.isArray(friends)) {
        App.friends = friends;
    }
}

App.backend.send('getFriends', App.me, friendUpdater);

App.backend.subscribe('app:friends:change', friendUpdater);

kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
    App.options = options;
});

// (function () {
//     var link = $('<a>').text('Get User Data');
//     link.click(function () {
//         App.backend.send('getUserData', App.me, function (msg) {
//             console.dir(msg);
//         });
//     });
//     App.addItem(link);
// })();
