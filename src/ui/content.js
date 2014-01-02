var reqPath = '../src/common',
    conversationalist = require('./modules/conversationalist'),
    dissaprop = require('./modules/dissaprop'),
    hidensfw = require('./modules/hidensfw'),
    totp = require('./modules/totp'),
    mffs = require('./modules/mffs'),
    App = require('./app'),
    async = require('async'),
    Messenger = require('../shared/messaging'),
    __slice = Array.prototype.slice;


App.messaging = new Messenger('ui');

App.friends = new mffs.models.Friends();
App.friends.on('all', function (event, friend, friends, opts) {
    // var args = __slice.call(arguments, 1);
    console.log('event: ' + event + "\nOptions: " + JSON.stringify(opts, null, 2));
    var channel = [App.friends.channel(), friend.channel(), event].join(':');
    App.messaging.send(channel, friend.toJSON());
});
App.friends.add({id: 1, username: 'foo'});
App.friends.get(1).followed(true);


App.UI.templates = require('./modules/templates');
App.UI.images = require('./modules/images');

module.exports = App;

// Register UI modules to initialize
App.UI.modules = [
    mffs,
    dissaprop,
    totp,
    conversationalist,
    hidensfw
];

function initCallback() {
    App.UI.modules.forEach(function (module) {
        if (module && module.init) module.init.call(module, App);
    });
}

// App.backend.send('getMe', null, function (me) {
//     console.log('content script getMe returned: ' + me);
//     App.me = me;
//     App.ready = true;
//     App.UI.init(initCallback);
// });

App.messaging.send('app:me:get');
App.messaging.once('app:me:get', function (me) {
    console.log('content script getMe returned: ' + me);
    App.me = me;
    App.ready = true;
    App.UI.init(initCallback);
});

kango.addMessageListener('RPC_Error', function (msg) {
    console.error(msg.data.error);
});

function friendUpdater (friends) {
    if (_.isArray(friends)) {
        App.friends = friends;
    }
}

// App.backend.send('getFriends', App.me, friendUpdater);

// App.backend.subscribe('app:friends:change', friendUpdater);

kango.invokeAsync('kango.storage.getItem', 'appOptions', function (options) {
    App.options = options;
});