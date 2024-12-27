"use strict";
(function() {
    //This adds the <eos-overlay-instance> element

    angular
        .module('firebotApp')
        .component("eosOverlayInstance", {
            bindings: {
                effect: '=',
                padTop: "<"
            },
            template: `
            <eos-container header="Overlay Instance" pad-top="$ctrl.padTop" ng-if="$ctrl.settings.getSetting('UseOverlayInstances')">
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="chat-effect-type">{{$ctrl.effect.overlayInstance ? $ctrl.effect.overlayInstance : 'Default'}}</span> <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu chat-effect-dropdown">
                        <li ng-click="$ctrl.effect.overlayInstance = null"><a href>Default</a></li>
                        <li ng-repeat="instanceName in $ctrl.settings.getSetting('OverlayInstances')" ng-click="$ctrl.effect.overlayInstance = instanceName"><a href>{{instanceName}}</a></li>
                        <li class="divider"></li>
                        <li ng-click="$ctrl.showEditOverlayInstancesModal()"><a href>Edit Instances</a></li>
                    </ul>
                </div>
            </eos-container>
       `,
            controller: function(settingsService, utilityService) {
                const ctrl = this;

                ctrl.settings = settingsService;

                ctrl.$onInit = function() {
                // Reset overlay instance to default (or null) if the saved instance doesnt exist anymore
                    if (ctrl.effect.overlayInstance != null) {
                        if (
                            !settingsService
                                .getSetting("OverlayInstances")
                                .includes(ctrl.effect.overlayInstance)
                        ) {
                            ctrl.effect.overlayInstance = null;
                        }
                    }
                };

                ctrl.showEditOverlayInstancesModal = function() {
                    utilityService.showModal({
                        component: "editOverlayInstancesModal"
                    });
                };
            }
        });
}());
