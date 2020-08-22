"use strict";

(function() {
    angular.module("firebotApp").component("settingContainer", {
        bindings: {
            header: "@",
            description: "@",
            collapsed: "<",
            padTop: "<"
        },
        transclude: true,
        template: `
            <div class="fb-setting-container" ng-class="{ 'fb-setting-padtop' : $ctrl.padTop }">
                <div class="fb-setting-header" ng-if="$ctrl.header" ng-click="$ctrl.toggleCollapse()">
                    <h4>{{$ctrl.header}} <span ng-if="$ctrl.description != null && $ctrl.description != ''" class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">({{$ctrl.description}})</span></h4>
                    <div style="display: flex; align-items: center;">
                        <div style="width:30px;">
                            <i class="fas" ng-class="{'fa-chevron-right': $ctrl.collapsed, 'fa-chevron-down': !$ctrl.collapsed}"></i>
                        </div>
                    </div>
                </div>
                <div uib-collapse="$ctrl.collapsed" class="fb-setting-content" ng-transclude></div>
            </div>
        `,
        controller: function($scope, $timeout) {
            const $ctrl = this;

            function rerenderSliders() {
                $timeout(function() {
                    $scope.$broadcast("rzSliderForceRender");
                }, 100);
            }

            if ($ctrl.collapsed == null) {
                $ctrl.collapsed = false;
            }

            $ctrl.toggleCollapse = () => {
                $ctrl.collapsed = !$ctrl.collapsed;
                rerenderSliders();
            };

            $ctrl.$onInit = () => {
                rerenderSliders();
            };
        }
    });
}());
