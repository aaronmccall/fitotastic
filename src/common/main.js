kango.storage.clear();

var App = {
	uniquenessTesters: {
		'friends': function (old_data, new_data) {
			var old_index = [],
				final_data = old_data.slice(0);
			old_data.forEach(function (friend) {
				old_index.push(friend.username);
			});
			new_data.forEach(function (friend) {
				var index = old_index.indexOf(friend.name);
				if (!~index) {
					final_data.push(friend);
				} else {
					final_data[index] = friend;
				}
			});
			return final_data;
		}
	},
	appendUnique: function (key, new_data) {
		var old_data = kango.storage.getItem(key),
			final_data = new_data,
			tester = this.uniquenessTesters[key]||null;

		if (old_data) {
			if (tester) {
				final_data = tester(old_data, new_data);
			} else if (_.isArray(old_data) && _.isArray(new_data)) {
				final_data = _.uniq(old_data.concat(new_data));
			}

		}

		kango.storage.setItem(key, final_data);
		kango.storage.setItem(key+'_freshness', Date.now());
		return final_data;
	}
};


kango.addMessageListener('App:fetch', function (msg) {
	$.get(msg.data.url, function (data) {
		msg.source.dispatchMessage(msg.data.channel, data);
	});
});
