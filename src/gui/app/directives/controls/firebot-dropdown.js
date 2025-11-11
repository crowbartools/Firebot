"use strict";

(function () {

    const { randomUUID } = require("crypto");

    angular
        .module('firebotApp')
        .component("firebotDropdown", {
            bindings: {
                options: "<",
                modelValue: "=ngModel",
                placeholder: "@",
                onUpdate: '&',
                isDisabled: '<',
                rightJustify: "<?",
                ariaLabel: "@?",
                style: "@?"
            },
            template: `
        <div class="btn-group" uib-dropdown style="{{$ctrl.style || ''}}">
            <button
                id="{{$ctrl.id}}"
                aria-label="{{($ctrl.ariaLabel || 'Selected') + ': ' + $ctrl.getSelectedOptionName()}}"
                type="button"
                class="btn btn-default"
                uib-dropdown-toggle
                ng-disabled="$ctrl.isDisabled"
            >{{$ctrl.getSelectedOptionName()}} <span class="caret" aria-hidden="true"></span></button>
            <ul
                class="dropdown-menu"
                ng-class="$ctrl.rightJustify ? 'right-justified-dropdown' : ''"
                uib-dropdown-menu
                role="menu"
                aria-labelledby="{{$ctrl.id}}"
            >
                <li
                    ng-repeat="option in $ctrl.options"
                    role="{{option.name === 'divider' ? 'divider' : 'menuitem'}}"
                    ng-class="option.name === 'divider' ? 'divider' : null"
                    ng-click="$ctrl.selectOption(option)"
                    aria-label="{{option.value}}"
                >
                    <a ng-if="option.name !== 'divider'" href aria-hidden="true">{{option.name}}</a>
                </li>
            </ul>
        </div>
        `,
            controller: function () {

                const $ctrl = this;

                $ctrl.id = randomUUID();

                $ctrl.selectOption = function (option) {
                    if (option.name === 'separator') {
                        return;
                    }

                    $ctrl.modelValue = option.value;
                };

                $ctrl.getSelectedOptionName = function () {
                    const selectedOption = $ctrl.options.find(opt => opt.value === $ctrl.modelValue);
                    if (selectedOption == null) {
                        return $ctrl.placeholder;
                    }
                    return selectedOption.name;
                };


                $ctrl.$onInit = () => {
                    if (!$ctrl.placeholder) {
                        $ctrl.placeholder = "Please select";
                    }
                };
            }
        });
}());
