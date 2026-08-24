"use strict";
(function() {
    angular
        .module("firebotApp")
        .component("pluginUpdateIndicator", {
            bindings: {},
            template: `
                <div class="plugin-update-indicator-wrapper" ng-if="$ctrl.pendingPluginUpdates() > 0">
                    <button
                        class="app-bar-icon-btn"
                        aria-label="Plugins ready to update"
                        ng-click="$ctrl.showPluginManager()"
                        uib-tooltip="{{$ctrl.getTooltipText()}}"
                        tooltip-append-to-body="true"
                        tooltip-placement="bottom-right"
                    >
                        <i class="fas fa-puzzle-piece"></i>
                        <span class="update-indicator-badge"></span>
                    </button>
                </div>
            `,
            controller: function(pluginsService, modalService) {
                const ctrl = this;

                ctrl.pendingPluginUpdates = () => {
                    return Object.keys(pluginsService.pendingPluginUpdates).length;
                };

                ctrl.getTooltipText = () => {
                    const updatesPending = Object.keys(pluginsService.pendingPluginUpdates).length;
                    return `${updatesPending} plugin${updatesPending > 1 ? "s" : ""} ready to update`;
                };

                ctrl.showPluginManager = () => {
                    modalService.showModal({
                        component: "pluginManagerModal",
                        size: "lg"
                    });
                };
            }
        });
}());