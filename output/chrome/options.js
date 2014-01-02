// Options stuff goes in here.
KangoAPI.onReady(function() {
    var transforms = {
        mffs_active_days: function (val) {
            val = parseInt(val||NaN, 10);
            return val;
        }
    };
    function initOptionsPage() {
        var options;
        kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
            var key, val;
            if (options) {
                console.log(options);
                options = options;
                for (key in options) {
                    val = options[key];
                    var $els = $('[name="' + key + '"]');
                    if ($els.length === 1) {
                        if (!!~['off', 'on'].indexOf(val)) {
                            $els[0].checked = true;
                        } else {
                            $els.val(val);
                        }
                    } else {
                        $els.filter('#mffs_' + val)[0].checked = true;
                    }
                }
            }
        });

        var $btn = $('#opt_submit').click(function () {
            $(this).parent().submit();
        });

        $('#opt_form').submit(function (e) {
            e.preventDefault();
            var serialized = $(this).serializeArray(),
                payload = {};
            serialized.forEach(function (entry) {
                payload[entry.name] = (transforms[entry.name]) ? transforms[entry.name](entry.value) : entry.value;
            });
            kango.invokeAsync('kango.storage.setItem', 'appOptions', payload);

            kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
                if (JSON.stringify(options) === JSON.stringify(payload)) {
                    $btn.addClass('save_success');
                }
            });
        }).on('change', 'input', function (e) {
            $btn.removeClass('save_success');
        });
    }
    var scr = document.createElement('script');
    scr.src = kango.io.getResourceUrl('res/jquery.1.8.3.min.js');
    scr.onload = initOptionsPage;
    document.body.appendChild(scr);
});