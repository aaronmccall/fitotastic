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
    var follower_url = 'https://www.fitocracy.com/get-user-friends/?user=aaronmccall&followers=true&page=',
        following_url = 'https://www.fitocracy.com/get-user-friends/?user=aaronmccall&following=true&page=',
        stream_urlizer = _.template('https://www.fitocracy.com/activity_stream/<%= start %>/?user_id=<%= id %>'),
        pp_urlizer = _.template('https://s3.amazonaws.com/static.fitocracy.com/site_media/<%= pic %>'),
        friend_page = 0,
        friends_per_friend_page = 5,
        stalker_page = 1,
        friends_per_stalker_page = 20,
        stalker_pages = {},
        prop_activity_url = 'https://www.fitocracy.com/give_prop/',
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
        App, $modal, $modal_contents, $list_table, $list_div, friend_count;

    function get_activity_image(activity) {
        var image = activity.find('.dramatic-image').attr('src', function () {
            var $this = $(this);
            if ($this.attr('src-attr')) {
                $this.attr('src', $this.attr('src-attr'));
            }
        });
        return image;
    }

    function get_activity_datetime(activity) {
        var activity_timestamp = activity.find('.action_time').text().trim(),
            activity_utime = Date.parse(activity_timestamp),
            activity_hours, datetime;
        if (activity_utime) {
            activity_hours = to_hours(Date.now(), activity_utime);
            if (activity_hours < 0.1) {
                datetime = 'now';
            } else if (activity_hours < 1) {
                datetime = Math.floor(activity_hours * 60) + ' min ago';
            } else if (activity_hours < 24) {
                datetime = Math.floor(activity_hours) + ' hrs ago';
            } else if (activity_hours < 48) {
                datetime = 'a day ago';
            } else {
                datetime = Math.floor(activity_hours / 24) + ' days ago';
            }
        }
        return datetime;
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
                                    return propped_by_me || (act_age > (24*7));
                                }),
                activities_list = [];
            activities.each(function () {
                var $this = $(this),
                    activity_type = $this.attr('data-ag-type'),
                    title = [(activity_type === 'workout') ? $this.find('.stream_total_points').text().trim() : $this.find('.dramatic-title').text().trim()],
                    activity_detail = (activity_type === 'workout') ? (function (el) {
                        var items = el.find('.action_detail > li'),
                            output = [];
                        items.each(function () {
                            var el = $(this),
                                n = el.find('.action_prompt').text().replace(/:/g, '').trim(),
                                pr = el.find('.pr');
                            if (pr.length) {
                                n += ' (PR)';
                            }
                            output.push(n);
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
                return (!abort_proppable) && (proppables && proppables.length < 3) && (stream_start < 75);
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
                if (proppable_container.length) {
                    proppable_container.html(proppables.slice(0, 3).join("\n"));
                }
            }
        );
    }

    function process_friends(friends, cb, opts) {
        var row = $('<tr>');
        _.each(friends, function (friend) {
            if (!friend) return console.log('no friend!'), cb();
            friend.pic_url = pp_urlizer(friend);
            friend.throbber = App.throbber;
            friend.el = friend.el || $(friend_renderer(friend));
            row.append(friend.el);
            add_proppables_to_friend(friend);
            friend_cells++;
        });
        $list_table.append(row);
        friend_page++;
        cb();
    }

    function load_friends(page, cb, opts) {
        var start_friend = (page * friends_per_friend_page),
            end_friend = start_friend + friends_per_friend_page;
        if (mffs_friends.length > end_friend) {
            process_friends(mffs_friends.slice(start_friend, end_friend), cb);
        } else {
            kango.invokeAsync('kango.storage.getItem', 'friends', function (friends) {
                var friends_includes_page = (friends && friends.length && (friends.length >= end_friend));
                if (friends) {
                    mffs_friends = friends;
                }
                if (!friends || !friends_includes_page) {
                    $.get(follower_url + friend_page, function (friends) {
                        kango.invokeAsync('App.appendUnique', 'friends', friends, function (stored_friends) {
                            if (friends.length < 5) friend_count = stored_friends.length;
                            mffs_friends = stored_friends;
                        });
                        process_friends(friends, cb);
                    });
                } else {
                    process_friends(friends.slice(start_friend, end_friend), cb);
                }
            });
        }

    }

    function clear_stalker_page(page) {
        if (!stalker_pages[page]) stalker_pages[page] = $list_table.html();
        $list_table.find('tr').remove();
    }

    function create_stalker_page(page) {
        var page_ratio = (friends_per_stalker_page / friends_per_friend_page),
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
            var $page_link = $('<a href="#" data-mffs_page="' + page + '" />').addClass('mffs_goto').text(''+page);
            if ($prev_page.length) {
                $prev_page.after($page_link);
            } else {
                $mffs_pages.append($page_link);
            }
        }
        App.async.whilst(
            function () {
                return friend_cells < 20 && (!friend_count || mffs_friends.length < friend_count);
            },

            function (cb) {
                load_friends(friend_page, cb);
            },

            function (err) {
                $modal_contents.find('.throbber:last').remove();
            }
        );
    }

    function load_next_stalker_page() {
        clear_stalker_page(stalker_page);
        load_stalker_page(++stalker_page);
    }

    function load_prev_stalker_page() {
        clear_stalker_page(stalker_page);
        load_stalker_page(--stalker_page);
    }

    function load_stalker_page(page) {
        App.publish('change:stalker_page');
        if (stalker_pages[page]) {
            $list_table.html(stalker_pages[page]);
            App.publish('reload:stalker_page', page);
        } else {
            create_stalker_page(page);
        }
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
            var link = $('<a id="mffs" href="#">Friend Stalker</a>');
            App = app;
            link.click(function (e) {
                e.preventDefault();
                var $header = $('#wrapper').find('header'),
                    mffs_style = $('<style />'),
                    mffs_prev = '<a class="mffs_prev" href="#">&laquo; Prev</a>',
                    mffs_pages = '<div class="mffs_pages" />',
                    mffs_next = '<a class="mffs_next" href="#">Next &raquo;</a>';
                
                $list_div = $list_div || $('<div class="friend-list"/>');
                $list_table = $list_table || $('<table style="border:none" />');
                $modal = app.getModal('mffs_modal', 'My Friends', { height: 'auto' }, {
                    my: 'center top',
                    at: 'center top+' + $header.height(),
                    of: 'body',
                    collision: 'none'
                });
                $modal_contents = $modal.find('.modal_contents')
                                        .css({ 'height': '600px', overflow: 'scroll' });
                if (!$modal_contents.find('.friend-list').length) {
                    $list_div.append($list_table);
                    $modal_contents.prepend($list_div);
                    $modal.find('h2').css({
                        display: 'inline-block',
                        'margin-right': '1em'
                    }).after($('<div class="mffs_nav">' + mffs_prev + mffs_pages + mffs_next + '</div>'));
                    mffs_style.html(friend_css);
                    $(document.body).append(mffs_style);
                    $modal.show(0, function () {
                        $('#mask').show().css('opacity', 0.5);
                    });

                    // Setup click handling for the proppables
                    $modal.on('click', '.proppable', function (e) {
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
                    });
                }

                create_stalker_page(stalker_page);
            });
            app.addItem(link);
            // Abort all proppables requests that have not completed.
            app.subscribe('change:stalker_page', function () {
                var old_queue = proppables_xhr_queue;
                proppables_xhr_queue = [];
                _(old_queue).each(function (xhr) {
                    if (xhr && xhr.readyState === 4) return;
                    console.log('aborting proppable request');
                    if (xhr && xhr.abort) xhr.abort();
                });
            });
            // Refresh proppables on stalker pages when they are reloaded.
            app.subscribe('reload:stalker_page', function (page) {
                var start = (page - 1) * friends_per_stalker_page,
                    end = page * friends_per_stalker_page,
                    friends = mffs_friends.slice(start, end);
                friends.forEach(function (friend) {
                    var el = friend.el || (friend.el = $list_table.find('#user_' + friend.id));
                    el.find('.proppables').html(App.throbber);
                    add_proppables_to_friend(friend);
                });
            });
        }
    };
})(window.jQuery, window._);