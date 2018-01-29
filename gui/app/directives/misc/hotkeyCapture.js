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

                    <span class="clickable" style="margin-left: 10px;" uib-tooltip="Clear current hotkey" ng-click="$ctrl.clearHotkey()" ng-show="$ctrl.hotkeyDisplay != null && $ctrl.hotkeyDisplay.length > 0"><i class="far fa-times-circle"></i></span>
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

                $ctrl.clearHotkey = function() {
                    $ctrl.onCapture({ hotkey: "" });
                    $ctrl.hotkeyDisplay = "";
                };

                $ctrl.$onChanges = function (changes) {
                    $ctrl.hotkeyDisplay = hotkeyService.getDisplayFromAcceleratorCode(changes.hotkey.currentValue);
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