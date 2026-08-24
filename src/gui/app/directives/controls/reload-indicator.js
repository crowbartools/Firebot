"use strict";
(function() {
    angular
        .module("firebotApp")
        .component("reloadIndicator", {
            bindings: {},
            template: `
                <div class="reload-indicator-wrapper" ng-if="$ctrl.pendingFrontendReload()">
                    <button
                        class="app-bar-icon-btn"
                        aria-label="Firebot Needs to Reload"
                        ng-click="$ctrl.reloadWindow()"
                        uib-tooltip="The Firebot main window needs to be reloaded. Click to reload."
                        tooltip-append-to-body="true"
                        tooltip-placement="bottom-right"
                    >
                        <i class="far fa-sync"></i>
                        <span class="update-indicator-badge"></span>
                    </button>
                </div>
            `,
            controller: function(pluginsService, modalFactory, backendCommunicator) {
                const ctrl = this;

                ctrl.pendingFrontendReload = () => {
                    return pluginsService.pendingFrontendReload === true;
                };

                ctrl.reloadWindow = () => {
                    modalFactory.showConfirmationModal({
                        title: "Reload Required",
                        question: "The main Firebot window needs to be reloaded because of changes to one or more of your plugins. Would you like to do that now?",
                        tip: "NOTE: Firebot will continue running, but you will lose any unsaved changes in any currently open modals.",
                        cancelLabel: "No, Don't Reload",
                        cancelBtnType: "btn-default",
                        confirmLabel: "Yes, Reload Now"
                    }).then((confirmed) => {
                        if (confirmed) {
                            backendCommunicator.send("reload-main-window");
                        }
                    });
                };
            }
        });
}());