'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("fontManagementModal", {
            template: `
            <div class="modal-header flex-row-center jspacebetween">
                <h4 class="modal-title" style="display:inline;">Manage Fonts</h4>
            </div>
            <div class="modal-body">
                <div class="list-group" style="margin-bottom: 0;">
                    <span class="muted" ng-show="$ctrl.fonts.length === 0">No custom fonts installed.</span>
                    <div class="list-group-item flex-row-center jspacebetween" ng-repeat="font in $ctrl.fonts track by $index">
                        <div>
                            <h4 class="list-group-item-heading">{{font.name}}</h4>
                            <p class="list-group-item-text muted">Format: {{font.format}}</p>
                        </div>
                        <div style="font-size:17px">
                            <span uib-tooltip="Remove Font" tooltip-append-to-body="true" class="clickable" style="color:red;" ng-click="$ctrl.removeFont(font.name)">
                                <i class="fas fa-trash-alt"></i>
                            </span>    
                        </div>
                    </div>
                </div>
                <div style="color: #fb7373;" ng-if="$ctrl.installError">{{$ctrl.installError}}</div>
                <div style="color: green;text-align: center;padding-top: 5px;" ng-if="$ctrl.installSuccessful">Font successfully installed! Please <strong>restart Firebot</strong> and <strong>refresh the overlay</strong> to put changes into effect.</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-default pull-left" ng-click="$ctrl.openFileExplorer()">Install Font</button>
                <button class="btn btn-primary" ng-click="$ctrl.dismiss()">Close</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function($scope, listenerService, logger, fontManager) {
                const fsExtra = require('fs-extra');
                const path = require("path");

                const $ctrl = this;

                $ctrl.installError = null;
                $ctrl.installSuccessful = false;

                $ctrl.fonts = fontManager.getInstalledFonts();

                $ctrl.removeFont = function(name) {
                    fontManager.removeFont(name)
                        .then(() => {
                            $ctrl.fonts = fontManager.getInstalledFonts();
                        })
                        .catch((err) => {
                            $ctrl.installError = `There was an error removing the font: ${err.message}`;
                        });
                };

                let fileListenerId = null;

                $scope.$on('modal.closing', function() {
                    if (fileListenerId) {
                        listenerService.unregisterListener(listenerService.ListenerType.ANY_FILE, fileListenerId);
                    }
                });

                $ctrl.openFileExplorer = function() {
                    $ctrl.installError = null;
                    $ctrl.installSuccessful = null;
                    const registerRequest = {
                        type: listenerService.ListenerType.ANY_FILE,
                        runOnce: true,
                        publishEvent: true,
                        data: {
                            options: {
                                title: 'Select Font File',
                                filters: [
                                    {
                                        name: 'Font', extensions: ['ttf', 'woff', 'woff2', 'otf']
                                    }
                                ]
                            }
                        }
                    };
                    fileListenerId = listenerService.registerListener(registerRequest, (filepath) => {
                        fileListenerId = null;
                        if (filepath == null || filepath.length === 0) {
                            return;
                        }
                        const filename = path.parse(filepath).base;
                        const destination = path.join(fontManager.FONTS_FOLDER, path.sep, filename);

                        fsExtra.copy(filepath, destination)
                            .then(() => {
                                $ctrl.fonts = fontManager.getInstalledFonts();
                                $ctrl.installSuccessful = true;
                            })
                            .catch((err) => {
                                logger.error(err);
                                $ctrl.installError = `There was an error installing the font: ${err.message}`;
                            });

                    });
                };

                $ctrl.$onInit = function () {
                    // When the component is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
