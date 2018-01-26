'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("hotkeyCapture", {
            bindings: {
                onCapture: "&",
                hotkey: "<"
            },
            template: `
                <div class="hotkey-capture" ng-class="{ 'capturing': $ctrl.hks.isCapturingHotkey }">                   
                    <span class="hotkey-display" ng-click="$ctrl.recordKeys()">
                        <span ng-if="$ctrl.hotkeyDisplay == null || $ctrl.hotkeyDisplay === ''" class="muted" style="font-weight: 500;">
                            {{ $ctrl.hks.isCapturingHotkey ? 'Press any key now...' : 'No hotkey set.' }}
                        </span>
                        <span>{{$ctrl.hotkeyDisplay}}</span>                 
                    </span>
                    <button ng-click="$ctrl.recordKeys()" class="btn" ng-class="$ctrl.hks.isCapturingHotkey ? 'btn-danger' : 'btn-success'">{{$ctrl.hks.isCapturingHotkey ? 'Stop recording' : 'Record'}}</button>
                </div>
            `,
            controller: function(hotkeyService, $rootScope, $scope) {
                let $ctrl = this;

                $ctrl.hks = hotkeyService;

                $ctrl.recordKeys = function() {
                    hotkeyService.startHotkeyCapture((hotkey) => {
                        $ctrl.onCapture({ hotkey: hotkey });
                        $scope.$applyAsync();
                    });
                };

                $ctrl.$onInit = function() {
                    $ctrl.hotkeyDisplay = hotkeyService.getDisplayFromAcceleratorCode($ctrl.hotkey);
                };

                $rootScope.$on("hotkey:capture:update", (event, data) => {
                    $ctrl.hotkeyDisplay = hotkeyService.getDisplayFromAcceleratorCode(data.hotkey);

                    $scope.$applyAsync();
                });
            }
        });
}());