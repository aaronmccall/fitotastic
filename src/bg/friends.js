var workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT');
var stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>');
var xhr = require('xhrQueue');
var templatizer = require('../ui/templates');
var proppables = require('./helpers/proppables');
var srcPrevent = require('./helpers/srcPrevent');
var me;

// Takes to integer timestamps and return the difference in hours
function to_hours(ts1, ts2) {
    if (isNaN(ts1) || isNaN(ts2)) return NaN;
    return (ts1 - ts2) / (60 * 60 * 1000);
}

// Given a .stream_item, return its age
function activity_age(activity) {
    return to_hours(Date.now(), Date.parse(activity.find('.action_time').text().trim()||''));
}


function setLastWorkout(friend, done) {
    xhr.add({
        url: workout_urlizer({user_id: friend.id}),
        cb: function (html) {
            var activity = $(srcPrevent(html)).find('.action_time:first'),
                last_ts = activity.length ? Date.parse(activity.text().trim()) : NaN;
            if (last_ts) friend.last_workout = last_ts;
            done(null, friend);
        }
    });
}

var get_last_conversation = (function () {
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

})();

var getProppables;

module.exports = {
    init: function (username) {
        me = username;
        getProppables = proppables.init(me);
    }
};