FitotasticUI = (function () {
    var $content = $('#content'),
    content_right = ($content.offset().left + $content.width()),
    right_margin = $(document).width() - content_right,
    div = $('<div id="fitotastic_container"/>'),
    btn = $('<a id="fitotastic">F!</a>'),
    menu = $('<ul id="fitotastic_menu" class="vert-nav" />');

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

    return {
        init: function (App) {
            App.UI.menu = menu;
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
        }
    };
})(div, menu);
