'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("fileChooser", {
            bindings: {
                model: "=",
                options: "<",
                onUpdate: '&'
            },
            template: `
            <div style="display: flex;flex-direction: row;align-items: center;">
                <button class="btn btn-default" ng-click="$ctrl.openFileExporer()">{{ $ctrl.isFile ? 'Choose File' : 'Choose Folder' }}</button>
                <span style="padding-left: 10px;font-size: 12px;max-width: 400px;text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">{{$ctrl.model ? $ctrl.model : "No file selected."}}</span>
                <span ng-if="$ctrl.model != null && $ctrl.model !== ''" class="clickable" style="margin-left: 10px" ng-click="$ctrl.model = null"><i class="fal fa-times-circle"></i></span>
            </div>
            `,
            controller: function($scope, $element, $attrs, listenerService) {
                let ctrl = this;

                ctrl.isFile = true;
                ctrl.$onInit = function() {
                    if (ctrl.options != null && ctrl.options.directoryOnly) {
                        ctrl.isFile = false;
                    }
                };

                ctrl.clearPath = function() {
                    ctrl.model = null;
                    ctrl.onUpdate({filepath: ''});
                };

                ctrl.openFileExporer = function() {
                    let registerRequest = {
                        type: listenerService.ListenerType.ANY_FILE,
                        runOnce: true,
                        publishEvent: true,
                        data: {
                            options: ctrl.options,
                            currentPath: ctrl.model && ctrl.model !== "" ? ctrl.model : undefined
                        }
                    };
                    listenerService.registerListener(registerRequest, (filepath) => {
                        ctrl.model = filepath;
                        ctrl.onUpdate({filepath: filepath});
                    });
                };
            }
        });
}());
