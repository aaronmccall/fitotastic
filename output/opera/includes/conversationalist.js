/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
var Conversationalist = (function ($, _) {
	var convos = {},
		last_word = /(\w+)$/;
	if (!String.prototype.trim) {
		String.prototype.trim = function trim() {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	function Convo(id, box) {
		this.id = id;
		this.box = box;
		this.names = [];
		this._initialized = false;
	}
	Convo.prototype = {
		init: function () {
			if (this._initialized) return;
			this._initialize_names();
			this._initialize_autocompleter();
			this._initialized = true;
		},

		_initialize_names: function () {
			var thread = $('#stream_item_' + this.id),
				author = thread.find('.stream-author').text().trim(),
				comments = thread.find('.user_comment'),
				self = this;
			
			if (author.length) this.names.push(author);

			comments.each(function () {
				var $comment = $(this),
					name = $comment.find('.comment_username_link').text().trim();
				if (name.length) self.names.push(name);
			});
			this.names = _.uniq(this.names);
		},

		_initialize_autocompleter: function () {
			var self = this;
			$(this.box).autocomplete({
				focus: function () { return false; },
				source: function (req, res) {
					var term = req.term.match(last_word)[0].toLowerCase(),
						matches = _.filter(self.names, function (item) { return !!~item.toLowerCase().indexOf(term); });
					res(matches);
				},
				search: function () {
					return !!this.value.match(/@\w+$/);
				},
				select: function (e, ui) {
					var match = ui.item.value,
						val = this.value,
						final_val = val.replace(last_word, match);
					this.value = final_val;
					return false;
				}
			});
		}
	};
	// Add click/focus handler to lazy init the autocomplete functionality
	function init() {
		$(document.body).on(
			'focus.conversationalist',
			'.user_comment_textarea',
			function (e) {
				console.log('focused comment box');
				var id = this.id.split("_").pop(),
					convo = convos[id] || (convos[id] = new Convo(id, this));
				convo.init();
			}
		);
	}

	return {
		init: init
	};
	// Autocompleter setup
})(window.jQuery, window._);