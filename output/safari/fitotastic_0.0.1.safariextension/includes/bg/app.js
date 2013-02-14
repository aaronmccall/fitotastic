var Fitotastic = (function (Backbone) {
    var Fitotastic = {}, FBM, FBC, FBV;
    Fitotastic.Backbone = {
        Models: {},
        Collections: {},
        Views: {}
    };

    // Generics


    FBM = Fitotastic.Backbone.Models;
    FBC = Fitotastic.Backbone.Collections;
    FBV = Fitotastic.Backbone.Views;

    FBC._HTMLParsingCollection = Backbone.Collection.extend({
        // Selector for html elements representing the members of the collection
        // For example: li, .stream-item
        collectionSelector: '',

        // Parser call signature
        // function (element) {}
        parsers: {
            attrib_name: function (element, attribs) {
                // do stuff and return data to store at model.attributes.attrib_name
            }
        },

        parseModel: function (model_container, index, element) {
            var model_attributes = {};
            _.each(this.model.prototype.fields, function (attribute) {
                var parser = this.parsers[attribute];
                if (parser) {
                    model_attributes[attribute] = parser.call(this, element, model_attributes);
                }
            }, this);
            model_container.push(model_attributes);
        },

        addHtml: function (html) {
            var model_container = [];
            Backbone.$('<div>' + html + '</div>').find(this.collectionSelector).each(_.bind(this.parseModel, this, model_container));
            console.log(model_container);
            this.add(model_container);
        },

        initialize: function (models, options) {
            this.bind('add', function (model) {
                console.log('new model added: ', model.cid);
            });
            if (options.html) {
                console.log('adding models from html');
                this.addHtml(options.html);
            }
        }
    });

    FBM.Person = Backbone.Model.extend({
        name: 'person',
        fields: [ 'id', 'username', 'level', 'followed', 'info', 'pic' ],
        unique: ['id', 'username'],
        collections: ['Activities', 'Notifications']
    });
    FBM.Activity = Backbone.Model.extend({
        name: 'activity',
        fields: ['id', 'timestamp', 'type', 'payload', 'propped'],
        unique: ['id']
    });
    // Types:
    Fitotastic.NotificationTypes = {
        prop:                   /^(.*) gave you props/,
        thread_comment:         /^(.*) commented on a thread you're on/,
        activity_comment:       /^(.*) commented on your activity/,
        profile_message:        /^(.*) left a message on your profile/,
        status_mention:         /^(.*) mentioned you in a status post/,
        follow:                 /^(.*) is now following you/,
        share:                  /^(.*) has shared your post/,
        duel_begin:             /^A duel has begun/,
        duel_end:               /^A duel has ended/,
        duel_challenge:         /^(.*) has challenged you to a duel/,
        duel_accept:            /^(.*) has accepted a duel/,
        duel_expire:            /^(.*) has let a duel expire/,
        duel_join_team:         /^(.*) has joined your team in a duel/,
        group_invite:           /^(.*) invited you to join a group/,
        group_new_challenge:    /^(.*) group has created a new challenge/,
        invitee_join:           /^(.*), your invitee, has joined Fitocracy/
     };
    FBM.Notification = Backbone.Model.extend({
        name: 'notfication',
        fields: ['id', 'user_id', 'type', 'timestamp', 'description'],
        unique: ['id']
    });

    FBC.Notifications = FBC._HTMLParsingCollection.extend({
        collectionSelector: 'li',
        model: FBM.Notification,

        parsers: {
            type: function (element) {
                console.log('Notification type parser called.');
                var NT = Fitotastic.NotificationTypes,
                    type, match, who, payload = {};
                for (type in NT) {
                    match = $(element).find('.notification-content').text().trim().match(NT[type]);
                    if (match) break;
                }
                return type;
            }
        }
    });
    return Fitotastic;
})(Backbone);