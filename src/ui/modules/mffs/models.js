var Backbone = require('backbone');
var accessorize = require('../accessorize');


var Friend = Backbone.Model.extend({
    fields: ['username', 'followed', 'level', 'pic', 'info', 'last_workout', 'last_convo'],
    channel: function () {
        return this.id;
    }
});

var Friends = Backbone.Collection.extend({
    model: Friend,
    channel: function () {
        return 'friends';
    }
});

accessorize(Friend);

module.exports = {
    Friends: Friends
};