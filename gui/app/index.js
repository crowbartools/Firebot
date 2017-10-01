const electron = require('electron');
const {ipcRenderer} = electron;
const {remote} = electron;

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

function boot() {

	angular.bootstrap(document, ['firebotApp'], {
		strictDi: false
	});
}

document.addEventListener('DOMContentLoaded', boot);
