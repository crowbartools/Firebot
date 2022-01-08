"use strict";

(function() {
    angular.module("firebotApp")
        .component("collapsablePanel", {
            bindings: {
                header: "@",
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
                                <h3 style="margin: 0px;padding-left: 15px;font-size:16px;">{{$ctrl.header}}</h3>
                            </div>

                            <div style="display: flex; align-items: center;">
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
            controller: function($scope) {
                let $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.initiallyOpen !== undefined) {
                        $scope.hidePanel = $ctrl.initiallyOpen !== true;
                    } else {
                        $scope.hidePanel = true;
                    }
                };
            }
        });
}());
