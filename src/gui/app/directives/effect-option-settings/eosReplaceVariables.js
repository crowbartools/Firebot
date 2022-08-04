"use strict";

(function() {
    angular.module("firebotApp").component("eosReplaceVariables", {
        template: `
            <eos-collapsable-panel show-label="Show Text Variables" hide-label="Hide Text Variables">
                <div>
                    <div class="searchbar-wrapper">
                        <input type="text" class="form-control" placeholder="Search variables" ng-model="variableSearch" style="padding-left: 27px;">
                        <span class="searchbar-icon"><i class="far fa-search"></i></span>
                    </div>

                    <dl>
                        <dt ng-repeat-start="variable in $ctrl.variables | filter:variableSearch" style="font-weight: 900;">\${{variable.handle}}</dt>
                        <dd ng-repeat-end style="margin-bottom: 8px;" class="muted">{{variable.description || ""}}</dd>
                    </dl>

                </div>
            </eos-collapsable-panel>
            `,
        controller: function($rootScope) {
            const $ctrl = this;
            $ctrl.openLinkExternally = $rootScope.openLinkExternally;

            $ctrl.variables = [];

            $ctrl.$onInit = function() {

            };
        }
    });
}());
