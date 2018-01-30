'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("navLink", {
            bindings: {
                name: "@",
                icon: "@",
                isIndex: "<",
                badgeText: "<"
            },
            template: `
            <a class="fb-nav-link" href="{{$ctrl.href}}" ng-class="{'selected': $ctrl.sbm.tabIsSelected($ctrl.name)}" ng-click="$ctrl.sbm.setTab($ctrl.name)"  uib-tooltip="{{!$ctrl.sbm.navExpanded ? $ctrl.name : ''}}" tooltip-placement="right" tooltip-append-to-body="true">
                <div class="nav-link-bar"></div>
                <div class="nav-link-icon"><i class="fal" ng-class="$ctrl.icon"></i></div>
                <div class="nav-link-title" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">{{$ctrl.name}}</div>
                <div ng-show="$ctrl.hasBadge" class="nav-update-badge" ng-class="{'contracted': !$ctrl.sbm.navExpanded}">
                    <span class="label label-danger">{{$ctrl.badgeText}}</span>
                </div>
            </a>
            `,
            controller: function(sidebarManager) {
                let ctrl = this;

                ctrl.sbm = sidebarManager;

                ctrl.$onInit = function() {
                    ctrl.hasBadge = ctrl.badgeText != null && ctrl.badgeText !== "";
                    ctrl.href = ctrl.isIndex ? "#" : "#!" + ctrl.name.toLowerCase().replace(/\W/g, "-");
                };
            }
        });
}());