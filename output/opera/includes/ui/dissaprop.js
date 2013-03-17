// Dissaprop Prop Nuker
var DPN = (function () {
    var $notifications = $('#global_notification_bubble div'),
        notification_count = function () { return parseInt($notifications.text().trim(), 10)||0; },
        get_notifications = function (callback) {
            start = start || 0;
            end = start + 30;
            if (!end) return;
            $.get('/notifications/?start=' + start + '&end=' + end, callback);
        },
        processor = function (data) {
            var notification_urls = [],
                $prop_notifications = $(data).filter('.unread-notification')
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
                        if ($prop_notifications.length) {
                            start = start + 30;
                            get_notifications(processor);
                        }
                    }
                };
            setTimeout(controller, 0);
        },
        start = 0,
        end = 0;
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