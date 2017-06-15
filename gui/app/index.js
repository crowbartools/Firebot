const electron = require('electron');
const {ipcRenderer} = electron;
const {remote} = electron;

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
