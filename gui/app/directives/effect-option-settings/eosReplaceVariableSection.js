'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("eosReplaceVariableSection", {
            bindings: {
                name: "@",
                defaultShow: "<"
            },
            transclude: true,
            template: `
                <div style="margin-bottom: 10px">
                    <div style="display:flex;flex-direction:row;justify-content: space-between; margin-bottom:5px" class="clickable" ng-init="hidePanel = true" ng-click="hidePanel = !hidePanel">
                        <h4 style="margin:0;">{{$ctrl.name}}</h4>
                        <span><i class="fas" ng-class="{ 'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel }"></i></span>
                    </div>
                    <div uib-collapse="hidePanel" ng-transclude>
                    </div>
                </div>
            `,
            controller: function() {
                let ctrl = this;

                ctrl.$onInit = function() {
                    if (ctrl.defaultShow === true) {
                        ctrl.hidePanel = false;
                    }
                };
            }
        });
}());