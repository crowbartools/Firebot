"use strict";

import type { FirebotComponent } from "../../../../types/";

export type DropdownOption = {
    name: string;
    value: unknown;
    icon?: string;
    tooltip?: string;
    chip?: string;
    chipTooltip?: string;
};

export type DropdownAction = {
    label: string;
    icon?: string;
    type?: "danger" | "success" | "info" | "warning";
    onSelect: () => void;
};

type Bindings = {
    options: DropdownOption[];
    actions: DropdownAction[];
    modelValue: unknown;
    placeholder: string;
    onUpdate: () => void;
    /**
     * When true, clicking the selected option will null out the model value.
     * @default true
     */
    optionToggling?: boolean;
    isDisabled: boolean;
    rightJustify?: boolean;
    ariaLabel?: string;
    style?: string;
    emptyMessage?: string;
    dark?: boolean;
};

type Controller = {
    getSelectedOptionName: () => string;
    getSelectedOptionIcon: () => string | undefined;
    selectOption: (option: DropdownOption) => void;
};

(function () {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { randomUUID } = require("crypto");

    const firebotDropdown: FirebotComponent<Bindings, Controller> = {
        bindings: {
            options: "<",
            actions: "<?",
            modelValue: "=ngModel",
            placeholder: "@",
            onUpdate: '&',
            optionToggling: '<?',
            isDisabled: '<',
            rightJustify: "<?",
            ariaLabel: "@?",
            style: "@?",
            emptyMessage: "@?",
            dark: "<?"
        },
        require: {
            ngModelCtrl: '^ngModel'
        },
        template: `
        <div class="firebot-dropdown-input" uib-dropdown uib-dropdown-toggle keyboard-nav="true" style="{{$ctrl.style || ''}}">
            <button
                class="firebot-dropdown-btn"
                role="button"
                aria-label="{{($ctrl.ariaLabel || 'Selected') + ': ' + $ctrl.getSelectedOptionName()}}"
                id="{{$ctrl.id}}"
                ng-disabled="$ctrl.isDisabled"
                ng-class="{'dark': $ctrl.dark === true}"
            >
                <span class="firebot-dropdown-label">
                    <i ng-if="$ctrl.getSelectedOptionIcon()" class="far muted" ng-class="$ctrl.getSelectedOptionIcon()"></i>
                    <span>{{$ctrl.getSelectedOptionName()}}</span>
                </span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <ul
                class="dropdown-menu firebot-dropdown-menu"
                ng-class="$ctrl.rightJustify ? 'right-justified-dropdown' : ''"
                uib-dropdown-menu
                role="menu"
            >
                <li
                    ng-repeat="option in $ctrl.options"
                    role="{{option.name === 'divider' ? 'divider' : 'menuitem'}}"
                    ng-click="$ctrl.selectOption(option)"
                    aria-label="{{option.name}}"
                    ng-class="option.name === 'divider' ? 'divider' : null"
                >
                    <a
                        href
                        ng-if="option.name !== 'divider'"
                        class="firebot-dropdown-menu-item"
                        aria-hidden="true"
                    >
                        <span class="firebot-dropdown-menu-label">
                            <i ng-if="option.icon" class="far" ng-class="option.icon"></i>
                            <span>{{option.name}}</span>
                            <tooltip ng-if="option.tooltip" text="option.tooltip"></tooltip>
                            <span
                                ng-if="option.chip"
                                class="firebot-dropdown-menu-chip"
                                uib-tooltip="{{option.chipTooltip}}"
                                append-tooltip-to-body="true"
                            >{{option.chip}}</span>
                        </span>
                        <i ng-show="$ctrl.modelValue === option.value" class="fas fa-check firebot-dropdown-check-icon"></i>
                    </a>
                </li>

                <li ng-show="$ctrl.options.length < 1 && $ctrl.emptyMessage" role="none">
                    <div class="firebot-dropdown-menu-empty">{{$ctrl.emptyMessage}}</div>
                </li>

                <li ng-if="$ctrl.actions && $ctrl.actions.length > 0"    role="separator" class="firebot-dropdown-menu-divider"></li>

                <li ng-if="$ctrl.actions && $ctrl.actions.length > 0"  role="none" ng-repeat="action in $ctrl.actions">
                    <a href
                        class="firebot-dropdown-menu-item"
                        ng-class="action.type"
                        ng-click="action.onSelect()"
                        role="menuitem">
                        <span class="firebot-dropdown-menu-label">
                            <i ng-if="action.icon" class="far" ng-class="action.icon"></i>
                            <span>{{action.label}}</span>
                        </span>
                    </a>
                </li>
            </ul>
        </div>
        `,
        controller: function ($scope: angular.IScope) {

            const $ctrl = this;

            $scope.$watch('$ctrl.modelValue', (newValue) => {
                if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                    $ctrl.ngModelCtrl.$setViewValue(newValue);
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            $ctrl.id = randomUUID();

            $ctrl.selectOption = function (option) {
                if (option.name === 'divider') {
                    return;
                }

                if ($ctrl.optionToggling !== false && $ctrl.modelValue === option.value) {
                    $ctrl.modelValue = null;
                } else {
                    $ctrl.modelValue = option.value;
                }
            };

            $ctrl.getSelectedOptionName = function () {
                const selectedOption = $ctrl.options.find(opt => opt.value === $ctrl.modelValue || (opt.value == null && $ctrl.modelValue == null));
                if (selectedOption == null) {
                    return $ctrl.placeholder;
                }
                return selectedOption.name;
            };

            $ctrl.getSelectedOptionIcon = function () {
                const selectedOption = $ctrl.options.find(opt => opt.value === $ctrl.modelValue || (opt.value == null && $ctrl.modelValue == null));
                return selectedOption?.icon;
            };


            $ctrl.$onInit = () => {
                if (!$ctrl.placeholder) {
                    $ctrl.placeholder = "Please select";
                }
            };
        }
    };

    // @ts-ignore
    angular
        .module('firebotApp')
        .component("firebotDropdown", firebotDropdown);
}());
