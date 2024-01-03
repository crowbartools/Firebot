"use strict";

(function() {
    angular.module("firebotApp")
        .component("restrictionItem", {
            bindings: {
                restriction: "=",
                restrictionDefinition: "<",
                restrictionMode: "<",
                onDelete: "&"
            },
            template: `
                <div style="margin-bottom:3px;">

                    <div class="expandable-item"
                        style="justify-content: space-between;"
                        ng-init="hidePanel = true"
                        ng-click="$ctrl.togglePanel()"
                        ng-class="{'expanded': !hidePanel}">

                            <div style="padding-left: 15px;font-family: 'Quicksand';font-size: 16px;">{{$ctrl.restrictionDefinition.definition.name}}</div>

                            <div style="display: flex; align-items: center;">
                                <div ng-show="hidePanel" style="opacity: 0.6; margin-right: 20px; max-width: 200px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">
                                    {{$ctrl.displayText}}
                                </div>
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>

                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded">
                        <div style="padding: 15px 20px 10px 20px;">
                            <restriction-options 
                                restriction="$ctrl.restriction" 
                                restriction-definition="$ctrl.restrictionDefinition" 
                                restriction-mode="$ctrl.restrictionMode"
                            ></restriction-options>
                            <div style="padding-top: 10px">
                                <button class="btn btn-danger" ng-click="$ctrl.delete()" aria-label="Delete restriction"><i class="far fa-trash"></i></button>
                            </div>
                        </div>
                    </div>

                </div>
          `,
            controller: function($injector, $q, $scope) {
                const $ctrl = this;

                $ctrl.displayText = "";
                $ctrl.setDisplayText = function() {
                    if ($ctrl.restrictionDefinition == null) {
                        return "";
                    }

                    const displayValueFunc = $ctrl.restrictionDefinition.optionsValueDisplay;
                    if (displayValueFunc != null && $ctrl.restriction != null) {
                        // Invoke the func and inject any dependencies
                        $q.when($injector.invoke(displayValueFunc, {}, { restriction: $ctrl.restriction }))
                            .then(displayText => {
                                $ctrl.displayText = displayText;
                            });
                    }
                };

                $ctrl.$onInit = function() {
                    $ctrl.setDisplayText();
                };

                $ctrl.togglePanel = function() {
                    $scope.hidePanel = !$scope.hidePanel;
                    $ctrl.setDisplayText();
                };

                $ctrl.delete = function() {
                    $ctrl.onDelete();
                };
            }
        });
}());
