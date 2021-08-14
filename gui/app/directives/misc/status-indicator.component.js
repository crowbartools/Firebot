"use strict";

(function() {
    angular.module("firebotApp")
        .component("statusIndicator", {
            bindings: {
                status: "<",
                enabledLabel: "@",
                disabledLabel: "@?"
            },
            template: `
                <div
                    style="
                        min-width: 100px;
                        display: flex;
                        align-items: center;
                    "
                >
                    <span
                    class="status-dot"
                    style="margin-right: 5px"
                    ng-class="{'active': $ctrl.status, 'notactive': !$ctrl.status}"
                    ></span
                    >{{$ctrl.status ? $ctrl.enabledLabel : $ctrl.disabledLabel}}
                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.enabledLabel == null) {
                        $ctrl.enabledLabel = "Active";
                    }
                    if ($ctrl.disabledLabel == null) {
                        $ctrl.disabledLabel = "Disabled";
                    }
                };

            }
        });
}());
