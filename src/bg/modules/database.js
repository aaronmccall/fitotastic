var db = require('db.js');
var schema = require('../schema.json');
var connection;

module.exports = {
    connect: function (cb) {
        if (!connection) {
            db.open( {
                server: 'fitotastic',
                version: 1,
                schema: schema
            } ).done( function ( conn ) {
                connection = conn;
                cb(null, conn);
            } );
        } else {
            cb(null, connection);
        }
    }
};
