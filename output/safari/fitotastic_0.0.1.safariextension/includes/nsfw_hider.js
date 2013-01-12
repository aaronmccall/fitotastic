/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
// Hide NSFW
var HideNSFW = (function ($) {
	return {
		init: function (app) {
			var show_nsfw = false,
				items = document.getElementsByClassName('nsfw-stream-item'),
				item_count = items.length,
				hide_nsfw = function (items) {
					var hiders = $(items).find('.up:first').each(function () {
						this.click();
					});
				},
				link = $('<a href="#" class="">Show NSFW</a>');
			link.click(function (e) {
				e.preventDefault();
				show_nsfw = true;
				$(items).find('.down:first').each(function () {
					this.click();
				});
			});
			app.addItem(link);
			hide_nsfw(items);
			setInterval(function () {
				var new_count = items.length;
				if (!show_nsfw && (new_count > item_count)) {
					hide_nsfw(items);
				}
			}, 300);
		}
	};
})(window.jQuery);