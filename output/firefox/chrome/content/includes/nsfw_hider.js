/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
// Hide NSFW
var HideNSFW = (function ($) {
	return {
		init: function () {
			$('.nsfw-stream-item').find('.collapse-stream-item.up').click();
		}
	};
})(window.jQuery);