var bunyan = require('bunyan');
var dataAccess = require('./data-access.js')

var app = (electron.app || electron.remote.app);

var logger = bunyan.createLogger({
    name: 'Error',
    hostname: app.getVersion(),
    time: new Date().toTimeString(),
    streams: [{
        type: 'rotating-file',
        path: dataAccess.getPathInUserData('/user-settings/logs')+'/log.json',
        period: '1d',   // daily rotation
        count: 5        // keep 3 back copies
    }]
});

function log(error){
    logger.error(error);
}

// Export
exports.log = log;
