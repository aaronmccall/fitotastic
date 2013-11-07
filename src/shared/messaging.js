var WildEmitter = require('wildemitter');

function Messenger (myEnd) {
    this.name = myEnd;
    WildEmitter.call(this);
    this.initialize();
}

Messenger.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: Messenger
    },
        
    send: {
        value: function (channel, payload, target) {
            if (!target) target = kango;
            target.dispatchMessage('fitotastic_messaging', {
                channel: channel,
                payload: payload,
                from: this.name
            });
        }
    },

    initialize: {
        value: function () {
            var self = this;
            kango.addMessageListener('fitotastic_messaging', function (msg) {
                if (msg.data.from === this.name) return;
                console.log('message received at ' + self.name, msg.data);
                self.emit(msg.data.channel, msg.data.payload, msg);
            });
        }
    }
});


module.exports = Messenger;