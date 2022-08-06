"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("setupsSettings", {
            template: `
                <div>

                    <firebot-setting 
                        name="Import Setup"
                        description="Import a Firebot Setup (.firebotsetup file) made by someone else!"
                    >
                        <firebot-button 
                            text="Import Setup"
                            ng-click="showImportSetupModal()"
                        />
                    </firebot-setting>

                    <firebot-setting 
                        name="Create Setup"
                        description="Create a new Firebot Setup (a collection of commands, events, currencies, etc) and share it with others!"
                    >
                        <firebot-button 
                            text="Create New Setup"
                            ng-click="showCreateSetupModal()"
                        />
                    </firebot-setting>

                    <firebot-setting 
                        name="Remove Setup"
                        description="Select a Setup file to have Firebot find and remove all matching components (commands, events, etc) currently saved for you. Useful if you want to completely remove a previously imported Setup."
                    >
                        <firebot-button 
                            text="Remove Setup"
                            ng-click="showRemoveSetupModal()"
                        />
                    </firebot-setting>

                    
                </div>
          `,
            controller: function($scope, settingsService, utilityService) {
                $scope.settings = settingsService;

                $scope.showImportSetupModal = () => {
                    utilityService.showModal({
                        component: "importSetupModal",
                        backdrop: false
                    });
                };

                $scope.showCreateSetupModal = () => {
                    utilityService.showModal({
                        component: "createSetupModal"
                    });
                };

                $scope.showRemoveSetupModal = () => {
                    utilityService.showModal({
                        component: "removeSetupModal",
                        backdrop: true
                    });
                };

            }
        });
}());
