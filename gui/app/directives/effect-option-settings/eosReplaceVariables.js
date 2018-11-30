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

                    <ul>
                        <li ng-repeat="variable in $ctrl.variables | filter:variableSearch">
                            <b>\${{variable.handle}}</b> - {{variable.description || ""}}
                        </li>
                    </ul>                        
                </div>
            </eos-collapsable-panel>
            `,
        controller: function($rootScope, listenerService) {
            let $ctrl = this;
            $ctrl.openLinkExternally = $rootScope.openLinkExternally;

            $ctrl.variables = listenerService.fireEventSync("getReplaceVariableDefinitions");

            $ctrl.$onInit = function() {
                
            }
        }
    });
}());
