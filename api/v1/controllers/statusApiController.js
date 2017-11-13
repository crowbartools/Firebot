'use strict';

const mixerInteractive = require('../../../lib/common/mixer-interactive.js');

exports.getStatus = function(req, res) {
    let status = {
        connections: {
            interactive: mixerInteractive.getInteractiveStatus()
        }
    };
    res.json(status);
};
