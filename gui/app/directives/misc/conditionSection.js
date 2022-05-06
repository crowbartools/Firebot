"use strict";

(function() {
    angular.module("firebotApp")
        .component("conditionSection", {
            bindings: {
                header: "@",
                label: "=",
                draggable: "<",
                initiallyOpen: "<"
            },
            transclude: true,
            template: `
                <div>
                    <div class="expandable-item"
                        style="justify-content: space-between;" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}"
                        ng-mouseenter="hovering = true"
                        ng-mouseleave="hovering = false">
                            <div style="display: flex; align-items: center;">
                                <h3 style="margin: 0px;font-weight: bold;padding-left: 15px;">{{$ctrl.header}}</h3>
                                <span ng-show="$ctrl.label != null && $ctrl.label != ''" class="muted" style="margin-left:10px;font-size:15px;">({{$ctrl.label}})</span>
                                <div class="clickable conditionTag" uib-tooltip="Edit clause label" tooltip-append-to-body="true" ng-click="$event.stopPropagation();$ctrl.showEditLabelModal();" ng-class="{'hiddenBtn': !hovering}">
                                    <i class="fas fa-tag"></i>
                                </div>
                            </div>         

                            <div style="display: flex; align-items: center;">
                                <div style="margin-right: 10px; cursor: move;" class="dragHandle" ng-class="{'hiddenHandle': !hovering || !hidePanel || !$ctrl.draggable}"><i class="fas fa-bars"></i></div>
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>
                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded">
                        <div style="padding: 10px 20px 20px;" ng-transclude></div>
                    </div> 
                </div>    
                `,
            controller: function($scope, utilityService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.draggable == null) {
                        $ctrl.draggable = true;
                    }
                    if ($ctrl.initiallyOpen !== undefined) {
                        $scope.hidePanel = $ctrl.initiallyOpen !== true;
                    } else {
                        $scope.hidePanel = true;
                    }
                };
                $ctrl.showEditLabelModal = () => {
                    utilityService.openGetInputModal(
                        {
                            model: $ctrl.label,
                            label: "Clause Label",
                            saveText: "Save",
                            validationFn: () => {
                                return new Promise(resolve => {
                                    resolve(true);
                                });
                            },
                            validationText: ""

                        },
                        (newLabel) => {
                            $ctrl.label = newLabel;
                        });
                };
            }
        });
}());
