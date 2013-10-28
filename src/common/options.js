// Options stuff goes in here.
KangoAPI.onReady(function() {

    function initOptionsPage() {
        var options;
        kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
            if (options) {
                console.log(options);
                options = options;
                options.forEach(function (option) {
                    var $els = $('[name="' + option.name + '"]');
                    if ($els.length === 1) {
                        if (!!~['off', 'on'].indexOf(option.value)) {
                            $els[0].checked = true;
                        } else {
                            $els.val(option.value);
                        }
                    } else {
                        $els.filter('#mffs_' + option.value)[0].checked = true;
                    }
                });
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
                payload[entry.name] = entry.value;
            });
            kango.invokeAsync('kango.storage.setItem', 'appOptions', payload);

            kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
                if (JSON.stringify(options) === JSON.stringify(payload)) {
                    $btn.addClass('save_success');
                }
            });
        });
    }
    var scr = document.createElement('script');
    scr.src = kango.io.getResourceUrl('res/jquery.1.8.3.min.js');
    scr.onload = initOptionsPage;
    document.body.appendChild(scr);
});