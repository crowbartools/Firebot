"use strict";

(function() {
    angular.module("firebotApp").component("eosCollapsablePanel", {
        bindings: {
            showLabel: "@",
            hideLabel: "@",
            hideInfoBox: "<"
        },
        transclude: true,
        template: `
      <div>
          <a ng-init="hidePanel = true" class="btn btn-link" ng-click="hidePanel = !hidePanel">{{hidePanel ? $ctrl.showLabel : $ctrl.hideLabel}}</a>
          <div uib-collapse="hidePanel">
              <div ng-class="{'effect-info alert alert-info': !$ctrl.hideInfoBox }" style="margin-top: 0;" ng-transclude>
              </div>
          </div> 
      </div>
    `
    });
}());
