// Hide NSFW
var HideNSFW = (function ($) {
	return {
		init: function () {
			$('.nsfw-stream-item').find('.collapse-stream-item.up').click();
		}
	};
})(window.jQuery);