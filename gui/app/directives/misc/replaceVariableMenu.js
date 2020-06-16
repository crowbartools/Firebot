"use strict";
(function() {

    angular.module("firebotApp")
        .directive("replaceVariables", function($compile, $document) {
            return {
                restrict: "A",
                scope: {
                    modelValue: '=ngModel',
                    replaceVariables: "@",
                    disableVariableMenu: "<",
                    onVariableInsert: "&?",
                    menuPosition: "@",
                    buttonPosition: "@"
                },
                controller: function($scope, $element, $q, backendCommunicator, $timeout) {

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    $scope.showMenu = false;

                    $scope.variables = [];

                    function getVariables() {
                        const { trigger, triggerMeta } = $scope.$parent;

                        if (!$scope.disableVariableMenu) {
                            $scope.variables = backendCommunicator.fireEventSync("getReplaceVariableDefinitions", {
                                type: trigger,
                                id: triggerMeta && triggerMeta.triggerId,
                                dataOutput: $scope.replaceVariables
                            });
                        }
                    }
                    getVariables();

                    $scope.$parent.$watch('trigger', function() {
                        getVariables();
                    });

                    $scope.toggleMenu = () => {
                        $scope.setMenu(!$scope.showMenu);
                    };
                    $scope.setMenu = (value) => {
                        $scope.showMenu = value;
                        if (!value) {
                            $timeout(() => {
                                $element.focus();
                            }, 10);
                        } else {
                            $timeout(() => {
                                $element.next(".variable-menu").find("#variable-search").focus();
                            }, 5);
                        }
                    };

                    $scope.addVariable = (variable) => {
                        if ($scope.onVariableInsert != null) {
                            $scope.onVariableInsert({ variable: variable});
                            $scope.toggleMenu();
                        } else {
                            let insertIndex = $element.prop("selectionStart");

                            let currentModel = $scope.modelValue ? $scope.modelValue : "";

                            let display = variable.usage ? variable.usage : variable.handle;

                            let updatedModel = insertAt(currentModel, "$" + display, insertIndex);

                            $scope.modelValue = updatedModel;
                        }
                    };

                },
                link: function(scope, element) {

                    let wrapper = angular.element(`
                        <div style="position: relative;"></div>`
                    );
                    let compiled = $compile(wrapper)(scope);
                    element.wrap(compiled);

                    let button = angular.element(`<span class="variables-btn ${scope.buttonPosition ? scope.buttonPosition : ''}" ng-click="toggleMenu()">$vars</span>`);
                    $compile(button)(scope);

                    if (!scope.disableVariableMenu) {
                        button.insertAfter(element);
                    }

                    if (scope.menuPosition == null) {
                        scope.menuPosition = "above";
                    }

                    let menu = angular.element(`
                        <div class="variable-menu" ng-show="showMenu" ng-class="menuPosition">
                            <div style="padding:10px;border-bottom: 1px solid #48474a;">
                                <div style="position: relative;">
                                    <input id="variable-search" type="text" class="form-control" placeholder="Search variables..." ng-model="variableSearchText" style="padding-left: 27px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                </div>
                            </div>
                            <div style="padding: 10px;overflow-y: scroll; height: 250px;">
                                <div ng-repeat="variable in variables | orderBy:'handle' | variableSearch:variableSearchText" style="margin-bottom: 8px;">
                                    <div style="font-weight: 900;">\${{variable.usage ? variable.usage : variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(variable)"></i></div>
                                    <div class="muted">{{variable.description || ""}}</div>
                                    <div ng-show="variable.examples && variable.examples.length > 0" style="font-size: 13px;padding-left: 5px; margin-top:3px;">
                                        <collapsable-section show-text="Other examples" hide-text="Other examples" text-color="#0b8dc6">
                                            <div ng-repeat="example in variable.examples" style="margin-bottom: 6px;">
                                                <div style="font-weight: 900;">\${{example.usage}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(example)"></i></div>
                                                <div class="muted">{{example.description || ""}}</div>
                                            </div>
                                        </collapsable-section>
                                    </div>
                                </div>
                            </div>                    
                        </div>`
                    );
                    $compile(menu)(scope);
                    menu.insertAfter(element);

                    function documentClick(event) {
                        if (
                            scope.showMenu &&
                            !wrapper[0].contains(event.target) &&
                            !button[0].contains(event.target) &&
                            !menu[0].contains(event.target)
                        ) {
                            scope.setMenu(false);
                        }
                    }

                    $document.bind("mousedown", documentClick);

                    scope.$on("$destroy", function() {
                        $document.unbind("mousedown", documentClick);
                    });
                }
            };
        });
}());
