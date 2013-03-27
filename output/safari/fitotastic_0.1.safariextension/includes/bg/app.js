var Fitotastic = (function (Backbone) {
    var Fitotastic = {}, Models, Collections, Views;
    Fitotastic = {
        Models: {},
        Collections: {},
        Views: {}
    };

    // Generics


    Models = Fitotastic.Models;
    Collections = Fitotastic.Collections;
    Views = Fitotastic.Views;

    Fitotastic.HTMLCollectionFactory = function (collectionClass, options) {
        this.collectionClass = collectionClass||Backbone.Collection;
        this.options = _.extend(this.defaults, options||{});
    };
    Fitotastic.HTMLCollectionFactory.prototype = {
        // Selector for html elements representing the members of the collection
        // For example: li, .stream-item
        defaults: {
            collectionSelector: 'li',
            parsers: {}
        },
        // Parser signature
        // parsers: {
        //     attrib_name: function (element, attribs) {
        //         // do stuff and return data to store at model.attributes.attrib_name
        //     }
        // },
        select: function () {
            return SoupSelect.select.apply(null, arguments);
        },
        
        parseModel: function (model_container, index, element) {
            var model_attributes = {};
            _.each(this.options.parsers, function (parser, attribute) {
                if (parser) {
                    model_attributes[attribute] = parser.call(this, element, model_attributes);
                }
            }, this);
            model_container.push(model_attributes);
        },
        
        parseHtml: function (html) {
            var model_container = [],
                iterator = _.bind(this.parseModel, this, model_container);
            $('<div/>').html(html).find(this.options.collectionSelector).each(iterator);
            return model_container;
        },

        getCollection: function (html) {
            return new this.collectionClass(this.parseHtml(html));
        }
    };

    Models.Person = Backbone.Model.extend({
        name: 'person',
        fields: [ 'id', 'username', 'level', 'followed', 'info', 'pic', 'freshness' ],
        unique: ['id', 'username'],
        collections: ['Activities', 'Notifications'],
        save: function () {
            this.set({freshness: Date.now()}, {silent: true});
            Backbone.Model.prototype.save.apply(this, arguments);
        }
    });
    Collections.Friends = Backbone.Collection.extend({
        model: Models.Person
    });
    Models.Activity = Backbone.Model.extend({
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
    Models.Notification = Backbone.Model.extend({
        name: 'notfication',
        fields: ['id', 'user', 'type', 'timestamp', 'description'],
        unique: ['id']
    });

    Collections.Notifications = Backbone.Collection.extend({
        model: Models.Notification
    });
    NotificationsFactory = function () {
        Fitotastic.HTMLCollectionFactory.call(this, function(){}, {
            collectionSelector: 'li',
            parsers: {
                description: function (element) {
                    var link_arr = this.select(element, 'a'),
                        link = (link_arr.length) ? link_arr[0] : null;
                    if (!link) return '';
                    return link.children[0].data;
                },
                id: function (element) {
                    var link_arr = this.select(element, 'a'),
                        link = (link_arr.length) ? link_arr[0] : null,
                        id_arr = (link.attribs.href||'').match(/\d+/);
                    return (id_arr && id_arr.length) ? id_arr[0] : null;
                },
                type: function (element, attributes) {
                    var NT = Fitotastic.NotificationTypes,
                        description = attributes.description ||
                            this.options.parsers.description(element),
                        type;
                    for (type in NT) {
                        match = description.match(NT[type]);
                        if (match) break;
                    }
                    return type;
                },
                timestamp: function (element) {
                    var ts_arr = this.select(element, 'p.iso-timestamp'),
                        ts = (ts_arr.length) ? ts_arr[0] : null;
                    if (!ts) return ts;
                    return Date.parse(ts.children[0].data);
                },
                user: function (element, attributes) {
                    var description = attributes.description ||
                            this.options.parsers.description(element, attributes),
                        user_match = (description || '').match(/^(\S+)/);
                    return (user_match !== null) ? user_match[1] : user_match;
                }
            }
        });
    };
    NotificationsFactory.prototype = Object.create(Fitotastic.HTMLCollectionFactory.prototype);
    return Fitotastic;
})(Backbone);