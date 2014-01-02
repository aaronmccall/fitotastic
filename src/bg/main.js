var async = require('async'),
    database = require('./modules/database'),
    Messenger = require('../shared/messaging'),
    resolver = require('./helpers/resolver'),
    friends = require('./friends'),
    xhr = require('./modules/xhrQueue');

//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var db, friends_updated;
database.connect(function (err, s) {
    if (err) console.error('could not connect to database: ' + err);
    console.log('database is ' + s);
    App.db = db = s;
    App.friends = friends.init(App);
});



// function _friendUpdater() {
//     setTimeout(function () {
//         App.getFriends(_friendUpdater);
//     }, Math.floor(STALE * 0.75));
// }
var App = {

    site: 'https://www.fitocracy.com',

    xhr: xhr,

    messaging: new Messenger('bg'),

    options: kango.storage.getItem('appOptions')||{ "mffs_who":"friends", "active":"on", "mffs_active_days":90 },

    // getPerformanceData: function (id_list, done) {
    //     var csv_data = [];
    //     async.forEach(
    //         id_list,
    //         function (id, next) {
    //             xhr.get('https://www.fitocracy.com/_get_activity_history_json/?activity-id=' + id, function (data) {
    //                 csv_data.push(generate_csv(data));
    //                 next();
    //             });
    //         },
    //         function (err) {
    //             done(csv_data);
    //         }
    //     );
    // },

    getUserData: function (username, callback) {
        xhr.get(
            'https://www.fitocracy.com/get_user_json_from_username/' + username + '/',
            function (data) { callback(data); }
        );
    },

    getMyData: function (callback) {
        if (!this.myData) {
            this.get_me(function (me) {
                this.getUserData(me, function (data) {
                    this.myData = data;
                    callback(data);
                });
            });
        } else {
            callback(this.myData);
        }
    },

    // getFriends: ,

    get_me: function (callback) {
        var me = App.me || kango.storage.getItem('me');
        if (me) return callback(me);

        xhr.get('https://fitocracy.com/profile/', function (html) {
            var match = html.match(/(\w+)'s Profile/);
            if (match && match[1]) App.me = match[1];
            kango.storage.setItem('me', App.me);
            callback(App.me);
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
        method_list = [],
        obj = App,
        method;
    if (action) method_list.push(action);
    if (target && typeof App[target] !== 'object') {
        method_list.push(target);
    } else {
        obj = App[target];
    }
    if (method_list.length && (method = obj[method_list.join('_')])) {
        if (payload) args.push(payload);
        args.push(function (payload) {
            App.messaging.send(channel, payload, msg.source);
        });
        method.apply(App, args);
    }
});

module.exports = App;
