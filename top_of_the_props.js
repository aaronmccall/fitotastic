var Totp = (function ($, _) {
    var body = $(document.body),
        btn = $('<button type="button" class="pill-btn red-btn" id="top_of_the_props">Top Proppers</button>'),
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
    
    pub.init = function () {
        btn.css({ 
            position: "absolute",
            top: "18px",
            right: "50px"
        });
        body.prepend(btn);
        btn.on('click', function (e) {
            e.preventDefault();
            var $orig_modal = $('#view-all-notifications'),
                $modal = $orig_modal.clone(true),
                $modal_h2 = $modal.find('h2'),
                $modal_content = $modal.find('.modal_contents');
            $modal.attr('id','top_proppers').css('height', '400px');
            $orig_modal.after($modal);
            $modal_h2.text('Proper Proppers');
            $modal_content.empty();
            $modal_content.append('<p style="text-align:center;"><img src="https://s3.amazonaws.com/static.fitocracy.com/site_media/images/ajax-loader.gif" /></p>');
            $modal.show();
            $modal.center(0);
            $.get(url, function (list_html) {
                btn.find('img').remove();
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
    };

    return pub;
})(window.jQuery, window._);
/*
var counts = {},
    names = [],
    list = ([]).slice.call(document.querySelectorAll('li')),
    template = "",
    url = 'https://www.fitocracy.com/notifications/?start=0&end=1000000',
    key, count; 

template += '<li>' +
                '<p class="notification-content">' +
                    '<%= name %> has propped you <%= count %> times.' +
                '</p>' +
            '</li>';

console.log("List has % members", list.length); 
list.forEach(function (li) { 
    var text = li.innerText, propper; 
    if (!!~text.indexOf('props')) {
        propper = text.split(' ').shift();
        if (!counts[propper]) {
            counts[propper] = 0;
            names.push(propper);
        }
        counts[propper] += 1;
    }
});

names.sort(function (a, b) {
    if (counts[a] && counts[b]) return counts[b] - counts[a];
    return 0;
});


names.slice(0, 10).forEach(function (name) {
    count = counts[name];
    if (count && (count > 5)) {
        console.log(name, 'has propped you', count, 'times.');
    }
});
*/

// The bookmarklet

javascript:(
    function(){
        // Script loader function
        function loadScript(a,b){
            var c=document.createElement('script');
            c.type='text/javascript';
            c.src=a;
            var d=document.getElementsByTagName('head')[0],
                done=false;
            c.onload = c.onreadystatechange = function(){
                if(!done&&(!this.readyState||this.readyState=='loaded'||this.readyState=='complete')){
                    done=true;
                    b()
                }
            };
            d.appendChild(c);
        }
        // Load and init Totp
        // NOTE: Make sure that the URL points to the right version!
        loadScript( 'https://raw.github.com/gist/4072798/938891a18201880a2f81c255e0fac94d944b36e3/top_of_the_props.js', function () {
            Totp.init();
        })
    }
)()
*/