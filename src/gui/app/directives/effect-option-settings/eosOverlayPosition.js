"use strict";

(function() {
    //This adds the <eos-overlay-instance> element

    angular
        .module('firebotApp')
        .component("eosOverlayPosition", {
            bindings: {
                effect: '=',
                hideRandom: "<",
                padTop: "<"
            },
            template: `
            <eos-container header="Overlay Display Location" pad-top="$ctrl.padTop">
                <div class="controls-fb-inline">
                    <label class="control-fb control--radio">Preset
                        <input type="radio" ng-model="$ctrl.presetOrCustom" ng-change="$ctrl.togglePresetCustom()" value="preset"/> 
                        <div class="control__indicator"></div>
                    </label>
                    <label class="control-fb control--radio">Custom
                        <input type="radio" ng-model="$ctrl.presetOrCustom" ng-change="$ctrl.togglePresetCustom()" value="custom"/>
                        <div class="control__indicator"></div>
                    </label>
                </div>
                <div ng-if="$ctrl.effect.position !== 'Custom'">
                    <div class="btn-group btn-matrix" style="margin: 5px 0 5px 0px;">
                        <label ng-repeat="position in $ctrl.presetPositions" class="btn btn-primary" ng-model="$ctrl.effect.position" ng-disabled="$ctrl.isRandom()" uib-btn-radio="position" uib-tooltip="{{position}}" tooltip-append-to-body="true" tooltip-animation="false"></label>
                    </div>
                    <div class="controls-fb-inline" ng-if="!$ctrl.hideRandom">
                        <label class="control-fb control--checkbox" style="margin: 5px 0 0 10px;"> Random preset location
                            <input type="checkbox" ng-click="$ctrl.toggleRandomPreset()" ng-checked="$ctrl.isRandom()">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
                <div ng-if="$ctrl.effect.position === 'Custom'" style="margin: 5px 0 5px 0px;">
                    <form class="form-inline">
                        <div class="form-group">
                            <input type="number" class="form-control" ng-model="$ctrl.topOrBottomValue" ng-change="$ctrl.updateAllValues()" style="width: 85px;">
                        </div>
                        <div class="form-group">
                            <span> pixels from the </span>
                            <dropdown-select options="['top','bottom']" selected="$ctrl.topOrBottom" on-update="$ctrl.updateTopOrBottom(option)"></dropdown-select>
                        </div>
                        <div style="margin-top: 15px;">
                            <div class="form-group">
                                <input type="number" class="form-control" ng-model="$ctrl.leftOrRightValue" ng-change="$ctrl.updateAllValues()" style="width: 85px;">
                            </div>
                            <div class="form-group">
                                <span> pixels from the </span>
                                <dropdown-select options="['left','right']" selected="$ctrl.leftOrRight" on-update="$ctrl.updateLeftOrRight(option)"></dropdown-select>
                            </div>
                        </div>
                    </form>
                </div>
                <div style="margin-top: 15px;">
                    <div class="input-group">
                        <span class="input-group-addon">z-index <tooltip text="'Controls which items appear in front when things overlap. Items with a higher number are shown on top of items with a lower number.'"></tooltip></span>
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Optional"
                            replace-variables="number"
                            ng-model="$ctrl.effect.zIndex">
                    </div>
                </div>
            </eos-container>
       `,
            controller: function() {
                const ctrl = this;

                ctrl.topOrBottom = "top";
                ctrl.topOrBottomValue = 0;
                ctrl.leftOrRight = "left";
                ctrl.leftOrRightValue = 0;

                ctrl.updateTopOrBottom = function(option) {
                    ctrl.topOrBottom = option;
                    ctrl.updateAllValues();
                };

                ctrl.updateLeftOrRight = function(option) {
                    ctrl.leftOrRight = option;
                    ctrl.updateAllValues();
                };

                ctrl.isRandom = function() {
                    return ctrl.effect.position === "Random";
                };

                ctrl.toggleRandomPreset = function() {
                    if (ctrl.isRandom()) {
                        ctrl.effect.position = "Middle";
                    } else {
                        ctrl.effect.position = "Random";
                    }
                };

                ctrl.updateAllValues = function() {
                    if (ctrl.topOrBottom === "top") {
                        ctrl.effect.customCoords.top = ctrl.topOrBottomValue;
                        ctrl.effect.customCoords.bottom = null;
                    } else {
                        ctrl.effect.customCoords.top = null;
                        ctrl.effect.customCoords.bottom = ctrl.topOrBottomValue;
                    }

                    if (ctrl.leftOrRight === "left") {
                        ctrl.effect.customCoords.left = ctrl.leftOrRightValue;
                        ctrl.effect.customCoords.right = null;
                    } else {
                        ctrl.effect.customCoords.left = null;
                        ctrl.effect.customCoords.right = ctrl.leftOrRightValue;
                    }
                };

                ctrl.togglePresetCustom = function() {
                    if (ctrl.presetOrCustom === "custom") {
                        ctrl.effect.position = "Custom";
                    } else {
                        ctrl.effect.position = "Middle";
                    }
                };

                ctrl.presetPositions = [
                    "Top Left",
                    "Top Middle",
                    "Top Right",
                    "Middle Left",
                    "Middle",
                    "Middle Right",
                    "Bottom Left",
                    "Bottom Middle",
                    "Bottom Right"
                ];

                ctrl.$onInit = function() {
                    if (ctrl.effect.position == null) {
                        ctrl.effect.position = "Middle";
                    }
                    if (ctrl.effect.customCoords == null) {
                        ctrl.effect.customCoords = {
                            top: 0,
                            bottom: null,
                            left: 0,
                            right: null
                        };
                    } else {
                        if (ctrl.effect.customCoords.top != null) {
                            ctrl.topOrBottom = "top";
                            ctrl.topOrBottomValue = ctrl.effect.customCoords.top;
                        } else {
                            ctrl.topOrBottom = "bottom";
                            ctrl.topOrBottomValue = ctrl.effect.customCoords.bottom;
                        }
                        if (ctrl.effect.customCoords.left != null) {
                            ctrl.leftOrRight = "left";
                            ctrl.leftOrRightValue = ctrl.effect.customCoords.left;
                        } else {
                            ctrl.leftOrRight = "right";
                            ctrl.leftOrRightValue = ctrl.effect.customCoords.right;
                        }
                    }
                    ctrl.presetOrCustom =
          ctrl.effect.position === "Custom" ? "custom" : "preset";
                };
            }
        });
}());
