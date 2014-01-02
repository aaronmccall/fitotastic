var link;

function calcGrid($win) {
    $win = $win || $(window);
    var window_height = $win.height(),
        window_width = $win.width(),
        rows = Math.floor((window_height-80)/187),
        columns = Math.floor((window_width-32)/140);
    return {rows: rows, columns: columns};
}

module.exports = {
    calcGrid: calcGrid,

    getLink: function () {
        if (!link) {
            link = $('<a id="mffs" href="#">Friend Stalker</a>');
            link.on('click', function (e) {
                e.preventDefault();
                console.dir(calcGrid($(window)));
            });
        }
        return link;
    }
};