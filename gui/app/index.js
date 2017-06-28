const electron = require('electron');
const {ipcRenderer} = electron;
const {remote} = electron;

//from old Gobal.js
const shell = require('electron').shell;
const fs = require('fs');
const JsonDB = require('node-json-db');
const request = require('request');
const List = require('list.js');
const howler = require('howler');
const compareVersions = require('compare-versions');
const marked = require('marked');
const path = require('path');

require('angular');
require('angular-animate');
require('angular-route');
require('angular-ui-bootstrap');

function boot() {

	angular.bootstrap(document, ['firebotApp'], {
		strictDi: false
	});
}

document.addEventListener('DOMContentLoaded', boot);
