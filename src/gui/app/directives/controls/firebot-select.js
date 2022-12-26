"use strict";

(function() {
    const firebotSelectComponent = {
        bindings: {
            options: "=",
            selected: "=",
            placeholder: "@",
            onUpdate: '&',
            isDisabled: '<',
            rightJustify: "<?"
        },
        template: `
        <div class="btn-group" uib-dropdown>
            <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle ng-disabled="$ctrl.isDisabled">
            {{$ctrl.getSelectedOption()}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" ng-class="$ctrl.rightJustify ? 'right-justified-dropdown' : ''" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li 
                    ng-if="!$ctrl.objectMode" 
                    ng-repeat="option in $ctrl.options" 
                    role="{{option === 'separator' ? 'separator' : 'menuitem'}}"
                    ng-class="option === 'separator' ? 'separator' : null" 
                    ng-click="$ctrl.selectOption(option)"
                >
                    <a href>{{option}}</a>
                </li>
                <li 
                    ng-if="$ctrl.objectMode"
                    ng-repeat="(value, label) in $ctrl.options" 
                    role="{{value === 'separator' ? 'separator' : 'menuitem'}}"
                    ng-class="value === 'separator' ? 'separator' : null" 
                    ng-click="$ctrl.selectOption(value)"
                >
                    <a href>{{label}}</a>
                </li>
            </ul>
        </div>
        `,
        controller: function($timeout) {

            const ctrl = this;

            ctrl.objectMode = false;

            ctrl.selectOption = function(option) {
                if (option === 'separator') {
                    return;
                }

                ctrl.selected = option;
                $timeout(() => {
                    ctrl.onUpdate({option: option});
                }, 1);
            };

            ctrl.getSelectedOption = function() {
                if (ctrl.selected == null) {
                    return ctrl.placeholder;
                }
                if (!ctrl.objectMode) {
                    return ctrl.selected;
                }
                return ctrl.options[ctrl.selected] ?? ctrl.placeholder;
            };

            function loadOptions() {
                const options = ctrl.options;
                if (!Array.isArray(options) && options instanceof Object) {
                    ctrl.objectMode = true;
                }
            }

            ctrl.$onInit = () => {
                loadOptions();
                if (!ctrl.placeholder) {
                    ctrl.placeholder = "Please select";
                }
            };

            ctrl.$onChanges = function (changes) {
                if (changes.options) {
                    loadOptions();
                }
            };
        }
    };

    angular
        .module('firebotApp')
        .component("dropdownSelect", firebotSelectComponent)
        .component("firebotSelect", firebotSelectComponent);
}());
