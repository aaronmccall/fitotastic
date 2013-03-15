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
        new_workout_logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAEJGlDQ1BJQ0MgUHJvZmlsZQAAOBGFVd9v21QUPolvUqQWPyBYR4eKxa9VU1u5GxqtxgZJk6XtShal6dgqJOQ6N4mpGwfb6baqT3uBNwb8AUDZAw9IPCENBmJ72fbAtElThyqqSUh76MQPISbtBVXhu3ZiJ1PEXPX6yznfOec7517bRD1fabWaGVWIlquunc8klZOnFpSeTYrSs9RLA9Sr6U4tkcvNEi7BFffO6+EdigjL7ZHu/k72I796i9zRiSJPwG4VHX0Z+AxRzNRrtksUvwf7+Gm3BtzzHPDTNgQCqwKXfZwSeNHHJz1OIT8JjtAq6xWtCLwGPLzYZi+3YV8DGMiT4VVuG7oiZpGzrZJhcs/hL49xtzH/Dy6bdfTsXYNY+5yluWO4D4neK/ZUvok/17X0HPBLsF+vuUlhfwX4j/rSfAJ4H1H0qZJ9dN7nR19frRTeBt4Fe9FwpwtN+2p1MXscGLHR9SXrmMgjONd1ZxKzpBeA71b4tNhj6JGoyFNp4GHgwUp9qplfmnFW5oTdy7NamcwCI49kv6fN5IAHgD+0rbyoBc3SOjczohbyS1drbq6pQdqumllRC/0ymTtej8gpbbuVwpQfyw66dqEZyxZKxtHpJn+tZnpnEdrYBbueF9qQn93S7HQGGHnYP7w6L+YGHNtd1FJitqPAR+hERCNOFi1i1alKO6RQnjKUxL1GNjwlMsiEhcPLYTEiT9ISbN15OY/jx4SMshe9LaJRpTvHr3C/ybFYP1PZAfwfYrPsMBtnE6SwN9ib7AhLwTrBDgUKcm06FSrTfSj187xPdVQWOk5Q8vxAfSiIUc7Z7xr6zY/+hpqwSyv0I0/QMTRb7RMgBxNodTfSPqdraz/sDjzKBrv4zu2+a2t0/HHzjd2Lbcc2sG7GtsL42K+xLfxtUgI7YHqKlqHK8HbCCXgjHT1cAdMlDetv4FnQ2lLasaOl6vmB0CMmwT/IPszSueHQqv6i/qluqF+oF9TfO2qEGTumJH0qfSv9KH0nfS/9TIp0Wboi/SRdlb6RLgU5u++9nyXYe69fYRPdil1o1WufNSdTTsp75BfllPy8/LI8G7AUuV8ek6fkvfDsCfbNDP0dvRh0CrNqTbV7LfEEGDQPJQadBtfGVMWEq3QWWdufk6ZSNsjG2PQjp3ZcnOWWing6noonSInvi0/Ex+IzAreevPhe+CawpgP1/pMTMDo64G0sTCXIM+KdOnFWRfQKdJvQzV1+Bt8OokmrdtY2yhVX2a+qrykJfMq4Ml3VR4cVzTQVz+UoNne4vcKLoyS+gyKO6EHe+75Fdt0Mbe5bRIf/wjvrVmhbqBN97RD1vxrahvBOfOYzoosH9bq94uejSOQGkVM6sN/7HelL4t10t9F4gPdVzydEOx83Gv+uNxo7XyL/FtFl8z9ZAHF4bBsrEwAADDNJREFUWMPFWQlUVEcWNXMmZyYnZ0Dt5ffeDY5EjYoGY4QYNSbKqiAKaJAgmAAj4hLBXQejEpdEwCWJsiuJI44aNdE5Y6JxjSK4IZGwGATZbFB2EDjceVXdtICt0YxJ/jnFp39117t1332vXtXvAaDHs2h0PWdv7/VCZGSkhW9kmIW9vf0L7NkzG//X/lCnG/PXk8fODcrNzZ9RXlGxqbah4avm5pYzLS0tma2t7RnNzc2na2vr9lVUVGzIycnzPXbsZH8C/vzvBjQ1NVWVd7MwtLGx8Tv6XA/jVVulx8+5N3D9ciayr1xCUUEemmqr0em6V19ffzSvoCAwJiZG+M2ARn78sfjWreKF7e3tecxqdaUeX6QkI3D2PNhPmQEb95nQuP8DSp8IqLzDoZ0YhP4eMzHaOwCzF0Tg8IH9aGlq4IiJ7Ww2WSaRZwr0fEbG+IaGxnRm5Kfs6widvwD9XH0h9V0F2fKjUG3JgSahFLpkPXQplbxpkyqgiS+BKiYLwqL9ELwWw9Z1GlZEroK+rIQDrqurO3Hy3DmH/xso09TNwsII5uKmhnosWrIEOmc/COF7oNlRBN2uKuiSyqFLKIEuvth8Y30Emn1XvS0P0lnb0d/JB7Ex0RwseaiSdB70S4H3yA4vL68XbpeW8tEyLpyHg9sUSN+PhTbeyNyjgD2uMdDEtvrTfEh9lsN9mh9KbhWinfAWFxevJLB/fiqgPezsni8tLecgD5K2rN/yhGL19wYG40t+HcjugHfehbBgD4Y6euBKxkXObmFh0QoC+6cnBkruDjeA3Ae103SotuYY3PdIw4zlCoM+2WRSqgz//5Is6DuKqLMY4DgF1y5lMpOtObm5AU8E9OKlS28znWec/wHWYycRyFzoEsvMG2JAWOBsvQH18q+gDNkC5Yy1UAaugyr0U6hX/Qe6zwoMwB81BslIseYU7IjZ8tIStLa23Tlx4sywxwLdunWrqKGx8WJ9TTVGuHlBsfaMeSaNWtNEfQ+FWzBkA16BTKODoFBSUxjvSsi01pDZOkAxdSm00ZcNLD+CWeGDL+HtP5NLoLq67r/h4RtffCTQwpISFuGIWLYSQliS+YEZM3FFZHwRZNY2HJhMpSGgWg62S1NrIajUhu+8NBjK4FjDxM3JgSQj9fwASQnxHGx3CZj+SUlJU7a1tRf8eO0qtM4zeB40B1K7LQfyUe4G42oz4B7VaDKCUgWFe6gBaHewpHPVlhuwdfFG7b0q3L9/PzMyKbrnQ0ALCgpnsZkEhc3leZIHR/eA2X4T8tfdDCCfFGB3hum3iklzzKc4xqr/esqxMZzV7Jwcry5AnZ2d/9LY3PydvqIUfV2mU64sMR+hnnMhFWQQKVS8SbnLHwCRKNWd+rTm++RKzqwqbPvD0mKsxlyDg4cv2ttaca+6Oq0jXXGgx06eHMRWn0TSh3TGBkOUdonMCqhXfgOpxgr9Bw/BeNeJGOc2AQPtXjUBYvehIxz4c9b6vjy4S5+dw+umPo313yG8PIyyRY7BU10IqSLG5yL97BlGaklaWprGBPSn/Hx/9vSd4NmQf3j84VRCbpKP84VIIuWGOq7EnbvQW2aQgZjYOvTNEVPf/IWL0UtQmIAeP3mKPy8pLUWfAS9DKpNDGbDODCl6SMMSsSbqI/79y1lZriagrJ5kVA+bHAB1nIFBDpbNlgXQJxch6zuADKqhs+mPgp9/5oNcycqC0qoPl4Cmrw1y8/JNQHd+uZu7mfXZDLLFHb2eP/8ybS+XAHO/fPjbxsBidkoNeZl0qlifDs/AEP79W8Wli411R4/nGqjo1ZeXwWqUCxTzk6FevA+aNccp92XyWarmJvCBGTu9yXhy6hd8EKpJMfQ1e86qnf3raGpqQltbGxUaxMTVLChoEr1lSox3m2iawPuzZqO3YMwY1i9B89Fp6CiTaNadgXrFIagWpEII3Ijhjobf6O/di+NA7an4aG1tPcOKXYmjP8TrLkC8+ADEc5IgCd4CafBmCKM8KB8agZIR//eDTYZ9/PzxN5EEnlN9+efTZ8/idkkJaPIYZDcclhIBEUuXmSZmZz+SB5YpZdGCweyIQ+MgikiDmKQn2pCJvo7euF9fA9o5HGQB1SMoKMiSCMg8f+oERB4U1TsbIE2kNJF0lxrdU2ohHu8PGVtpjNFrO3wEqFrnxjdEx+DFXiKsWLWaf1619iN8e/wE/3+CpxcHunf/Af75wsVMyGm1EjryL40pem8TpLsaH9hLqIQkXg+tix/ukZcbmpuPsXKzK1D3OZAm10CyvQyiz8sgprs0uRpixxkmoB2NMceu70+d5nJI27eff544xRubP/2M/79w2QpaRnXIzy/gn9dvija4vWMcI1BJUs0De3FlkOyoIKDTUdUZqMn1tNeRuAbRj6qhJFG/drASg/bqIeys4UzLOiV5Fs0fRq3jxu/cuUMufhVZ17OpoGjFwFeGIThsDu/btXs3paWRaG1pNTHMAswElHQvIon12VuLEYcq0Xe3npMk+ZzyufNUNHV2vSmYSm/zkk4cX4HRR6rwr8ImWKVWcIZFQbFdGGXGHHmAtLMKHTNDZqG6pgZ5xBxz7VgnFw4sPfMSQubM4/+XVZR3ya08mLR9SJMnIEuqRERmLZZdroOQUA5R9E+wmzCVj28KJvaHtrSbKFwxxNUb4s15UFB6UiWXczdIE0kza09DoAKkY21nxqz7DcCtoiIO4sDhr/l9/6HDPAPYDLZFZVUVKiur8PWRo4bvUB/LtR2TZcEpHTIS0s+KyNXlUJAXmU2BQPf65wlM8gvomp46J/ypgUHoufQoJEzQRr0YBF4BybCx3FUmVskoy4nsogKC31d+uJpkIef9Z344b+xr4fewD8JNCwBvcjnEk+ZB+kUTjW90uTEmLN/bitWrVz+c8DuW0IQd22Hps5JHOo9CAipechCi6asg8pxvNKI1pSmWEztfk3ym8cBirG7bHmd63tLSAvvRbz5glKUlm4EQTV0GEeVMcdQ5Q6Yh70kpRsROM2kJPf3wEmoqSspodXh7CsRbb0JEFZTIhwYK2QZJzI9cq+JxfqagElOaYus3A9HBnO1we56+2CSCQsNMQK9n/wglW9+5dLSGaCeA0p11ENNeTOQfBZHfap5De6+/jNfcJpsvSjqXee8RSxZv+kI8LwWSLXncFVIKMIG5J/YGpENHcbDMqEJnTTlyPwHJxuEjR6Cy7sufM+YcxozlmYD1Ra6JehDt9FuxYyB3tzS+nI8rkLzE6y9CRInfYoQbomNjzZd5XQrnq1cgHzMZksS7HCBzv9JY9slJ6JINGZC8MtoElkU5WyoZ6O71J39OTaa1MuwCGEhaPKSfF0NB0a2mcbU0Lmss8kUUyAPHuqLmcYVz563IgvBwWLy7gWtVGde1NlUmEQObcyByCjAVwgLTnJlqX+i0FZHSui4mrcvjy6BJ6FqdcaAsiFxnIWHHjsdvRTo2d43Gzd2w8W7otfI4paoqs1sSBWNg4T5IxkyB0KefISMw/XZqDKS0ny0ktJ4rok5DQyWdVbctCPOWkFIDy1mJmPzO9Cfb3HXeLqf/QNXMSBeIPsnmLJrbPbJJ8DzL9BWWANG05RC7h0FEaUfkt4YHpDw2G1qq5K1YCdft9yoGkpjstfwYhox1QVnxbbS2PcF2ufsBxIF/74HwxgQCm8VBac2AZTpTJ5LeqF+dctfUVKwlVz5cwRubPK6UZ5JeK76FzSgnXMlMf7oDiO5HOgys5g0XksF3kJGLNM/gSEdBGmX6t5yTikHE5KX0C9zlN5/2SOfBIZkBLJPBcNKshd86Wj1KIefsPj1gFbErT6GEviUflh4L4DrZB0WFfLfw6w7Juh87Ut3R0Fhfi/CIcCjGeMIiNInWaAoEMqpm56AEwJws2GRYn4o0zgFuzodFwCb0eXMCNm3c8GyOHR86yG00HOSyA4rg0NmwessTll7L0HPRIYijb/B8yxI3Cw7eaElk7PfeeA2W8/egp8d8DBjngSVLl6K85PazPch93NH4vTvlSKbt9btBIRjm5gOd0zsQnAMhdgvhTeYcAGunaXBwn4oQqk8P7N2D+w31v+3RuPmXDc1dXjZU6+8g/0Y2rl68gGsZ6SjMvYGG6qoHFUs7qn+Xlw2Pf32j569vqEDhr2+IdcPrm7o/8PXNH/VC7H8mKq2JLrm1IAAAAABJRU5ErkJggg==',
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
                    title_body = (activity_type === 'workout') ? $this.find('.action_prompt').text().replace(/:/g, ', ').trim() : $this.find('.dramatic-description').text().trim(),
                    activity_time = get_activity_datetime($this),
                    url = $this.find('.action_time').attr('href'),
                    image = get_activity_image($this),
                    link = $('<a class="proppable" href="#"/>');
                if (title_body.length) title.push(title_body);
                if (activity_time) title.push(activity_time);

                if (!image.length) {
                    image = $('<img src="' + new_workout_logo + '">');
                }
                link.attr({
                    'title': title.join("\n"),
                    'data-activity-id': this.id.split('_').pop(),
                    'href': url || '#'
                });
                link.append(image);
                activities_list.push(link);
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
                    proppable_container.html($('<span>').append(proppables.slice(0, 3)));
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