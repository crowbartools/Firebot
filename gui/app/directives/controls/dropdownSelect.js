"use strict";

(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module('firebotApp')
        .component("dropdownSelect", {
            bindings: {
                options: "=",
                selected: "=",
                placeholder: "@",
                onUpdate: '&'
            },
            template: `
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{$ctrl.getSelectedOption()}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li ng-if="!$ctrl.objectMode" role="menuitem" ng-repeat="option in $ctrl.options" ng-click="$ctrl.selectOption(option)">
                        <a href>{{option}}</a>
                    </li>
                    <li ng-if="$ctrl.objectMode" role="menuitem" ng-repeat="(value, label) in $ctrl.options" ng-click="$ctrl.selectOption(value)">
                        <a href>{{label}}</a>
                    </li>
                </ul>
            </div>
            `,
            controller: function($timeout) {

                let ctrl = this;

                ctrl.objectMode = false;

                ctrl.selectOption = function(option) {
                    ctrl.selected = option;
                    $timeout(() => {
                        ctrl.onUpdate({option: option});
                    }, 1);
                };

                ctrl.getSelectedOption = function() {
                    if (!ctrl.selected) {
                        return ctrl.placeholder;
                    }
                    if (!ctrl.objectMode) {
                        return ctrl.selected;
                    }
                    return ctrl.options[ctrl.selected];
                };

                function loadOptions() {
                    let options = ctrl.options;
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
        });
}());
