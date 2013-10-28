// ==UserScript==
// @name Main Content Script
// @include https://www.fitocracy.com/*
// @include http://www.fitocracy.com/*
// @require res/jquery.1.8.3.min.js
// @require res/jquery-ui.1.9.2.min.js
// @require res/underscore.1.4.3.min.js
// @require res/async.js
// @require res/sugar-1.3.9-custom.development.js
// @require includes/ui/templates.js
// @require includes/ui/images.js
// @require includes/ui/conversationalist.js
// @require includes/ui/top_of_the_props.js
// @require includes/ui/nsfw_hider.js
// @require includes/ui/my_fito_friend_stalker.js
// @require includes/ui/dissaprop.js
// ==/UserScript==

var $content = $('#content'),
    content_right = ($content.offset().left + $content.width()),
    right_margin = $(document).width() - content_right,
    div = $('<div id="fitotastic_container"/>'),
    btn = $('<a id="fitotastic">F!</a>'),
    menu = $('<ul id="fitotastic_menu" class="vert-nav" />'),
    App = {

        modals: {},

        async: async,

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
            menu.append(li);
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

App.me = App.getCookie('km_ai') || App.getCookie('km_ni');
if (!App.me) $.get('/profile/', function (html) {
    var match = html.match(/(\w+)'s Profile/);
    if (match && match[1]) App.me = match[1];
});

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
var fitotastic_style = $('#fitotastic_style');
if (!fitotastic_style.length) {
    fitotastic_style = $('<style id="fitotastic_style" />');
    fitotastic_style.text($(templatizer.style()).text());
    $(document.body).append(fitotastic_style);
}
div.css({
    // right: (content_right - 5) + "px",
    width: ((right_margin - 5) > 150 ? (right_margin - 5) : 150) + "px"
});

btn.click(function (e) {
    e.preventDefault();
    menu[(menu.is(':visible')) ? 'hide' : 'show']();
});

div.append(btn);
div.append(menu);

$(document.body).append(div).on('click', function (e) {
    if (((e.srcElement !== btn[0] || e.target !== btn[0]) && ($(e.srcElement).closest(menu).length === 0))) {
        menu.hide();
    }
}).on('keydown', function (e) {
    // Escape key to hide modals and fitotastic menu
    if ((e.keyCode && e.keyCode === 27)) {
        $('#mask, .modal_window').hide();
        menu.hide();
    }
    // Begin charometer functionality
}).on('focus', '[maxlength]', function (e) {
    var $this = $(this),
        css_props = $.extend({
            position:'relative',
            left:'2px',
            color:'#aaa'
        }, (function (id) {
                if (id === 'status_text') {
                    return { left: '4px' };
                } else if (id === 'info') {
                    return { top: '-4px' };
                } else {
                    return { top: '-28px' };
                }
            })(this.id)
        ),
        $indicator;
    if (!$this.data('char_remaining_indicator')) {
        $indicator = indicator_cache[this.id] || (indicator_cache[this.id] = $('<span class="charometer" />').css(css_props)).insertAfter($this);
        $this.keyup(function () {
            $indicator.text($this.prop('maxlength')-$this.val().length);
        });
        $this.data('char_remaining_indicator', true);
    }
}).on('click', '.submitstatus', function () {
    $('#add_status').find('.charometer').html('');
}).on('click', '.submitcomment', function () {
    $(this).prev('.charometer').html('');
    // End charometer functionality
});

menu.hide();
Mffs.init(App);
DPN.init(App);
Totp.init(App);
Conversationalist.init();
HideNSFW.init(App);

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

/*
(function () {
    var link = $('<a>').text('Get User Data');
    link.click(function () {
        kango.dispatchMessage('App:getUserData', {username: App.getCookie('km_ai')});
    });
    kango.addMessageListener('user_data', function (msg) {
        console.dir(msg);
    });
    App.addItem(link);
})();
*/