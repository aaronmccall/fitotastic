var config = require('../config.json');

var maxProppableAge;
function getMaxProppableAge() {
    return maxProppableAge || (maxProppableAge = (24 * config.maxProppableDays));
}

var me, xhr;
function proppableFilter() {
    var $this = $(this),
        act_age = activity_age($this),
        propped_by_me = !!$this.find('.proppers a[href="/profile/' + me + '/"]').length;

    
    $this.data('activity_age', act_age);
    return propped_by_me || (act_age > getMaxProppableAge());
}

function initProppableTypes () {
    var proppablePrefix = '[data-ag-type^=',
        proppableSuffix = ']',
        proppableSeparator = proppableSuffix + ',' + proppablePrefix;
        
    return proppablePrefix + ['badge', 'level', 'quest', 'work'].join(proppableSeparator) + proppableSuffix;
}

var proppableTypes;
function getProppableTypes() {
    return proppableTypes || (proppableTypes = initProppableTypes());
}

function workoutDetail(workout) {
    var items = workout.find('.action_detail > li'),
        output = [];
    items.each(function () {
        var activity = $(this),
            payload = {},
            pr = activity.find('.pr');
        payload.name = activity.find('.action_prompt').text().replace(/:/g, '').trim();
        payload.note = activity.find('.stream_note').text();
        if (pr.length) {
            payload.pr = pr.find('.set_user_original').text().trim();
        }
        output.push(payload);
    });
    return output;
}

function activityDetail(activities_list, activity) {
    var $activity = $(activity),
        activity_type = $activity.attr('data-ag-type'),
        isWorkout = activity_type==='workout',
        title = $activity.find(isWorkout ? '.stream_total_points' : '.dramatic-title:first').text().trim(),
        activity_detail = isWorkout ? workoutDetail($activity) : [title],
        activity_time = get_activity_datetime($activity),
        url = $activity.find('.action_time').attr('href'),
        image = get_activity_image($activity),
        image_src;

    if (activity_time) title.push(activity_time);

    if (!image.length) {
        image_src = FitotasticImages.workout_logo;
    } else {
        image_src = image[0].src;
    }
    activities_list.push({
        title: title[0],
        age: get_activity_datetime($this),
        activity_age: $this.data('activity_age'),
        id: this.id.split('_').pop(),
        href: url || '#',
        image_src: image_src,
        details: activity_detail,
        isWorkout: isWorkout
    });
    return activities_list;
}

function getProppables(id, start, callback) {
    xhr.get(stream_urlizer({id: id, start: start}), function (html) {
        var $dom = $(srcPrevent(html)),
            page_age = activity_age($dom.find('.stream_item:first'));

        if (isNaN(page_age) || page_age > (24 * getMaxProppableAge())) {
            return callback(null, []);
        }

        var activities = $dom.find(getProppableTypes()).not(proppableFilter),
            activities_list = [];

        _.reduce(activities.toArray(), activityDetail, activities_list);

        callback(null, activities_list);
    });
}

module.exports = {
    init: function (username, xhrQueue) {
        me = username;
        xhr = xhrQueue;
        return getProppables;
    }
};