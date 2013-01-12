// ==UserScript==
// @name Main Content Script
// @include https://www.fitocracy.com/*
// @include http://www.fitocracy.com/*
// @require lib/jquery.1.8.3.min.js
// @require lib/jquery-ui.1.9.2.min.js
// @require lib/jquery.inputMath.min.js
// @require lib/underscore.1.4.3.min.js
// @require lib/async.js
// @require includes/conversationalist.js
// @require includes/top_of_the_props.js
// @require includes/nsfw_hider.js
// @require includes/my_fito_friend_stalker.js
// ==/UserScript==

var div = $('<div id="fitotastic_container"/>'),
    btn = $('<button type="button" class="pill-btn red-btn" id="fitotastic">Fitotastic</button>'),
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
div.css({
    position: "fixed",
    top: "15px",
    right: "20px",
    width: "250px",
    "z-index": 50
});
menu.css({
    padding: "20px",
    background: "#FFF",
    "-webkit-box-shadow":  '2px 3px 3px 1px #999',
    "box-shadow":  '2px 3px 3px 1px #999',
    "-webkit-border-radius": '4px',
    "border-radius": '4px'
});
btn.click(function (e) {
    e.preventDefault();
    menu[(menu.is(':visible')) ? 'hide' : 'show']();
});
div.append($('<p />').append(btn));
div.append(menu);
$(document.body).append(div).on('click', function (e) {
    if (((e.srcElement !== btn[0] || e.target !== btn[0]) && ($(e.srcElement).closest(menu).length === 0))) {
        menu.hide();
    }
}).on('keydown', function (e) {
    if ((e.keyCode && e.keyCode === 27)) {
        $('#mask, .modal_window').hide();
        menu.hide();
    }
}).on('focus', '[maxlength]', function (e) {
    var $this = $(this),
        css_props = $.extend({
            position:'relative',
            left:'2px',
            color:'#aaa'
        }, (this.id === 'status_text') ? { left: '4px' } : { top: '-28px' }),
        $indicator = indicator_cache[this.id] || (indicator_cache[this.id] = $('<span/>').css(css_props)).insertAfter($this);
    if (!$this.data('char_remaining_indicator')) {
        $this.keyup(function () {
            $indicator.text($this.prop('maxlength')-$this.val().length);
        });
        $this.data('char_remaining_indicator', true);
    }
    
});
menu.hide();
Totp.init(App);
Conversationalist.init();
HideNSFW.init(App);
Mffs.init(App);
$('#entry_items').inputMath(null, 'input:visible');

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

App.me = App.getCookie('km_ai');
