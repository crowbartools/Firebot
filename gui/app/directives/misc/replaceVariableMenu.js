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
                    menuPosition: "@"
                },
                controller: function($scope, $element, listenerService, $timeout) {

                    const { trigger, triggerMeta } = $scope.$parent;

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    $scope.showMenu = false;

                    $scope.variables = listenerService.fireEventSync("getReplaceVariableDefinitions", {
                        type: trigger,
                        id: triggerMeta && triggerMeta.triggerId,
                        dataOutput: $scope.replaceVariables
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
                        let insertIndex = $element.prop("selectionStart");

                        let currentModel = $scope.modelValue ? $scope.modelValue : "";

                        let display = variable.usage ? variable.usage : variable.handle;

                        let updatedModel = insertAt(currentModel, "$" + display, insertIndex);

                        $scope.modelValue = updatedModel;
                    };

                },
                link: function(scope, element) {

                    let wrapper = angular.element(`
                        <div style="position: relative;"></div>`
                    );
                    let compiled = $compile(wrapper)(scope);
                    element.wrap(compiled);

                    let button = angular.element('<span style="width: 30px;height: 15px;background: #0b8dc6;position: absolute;bottom:0;right:0;border-radius:4px;font-size: 10px;text-align: center;margin: 0 7px 7px 0;cursor: pointer;user-select: none;" ng-click="toggleMenu()" class="clickable">$vars</span>');
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
                                <dl>
                                    <dt ng-repeat-start="variable in variables | orderBy:'handle' | variableSearch:variableSearchText" style="font-weight: 900;">\${{variable.usage ? variable.usage : variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(variable)"></i></dt>
                                    <dd ng-repeat-end style="margin-bottom: 8px;" class="muted">{{variable.description || ""}}</dd>
                                </dl>
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
