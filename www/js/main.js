$(function () {
	$('.content').on('click', 'a', function (e) {
		var $win = $(window),
			scroll = $win.scrollTop(),
			target = $(this.hash);
		console.log('target: ' + this.hash + ' (' + target.length + ')');
		$win.one('scroll', function () {
			console.log('scrolled');
			$win.scrollTop(scroll);
			$('body').animate({"scroll-top": target.offset().top + 'px'}, 500);
		});
	});
});