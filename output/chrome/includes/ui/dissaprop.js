// Dissaprop Prop Nuker
var DPN = (function () {
    var START = 0,
        END = 0,
        N_INCR = 100,
        N_MAX = 2000,
        $notifications = $('#global_notification_bubble div'),
        notification_count = function () { return parseInt($notifications.text().trim(), 10)||0; },
        get_notifications = function (callback) {
            START = START || 0;
            END = START + 100;
            if (!END) return;
            $.get('/notifications/?start=' + START + '&end=' + END, callback);
        },
        processor = function (html) {
            var notification_urls = [],
                $prop_notifications = $(html).filter('.unread-notification')
                                             .filter(':contains("gave you props")')
                                             .find('a').each(function () {
                        if (this.href) notification_urls.push(this.href);
                    }),
                nuker = function (url) {
                    console.log('nuking ' + url);
                    $.get(url, function () {
                        var nCount = notification_count();
                        if (nCount) $notifications.text(nCount-1);
                        setTimeout(controller, 100);
                    });
                },
                controller = function () {
                    if (notification_urls.length) {
                        nuker(notification_urls.shift());
                    } else {
                        if ($prop_notifications.length || START <= N_MAX) {
                            START = START + N_INCR;
                            get_notifications(processor);
                        }
                    }
                };
            setTimeout(controller, 0);
        };
    return {
        init: function (app) {
            var $nuke_link = $('<a/>').attr({href: '#', "class": "dpn_nuke"}).text('Prop Bomb Neutralizer');
            $nuke_link.on('click.dpn', function (e) {
                e.preventDefault();
                get_notifications(processor);
            });
            app.addItem($nuke_link);
        }
    };
})();
