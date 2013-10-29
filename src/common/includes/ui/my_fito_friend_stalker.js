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
    var friend_url_tpl = _.template('https://www.fitocracy.com/get-user-friends/?user=<%= user %>&page=<%= page %>&followers=true'),
        stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>'),
        pp_urlizer = _.template('https://s3.amazonaws.com/static.fitocracy.com/site_media/<%= pic %>'),
        profile_linker = _.template('<a href="/profile/<%= username %>/"><%= at_name %></a>'),
        workout_urlizer = _.template('https://www.fitocracy.com/activity_stream/0/?user_id=<%= user_id %>&types=WORKOUT'),
        friend_page = 0,
        friends_per_friend_page = 5,
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
        mffs_friends = [],
        proppables_xhr_queue = [],
        App, $modal, $modal_contents, $list_table, $list_div, $friend_row,
        friend_count, friend_url, friends_per_stalker_page, friends_per_stalker_row, get_last_conversation;

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

    function humanized_timesince(activity_utime) {
        var datetime = null;
        if (activity_utime) {
            activity_hours = to_hours(Date.now(), activity_utime);
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

    function get_proppables(id, start, callback) {
        // data-ag-type: workout, levelup, questcomplete, badgecomplete
        proppables_xhr_queue.push($.get(stream_urlizer({id: id, start: start}), function (data) {
            var dom = $(data.replace(/src=/g, 'src-attr=')),
                page_age = activity_age(dom.find('.stream_item:first'));
            if (isNaN(page_age) || page_age > (24*7)) return callback(null, []);
            var activities = dom.find('[data-ag-type^=badge],[data-ag-type^=level],[data-ag-type^=quest],[data-ag-type^=work]')
                                .not(function () {
                                    var $this = $(this),
                                        act_age = activity_age($this),
                                        propped_by_me = !!$this.find('.proppers a[href="/profile/' + App.me + '/"]').length;
                                    $this.data('activity_age', act_age);
                                    return propped_by_me || (act_age > (24*7));
                                }),
                activities_list = [],
                friend = _(mffs_friends).find(function (friend) { return id === friend.id; }),
                last_convo = !friend.last_convo ? get_last_conversation($(data), friend) : {};
            // If friend doesn't have last_convo yet and we've retrieved one, add it to friend.
            if (!friend.last_convo && !_.isEmpty(last_convo)) {
                friend.last_convo = last_convo;
            }

            activities.each(function () {
                var $this = $(this),
                    activity_type = $this.attr('data-ag-type'),
                    title = [(activity_type === 'workout') ? $this.find('.stream_total_points').text().trim() : $this.find('.dramatic-title:first').text().trim()],
                    activity_detail = (activity_type === 'workout') ? (function (workout) {
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
                            output.push(templatizer.mffs.activity(payload));
                        });
                        return output;
                    })($this) : [$this.find('.dramatic-description').text().trim()],
                    activity_time = get_activity_datetime($this),
                    url = $this.find('.action_time').attr('href'),
                    image = get_activity_image($this),
                    image_src;
                if (activity_detail.length) title.push(activity_detail.join(', '));
                if (activity_time) title.push(activity_time);

                if (!image.length) {
                    image_src = FitotasticImages.workout_logo;
                } else {
                    image_src = image[0].src;
                }
                activities_list.push(templatizer.mffs.proppable({
                    title: title[0],
                    age: get_activity_datetime($this),
                    activity_age: $this.data('activity_age'),
                    id: this.id.split('_').pop(),
                    href: url || '#',
                    image_src: image_src,
                    details: activity_detail,
                    isWorkout: activity_type === 'workout'
                }));
            });
            callback(null, activities_list);
        }));
    }

    function add_proppables_to_friend(friend) {
        var proppables = [],
            stream_start = 0,
            abort_proppable = false;
        App.async.whilst(
            function () {
                return (!abort_proppable) && (proppables && proppables.length < 6) && (stream_start < 75);
            },
            function (cb) {
                get_proppables(friend.id, stream_start, function (err, proppables_list) {
                    if (!err) {
                        if (proppables && proppables_list && proppables_list.length) {
                            proppables = proppables.concat(proppables_list);
                        }
                        stream_start += stream_step;
                    }
                    cb(err);
                });
            },
            function (err) {
                var proppable_container = friend.el.find('.proppables');
                if (proppable_container.length && proppables.length) {
                    proppables.sort(function (a, b) {
                        var b_age_match = b.match(/data-activity_age='([^']+)/),
                            a_age_match = a.match(/data-activity_age='([^']+)/),
                            b_age = b_age_match ? parseFloat(b_age_match[1]) : NaN,
                            a_age = a_age_match ? parseFloat(a_age_match[1]) : NaN;
                        return b_age - a_age;
                    });
                    proppable_container.html(proppables.slice(0, 3).join("\n"));
                } else {
                    $.get(workout_urlizer({user_id: friend.id}), function (html) {
                        var activity = $(html).find('.action_time:first'),
                            last_ts = activity.length ? Date.parse(activity.text().trim()) : NaN;
                        if (last_ts && (to_hours(Date.now(), last_ts) < 168)) {
                            return proppable_container.text('You\'ve propped \'em all!');
                        }
                        proppable_container.html('<span class="no-work">No workouts' + (last_ts?' in the last ' + humanized_timesince(last_ts):'.</span>'));
                        if (friend.last_convo) {
                            proppable_container.append(templatizer.mffs.convo(friend.last_convo));
                        } else {
                            /*console.log('no last_convo for ' + friend.username);*/
                        }
                    });
                }
            }
        );
    }

    function process_friends(friends, cb, opts) {
        _.each(friends, function (friend) {
            var row = $friend_row || ($friend_row = $('<tr>'));
            friend.pic_url = pp_urlizer(friend);
            friend.throbber = App.throbber;
            friend.info = friend.info.replace(/@(\w+)/g, function (at_name, username) {
                return profile_linker({username: username, at_name: at_name});
            }).replace(/\n{2,}/g, "\n").trim();
            friend.el = friend.el || $(templatizer.mffs.friend(friend));
            row.append(friend.el);
            add_proppables_to_friend(friend);
            friend_cells++;
            if (row.find('td').length === friends_per_stalker_row) {
                $list_table.append(row);
                $friend_row = null;
            }
        });
        friend_page++;
        cb();
    }

    function load_friends(page, cb, opts) {
        var start_friend = Math.floor(page * friends_per_friend_page),
            end_friend = start_friend + friends_per_friend_page;
        if (mffs_friends.length > end_friend) {
            process_friends(mffs_friends.slice(start_friend, end_friend), cb);
        } else {
            // kango.invokeAsync('kango.storage.getItem', 'friends', function (friends) {
            //     var friends_includes_page = (friends && friends.length && (friends.length >= end_friend));
            //     if (friends) {
            //         mffs_friends = friends;
            //     }
            //     if (!friends || !friends_includes_page) {
            //         $.get(follower_url + friend_page, function (friends) {
            //             kango.invokeAsync('App.appendUnique', 'friends', friends, function (stored_friends) {
            //                 if (friends.length < 5) friend_count = stored_friends.length;
            //                 mffs_friends = stored_friends;
            //             });
            //             process_friends(friends, cb);
            //         });
            //     } else {
            //         process_friends(friends.slice(start_friend, end_friend), cb);
            //     }
            // });
            $.get(friend_url(friend_page), function (friends) {
                if (_.isArray(friends)) {
                    mffs_friends = mffs_friends.concat(friends);
                    if (friends.length < 5) friend_count = mffs_friends.length;
                    process_friends(friends, cb);
                }
            });
        }

    }

    function clear_stalker_page() {
        $list_table.find('tr').remove();
    }

    function create_stalker_page(page) {
        var page_ratio = Math.floor(friends_per_stalker_page / friends_per_friend_page),
            $mffs_pages = $modal.find('.mffs_pages'),
            $prev_page = $mffs_pages.find('.goto_' + (page-1));
        // How many friends have we rendered for the UI?
        friend_cells = 0;
        // friend_page is the page in the fitocracy.com friend list
        friend_page = (page > 1) ? ((page - 1) * page_ratio)+1 : 0;

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
                return friend_cells < friends_per_stalker_page && (!friend_count || mffs_friends.length < friend_count);
            },

            function (cb) {
                load_friends(friend_page, cb);
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
                    return function (page) {
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

            link.click(function (e) {
                e.preventDefault();
                var $header = $('#wrapper').find('header'),
                    mffs_style = $('#mffs_style'),
                    window_height = $(window).height(),
                    window_width = $(window).width(),
                    stalker_rows = Math.floor((window_height-80)/187);
                $list_div = $list_div || $('<div class="friend-list"/>');
                $list_table = $list_table || $('<table style="border:none" />');
                $modal = app.getModal('mffs_modal', 'My Friends', { height: 'auto', width: (window_width-32) + 'px' }, {
                    my: 'center top',
                    at: 'center top+' + 16,
                    of: 'body',
                    collision: 'none'
                });
                friends_per_stalker_row = Math.floor((window_width-32)/140);
                /*console.log('stalker_rows: ' + stalker_rows);*/
                friends_per_stalker_page = (stalker_rows*friends_per_stalker_row);
                $modal_contents = $modal.find('.modal_contents').css({
                    'height': (window_height - 80) + 'px',
                    'overflow': 'scroll'
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
                        var mffs_page = $(this).data('mffs_page');
                        e.preventDefault();
                        if (mffs_page) {
                            load_stalker_page(stalker_page = mffs_page);
                        } else if (!!~this.className.indexOf('prev')) {
                            load_prev_stalker_page();
                        } else {
                            load_next_stalker_page();
                        }
                    }).on('click', '.mffs_detail button', function (e) {
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
                        $.post(url, payload, function (data) {
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
                        $('.proppable a', $list_table).not('.propped').each(function () { this.click(); });
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
                var old_queue = proppables_xhr_queue;
                proppables_xhr_queue = [];
                _(old_queue).each(function (xhr) {
                    if (xhr && xhr.readyState === 4) return;
                    if (xhr && xhr.abort) xhr.abort();
                });
            });
            // Refresh proppables on stalker pages when they are reloaded.
            // app.subscribe('reload:stalker_page', function (page) {
            //     var start = (page - 1) * friends_per_stalker_page,
            //         end = page * friends_per_stalker_page,
            //         friends = mffs_friends.slice(start, end);
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