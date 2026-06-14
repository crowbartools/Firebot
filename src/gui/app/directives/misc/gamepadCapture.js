"use strict";

(function() {
    angular.module("firebotApp").component("gamepadCapture", {
        bindings: {
            onCapture: "&",
            button: "<"
        },
        template: `
            <div class="hotkey-capture" ng-class="{ 'capturing': $ctrl.gps.isCapturingButton, 'has-value': $ctrl.buttonDisplay }">
                <div class="hotkey-display">
                    <div class="hotkey-content">
                        <i class="fas fa-gamepad" style="margin-right: 8px; opacity: 0.7;"></i>
                        <span ng-if="!$ctrl.buttonDisplay" class="muted" style="font-weight: 500;">
                            {{ $ctrl.gps.isCapturingButton ? 'Press any controller button...' : 'No button set' }}
                        </span>
                        <span class="hotkey-value">{{$ctrl.buttonDisplay}}</span>
                    </div>
                    <button
                        ng-click="$ctrl.toggleCapture(); $event.stopPropagation()"
                        class="hotkey-chip-btn"
                        ng-class="$ctrl.gps.isCapturingButton ? 'recording' : 'idle'"
                    >
                        <i class="fas" ng-class="$ctrl.gps.isCapturingButton ? 'fa-stop' : 'fa-dot-circle'"></i>
                        <span>{{$ctrl.gps.isCapturingButton ? 'Cancel' : ($ctrl.buttonDisplay ? 'Change Button' : 'Record Button')}}</span>
                    </button>
                </div>
            </div>
        `,
        controller: function(gamepadService, $rootScope, $scope) {
            const $ctrl = this;

            $ctrl.gps = gamepadService;
            $ctrl.buttonDisplay = "";

            $ctrl.toggleCapture = () => {
                if (gamepadService.isCapturingButton) {
                    gamepadService.cancelCapture();
                } else {
                    gamepadService.startCapture((gamepadIndex, buttonIndex) => {
                        $ctrl.onCapture({ gamepadIndex, buttonIndex });
                        $scope.$applyAsync();
                    });
                }
            };

            $ctrl.$onChanges = (changes) => {
                if (changes.button != null && changes.button.currentValue != null) {
                    $ctrl.buttonDisplay = gamepadService.getButtonName(changes.button.currentValue);
                }
            };

            $ctrl.$onInit = () => {
                if ($ctrl.button != null) {
                    $ctrl.buttonDisplay = gamepadService.getButtonName($ctrl.button);
                }
            };

            $rootScope.$on("gamepad:capture:update", (event, data) => {
                $ctrl.buttonDisplay = gamepadService.getButtonName(data.buttonIndex);
                $scope.$applyAsync();
            });
        }
    });
}());
