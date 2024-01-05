"use strict";

(function() {
    angular.module("firebotApp")
        .component("keyCapture", {
            bindings: {
                keyCode: "="
            },
            template: `
                <div class="hotkey-capture" ng-class="{ 'capturing': $ctrl.isCapturingKey }">
                    <span class="hotkey-display grayscale" ng-click="$ctrl.startKeyCapture()">
                        <span ng-if="$ctrl.keyDisplay == null || $ctrl.keyDisplay === ''" class="muted" style="font-weight: 500;">
                            {{ $ctrl.isCapturingKey ? 'Press a key...' : 'No key set.' }}
                        </span>
                        <span>{{$ctrl.keyDisplay}}</span>
                    </span>
                    <button ng-click="$ctrl.startKeyCapture()" class="btn" ng-class="$ctrl.isCapturingKey ? 'btn-danger' : 'btn-default'">{{$ctrl.isCapturingKey ? 'Stop recording' : 'Record'}}</button>

                    <span class="clickable" style="margin-left: 10px;" uib-tooltip="Clear current key" tooltip-append-to-body="true" ng-click="$ctrl.clearKey()" ng-show="!$ctrl.isCapturingKey && $ctrl.keyDisplay != null && $ctrl.keyDisplay.length > 0"><i class="far fa-times-circle"></i></span>
                </div>
            `,
            controller: function(keyHelper, logger) {
                const $ctrl = this;

                $ctrl.keyDisplay = null;
                $ctrl.isCapturingKey = false;

                $ctrl.clearKey = function() {
                    $ctrl.keyDisplay = "";
                    $ctrl.keyCode = undefined;
                };

                $ctrl.$onInit = function() {
                    if ($ctrl.keyCode != null) {
                        const keyName = keyHelper.getKeyboardKeyName($ctrl.keyCode);
                        if (keyName != null && keyName.length > 0) {
                            $ctrl.keyDisplay = keyName;
                        } else {
                            $ctrl.keyCode = undefined;
                        }
                    }
                };

                const keyDownListener = function(event) {
                    if (!$ctrl.isCapturingKey || event.keyCode == null) {
                        return;
                    }

                    const keyName = keyHelper.getKeyboardKeyName(event.keyCode);

                    //if key name is empty we don't support this keycode
                    if (keyName != null && keyName.length > 0) {
                        $ctrl.keyDisplay = keyName;
                        $ctrl.keyCode = event.keyCode;
                    }

                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    event.preventDefault();
                };

                const clickListener = function() {
                    if ($ctrl.isCapturingKey) {
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        event.preventDefault();
                    }
                    $ctrl.stopKeyCapture();
                };

                $ctrl.startKeyCapture = function() {
                    if ($ctrl.isCapturingKey) {
                        return;
                    }

                    $ctrl.isCapturingKey = true;
                    logger.info("Starting key capture...");
                    window.addEventListener("keydown", keyDownListener, true);
                    window.addEventListener("click", clickListener, true);
                };

                $ctrl.stopKeyCapture = function() {
                    logger.info("Stopping key recording");
                    if ($ctrl.isCapturingKey) {
                        $ctrl.isCapturingKey = false;
                    }
                    window.removeEventListener("keydown", keyDownListener, true);
                    window.removeEventListener("click", clickListener, true);
                };

            }
        });
}());
