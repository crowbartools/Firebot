"use strict";

import type { FirebotComponent } from "../../../../../types";

export type PreviewItem = {
    icon: string;
    label: string;
    tooltip: string;
};

type Bindings = {
    icon: string;
    label: string;
    tooltip?: string;
    mainValue?: PreviewItem;
    previewItems?: PreviewItem[];
    disabled?: boolean;
    noBottomMargin?: boolean;
};

type Controller = {
    expanded: boolean;
    animationComplete: boolean;
    toggleExpanded: () => void;
};

(function () {
    const effectConfigPanel: FirebotComponent<Bindings, Controller> = {
        bindings: {
            icon: "@",
            label: "@",
            tooltip: "@?",
            mainValue: "<?",
            previewItems: "<?",
            disabled: "<?",
            noBottomMargin: "<?"
        },
        transclude: true,
        template: `
            <div class="effect-list-config-panel" ng-class="{'expanded': $ctrl.expanded, 'animation-complete': $ctrl.animationComplete, 'disabled': $ctrl.disabled, 'no-bottom-margin': $ctrl.noBottomMargin}">
                <div class="config-panel-header" ng-click="$ctrl.toggleExpanded()" role="button" tabindex="0" aria-disabled="{{$ctrl.disabled}}">
                    <div class="config-panel-header-left">
                        <i class="far {{$ctrl.icon}}"></i>
                        <span>{{$ctrl.label}}</span>
                        <tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip"></tooltip>
                    </div>
                    <div class="config-panel-header-right">
                        <div class="config-preview" ng-if="!$ctrl.expanded && ($ctrl.mainValue || ($ctrl.previewItems && $ctrl.previewItems.length > 0))">
                            <span
                                class="config-preview-main"
                                ng-if="$ctrl.mainValue"
                                uib-tooltip="{{$ctrl.mainValue.tooltip}}"
                                append-tooltip-to-body="true"
                            >
                                <i ng-if="$ctrl.mainValue.icon" class="fas {{$ctrl.mainValue.icon}}"></i>
                                <span>{{$ctrl.mainValue.label}}</span>
                            </span>
                            <span
                                class="config-preview-item"
                                ng-repeat="item in $ctrl.previewItems"
                                uib-tooltip="{{item.tooltip}}"
                                append-tooltip-to-body="true"
                            >
                                <i ng-if="item.icon" class="fas {{item.icon}}"></i>
                                <span>{{item.label}}</span>
                            </span>
                        </div>
                        <i class="fas config-panel-chevron" ng-class="{'fa-chevron-down': !$ctrl.disabled, 'fa-lock': $ctrl.disabled}"></i>
                    </div>
                </div>

                <div class="config-panel-content">
                    <ng-transclude></ng-transclude>
                </div>
            </div>
        `,
        controller: function () {
            const $ctrl = this;

            $ctrl.expanded = false;
            $ctrl.animationComplete = false;

            let animationTimeout: ReturnType<typeof setTimeout> | null = null;

            $ctrl.$onDestroy = () => {
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                }
            };

            $ctrl.toggleExpanded = () => {
                if ($ctrl.disabled) {
                    return;
                }

                $ctrl.expanded = !$ctrl.expanded;

                // Clear any existing timeout
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                    animationTimeout = null;
                }

                if ($ctrl.expanded) {
                    // When opening, delay the overflow change until after animation (300ms)
                    $ctrl.animationComplete = false;
                    animationTimeout = setTimeout(() => {
                        $ctrl.animationComplete = true;
                        animationTimeout = null;
                    }, 300);
                } else {
                    // When closing, immediately set animationComplete to false
                    $ctrl.animationComplete = false;
                }
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("effectConfigPanel", effectConfigPanel);
})();
