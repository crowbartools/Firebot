"use strict";

import type { FirebotComponent } from "../../../../../types";

type TabsBindings = {
    active: string;
    type?: "underlined" | "pill" | "bar";
    fullWidth?: boolean;
};

type TabsController = {
    tabs: TabController[];
    registerTab: (tab: TabController) => void;
    unregisterTab: (tab: TabController) => void;
    selectTab: (name: string) => void;
    isActive: (name: string) => boolean;
};

type TabBindings = {
    name: string;
    label: string;
    icon?: string;
    badge?: number;
};

type TabController = {
    tabsCtrl?: TabsController;
};

(function () {
    const firebotTabs: FirebotComponent<TabsBindings, TabsController> = {
        bindings: {
            active: "=",
            type: "@?",
            fullWidth: "<?"
        },
        transclude: true,
        template: `
            <div class="firebot-tabset" ng-class="{'full-width': $ctrl.fullWidth}">
                <ul class="firebot-tabs" ng-class="'firebot-tabs--' + $ctrl.type" role="tablist">
                    <li ng-repeat="tab in $ctrl.tabs track by tab.name"
                        role="presentation"
                        ng-class="{active: $ctrl.isActive(tab.name)}">
                        <a ng-click="$ctrl.selectTab(tab.name); $event.preventDefault()"
                           role="tab"
                           aria-controls="tab-{{tab.name}}">
                            <i ng-if="tab.icon" ng-class="tab.icon"></i>
                            <span>{{tab.label}}</span>
                            <span ng-if="tab.badge != null && tab.badge > 0" class="tab-badge">{{tab.badge}}</span>
                        </a>
                    </li>
                </ul>
                <div class="firebot-tabs-content" ng-transclude></div>
            </div>
        `,
        controller: function () {
            const $ctrl = this;

            $ctrl.tabs = [];
            $ctrl.type = "underlined";
            $ctrl.fullWidth = false;

            $ctrl.$onInit = function () {
                if (!$ctrl.type || ($ctrl.type !== "underlined" && $ctrl.type !== "pill" && $ctrl.type !== "bar")) {
                    $ctrl.type = "underlined";
                }
            };

            $ctrl.registerTab = (tab: TabController) => {
                $ctrl.tabs.push(tab);
            };

            $ctrl.unregisterTab = (tab: TabController) => {
                const index = $ctrl.tabs.indexOf(tab);
                if (index > -1) {
                    $ctrl.tabs.splice(index, 1);
                }
            };

            $ctrl.selectTab = (name: string) => {
                $ctrl.active = name;
            };

            $ctrl.isActive = (name: string) => {
                return $ctrl.active === name;
            };
        }
    };

    const firebotTab: FirebotComponent<TabBindings, TabController> = {
        bindings: {
            name: "@",
            label: "@",
            icon: "@?",
            badge: "<?"
        },
        transclude: true,
        require: {
            tabsCtrl: "^^firebotTabs"
        },
        template: `
            <div class="firebot-tab-pane"
                 role="tabpanel"
                 id="tab-{{$ctrl.name}}"
                 ng-show="$ctrl.tabsCtrl.isActive($ctrl.name)"
                 ng-transclude>
            </div>
        `,
        controller: function () {
            const $ctrl = this;

            $ctrl.$onInit = function () {
                if ($ctrl.tabsCtrl) {
                    $ctrl.tabsCtrl.registerTab($ctrl);
                }
            };

            $ctrl.$onDestroy = function () {
                if ($ctrl.tabsCtrl) {
                    $ctrl.tabsCtrl.unregisterTab($ctrl);
                }
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("firebotTabs", firebotTabs);
    // @ts-ignore
    angular.module("firebotApp").component("firebotTab", firebotTab);
})();
