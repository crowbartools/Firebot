'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("navCategory", {
            bindings: {
                name: "@",
                padTop: "<"
            },
            template: `
            <div class="fb-nav-link-category" ng-class="{ 'pad-top': $ctrl.padTop }">
                <div ng-class="{'contracted': !$ctrl.sbm.navExpanded}" class="spacing"></div>          
                <span ng-class="{'contracted': !$ctrl.sbm.navExpanded}">{{$ctrl.name}}</span>
            </div>
            `,
            controller: function(sidebarManager) {
                let $ctrl = this;

                $ctrl.sbm = sidebarManager;
            }
        });
}());