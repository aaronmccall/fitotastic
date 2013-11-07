var $content = $('#content'),
    content_right = ($content.offset().left + $content.width()),
    right_margin = $(document).width() - content_right,
    div = $('<div id="fitotastic_container"/>'),
    btn = $('<a id="fitotastic">F!</a>'),
    menu = $('<ul id="fitotastic_menu" class="vert-nav" />'),
    indicator_cache = {},
    templatizer = require('./templates');

var UI = module.exports = {
    div: div,
    btn: btn,
    menu: menu,
    addItem: function (menu_item) {
        var li = $('<li/>');
        li.append(menu_item);
        App.UI.menu.append(li);
    },

    modals: {},

    getModal: function (id, h2_text, css_opts, position_opts) {
        if (UI.modals[id]) return UI.modals[id];
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
        $modal_content.append('<p style="text-align:center;">' + UI.throbber + '</p>');
        $modal.position(position_opts || {
            my: "center",
            at: "center",
            of: window
        });
        UI.modals[id] = $modal;
        return $modal;
    },

    throbber: '<img class="throbber" src="https://s3.amazonaws.com/static.fitocracy.com/site_media/images/ajax-loader.gif" />',

    init: function (initCallback) {
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
            if (((e.srcElement !== btn[0] || e.target !== btn[0]) /*&& ($(e.srcElement).closest(menu).length === 0)*/)) {
                menu.hide(100);
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
                        if (id === 'status_text') return { left: '4px' };
                        if (id === 'info') return { top: '-4px' };
                        return { top: '-28px' };
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
        initCallback();
    }
};