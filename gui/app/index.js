/* eslint no-unused-vars: 0*/
'use strict';
const electron = require('electron');
const {ipcRenderer} = electron;
const {remote} = electron;

const logger = require('../../lib/logwrapper');

//from old Gobal.js
const shell = require('electron').shell;
const fs = require('fs');
const request = require('request');
const List = require('list.js');
const howler = require('howler');
const compareVersions = require('compare-versions');
const marked = require('marked');
const path = require('path');

require('angular');
require('angular-animate');
require('angular-route');
require('angular-sanitize');
require('angular-ui-bootstrap');
require('angularjs-slider');
require('ui-select');
require('angular-ui-sortable');
require('angularjs-scroll-glue');

function boot() {
    angular.bootstrap(document, ['firebotApp'], {
        strictDi: false
    });
}

document.addEventListener('DOMContentLoaded', boot);

// Catch browser window (renderer) errors and log them via Winston
window.onerror = function(error, url, line) {
    logger.error("(Renderer) " + error, { url: url, line: line });
};

// Prints all logs from the "console" transport into the Browser Console
logger.on('logging', (transport, level, msg, meta) => {
    if (transport != null && transport.name === 'console') {
        if (msg != null && msg.trim() !== '(Renderer)') {
            // Only print if the msg isnt 'empty' aka has more than just the prefix
            console.log(level.toUpperCase() + ": " + msg);
        }
        if (meta && Object.keys(meta).length > 0) {
            console.log(meta);
        }
    }
});