//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var server;
db.open( {
    server: 'my-app',
    version: 1,
    schema: {
        friends: {
            key: { keyPath: 'id' },
            // Optionally add indexes
            indexes: {
                followed: { },
                username: { unique: true },
                level: {},
                last_workout: {}
            }
        }
    }
} ).done( function ( s ) {
    server = s;
} );

function _friendUpdater() {
    setTimeout(function () {
        App.getFriends(_friendUpdater);
    }, Math.floor(STALE * 0.75));
}
var App = {
    options: kango.storage.getItem('appOptions'),

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

        if (old_data && _.isArray(old_data)) {
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
    },

    getFriends: function (user, callback) {
        var friend_url_tpl = _.template('https://www.fitocracy.com/get-user-friends/?user=<%= user %>&page=<%= page %>&followers=true'),
            retrieve = function (page) {
                $.getJSON(friend_url_tpl({user: user, page: page}), function (friends) {
                    if (_.isArray(friends)) {
                        async.forEach(friends, function (friend, done) {
                            setLastWorkout(friend, function (friend) {
                                payload.push(friend);
                                done();
                            });
                        }, function (err) {
                            if (friends.length < 5) {
                                App.appendUnique('friends', payload);
                                return callback(payload);
                            }
                            retrieve(++page);
                        });
                        
                    }
                });
            },
            payload = kango.storage.getItem('friends'),
            fresh = (Date.now() - (kango.storage.getItem('friends_freshness')||0)) < STALE;
        if (payload) callback(payload);
        if (!fresh || !payload) {
            payload = [];
            retrieve(0);
        }
    }
};


kango.addMessageListener('App:getPerformanceData', function (msg) {
    App.getPerformanceData(msg.data.ids, function (data) {
        msg.source.dispatchMessage(msg.data.channel, data);
    });
});

kango.addMessageListener('RPC', function (msg) {
    var payload = msg.data;
    if (!payload.data || !payload.method || !App[payload.method]) return msg.source.dispatchMessage(
        'RPC_Error',
        {error: 'No method or method not found.', original_msg: msg.data}
    );
    App[payload.method](payload.data, function (data) {
        msg.source.dispatchMessage(payload.channel, data);
    });
});

_friendUpdater();

function setLastWorkout(friend, cb) {
    var workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT');
    $.get(workout_urlizer({user_id: friend.id}), function (html) {
        var activity = $(html.replace(/\bsrc\b/g, 'src-attr')).find('.action_time:first'),
            last_ts = activity.length ? Date.parse(activity.text().trim()) : NaN;
        if (last_ts) friend.last_workout = last_ts;
        cb(friend);
    });
}
