"use strict";

const { EffectCategory } = require("../../shared/effect-constants");

(function() {
    angular.module("firebotApp").component("addNewEffectModal", {
        template: `
            <div class="select-effect-header modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Select New Effect</h4>
            </div>
            <div class="modal-body">
                <div class="select-effect-search">
                    <searchbar search-id="effectSearch" placeholder-text="Search effects..." query="$ctrl.effectSearch" style="width: 100%"></searchbar>
                </div>
                <div style="display: flex;flex-direction:row;height: 450px;">
                    <div class="effect-categories">
                        <div class="effect-category-header muted">Categories</div>
                        <div class="effect-category-wrapper" ng-class="{'selected': $ctrl.activeCategory == null}" ng-click="$ctrl.activeCategory = null;">
                            <div class="category-text">All</div>
                        </div>
                        <div class="effect-category-wrapper" ng-repeat="category in $ctrl.categories" ng-class="{'selected': $ctrl.activeCategory === category}" ng-click="$ctrl.activeCategory = category;">
                            <div class="category-text">
                                {{category}}
                                <tooltip
                                    style="margin-left: 5px"
                                    ng-if="category === 'integrations'"
                                    text="'Integrations need to be linked / configured in Settings -> Integrations in order for the effects to work.'"
                                ></tooltip>
                            </div>
                        </div>
                    </div>
                    <div style="width: 100%; height: 100%;overflow-y:scroll;padding: 15px 15px 0;">
                        <div class="effect-def-wrapper" ng-repeat="effect in $ctrl.effectDefs | effectCategoryFilter:$ctrl.activeCategory | filter:$ctrl.effectSearch track by effect.id" ng-click="$ctrl.selectedEffectDef = effect" ng-class="{'selected': $ctrl.selectedEffectDef === effect}">
                            <div class="effect-icon-wrapper">
                                <i ng-class="effect.icon"></i>
                            </div>
                            <div style="width: 100%;">
                                <div>{{effect.name}}</div>
                                <div class="muted" style="font-size: 13px;">{{effect.description}}</div>
                            </div>
                            <div class="effect-selected-wrapper">
                                <i class="fad fa-check-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="select-effect-footer">
                <div>
                    <div style="font-size: 12px;font-weight: 600;" class="muted">SELECTED EFFECT:</div>
                    <div style="font-size: 20px;font-weight: 100;">{{$ctrl.selectedEffectDef ? $ctrl.selectedEffectDef.name : "None"}}</div>
                </div>
                <div style="display:flex;align-items: center; justify-content: flex-end;">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()" style="margin-right: 10px;">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()" ng-disabled="$ctrl.selectedEffectDef == null">Select</button>
                </div>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(ngToast, backendCommunicator, utilityService, $scope, $timeout) {
            const $ctrl = this;

            $ctrl.activeCategory = null;
            $ctrl.categories = Object.values(EffectCategory);

            $ctrl.selectedEffectDef = null;

            $ctrl.effectDefs = [];
            $ctrl.$onInit = async function() {
                const effectDefs = await backendCommunicator
                    .fireEventAsync("getEffectDefinitions", {
                        triggerType: $ctrl.resolve.trigger,
                        triggerMeta: $ctrl.resolve.triggerMeta
                    });
                $ctrl.effectDefs = effectDefs
                    .sort((a, b) => {
                        const textA = a.name.toUpperCase();
                        const textB = b.name.toUpperCase();
                        return textA < textB ? -1 : textA > textB ? 1 : 0;
                    })
                    .filter(e => !e.hidden);

                if ($ctrl.resolve.selectedEffectTypeId) {
                    $ctrl.selectedEffectDef = $ctrl.effectDefs.find(e => e.id === $ctrl.resolve.selectedEffectTypeId);
                }

                $timeout(() => {
                    angular.element("#effectSearch").trigger("focus");
                }, 50);
            };

            $ctrl.save = function() {
                if ($ctrl.selectedEffectDef == null) {
                    ngToast.create("Please select an effect!");
                    return;
                }

                $ctrl.close({
                    $value: {
                        selectedEffectDef: $ctrl.selectedEffectDef
                    }
                });
            };
        }
    });
}());
