var async = require('async'),
    database = require('./modules/database'),
    Messenger = require('../shared/messaging'),
    resolver = require('./helpers/resolver'),
    xhr = require('./modules/xhrQueue');

//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var db, friends_updated;
database.connect(function ( s ) {
    db = s;
});



// function _friendUpdater() {
//     setTimeout(function () {
//         App.getFriends(_friendUpdater);
//     }, Math.floor(STALE * 0.75));
// }
var App = {

    messaging: new Messenger('bg'),

    options: kango.storage.getItem('appOptions'),

    getPerformanceData: function (id_list, done) {
        var csv_data = [];
        async.forEach(
            id_list,
            function (id, next) {
                xhr.add({
                    url: 'https://www.fitocracy.com/_get_activity_history_json/?activity-id=' + id,
                    cb: function (data) {
                        csv_data.push(generate_csv(data));
                        next();
                    }
                });
            },
            function (err) {
                done(csv_data);
            }
        );
    },

    getUserData: function (username, callback) {
        xhr.add({
            url: 'https://www.fitocracy.com/get_user_json_from_username/' + username + '/',
            cb: function (data) {
                callback(data);
            }
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
        // var friend_url_tpl = _.template('https://www.fitocracy.com/get-user-friends/?user=<%= user %>&page=<%= page %>&followers=true'),
        //     retrieve = function (page) {
        //         $.getJSON(friend_url_tpl({user: user, page: page}), processor);
        //     },
        //     payload = kango.storage.getItem('friends'),
        //     fresh = (Date.now() - (kango.storage.getItem('friends_freshness')||0)) < STALE;
        // function processor(friends) {
        //     if (_.isArray(friends)) {
        //         async.forEach(friends, function (friend, friend_done) {
        //             async.waterfall(
        //                 function (cb) {
        //                     setLastWorkout(friend, cb);
        //                 },
        //                 function (friend, cb) {},
        //                 function (friend, cb) {},
        //                 function (err, friend) {
        //                     friend_done();
        //                 }
        //             );
                    
        //         }, function (err) {
        //             if (friends.length < 5) {
        //                 App.appendUnique('friends', payload);
        //                 return callback(payload);
        //             }
        //             retrieve(++page);
        //         });
                
        //     }
        // }
        // if (payload) callback(payload);
        // if (!fresh || !payload) {
        //     payload = [];
        //     retrieve(0);
        // }
        callback([]);
    },

    get_me: function (callback) {
        var me = App.me || kango.storage.getItem('me');
        if (me) return callback(me);

        $.get('https://fitocracy.com/profile/', function (html) {
            var match = html.match(/(\w+)'s Profile/);
            if (match && match[1]) App.me = match[1];
            kango.storage.setItem('me', App.me);
            callback(me);
        });
    }
};

kango.addMessageListener('RPC', function (msg) {
    var payload = msg.data,
        args = [],
        method, fail;
    if (!payload.method) {
        fail = true;
    } else {
        method = resolver(payload.method, App) || resolver(payload.method, kango);
        fail = !method;
    }

    if (fail) return msg.source.dispatchMessage(
        'RPC_Error',
        {error: 'No method or method not found.', original_msg: msg.data}
    );
    if (payload.data) args.push(payload.data);
    args.push(function (data) {
        msg.source.dispatchMessage(payload.channel, data);
    });
    method.apply(null, args);
});

App.messaging.on('app:*', function (channel, payload, msg) {
    var split = channel.substr(4).split(':'),
        action = (split.length === 2) ? split.pop() : null,
        target = (split.length) ? split.pop() : null,
        args = [],
        method_list = [], method;
    if (action) method_list.push(action);
    if (target) method_list.push(target);
    if (method_list.length && (method = App[method_list.join('_')])) {
        if (payload) args.push(payload);
        args.push(function (payload) {
            App.messaging.send(channel, payload, msg.source);
        });
        method.apply(App, args);
    }
});

module.exports = App;
