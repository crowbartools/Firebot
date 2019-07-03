"use strict";

(function() {
    angular.module("firebotApp")
        .component("textboxTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-textbox-container" ng-class="{'compact': $ctrl.shouldBeCompact() }">
                    <input type="search" ng-if="!$ctrl.control.mixplay.multiline" class="mixer-textbox" placeholder="{{$ctrl.control.mixplay.placeholder || ''}}">
                    <textarea type="search" ng-if="$ctrl.control.mixplay.multiline" class="mixer-textbox" placeholder="{{$ctrl.control.mixplay.placeholder || ''}}" multiline="true" style="width:100% !important;"></textarea>
                    <div ng-if="$ctrl.control.mixplay.hasSubmit || $ctrl.control.mixplay.cost" class="mixer-button" ng-class="{'compact': $ctrl.shouldBeCompact() }" >
                        <div class="mixer-button-content">
                            <div class="mixer-button-text">{{$ctrl.control.mixplay.submitText || 'Submit' }}</div>
                            <div class="mixer-spark-wrapper" ng-show="$ctrl.control.mixplay.cost">
                                <div class="mixer-spark-pill">{{$ctrl.control.mixplay.cost}}</div>
                            </div>
                        </div>
                    </div>
                </div>               
            `,
            controller: function(gridHelper) {
                let $ctrl = this;

                $ctrl.shouldBeCompact = function() {
                    let control = $ctrl.control;
                    let position = control.position.find(p => p.size === gridHelper.currentGridSize);
                    return position.height < 7;
                };
            }
        });
}());
