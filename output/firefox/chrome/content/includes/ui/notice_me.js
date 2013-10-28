// Notification processor
var NoticeMe = (function () {
	var $modal, $modal_contents;

	return {
		init: function (app) {
			var link = $('<a id="noticeMe" href="#">Notice Me!</a>'),
                window_height = $(window).height(),
                window_width = $(window).width();

			link.click(function (e) {
				var $style = $('#noticeMe_style');

				if (!$style.length) {
					$style = $('<style id="noticeMe_style">');
					$style.text($(templatizer.noticeMe.style()).text());
					$(document.body).append($style);
				}

                e.preventDefault();

				$modal = app.getModal('noticeMe_modal', 'My Notifications', { height: 'auto', width: (window_width-32) + 'px' }, {
                    my: 'center top',
                    at: 'center top+' + 16,
                    of: 'body',
                    collision: 'none'
                }).removeClass('gray');
				$modal_contents = $modal.find('.modal_contents').css({
                    'height': (window_height - 80) + 'px',
                    'overflow': 'scroll'
                });

				var $h2 = $modal.find('h2:first');
				if ($h2.length) {
					$h2.after(templatizer.noticeMe.nav());
					$modal.on('click', '.noticeMe_nav a', function (e) {
						e.preventDefault();
						$(this).addClass('active').siblings().removeClass('active');
					});
				} else {
					console.log('no h2 in mah modal!');
				}

				$modal.show(0, function () {
                    $('#mask').show().css('opacity', 0.5);
                });
			});

			app.addItem(link);
			// var observer = new MutationObserver(function (changes) {
			// 	changes.forEach(function (change) { console.log(change); });
			// });
			// observer.observe(
			// 	document.querySelector('#global_notifications'),
			// 	{ attributes: true, childList: true, characterData: true }
			// );
		}
	};
})();