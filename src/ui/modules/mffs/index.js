var models = require('./models'),
    views = require('./views');


module.exports = {
    models: models,
    views: views,
    init: function (app) {
        app.UI.addItem(views.getLink());
        app.messaging.send('app:friends:setGrid', views.calcGrid());
    }
};