var Totp = (function ($, _) {
    var body = $(document.body),
        link = $('<a href="#" id="top_of_the_props">Top Proppers</a>'),
        counts = {},
        pub = {},
        names = [],
        template = "",
        url = 'https://www.fitocracy.com/notifications/?start=0&end=1000000',
        key, count, list, renderer;

    // Set up the template and its renderer
    template += '<li>' +
                    '<p class="notification-content">' +
                        '<a href="https://www.fitocracy.com/profile/<%= name %>/">' +
                            '<%= name %> has propped you <%= count %> times.' +
                        '</a>' +
                    '</p><br />' +
                '</li>';
    renderer = _.template(template);

    function process_item() {
        var li = $(this),
            text = li.text().replace(/^\s+/g, '').replace(/\s+$/g, '');
        if (!!~text.indexOf('props')) {
            propper = text.split(' ').shift();
            if (!counts[propper]) {
                counts[propper] = 0;
                names.push(propper);
            }
            counts[propper] += 1;
        }
    }
    
    pub.init = function (app) {
        link.on('click', function (e) {
            e.preventDefault();
            var $modal = app.getModal('top_proppers', 'Proper Proppers'),
                $modal_content = $modal.find('.modal_contents');
            $modal.show();
            $.get(url, function (list_html) {
                var list = $(list_html),
                    $ul = $('<ul/>'),
                    proppers = [];
                list.each(process_item);
                // Sort names by prop count in descending order
                names.sort(function (a, b) {
                    if (counts[a] && counts[b]) return counts[b] - counts[a];
                    return 0;
                });
                names.slice(0, 20).forEach(function (name) {
                    proppers.push(renderer({name: name, count: counts[name]}));
                });
                $ul.html(proppers.join("\n"));
                $modal_content.empty();
                $modal_content.append($ul);
            });
        });
        app.addItem(link);
    };

    return pub;
})(window.jQuery, window._);