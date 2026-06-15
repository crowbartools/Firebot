"use strict";

(function() {
    angular.module("firebotApp").component("gameControllerCapture", {
        bindings: {
            onCapture: "&",
            button: "<"
        },
        template: `
            <div class="hotkey-capture" ng-class="{ 'capturing': $ctrl.gcs.isCapturingButton, 'has-value': $ctrl.buttonDisplay }">
                <div class="hotkey-display">
                    <div class="hotkey-content">
                        <i class="fas fa-gamepad" style="margin-right: 8px; opacity: 0.7;"></i>
                        <span ng-if="!$ctrl.buttonDisplay" class="muted" style="font-weight: 500;">
                            {{ $ctrl.gcs.isCapturingButton ? 'Press any controller button...' : 'No button set' }}
                        </span>
                        <span class="hotkey-value">{{$ctrl.buttonDisplay}}</span>
                    </div>
                    <button
                        ng-click="$ctrl.toggleCapture(); $event.stopPropagation()"
                        class="hotkey-chip-btn"
                        ng-class="$ctrl.gcs.isCapturingButton ? 'recording' : 'idle'"
                    >
                        <i class="fas" ng-class="$ctrl.gcs.isCapturingButton ? 'fa-stop' : 'fa-dot-circle'"></i>
                        <span>{{$ctrl.gcs.isCapturingButton ? 'Cancel' : ($ctrl.buttonDisplay ? 'Change Button' : 'Record Button')}}</span>
                    </button>
                </div>
            </div>
        `,
        controller: function(gameControllerService, $rootScope, $scope) {
            const $ctrl = this;

            $ctrl.gcs = gameControllerService;
            $ctrl.buttonDisplay = "";

            $ctrl.toggleCapture = () => {
                if (gameControllerService.isCapturingButton) {
                    gameControllerService.cancelCapture();
                } else {
                    gameControllerService.startCapture((controllerIndex, buttonIndex) => {
                        $ctrl.onCapture({ controllerIndex, buttonIndex });
                        $scope.$applyAsync();
                    });
                }
            };

            $ctrl.$onChanges = (changes) => {
                if (changes.button != null && changes.button.currentValue != null) {
                    $ctrl.buttonDisplay = gameControllerService.getButtonName(changes.button.currentValue);
                }
            };

            $ctrl.$onInit = () => {
                if ($ctrl.button != null) {
                    $ctrl.buttonDisplay = gameControllerService.getButtonName($ctrl.button);
                }
            };

            $rootScope.$on("game-controller:capture:update", (event, data) => {
                $ctrl.buttonDisplay = gameControllerService.getButtonName(data.buttonIndex);
                $scope.$applyAsync();
            });
        }
    });
}());
