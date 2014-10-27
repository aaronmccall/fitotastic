/* jshint expr:true */
var Mffs = (function ($, _) {
    /*
        get-user-friends returns an array of objects like so:
        {
            "username":"aaronsamberdawn",
            "info":"Lighting a FIRE!",
            "followed":true,
            "level":14,
            "pic":"user_images/profile/602799/07b67abf2fb049521c9c66c481bc973e.jpg",
            "id":602799
          }
    */
    var friend_url_tpl = _.template('https://www.fitocracy.com/get-user-friends/?user=<%= user %>&page=<%= page %>&following=true'),
        stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>'),
        pp_urlizer = _.template('https://s3.amazonaws.com/static.fitocracy.com/site_media/<%= pic %>'),
        profile_linker = _.template('<a href="/profile/<%= username %>/"><%= at_name %></a>'),
        workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT'),
        friend_page = 0,
        friends_per_friend_page = 50,
        stalker_page = 1,
        stalker_pages = {},
        prop_activity_url = 'https://www.fitocracy.com/give_prop/',
        activity_comment_url = '/add_comment/',
        profile_status_url = '/add_status/',
        stream_step = 15,
        friend_cells = 0,
        MAX_GOTO_VISIBLE = 12,
        GOTO_OFFSET = 6,
        to_hours = function (ts1, ts2) {
            if (isNaN(ts1) || isNaN(ts2)) return NaN;
            return (ts1 - ts2) / (60 * 60 * 1000);
        },
        activity_age = function (activity) {
            return to_hours(Date.now(), Date.parse(activity.find('.action_time').text().trim()||''));
        },
        friend_map = {},
        queued_friends = [],
        friend_list = [],
        App, xhr, proppables_xhr, $modal, $modal_contents, $list_table, $list_div, $friend_row,
        friend_count, friend_url, friends_per_stalker_page, friends_per_stalker_row, get_last_conversation, end_of_friends;

    function date_prettifier(_, match) {
        var output = '';
        if (match) {
            var now = new Date(),
                date = Date.create(match);
            if (now.daysSince(date) < 7) {
                if (date.isLastWeek()) output += 'last ';
                output += date.format("{Weekday}");
            } else {
                output += date.format();
            }
        }
        return output;
    }
    function get_activity_image(activity) {
        var image = activity.find('.dramatic-image').attr('src', function () {
            var $this = $(this);
            if ($this.attr('src-attr')) {
                $this.attr('src', $this.attr('src-attr'));
            }
        });
        return image;
    }

    function humanized_timesince(time_or_age, is_hours) {
        var datetime = null, activity_hours;

        if (time_or_age && is_hours) {
            activity_hours = time_or_age;
        } else {
            activity_hours = to_hours(Date.now(), time_or_age);
        }

        if (activity_hours) {
            if (activity_hours < 0.1) {
                datetime = 'now';
            } else if (activity_hours < 1) {
                datetime = Math.floor(activity_hours * 60) + ' min';
            } else if (activity_hours < 24) {
                datetime = Math.floor(activity_hours) + ' hrs';
            } else if (activity_hours < 48) {
                datetime = 'a day';
                if (activity_hours > 36) {
                    datetime += ' and a half';
                }
            } else {
                datetime = Math.floor(activity_hours / 24) + ' days';
            }
        }
        return datetime;
    }

    function get_activity_datetime(activity) {
        var activity_timestamp = activity.find('.action_time').text().trim(),
            activity_utime = Date.parse(activity_timestamp),
            activity_hours;
        return humanized_timesince(activity_utime);
    }

    function activityFilter() {
        var $this = $(this),
            act_age = activity_age($this),
            propped_by_me = !!$this.find('.proppers a[href="/profile/' + App.me + '/"]').length;
        $this.data('activity_age', act_age);
        return propped_by_me || (act_age > (24*7));
    }

    function get_proppables(friend, start, callback) {
        var proppable_container = friend.el.find('.proppables');
        // data-ag-type: workout, levelup, questcomplete, badgecomplete
        proppables_xhr.get(stream_urlizer({id: friend.id, start: start}), function (data) {
            var dom = $(data.replace(/src=/g, 'src-attr=')),
                page_age = activity_age(dom.find('.stream_item:first'));
            if (isNaN(page_age) || page_age > (24*7)) {
                return callback(null, {proppables: friend.activities_list, age: page_age});
            }
            var activities = dom.find('[data-ag-type^=badge],[data-ag-type^=level],[data-ag-type^=quest],[data-ag-type^=work]')
                                .not(activityFilter),
                last_convo = !friend.last_convo ? get_last_conversation($(data), friend) : {};
            // If friend doesn't have last_convo yet and we've retrieved one, add it to friend.
            if (!friend.last_convo && !_.isEmpty(last_convo)) {
                friend.last_convo = last_convo;
            }
            App.async.forEach(activities.toArray(), _.defer.bind(_, function (activity, activityNext) {
                if (friend.activities_list.length > 3 || friend.el.find('.proppable').length > 3) activityNext('done');
                if (friend.activities_list.length === 0) proppable_container.html('');
                var $this = $(activity);
                var activity_type = $this.attr('data-ag-type');
                var activity_detail = [];
                var activity_time = get_activity_datetime($this);
                var url = $this.find('.action_time').attr('href');
                var image = get_activity_image($this);
                var image_src, title = [];
                if (!image.length) {
                    image_src = FitotasticImages.workout_logo;
                } else {
                    image_src = image[0].src;
                }
                var activityPayload = {
                    age: get_activity_datetime($this),
                    activity_age: $this.data('activity_age'),
                    id: activity.id.split('_').pop(),
                    href: url || '#',
                    image_src: image_src,
                    details: [],
                    isWorkout: activity_type === 'workout'
                };
                if (activity_type === 'workout') {
                    activityPayload.title = $this.find('.stream_total_points').text().trim();
                    App.async.map($this.find('.action_detail > li').toArray(), _.defer.bind(_, function (item, itemNext) {
                        var activity = $(item);
                        var payload = {};
                        var pr = activity.find('.pr');
                        payload.name = activity.find('.action_prompt').text().replace(/:/g, '').trim();
                        payload.note = activity.find('.stream_note').text();
                        if (pr.length) {
                            payload.pr = pr.find('.set_user_original').text().trim();
                        }
                        itemNext(null, templatizer.mffs.activity(payload));
                    }), function (err, details) {
                        activityPayload.details = details;
                        if (friend.el.find('.proppable').length < 4 && friend.activities_list.length < 4) {
                            proppable_container.append(templatizer.mffs.proppable(activityPayload));
                            friend.activities_list.push(activityPayload);
                            return activityNext();
                        }
                        activityNext('done');
                    });
                } else {
                    activityPayload.title = $this.find('.dramatic-title:first').text().trim();
                    activityPayload.details.push($this.find('.dramatic-description').text().trim());
                    if (friend.el.find('.proppable').length < 4 && friend.activities_list.length < 4) {
                        proppable_container.append(templatizer.mffs.proppable(activityPayload));
                        friend.activities_list.push(activityPayload);
                        return activityNext();
                    }
                    activityNext('done');
                }
            }), function (err) {
                callback(null, {proppables: friend.activities_list, age: page_age});
            });
        });
    }

    function add_proppables_to_friend(friend) {
        var proppables = [];
        var stream_start = 0;
        var MAX_STREAM_START = 90;
        var abort_proppable = false;
        var checked_last = false;
        var proppable_container = friend.el.find('.proppables');
        var msg;
        friend.activities_list = [];
        App.async.whilst(
            function () {
                return (!abort_proppable) && (friend.activities_list.length < 4) && (stream_start < MAX_STREAM_START);
            },
            function (cb) {
                if (!checked_last) {
                    xhr.get(workout_urlizer({user_id: friend.id}), function (html) {
                        proppable_container.length && proppable_container.html(App.throbber);
                        html = html.replace(/src=/g, 'src-attr=');
                        var first_activity = $(html).find('.stream_item:first');
                        var first_age = activity_age(first_activity);
                        if (!first_age || first_age > (24 * 7)) {
                            msg = '<span class="no-work">No workouts' + (first_age ? ' for ' + humanized_timesince(first_age, true) : '') + '.</span>';
                            return cb('no-workouts');
                        }
                        var unpropped = $('.stream_item', html).not(activityFilter);
                        var last_ts = first_activity.length ? Date.parse(first_activity.find('.action_time').text().trim()) : NaN;
                        checked_last = true;

                        if (first_age < 168 && !unpropped.length) {
                            return cb('all-propped');
                        }
                        cb();
                    });
                } else {
                    get_proppables(friend, stream_start, function (err, payload) {
                        if (!err) {
                            if (proppables && payload && payload.proppables && payload.proppables.length) {
                                proppables = proppables.concat(payload.proppables);
                            }
                            if (payload && payload.age > (24 * 7)) abort_proppable = true;
                            stream_start += stream_step;
                        }
                        cb(err);
                    });
                }
            },
            function (err) {
                if (proppable_container.length) {
                    if (proppable_container.find('.proppable').length) return;
                    if (err && msg) {
                        return proppable_container.html(msg);
                    }
                    proppable_container.html('<span>You\'ve propped \'em all!</span>');
                }
            }
        );
    }

    function nameLinker(at_name, username) {
        return profile_linker({username: username, at_name: at_name});
    }

    function process_friends(friends, cb, opts) {
        var friend;
        while ((friend = friends.shift())) {
            // Add friend to friend_map hash and friend_list
            if (!friend_map[friend.id]) {
                friend_map[friend.id] = friend;
            }

            var row = $friend_row || ($friend_row = $('<tr>'));
            friend.pic_url = pp_urlizer(friend);
            friend.throbber = App.throbber;
            friend.info = friend.info.replace(/@(\w+)/g, nameLinker).replace(/\n{2,}/g, "\n").trim();
            friend.el = friend.el || $(templatizer.mffs.friend(friend));
            row.append(friend.el);
            add_proppables_to_friend(friend);
            friend_cells++;
            if (row.find('td').length === friends_per_stalker_row) {
                $list_table.append(row);
                $friend_row = null;
            }
            if (friend_cells === friends_per_stalker_page) {
                break;
            }
        }
        cb();
    }

    function load_friends(page, cb, opts) {
        var start_friend = Math.floor(page * friends_per_friend_page),
            end_friend = start_friend + friends_per_friend_page;

        xhr.get(friend_url(page), function _get_friends_handler(friends) {
            if (_.isArray(friends)) {
                if (page === 0) {
                    // console.log('first page of friends: setting friends_per_friend_page to %s', friends.length);
                    friends_per_friend_page = friends.length;
                }
                // console.log('server responded with %s friends in friend page %s', friends.length, page);
                if (friend_list.length <= (page+1) * friends_per_friend_page) {
                    // console.log('adding %s friends to friend_list', friends.length);
                    friend_list.push.apply(friend_list, friends);
                }
                if (friends.length < friends_per_friend_page) end_of_friends = true;
                return process_friends(friends, cb);
            }
            // console.log('server response was NOT an array for friend page %s', page);
        }, {priority: 1});

    }

    function clear_stalker_page() {
        $list_table.find('tr').remove();
    }

    function create_stalker_page(page) {
        var $mffs_pages = $modal.find('.mffs_pages'),
            $prev_page = $mffs_pages.find('.goto_' + (page-1));
        // console.log('Generating stalker page: %s (%s)', page, friend_page);
        // How many friends have we rendered for the UI?
        friend_cells = 0;

        if (!$modal_contents.find('.throbber').length) {
            $modal_contents.find('p:last').html(App.throbber);
        }
        if (!$mffs_pages.find('[data-mffs_page="' + page + '"]').length) {
            var $page_link = templatizer.mffs.goto_link({page: page});
            if ($prev_page.length) {
                $prev_page.after($page_link);
            } else {
                $mffs_pages.append($page_link);
            }
        }
        App.async.whilst(
            function () {
                return friend_cells < friends_per_stalker_page;
            },

            function (cb) {
                // console.log('friend_cells: %s, friend_list.length: %s', friend_cells, friend_list.length);
                if (friend_cells === 0 && friend_list.length) {
                    var end_friend = (stalker_page * friends_per_stalker_page);
                    var start_friend = end_friend - friends_per_stalker_page;
                    if (start_friend < 0) start_friend = 0;
                    if ((start_friend < friend_list.length)) {
                        var sliced = friend_list.slice(start_friend, end_friend);
                        // console.log('retrieving friends from friend_list (%s) starting at %s and ending at %s',
                        //     friend_list.length, start_friend, end_friend
                        // );
                        return process_friends(sliced, cb);
                    }
                }
                if (end_of_friends) return cb('done');
                load_friends(friend_page++, cb);
            },

            function (err) {
                $modal_contents.find('.throbber:last').remove();
                /*console.log('friends_per_stalker_page: ' + friends_per_stalker_page);*/
                /*console.log('cells in table: ' + $list_table.find('td').length);*/
                $('.mffs_next')[($list_table.find('td').length < friends_per_stalker_page)?'hide':'show']();
                $('.mffs_prev')[(stalker_page===1)?'hide':'show']();
                $friend_row = null;
            }
        );
    }

    function load_next_stalker_page() {
        clear_stalker_page();
        load_stalker_page(++stalker_page);
    }

    function load_prev_stalker_page() {
        clear_stalker_page();
        load_stalker_page(--stalker_page);
    }

    function load_stalker_page(page) {
        App.publish('change:stalker_page');
        clear_stalker_page();
        create_stalker_page(page);
        var gt = $('.mffs_goto'),
            pages = gt.length,
            sliding = pages > MAX_GOTO_VISIBLE,
            is_right = sliding && (stalker_page >= GOTO_OFFSET),
            right_offset = ((pages - stalker_page) >= GOTO_OFFSET) ? GOTO_OFFSET : (pages - stalker_page),
            left_offset = ((pages - stalker_page) >= GOTO_OFFSET) ? GOTO_OFFSET : MAX_GOTO_VISIBLE - right_offset;
        gt.filter(function (i) {
            return (sliding && i < (stalker_page - left_offset)) ||
                   (is_right && (pages > (stalker_page + right_offset) && i > (stalker_page + right_offset))) ||
                   (is_right && (i < (stalker_page - left_offset)));
        }).hide();

        gt.filter(function (i) {
            return !sliding ||
                   (is_right && (pages > (stalker_page + right_offset) && i < (stalker_page + right_offset))) ||
                   (is_right && (i >= (stalker_page - left_offset)));
        }).show();
        gt.removeClass('mffs_active').filter('[data-mffs_page="' + stalker_page + '"]')
          .addClass('mffs_active');
    }

    return {
        init: function (app) {
            var link = $('<a id="mffs" href="#">Friend Stalker</a>'),
                friend_url_init = function (username) {
                    var payload = { user: username };
                    friend_url = function (page) {
                        payload.page = page || 0;
                        return friend_url_tpl(payload);
                    };
                };

            if (!app.me) {
                app.subscribe('app:me:change', friend_url_init);
            } else {
                friend_url_init(app.me);
            }
            
            App = app;
            xhr = App.xhrFactory(App.async, 2);
            proppables_xhr = App.xhrFactory(App.async, 2);
            link.click(function (e) {
                e.preventDefault();
                var $header = $('#wrapper').find('header'),
                    mffs_style = $('#mffs_style'),
                    window_height = $(window).height(),
                    window_width = $(window).width(),
                    stalker_rows = Math.floor((window_height-80)/172);
                $list_div = $list_div || $('<div class="friend-list"/>');
                $list_table = $list_table || $('<table style="border:none" />');
                var position = {
                    my: 'center top',
                    at: 'center top+16',
                    of: 'body',
                    collision: 'none'
                };
                $modal = app.getModal('mffs_modal', 'My Friends', { height: 'auto', width: (window_width-32) + 'px' }, position);
                friends_per_stalker_row = Math.floor((window_width-32)/140);
                /*console.log('stalker_rows: ' + stalker_rows);*/
                friends_per_stalker_page = (stalker_rows*friends_per_stalker_row);
                // console.log('friends per stalker page: %s', friends_per_stalker_page);
                $modal_contents = $modal.find('.modal_contents').css({
                    'height': (window_height - 80) + 'px',
                    'overflow': 'scroll'
                });
                $(window).on('resize', function () {
                    window_width = $(window).width();
                    window_height = $(window).height();

                    stalker_rows = Math.floor((window_height-80)/172);
                    friends_per_stalker_row = Math.floor((window_width-32)/140);
                    friends_per_stalker_page = (stalker_rows*friends_per_stalker_row);

                    $modal.position(position);
                    $modal.css({ height: 'auto', width: (window_width-32) + 'px' });
                    $modal_contents.css({ 'height': (window_height - 80) + 'px' });
                });
                if (!$modal_contents.find('.friend-list').length) {
                    $list_div.append($list_table);
                    $modal_contents.prepend($list_div);
                    $modal.find('h2').css({
                        display: 'inline-block',
                        'margin-right': '1em'
                    }).after(templatizer.mffs.nav());
                    if (!mffs_style.length) {
                        mffs_style = $('<style id="mffs_style" />');
                        mffs_style.text($(templatizer.mffs.style()).text());
                        $(document.body).append(mffs_style);
                    }

                    // Setup click handling for the proppables
                    $modal.on('click', '.proppable a', function (e) {
                        var $this = $(this),
                            propped = $this.is('.propped');
                        if (!propped || !!~this.href.indexOf('#')) {
                            e.preventDefault();
                        }
                        if (!propped) app.giveProp($this.data('activity-id'), function (res) {
                            if (res && res.result) $this.addClass('propped');
                        });
                    }).on('click', '.mffs_nav a', function (e) {
                        var mffs_page = parseInt($(this).data('mffs_page'), 10);
                        e.preventDefault();
                        if (mffs_page) {
                            load_stalker_page(stalker_page = mffs_page);
                        } else if (!!~this.className.indexOf('prev')) {
                            load_prev_stalker_page();
                        } else {
                            load_next_stalker_page();
                        }
                    }).on('click', '.post-btn', function (e) {
                        e.preventDefault();
                        var $this = $(this),
                            $proppable = $this.closest('.proppable'),
                            is_proppable = !!$proppable.length,
                            $parent = is_proppable ? $proppable : $this.closest('.mffs_friend'),
                            $comment = $parent.find('textarea:first'),
                            comment_text = $comment.val(),
                            id = $parent.data('id'),
                            url, payload;
                        if (is_proppable) {
                            url = activity_comment_url;
                            payload = { ag: id, comment_text: comment_text };
                        } else {
                            url = profile_status_url;
                            payload = { profile_user: id, status_text: comment_text };
                        }
                        App.xhr.post(url, payload, function (data) {
                            if (data && data.result) {
                                $this.prevAll('.charometer').remove();
                                $this.text('Success!').fadeOut('slow');
                                $comment.replaceWith('<p class="comment_confirm">You said: <em>' + comment_text + '</em></p>');
                            } else {
                                $this.text('Failed!');
                                setTimeout(function () {
                                    $this.prop('disabled', false).text('Comment');
                                }, 500);
                            }
                        }, 'json');
                        $this.prop('disabled', true).text('Saving...');
                    }).on('click', '.prop_all', function (e) {
                        e.preventDefault();
                        $('.proppable a', $list_table).not('.propped').each(_.defer.bind(_, function (i, a) {
                            var $this = $(a);
                            App.giveProp($this.data('activity-id'), function (res) {
                                if (res && res.result) $this.addClass('propped');
                            }, ((i % 2 === 0) ? xhr : proppables_xhr));
                        }));
                    }).on('click', '.unfollow', function (e) {
                        e.preventDefault();
                        var $this = $(this),
                            id = $this.data('userid');
                        if (id) App.xhr.post('/unfollow/', {id: id}, function () {
                            $this.closest('.mffs_friend').removeClass('followed').addClass('unfollowed');
                            $this.hide(150);
                        });
                    });
                    create_stalker_page(stalker_page);
                }
                $modal.show(0, function () {
                    $('#mask').show().css('opacity', 0.5);
                });

            });
            app.addItem(link);
            // Abort all proppables requests that have not completed.
            app.subscribe('change:stalker_page', function () {
                xhr.getQueue().kill();
                proppables_xhr.getQueue().kill();
            });
            // Refresh proppables on stalker pages when they are reloaded.
            // app.subscribe('reload:stalker_page', function (page) {
            //     var start = (page - 1) * friends_per_stalker_page,
            //         end = page * friends_per_stalker_page,
            //         friends = friend_map.slice(start, end);
            // });
            get_last_conversation = (function () {
                var author_getter = function (author) {
                        return '.stream-author[href$="' + author + '/"]:first';
                    },
                    commenter_getter = function (commenter) {
                        return '.comment_username_link[href$="' + commenter + '/"]:first';
                    },
                    me_author = author_getter(App.me),
                    me_commenter = commenter_getter(App.me),
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
                        headline = headline.replace(App.me, 'you');
                        reply = $comment.replace(App.me, 'and you replied: ');
                    } else {
                        headline = headline.replace(App.me, 'You');
                        reply = $comment.replace(friend.username, 'and they replied: ');
                    }
                    return {headline: headline, body: body, reply: reply};
                };

            })();
        }
    };
})(window.jQuery, window._);