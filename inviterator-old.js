var nonMembers;

var friends = [], fpush = friends.push.apply.bind(friends.push, friends), fPage = 0;
function loadFriends() {
    $.get('https://www.fitocracy.com/get-user-friends/?user=aaronmccall&following=true&page=' + fPage, function (friend_list) {
        if (friend_list && friend_list.length) {
            fpush(_.pluck(friend_list, 'id'));
            if (friend_list.length === 5) {
                fPage++;
                loadFriends();
            } else {
                console.log('loaded all %s friends. loading group members', friends.length);
                loadMembers();
            }
        }
    });
}

var group_num = location.href.split('group/').pop().replace(/[^\d]/g, '');
var group_name = document.getElementById("wrapped-group-name").innerText;
console.log('group number %s', group_num);
var memberCount = $('.stat-value:first').text().trim().replace(/[^\d]/g, '')*1;
console.log('there are %s members in this group', memberCount);
var members = [], mpush = members.push.apply.bind(members.push, members), mPage = 0;
function loadMembers() {
    $.get('https://www.fitocracy.com/get_group_members/8677/' + mPage + '/', function (member_list) {
        if (member_list && member_list.length) {
            mpush(_.pluck(member_list, 'id'));
            if (member_list.length === 15 && (members.length < memberCount)) {
                mPage++;
                loadMembers();
            } else {
                console.log('loaded all %s members. finding difference.', members.length);
                nonMembers = _.difference(friends, members);
                console.log('out of %s friends and %s group members, %s of your friends are not members', friends.length, members.length, nonMembers.length);
                if (confirm('Invite ' + nonMembers.length + ' friends to join ' + group_name + '?')) {
                    doInvite();
                }
            }
        }
    });
}

var invited = 0;
function doInvite() {
    var invitees = nonMembers.splice(0, 100);
    var payload = {
        group_id: group_num,
        friends_to_invite: invitees.join(',')
    };
    $.post("https://www.fitocracy.com/invite_to_group/", payload, function(response) {
        if (response && response.result) {
            console.log('Successfully invited %s friends to %s', invitees.length, group_name);
            invited += payload.friends_to_invite.length;
            if (nonMembers.length) {
                doInvite();
            } else {
                alert("Invited " + invited.length + " to join " + group_name + "!");
            }
        }
    });
}

loadFriends();