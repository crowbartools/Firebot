"use strict";

import type { FirebotComponent, FirebotRootScope } from "../../../../types";

type Bindings = {
    text: string;
    tooltipText?: string;
};

type Controller = {
    text: string;
    tooltipText?: string;
    copiedText: boolean;
    copy: () => void;
};

(function () {
    const copyTextDisplay: FirebotComponent<Bindings, Controller> = {
        bindings: {
            text: "<",
            tooltipText: "@?"
        },
        template: `
            <div style="position: relative;">
                <input
                    type="text"
                    class="form-control"
                    ng-value="$ctrl.text"
                    disabled
                    style="padding-right: 40px;cursor: text;"
                />
                <button
                    class="btn btn-link"
                    style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); z-index: 10; padding: 0 10px;"
                    ng-click="$ctrl.copy()"
                    uib-tooltip="{{$ctrl.copiedText ? 'Copied!' : $ctrl.tooltipText}}"
                    tooltip-append-to-body="true"
                    aria-label="{{$ctrl.tooltipText}}"
                >
                    <i class="fas" ng-class="$ctrl.copiedText ? 'fa-check' : 'fa-clone'"></i>
                </button>
            </div>
        `,
        controller: function ($rootScope: FirebotRootScope, $timeout: ng.ITimeoutService) {
            const $ctrl = this;
            $ctrl.copiedText = false;

            $ctrl.copy = function () {
                $rootScope.copyTextToClipboard($ctrl.text);

                $ctrl.copiedText = true;
                $timeout(() => {
                    $ctrl.copiedText = false;
                }, 2000);
            };

            $ctrl.$onInit = function () {
                if (!$ctrl.tooltipText) {
                    $ctrl.tooltipText = "Copy to clipboard";
                }
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("copyTextDisplay", copyTextDisplay);
})();
