var async = require('async');
var workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT');
var stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>');
var templatizer = require('../ui/modules/templates');
var proppables = require('./helpers/proppables');
var srcPrevent = require('./helpers/srcPrevent');
var friends = {};
var optsMap = { friends: 'following', fans: 'followers' };
//            ms     min  hrs
var STALE = ( 1000 * 60 * 60 ) * 2;
var App, db, xhr, me, getLastConvo;

// Takes to integer timestamps and return the difference in hours
function to_hours(ts1, ts2) {
    if (isNaN(ts1) || isNaN(ts2)) return NaN;
    return (ts1 - ts2) / (60 * 60 * 1000);
}

// Given a .stream_item, return its age
function activity_age(activity) {
    return to_hours(Date.now(), Date.parse(activity.find('.action_time').text().trim()||''));
}

function getCountFromGrid() {
    return friends.grid.rows * friends.grid.columns;
}

function userSort(a, b) {}

friends.setLastWO = function setLastWorkout(friend, done) {
    xhr.get(workout_urlizer({user_id: friend.id}), function (html) {
        var activity = $(srcPrevent(html)).find('.action_time:first'),
            last_ts = activity.length ? Date.parse(activity.text().trim()) : NaN;
        if (last_ts) friend.last_workout = last_ts;
        done(null, friend);
    });
};

var initGetLastConvo = function (me) {
    var author_getter = function (author) {
            return '.stream-author[href$="' + author + '/"]:first';
        },
        commenter_getter = function (commenter) {
            return '.comment_username_link[href$="' + commenter + '/"]:first';
        },
        me_author = author_getter(me),
        me_commenter = commenter_getter(me),
        convo_selector = [
            me_author,
            me_commenter
        ].join(',');

    return function ($html, friend) {
        var $this = $html.find(convo_selector).first();
        if (!$this.length) return;
        var is_comment = $this.is('.comment_username_link'),
            $item = $this.closest('.stream_item'),
            headline = $('.stream-item-headline', $item).text().replace(/\s{2,}/g, ' ')
                        .trim().replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2})/, date_prettifier),
            body = $('.stream-status', $item).text().replace(/\s{2,}/g, ' ').trim(),
            $comment = (is_comment ? $this : $(commenter_getter(friend.username), $item))
                        .closest('.comment-content').text().replace(/\s{2,}/g, ' ').trim(),
            reply;
        if  (is_comment) {
            headline = headline.replace(me, 'you');
            reply = $comment.replace(me, 'and you replied: ');
        } else {
            headline = headline.replace(me, 'You');
            reply = $comment.replace(friend.username, 'and they replied: ');
        }
        return {headline: headline, body: body, reply: reply};
    };

};

friends.get = function getFriends(page, callback) {
    var self = this,
        q = db.query('last_workout'),
        per_page = getCountFromGrid(),
        start = page * per_page,
        end = start + per_page,
        now = Date.now(),
        lowBound = now - (App.options.mffs_active_days*86400000),
        filtered;
    console.log({start: start, page: page, end: end, lowBound: lowBound, now: now });
    if (App.options.active === 'on') {

        q = q.lowerBound(lowBound);
        filtered = true;
    }
    if (!filtered) q = q.all();
    q.limit(start, end).execute().done(function (results) {
        if (!results.length && start === 0) {
            self.load({
                start: start,
                end: end,
                page: page,
                user: me
            }, function (friends) {
                callback(_.sortBy(friends, 'username'));
            });
        } else {
            callback(_.sortBy(results, 'username'));
        }
    });
};

friends.save = function saveFriend(friend, callback) {
    db.update(friend).done(function (result) {
        callback(null, friend);
    }).fail(function (result) {
        db.add(friend).done(function (result) {
            callback(null, friend);
        });
    });
};

friends.load = function loadFriends(options, callback) {
    var self = this,
        who = optsMap[App.options.mffs_who],
        retrieve = function (page) {
            if (!friend_url_tpl) {
                friend_url_tpl = _.template(
                    App.site + '/get-user-friends/?user=' +
                    options.user + '&' + who + '=true&page=<%= page %>'
                );
            }
            xhr.get(friend_url_tpl({page: page}), processor, {dataType: 'json'});
        },
        fresh = ((Date.now() - (kango.storage.getItem('friends_freshness')||0)) < STALE),
        page = Math.floor(options.start / 5)||0,
        friend_url_tpl;

    function processor(friends) {
        console.log('processor called with ', friends);
        if (_.isArray(friends)) {
            async.forEach(friends, function (friend, friend_done) {
                async.waterfall([
                        function (cb) {
                            console.log('setting last WO on ' + friend.username);
                            self.setLastWO(friend, cb);
                        },
                        function (friend, cb) {
                            console.log('saving ' + friend.username);
                            self.save(friend, cb);
                        }
                    ], function (err, friend) {
                        friend_done();
                    }
                );
                
            }, function (err) {
                if (friends.length < 5 || page === 5) {
                    // App.appendUnique('friends', payload);
                    return self.get(options.page, callback);
                }
                retrieve(++page);
            });
            
        }
    }
    // App.db.friends.
    if (!fresh || !payload) {
        payload = [];
        retrieve(page);
    }
    // callback([]);
};

friends.setGrid = function setGrid(grid) {
    friends.grid = grid;
};

module.exports = {
    init: function (app) {
        App = app;
        db = App.db.friends;
        xhr = App.xhr;
        App.get_me(function (meRes) {
            me = meRes;
            friends.getProppables = proppables.init(me, xhr);
            getLastConvo = initGetLastConvo(me);
        });
        return friends;
    }
};