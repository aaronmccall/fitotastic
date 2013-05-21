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
	},

	getCookie: function (name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

	getPerformanceData: function (id_list, callback) {
		var csv_data = [];
		async.forEach(
			id_list,
			function (id, cb) {
				$.get(
					'https://www.fitocracy.com/_get_activity_history_json/?activity-id=' + id,
					function (data) {
						csv_data.push(generate_csv(data));
						cb();
					});
			},
			function (err) {
				callback(csv_data);
			}
		);
	},

	getUserData: function (username, callback) {
		$.get('https://www.fitocracy.com/get_user_json_from_username/' + username + '/',
			function (data) {
				callback(data);
			});
	},

	getMyData: function (callback) {
		if (!this.me) {
			this.getUserData(this.getCookie('km_ai'), function (data) {
				this.me = data;
				callback(data);
			});
		} else {
			callback(this.me);
		}
	}
};


kango.addMessageListener('App:getPerformanceData', function (msg) {
	App.getPerformanceData(msg.data.ids, function (data) {
		msg.source.dispatchMessage(msg.data.channel, data);
	});
});

kango.addMessageListener('App:getUserData', function (msg) {
	App.getUserData(msg.data.username, function (data) {
		msg.source.dispatchMessage('user_data', data);
	});
});