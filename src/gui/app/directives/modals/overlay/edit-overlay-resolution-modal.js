"use strict";

(function() {
    angular.module("firebotApp")
        .component("editOverlayResolutionModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Edit Overlay Resolution</h4>
                </div>
                <div class="modal-body">
                    <div class="btn-group mb-5">
                        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Presets <span class="caret"></span></button>
                        <ul class="dropdown-menu">
                            <li ng-repeat="preset in $ctrl.presets"><a href ng-click="$ctrl.applyPreset(preset)">{{ preset.label }}</a></li>
                        </ul>
                    </div>
                    <form class="form-inline">
                        <div class="form-group">
                            <label class="sr-only" for="exampleInputAmount">Amount (in dollars)</label>
                            <div class="input-group">
                                <input
                                    type="number"
                                    class="form-control"
                                    id="width"
                                    placeholder="Width"
                                    ng-model="$ctrl.overlayResolution.width"
                                >
                                <div class="input-group-addon">x</div>
                                <input
                                    type="number"
                                    class="form-control"
                                    id="height"
                                    placeholder="Height"
                                    ng-model="$ctrl.overlayResolution.height"
                                >
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(settingsService) {
                const $ctrl = this;

                $ctrl.presets = [
                    { width: 1280, height: 720, label: "720p" },
                    { width: 1920, height: 1080, label: "1080p" },
                    { width: 2560, height: 1440, label: "1440p" },
                    { width: 3840, height: 2160, label: "4K" }
                ];

                $ctrl.applyPreset = (preset) => {
                    $ctrl.overlayResolution.width = preset.width;
                    $ctrl.overlayResolution.height = preset.height;
                };

                $ctrl.overlayResolution = settingsService.getSetting("OverlayResolution") || { width: 1280, height: 720 };

                $ctrl.save = () => {
                    settingsService.saveSetting("OverlayResolution", $ctrl.overlayResolution);
                    $ctrl.close({ $value: $ctrl.overlayResolution });
                };
            }
        });
}());