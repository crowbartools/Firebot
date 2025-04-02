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
                <div style="color: green;text-align: center;padding-top: 5px;" ng-if="$ctrl.installSuccessful">Font successfully installed!</div>
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
            controller: function(backendCommunicator, fontManager) {
                const $ctrl = this;

                $ctrl.installError = null;
                $ctrl.installSuccessful = false;

                $ctrl.fonts = fontManager.getInstalledFonts();

                $ctrl.removeFont = async (name) => {
                    try {
                        await fontManager.removeFont(name);
                        $ctrl.fonts = fontManager.getInstalledFonts();
                    } catch (error) {
                        $ctrl.installError = `There was an error removing the font: ${error.message}`;
                    }
                };

                $ctrl.openFileExplorer = async () => {
                    $ctrl.installError = null;
                    $ctrl.installSuccessful = null;
                    const response = await backendCommunicator.fireEventAsync("open-file-browser", {
                        options: {
                            title: 'Select Font File',
                            filters: [
                                {
                                    name: 'Font', extensions: ['ttf', 'woff', 'woff2', 'otf']
                                }
                            ]
                        }
                    });

                    if (response?.path?.length) {
                        const success = await fontManager.installFont(response.path);

                        if (success) {
                            $ctrl.fonts = fontManager.getInstalledFonts();
                            $ctrl.installSuccessful = true;
                        } else {
                            $ctrl.installError = "There was an error installing the font. Check the log for more details.";
                        }
                    }
                };
            }
        });
}());